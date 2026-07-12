/**
 * Export the game's authored zones into tools/zone-editor/zone-library.js
 * so the Cartographer tool can load and visualize them.
 *
 * Run from the repo root (uses tsx to load the shared package source):
 *   pnpm --filter @solo-mud/server exec tsx ../../tools/export-zones.mjs
 */

import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharedSrc = pathToFileURL(join(__dirname, '../packages/shared/src/index.ts')).href;

const shared = await import(sharedSrc);

const {
  WILD_LOCATIONS, WILD_EXITS, WILD_BOSS_ANCHORS, WILD_ENTRANCE, WILD_PUZZLES,
  WOODS_LOCATIONS, WOODS_EXITS, WOODS_BOSS_ANCHORS,
  EASTHOLLOW_LOCATIONS, EASTHOLLOW_EXITS,
  CREATURE_TEMPLATES, EASTHOLLOW_NPCS, TEMPLE_ITEMS, SEWER_ITEMS, SPELLS,
  EASTHOLLOW_CONTAINERS, WOODS_CONTAINERS,
} = shared;

const ALL_CONTAINERS = { ...EASTHOLLOW_CONTAINERS, ...WOODS_CONTAINERS };

/** Containers whose room is inside the zone. */
function zoneContainers(rooms) {
  return Object.fromEntries(
    Object.entries(ALL_CONTAINERS).filter(([, c]) => rooms[c.locationId])
  );
}

/** All exits across the world, for finding cross-zone bridges. */
const ALL_EXITS = [
  ...Object.values(WILD_EXITS),
  ...Object.values(WOODS_EXITS),
  ...Object.values(EASTHOLLOW_EXITS),
];
const ALL_LOCATIONS = { ...WILD_LOCATIONS, ...WOODS_LOCATIONS, ...EASTHOLLOW_LOCATIONS };

/** Strip a Location down to what the editor needs. */
function slimRooms(locations) {
  const out = {};
  for (const [id, loc] of Object.entries(locations)) {
    out[id] = {
      name: loc.name,
      description: loc.description,
      biome: loc.biome,
      props: loc.props ?? [],
      items: loc.items ?? [],
      npcs: loc.npcs ?? [],
      depth: loc.depth ?? 0,
      isSafeZone: loc.isSafeZone,
      isBossRoom: loc.isBossRoom,
      isDark: loc.isDark,
    };
  }
  return out;
}

function slimExits(exits) {
  return Object.values(exits).map((e) => ({
    from: e.from,
    to: e.to,
    label: e.label,
    type: e.type,
    requiresItem: e.requiresItem,
    requiresItemMessage: e.requiresItemMessage,
    requirement: e.requirement,
  }));
}

/** Keep only exits whose endpoints are both inside the room set. */
function internalExits(exits, rooms) {
  return exits.filter((e) => rooms[e.from] && rooms[e.to]);
}

/** Exits that leave the zone: one endpoint inside, one outside. */
function bridgeExits(rooms) {
  return ALL_EXITS
    .filter((e) => rooms[e.from] && !rooms[e.to])
    .map((e) => ({
      room: e.from,
      dir: e.label,
      target: e.to,
      targetName: ALL_LOCATIONS[e.to]?.name ?? e.to,
    }));
}

const wildRooms = slimRooms(WILD_LOCATIONS);
const woodsRooms = slimRooms(WOODS_LOCATIONS);
const townRooms = slimRooms(
  Object.fromEntries(Object.entries(EASTHOLLOW_LOCATIONS).filter(([id]) => id.startsWith('town_')))
);
const sewerRooms = slimRooms(
  Object.fromEntries(Object.entries(EASTHOLLOW_LOCATIONS).filter(([id]) => id.startsWith('sewer_')))
);

const library = {
  world: {
    name: '⟡ World Map (all zones)',
    prefix: 'world',
    entrance: 'town_square',
    rooms: slimRooms(ALL_LOCATIONS),
    exits: slimExits({ ...WILD_EXITS, ...WOODS_EXITS, ...EASTHOLLOW_EXITS }),
    bridges: [],
    containers: ALL_CONTAINERS,
    anchors: [...WILD_BOSS_ANCHORS, ...WOODS_BOSS_ANCHORS],
    puzzles: WILD_PUZZLES,
  },
  'western-reaches': {
    name: 'The Western Reaches',
    prefix: 'wild',
    entrance: WILD_ENTRANCE,
    rooms: wildRooms,
    exits: internalExits(slimExits(WILD_EXITS), wildRooms),
    bridges: bridgeExits(wildRooms),
    containers: zoneContainers(wildRooms),
    anchors: WILD_BOSS_ANCHORS,
    puzzles: WILD_PUZZLES,
  },
  'whispering-woods': {
    name: 'Whispering Woods',
    prefix: 'woods',
    entrance: 'woods_farmhouse',
    rooms: woodsRooms,
    exits: internalExits(slimExits(WOODS_EXITS), woodsRooms),
    bridges: bridgeExits(woodsRooms),
    containers: zoneContainers(woodsRooms),
    anchors: WOODS_BOSS_ANCHORS,
  },
  easthollow: {
    name: 'Easthollow (town)',
    prefix: 'town',
    entrance: 'town_square',
    rooms: townRooms,
    exits: internalExits(slimExits(EASTHOLLOW_EXITS), townRooms),
    bridges: bridgeExits(townRooms),
    containers: zoneContainers(townRooms),
    anchors: [],
  },
  sewer: {
    name: 'Easthollow Sewer',
    prefix: 'sewer',
    entrance: 'sewer_entrance',
    rooms: sewerRooms,
    exits: internalExits(slimExits(EASTHOLLOW_EXITS), sewerRooms),
    bridges: bridgeExits(sewerRooms),
    containers: zoneContainers(sewerRooms),
    anchors: [],
  },
};

/** Game-data catalog for the editor's pickers. */
const catalog = {
  creatures: Object.values(CREATURE_TEMPLATES).map((t) => ({
    id: t.id, name: t.name, level: t.baseLevel, tier: t.tier,
  })).sort((a, b) => a.level - b.level),
  npcs: Object.values(EASTHOLLOW_NPCS).map((n) => ({
    id: n.id, name: n.title ? `${n.title} ${n.name}` : n.name,
  })),
  items: [...Object.values(TEMPLE_ITEMS), ...Object.values(SEWER_ITEMS)].map((i) => ({
    id: i.id, name: i.name,
  })),
  spells: Object.values(SPELLS).map((s) => ({
    id: s.id, name: s.name, classes: s.classes, level: s.levelRequired,
  })),
};

const banner =
  '// GENERATED by tools/export-zones.mjs — do not edit by hand.\n' +
  '// Regenerate: pnpm --filter @solo-mud/shared build && node tools/export-zones.mjs\n';

writeFileSync(
  join(__dirname, 'zone-editor', 'zone-library.js'),
  `${banner}window.ZONE_LIBRARY = ${JSON.stringify(library, null, 1)};\n` +
  `window.GAME_CATALOG = ${JSON.stringify(catalog, null, 1)};\n`
);

const counts = Object.entries(library)
  .map(([k, z]) => `${k}: ${Object.keys(z.rooms).length} rooms / ${z.exits.length} exits`)
  .join('\n  ');
console.log(`zone-library.js written.\n  ${counts}`);
