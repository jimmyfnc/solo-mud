/**
 * Procedural world generation pipeline.
 */

import {
  createRng,
  type Rng,
  type World,
  type WorldGenParams,
  type Location,
  type Exit,
  type Item,
  type NodeId,
  type EdgeId,
  type BiomeWeights,
  BIOMES,
  EASTHOLLOW_LOCATIONS,
  EASTHOLLOW_EXITS,
  EASTHOLLOW_ADJACENCY,
  EASTHOLLOW_NPCS,
  EASTHOLLOW_CREATURES,
  EASTHOLLOW_CONTAINERS,
  TEMPLE_ITEMS,
  SEWER_ITEMS,
  TOWN_INN,
  TOWN_OUTSIDE_WALLS,
  WOODS_LOCATIONS,
  WOODS_EXITS,
} from '@solo-mud/shared';

import {
  createSpanningTree,
  addRandomEdges,
  buildAdjacency,
  computeBfsDepths,
  findFarthestNode,
  reconstructPath,
} from './graph';
import { validateWorld } from './validate';
import { spawnAllCreatures } from './creatures';

const MAX_RETRY_ATTEMPTS = 10;

// Procedural exits use only cardinal directions + up/down for clear navigation
const EXIT_LABELS = ['north', 'south', 'east', 'west', 'up', 'down'];

const LOCATION_NAMES = [
  'Clearing', 'Crossroads', 'Hollow', 'Ridge', 'Valley', 'Grove', 'Ruins',
  'Camp', 'Pond', 'Cave Entrance', 'Old Bridge', 'Shrine', 'Watchtower',
  'Ravine', 'Thicket', 'Meadow', 'Cliff', 'Stream', 'Den', 'Overlook',
];

/**
 * Generate a complete, validated world.
 */
export function generateWorld(params: WorldGenParams): World {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const attemptSeed = attempt === 0 ? params.seed : `${params.seed}_${attempt}`;
    const world = generateWorldAttempt({ ...params, seed: attemptSeed });

    const validation = validateWorld(world);
    if (validation.valid) {
      return world;
    }

    console.warn(`World generation attempt ${attempt + 1} failed:`, validation.errors);
  }

  throw new Error(`Failed to generate valid world after ${MAX_RETRY_ATTEMPTS} attempts`);
}

/**
 * Single attempt at world generation.
 */
