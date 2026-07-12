/**
 * World assembly pipeline.
 *
 * The world is assembled from authored zones — Easthollow (town + sewer),
 * the Western Reaches wilderness, and the Whispering Woods — with
 * procedural systems layered on top: creature spawning (biome + depth
 * driven), dynamic descriptions, weather, and time of day.
 *
 * The old random-graph wilderness generator was retired in Phase 2 of the
 * living-world plan (docs/design/living-world.md). Graph utilities are
 * parked in ./graph.ts for future spatial chunk generation.
 */

import {
  createRng,
  type Rng,
  type World,
  type WorldGenParams,
  type Location,
  type Exit,
  type Item,
  type Creature,
  type NodeId,
  type EdgeId,
  CREATURE_TEMPLATES,
  EASTHOLLOW_LOCATIONS,
  EASTHOLLOW_EXITS,
  EASTHOLLOW_ADJACENCY,
  EASTHOLLOW_NPCS,
  EASTHOLLOW_CREATURES,
  EASTHOLLOW_CONTAINERS,
  TEMPLE_ITEMS,
  SEWER_ITEMS,
  TOWN_INN,
  WOODS_LOCATIONS,
  WOODS_EXITS,
  WOODS_CONTAINERS,
  WOODS_CONTAINER_ITEMS,
  WOODS_BOSS_ANCHORS,
  WILD_LOCATIONS,
  WILD_EXITS,
  WILD_WATCHTOWER,
  WILD_BOSS_ANCHORS,
  WILD_PUZZLES,
} from '@solo-mud/shared';

import { validateWorld } from './validate';
import { spawnAllCreatures } from './creatures';
import { ensureEconomyState } from '../economy/economy-manager';

/**
 * Assemble a complete, validated world.
 *
 * Note: only `params.seed` matters now — it drives creature spawning and
 * other procedural dressing. The graph parameters (nodeCount, extraEdges,
 * lockedEdges) are accepted for API compatibility and ignored.
 */
export function generateWorld(params: WorldGenParams): World {
  const world = assembleWorld(params.seed);

  const validation = validateWorld(world);
  if (!validation.valid) {
    // Authored data bug — fail loudly rather than shipping a broken world
    throw new Error(`World assembly produced an invalid world: ${validation.errors.join('; ')}`);
  }

  return world;
}

/**
 * Deep-enough copy of an authored location so world mutations never leak
 * back into the shared data modules (or across worlds in tests).
 */
function cloneLocation(location: Location): Location {
  return {
    ...location,
    props: [...location.props],
    items: [...location.items],
    enemies: [...location.enemies],
    creatures: [...location.creatures],
    visitState: { ...location.visitState },
    npcs: location.npcs ? [...location.npcs] : location.npcs,
  };
}

/**
 * Build the world from authored zones + procedural dressing.
 */