function generateWorldAttempt(params: WorldGenParams): World {
  const rng = createRng(params.seed);
  const { nodeCount, extraEdges, lockedEdges } = params;

  // 1. Create nodes
  const nodeIndices = Array.from({ length: nodeCount }, (_, i) => i);

  // 2. Build spanning tree
  const treeEdges = createSpanningTree(nodeCount, rng);

  // 3. Add extra edges for loops
  const allEdges = addRandomEdges(nodeCount, treeEdges, extraEdges, rng);

  // 4. Compute depths from start (node 0)
  const adjacencyNumbers = buildAdjacency(nodeCount, allEdges);
  const { depths, parents } = computeBfsDepths(adjacencyNumbers, 0);

  // 5. Find goal (farthest from start)
  const goalIndex = findFarthestNode(depths);

  // 6. Reconstruct critical path
  const criticalPath = reconstructPath(parents, 0, goalIndex);

  // 7. Convert to string IDs
  const nodeIds = nodeIndices.map((i) => `loc_${i}`);
  const startId = nodeIds[0]!;
  const goalId = nodeIds[goalIndex]!;

  // 8. Create locations
  const locations: Record<NodeId, Location> = {};
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = nodeIds[i]!;
    const depth = depths[i] ?? 0;
    locations[nodeId] = createLocation(nodeId, depth, rng);
  }

  // 9. Create exits and adjacency
  const exits: Record<EdgeId, Exit> = {};
  const adjacency: Record<NodeId, EdgeId[]> = {};

  for (const nodeId of nodeIds) {
    adjacency[nodeId] = [];
  }

  // Select edges on critical path (skip first 2) to lock
  const criticalEdgeIndices = new Set<number>();
  const criticalEdges: [number, number][] = [];
  for (let i = 0; i < criticalPath.length - 1; i++) {
    criticalEdges.push([criticalPath[i]!, criticalPath[i + 1]!]);
  }

  // Find which allEdges are on the critical path
  for (let i = 0; i < allEdges.length; i++) {
    const [a, b] = allEdges[i]!;
    for (let j = 2; j < criticalEdges.length; j++) {
      // Skip first 2 edges
      const [ca, cb] = criticalEdges[j]!;
      if ((a === ca && b === cb) || (a === cb && b === ca)) {
        criticalEdgeIndices.add(i);
        break;
      }
    }
  }

  // Select up to lockedEdges from critical path edges
  const availableToLock = Array.from(criticalEdgeIndices);
  const shuffledToLock = rng.shuffle(availableToLock);
  const lockedEdgeIndices = new Set(shuffledToLock.slice(0, lockedEdges));

  // Create items (keys) for locked edges
  const items: Record<string, Item> = {};
  const lockKeys: Map<number, string> = new Map();

  let keyIndex = 0;
  for (const edgeIndex of lockedEdgeIndices) {
    const keyId = `key_${keyIndex++}`;
    const keyNames = ['iron', 'bone', 'crystal', 'brass', 'obsidian', 'silver'];
    const keyName = `${rng.pick(keyNames)} key`;

    items[keyId] = {
      id: keyId,
      baseId: 'key',
      name: keyName,
      tags: ['key'],
      rarity: 'common',
      affixes: [],
    };

    lockKeys.set(edgeIndex, keyId);
  }

  // Track which labels are used per location to avoid duplicates
  const usedLabels: Record<string, Set<string>> = {};
  for (const nodeId of nodeIds) {
    usedLabels[nodeId] = new Set();
  }

  // Create exits - ensuring no duplicate direction labels per location
  for (let i = 0; i < allEdges.length; i++) {
    const [a, b] = allEdges[i]!;
    const nodeA = nodeIds[a]!;
    const nodeB = nodeIds[b]!;
    const isLocked = lockedEdgeIndices.has(i);
    const keyId = lockKeys.get(i);

    // Find an available label for nodeA that won't conflict with nodeB's opposite
    const availableLabels = EXIT_LABELS.filter(label => {
      const opposite = getOppositeLabel(label);
      return !usedLabels[nodeA]!.has(label) && !usedLabels[nodeB]!.has(opposite);
    });

    // If no cardinal directions available, skip this edge (shouldn't happen with proper graph structure)
    if (availableLabels.length === 0) {
      console.warn(`No available exit labels for edge ${nodeA} <-> ${nodeB}, skipping`);
      continue;
    }

    const exitIdAB = `exit_${i}_ab`;
    const exitIdBA = `exit_${i}_ba`;
    const label = rng.pick(availableLabels);
    const oppositeLabel = getOppositeLabel(label);

    // Mark labels as used
    usedLabels[nodeA]!.add(label);
    usedLabels[nodeB]!.add(oppositeLabel);

    const exitAB: Exit = {
      id: exitIdAB,
      from: nodeA,
      to: nodeB,
      label,
      type: isLocked ? 'locked' : 'open',
      requirement: isLocked && keyId ? { kind: 'item', value: keyId } : undefined,
    };

    const exitBA: Exit = {
      id: exitIdBA,
      from: nodeB,
      to: nodeA,
      label: oppositeLabel,
      type: isLocked ? 'locked' : 'open',
      requirement: isLocked && keyId ? { kind: 'item', value: keyId } : undefined,
    };

    exits[exitIdAB] = exitAB;
    exits[exitIdBA] = exitBA;
    adjacency[nodeA]!.push(exitIdAB);
    adjacency[nodeB]!.push(exitIdBA);
  }

  // 10. Place keys (must be reachable before their locks)
  for (const [edgeIndex, keyId] of lockKeys) {
    const [lockA, lockB] = allEdges[edgeIndex]!;
    const lockDepth = Math.min(depths[lockA] ?? 0, depths[lockB] ?? 0);

    // Find locations with depth < lockDepth, preferably off critical path
    const candidates = nodeIds.filter((_, i) => {
      const d = depths[i] ?? 0;
      const onCriticalPath = criticalPath.includes(i);
      return d < lockDepth && !onCriticalPath;
    });

    // Fallback: any location with lower depth
    const fallbackCandidates = nodeIds.filter((_, i) => (depths[i] ?? 0) < lockDepth);

    const placement = candidates.length > 0
      ? rng.pick(candidates)
      : fallbackCandidates.length > 0
        ? rng.pick(fallbackCandidates)
        : startId;

    locations[placement]!.items.push(keyId);
  }

  // 11. Spawn creatures
  const creatures = spawnAllCreatures(locations, rng);

  // 12. Integrate Easthollow town
  // Add town locations
  for (const [id, location] of Object.entries(EASTHOLLOW_LOCATIONS)) {
    locations[id] = { ...location };
  }

  // Add town exits
  for (const [id, exit] of Object.entries(EASTHOLLOW_EXITS)) {
    exits[id] = { ...exit };
  }

  // Add town adjacency
  for (const [locId, exitIds] of Object.entries(EASTHOLLOW_ADJACENCY)) {
    adjacency[locId] = [...exitIds];
  }

  // Add town creatures (training dummy)
  for (const [id, creature] of Object.entries(EASTHOLLOW_CREATURES)) {
    creatures[id] = { ...creature };
  }

  // Add temple items (cleric starter gear)
  for (const [id, item] of Object.entries(TEMPLE_ITEMS)) {
    items[id] = { ...item };
  }

  // Add sewer items (rusty key, etc.)
  for (const item of Object.values(SEWER_ITEMS)) {
    items[item.id] = { ...item };
  }

  // 13. Integrate Whispering Woods
  // Add woods locations
  for (const [id, location] of Object.entries(WOODS_LOCATIONS)) {
    locations[id] = { ...location };
  }

  // Add woods exits
  for (const [id, exit] of Object.entries(WOODS_EXITS)) {
    exits[id] = exit;
  }

  // Build woods adjacency from exits
  for (const exit of Object.values(WOODS_EXITS)) {
    if (!adjacency[exit.from]) {
      adjacency[exit.from] = [];
    }
    adjacency[exit.from]!.push(exit.id);
  }

  // Connect outside walls to wilderness (loc_0)
  // Flow: Town Gate → Outside Walls → Wilderness
  const outsideToWildernessId = 'exit_outside_wilderness';
  const wildernessToOutsideId = 'exit_wilderness_outside';

  exits[outsideToWildernessId] = {
    id: outsideToWildernessId,
    from: TOWN_OUTSIDE_WALLS,
    to: 'loc_0',
    label: 'west',
    type: 'open',
  };
  exits[wildernessToOutsideId] = {
    id: wildernessToOutsideId,
    from: 'loc_0',
    to: TOWN_OUTSIDE_WALLS,
    label: 'east',
    type: 'open',
  };

  adjacency[TOWN_OUTSIDE_WALLS]!.push(outsideToWildernessId);
  adjacency['loc_0']!.push(wildernessToOutsideId);

  // Set start to town inn instead of loc_0
  const townStartId = TOWN_INN;

  // Deep copy containers
  const containers: Record<string, typeof EASTHOLLOW_CONTAINERS[string]> = {};
  for (const [id, container] of Object.entries(EASTHOLLOW_CONTAINERS)) {
    containers[id] = { ...container, contents: [...container.contents] };
  }

  return {
    seed: params.seed,
    startId: townStartId,
    goalId,
    locations,
    exits,
    adjacency,
    items,
    creatures,
    corpses: {},
    containers,
    respawnQueue: [],
    npcs: { ...EASTHOLLOW_NPCS },
    time: { totalMinutes: 480, timeOfDay: 'morning', day: 1 }, // 8 AM
    weather: { type: 'clear', intensity: 0 },
  };
}

/**
 * Create a location with biome based on depth.
 */
function createLocation(id: NodeId, depth: number, rng: Rng): Location {
  const name = rng.pick(LOCATION_NAMES);
  const biome = assignBiome(depth, rng);
  const props = generateProps(biome, rng);

  return {
    id,
    name,
    biome,
    props,
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth,
  };
}

/**
 * Assign biome weights based on depth.
 */
function assignBiome(depth: number, rng: Rng): BiomeWeights {
  // Depth bands determine primary biome
  const weights: BiomeWeights = {};

  if (depth <= 2) {
    // Safe starter area
    weights.plains = 0.6 + rng.next() * 0.2;
    weights.forest = 0.2 + rng.next() * 0.2;
  } else if (depth <= 5) {
    // Transitional
    weights.forest = 0.4 + rng.next() * 0.2;
    weights.hills = 0.2 + rng.next() * 0.2;
    weights.plains = 0.1 + rng.next() * 0.2;
  } else if (depth <= 8) {
    // Mid-range
    weights.hills = 0.4 + rng.next() * 0.2;
    weights.swamp = 0.2 + rng.next() * 0.2;
    weights.forest = 0.1 + rng.next() * 0.1;
  } else {
    // Deep/dangerous
    weights.mountains = 0.3 + rng.next() * 0.2;
    weights.swamp = 0.2 + rng.next() * 0.2;
    weights.desert = 0.2 + rng.next() * 0.2;
  }

  return weights;
}

/**
 * Generate props based on biome weights.
 */
function generateProps(biome: BiomeWeights, rng: Rng): string[] {
  const props: string[] = [];
  const propCount = rng.nextInt(1, 3);

  // Get dominant biome
  const entries = Object.entries(biome) as [keyof typeof BIOMES, number][];
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const dominantBiomeId = entries[0]?.[0] ?? 'plains';
  const biomeDef = BIOMES[dominantBiomeId];

  if (biomeDef) {
    for (let i = 0; i < propCount; i++) {
      props.push(rng.pick(biomeDef.props));
    }
  }

  return [...new Set(props)]; // Remove duplicates
}

/**
 * Get opposite direction label.
 */
function getOppositeLabel(label: string): string {
  const opposites: Record<string, string> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
    up: 'down',
    down: 'up',
  };
  return opposites[label] ?? label;
}