function assembleWorld(seed: string): World {
  const rng = createRng(seed);

  const locations: Record<NodeId, Location> = {};
  const exits: Record<EdgeId, Exit> = {};
  const adjacency: Record<NodeId, EdgeId[]> = {};
  const items: Record<string, Item> = {};

  // 1. Easthollow town + sewer (authored, ships its own adjacency)
  for (const [id, location] of Object.entries(EASTHOLLOW_LOCATIONS)) {
    locations[id] = cloneLocation(location);
  }
  for (const [id, exit] of Object.entries(EASTHOLLOW_EXITS)) {
    exits[id] = { ...exit };
  }
  for (const [locId, exitIds] of Object.entries(EASTHOLLOW_ADJACENCY)) {
    adjacency[locId] = [...exitIds];
  }

  // 2. Western Reaches (west) + Whispering Woods (east)
  for (const [id, location] of Object.entries(WILD_LOCATIONS)) {
    locations[id] = cloneLocation(location);
  }
  for (const [id, location] of Object.entries(WOODS_LOCATIONS)) {
    locations[id] = cloneLocation(location);
  }
  for (const [id, exit] of Object.entries(WILD_EXITS)) {
    exits[id] = { ...exit };
  }
  for (const [id, exit] of Object.entries(WOODS_EXITS)) {
    exits[id] = { ...exit };
  }

  // Build adjacency from zone exits (includes the town-edge bridges)
  for (const exit of [...Object.values(WILD_EXITS), ...Object.values(WOODS_EXITS)]) {
    if (!adjacency[exit.from]) {
      adjacency[exit.from] = [];
    }
    adjacency[exit.from]!.push(exit.id);
  }

  // Every location gets an adjacency entry
  for (const id of Object.keys(locations)) {
    if (!adjacency[id]) {
      adjacency[id] = [];
    }
  }

  // 3. Authored items (temple starter gear, sewer key items, woods container loot)
  for (const [id, item] of Object.entries(TEMPLE_ITEMS)) {
    items[id] = { ...item };
  }
  for (const item of Object.values(SEWER_ITEMS)) {
    items[item.id] = { ...item };
  }
  for (const [id, item] of Object.entries(WOODS_CONTAINER_ITEMS)) {
    items[id] = { ...item };
  }

  // 4. Procedural creature spawning over the outdoor zones.
  //    Biome + depth pick the templates; safe zones and boss rooms are
  //    excluded (boss rooms are populated by hand below).
  const spawnable: Record<string, Location> = {};
  for (const [id, location] of Object.entries(locations)) {
    const isOutdoorZone = id.startsWith('wild_') || id.startsWith('woods_');
    if (isOutdoorZone && !location.isSafeZone && !location.isBossRoom) {
      spawnable[id] = location;
    }
  }
  const creatures = spawnAllCreatures(spawnable, rng);

  // 5. Boss/POI anchors (hand-placed, static)
  placeBossAnchors(locations, creatures, rng);

  // 6. Town + sewer creatures (training dummy, placed rats, King Rat)
  for (const [id, creature] of Object.entries(EASTHOLLOW_CREATURES)) {
    creatures[id] = { ...creature };
  }

  // 7. Containers (deep copy so loot state doesn't leak into shared data)
  const containers: Record<string, typeof EASTHOLLOW_CONTAINERS[string]> = {};
  for (const [id, container] of Object.entries({ ...EASTHOLLOW_CONTAINERS, ...WOODS_CONTAINERS })) {
    containers[id] = { ...container, contents: [...container.contents] };
  }

  const npcs = Object.fromEntries(Object.entries(EASTHOLLOW_NPCS).map(([id, npc]) => [
    id,
    {
      ...npc,
      shop: npc.shop ? {
        ...npc.shop,
        items: npc.shop.items.map(item => ({ ...item })),
        materials: npc.shop.materials ? { ...npc.shop.materials } : undefined,
        productionReadyAt: npc.shop.productionReadyAt ? { ...npc.shop.productionReadyAt } : undefined,
      } : undefined,
    },
  ]));

  const world: World = {
    seed,
    startId: TOWN_INN,
    goalId: WILD_WATCHTOWER,
    locations,
    exits,
    adjacency,
    items,
    creatures,
    corpses: {},
    containers,
    respawnQueue: [],
    npcs,
    puzzles: { ...WILD_PUZZLES },
    time: { totalMinutes: 480, timeOfDay: 'morning', day: 1 }, // 8 AM
    weather: { type: 'clear', intensity: 0 },
  };
  ensureEconomyState(world);
  return world;
}

/**
 * Place hand-authored boss/POI creatures (e.g. the Wolf Den pack, the
 * Elder Troll at the Fallen Watchtower).
 */
function placeBossAnchors(
  locations: Record<NodeId, Location>,
  creatures: Record<string, Creature>,
  rng: Rng
): void {
  let anchorIndex = 0;

  for (const anchor of [...WILD_BOSS_ANCHORS, ...WOODS_BOSS_ANCHORS]) {
    const template = CREATURE_TEMPLATES[anchor.templateId];
    const location = locations[anchor.locationId];
    if (!template || !location) continue;

    const id = `creature_${anchor.locationId}_${anchor.templateId}_anchor${anchorIndex++}`;

    // HP scales +20% per level above the template base (same as the spawner)
    const levelDiff = anchor.level - template.baseLevel;
    const maxHp = Math.floor(template.baseHp * (1 + levelDiff * 0.2));

    creatures[id] = {
      id,
      templateId: anchor.templateId,
      name: anchor.name ?? template.name,
      level: anchor.level,
      behavior: template.behavior,
      mobility: 'static', // anchors guard their lair
      currentHp: maxHp,
      maxHp,
      locationId: anchor.locationId,
      homeLocationId: anchor.locationId,
      spawnLocationId: anchor.locationId,
      inCombat: false,
      description: rng.pick(template.descriptions.idle),
      isBossAnchor: true,
    };

    location.creatures.push(id);
  }
}
