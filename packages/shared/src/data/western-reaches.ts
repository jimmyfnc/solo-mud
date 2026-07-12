/**
 * The Western Reaches — the authored wilderness zone west of Easthollow.
 *
 * This is an "outdoor dungeon": a fixed, hand-authored skeleton with a
 * coherent compass layout, while creatures, descriptions, and weather are
 * layered on procedurally at world generation. Replaces the old
 * random-graph wilderness (see docs/design/living-world.md, Phase 2).
 *
 * Layout (west is deeper/harder; depths in parentheses):
 *
 *                              [Wolf Den(7)]
 *                                   │e/w
 *                             [Howling Ridge(6)]
 *                                   │n/s
 *                             [Rolling Foothills(5)]
 *                                   │n/s
 *      [Pine Slope(5)] ──e/w── [Windswept Meadow(4)]
 *            │n/s                   │n/s
 * [Watchtower(9)]─[Ruined Gate(8)]─[Overgrown Rd(7)]─[Bandit Camp(6)]─[Darkpine Depths(5)]─[Darkpine Edge(4)]─[Crossroads(3)]─[Milestone(2)]─[Old West Rd(1)]─[Outside Walls]
 *                                                                                                │n/s                │n/s
 *                                                                             [Silverbrook Ford(4)] ──e/w── [Silverbrook Bank(4)]
 *                                                                                                │n/s
 *                                                                                       [Bramble Thicket(5)]
 *                                                                                                │n/s
 *                                                                                         [Marsh Edge(6)]
 *                                                                                                │n/s
 *                                    [Sunken Hut(8)] ──e/w── [Sunken Marsh(7)]
 */

import type { Location, Exit, SequencePuzzle } from '../types';
import { TOWN_OUTSIDE_WALLS } from './easthollow';

// ============ Location IDs ============
// The road west
export const WILD_ROAD_1 = 'wild_road_1';
export const WILD_ROAD_2 = 'wild_road_2';
export const WILD_CROSSROADS = 'wild_crossroads';
export const WILD_FOREST_1 = 'wild_forest_1';
export const WILD_FOREST_2 = 'wild_forest_2';
export const WILD_BANDIT_CAMP = 'wild_bandit_camp';
export const WILD_OLD_ROAD = 'wild_old_road';
export const WILD_RUINS_GATE = 'wild_ruins_gate';
export const WILD_WATCHTOWER = 'wild_watchtower';

// The northern hills
export const WILD_MEADOW = 'wild_meadow';
export const WILD_PINE_SLOPE = 'wild_pine_slope';
export const WILD_FOOTHILLS = 'wild_foothills';
export const WILD_RIDGE = 'wild_ridge';
export const WILD_WOLF_DEN = 'wild_wolf_den';

// The southern marsh
export const WILD_STREAM_BANK = 'wild_stream_bank';
export const WILD_FORD = 'wild_ford';
export const WILD_THICKET = 'wild_thicket';
export const WILD_MARSH_EDGE = 'wild_marsh_edge';
export const WILD_MARSH = 'wild_marsh';
export const WILD_MARSH_HUT = 'wild_marsh_hut';

// ============ Locations ============
export const WILD_LOCATIONS: Record<string, Location> = {
  [WILD_ROAD_1]: {
    id: WILD_ROAD_1,
    name: 'Old West Road',
    biome: { plains: 0.8, forest: 0.2 },
    props: [
      'deep wagon ruts baked into the dirt',
      'leaning milestone worn smooth by weather',
      'town palisade shrinking behind you',
      'crows picking at something by the roadside',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 1,
    npcs: [],
  },
  [WILD_ROAD_2]: {
    id: WILD_ROAD_2,
    name: 'Broken Milestone',
    biome: { plains: 0.7, forest: 0.3 },
    props: [
      'shattered milestone lying in pieces',
      'grass growing up through the road',
      'rusted horseshoe half-buried in a rut',
      'dark line of pines on the western horizon',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 2,
    npcs: [],
  },
  [WILD_CROSSROADS]: {
    id: WILD_CROSSROADS,
    name: 'Forked Crossroads',
    biome: { plains: 0.6, forest: 0.4 },
    props: [
      'weathered signpost with three arms',
      'cold campfire ring beside the road',
      'cairn of stacked stones left by travelers',
      'boot prints heading in every direction',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 3,
    npcs: [],
  },
  [WILD_FOREST_1]: {
    id: WILD_FOREST_1,
    name: 'Darkpine Edge',
    biome: { forest: 0.9, plains: 0.1 },
    props: [
      'towering pines swallowing the road',
      'claw marks scored deep into bark',
      'sudden hush beneath the canopy',
      'game trail slipping between the trunks',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 4,
    npcs: [],
  },
  [WILD_FOREST_2]: {
    id: WILD_FOREST_2,
    name: 'Darkpine Depths',
    biome: { forest: 1 },
    props: [
      'green twilight under the dense canopy',
      'deadfall trunks furred with moss',
      'half-eaten carcass dragged off the trail',
      'eyes glinting from a hollow log',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 5,
    npcs: [],
  },
  [WILD_BANDIT_CAMP]: {
    id: WILD_BANDIT_CAMP,
    name: 'Abandoned Bandit Camp',
    biome: { forest: 0.8, hills: 0.2 },
    props: [
      'collapsed lean-tos around a fire pit',
      'empty strongbox pried open and discarded',
      'crude dice carved from knucklebones',
      'watch platform rotting in a tree fork',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 6,
    npcs: [],
  },
  [WILD_OLD_ROAD]: {
    id: WILD_OLD_ROAD,
    name: 'Overgrown Road',
    biome: { forest: 0.5, hills: 0.5 },
    props: [
      'ancient paving stones heaved up by roots',
      'toppled statue with a moss-eaten face',
      'roadbed climbing steadily westward',
      'ruined arch straddling the old road',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 7,
    npcs: [],
  },
  [WILD_RUINS_GATE]: {
    id: WILD_RUINS_GATE,
    name: 'Ruined Gate',
    biome: { hills: 0.8, mountains: 0.2 },
    props: [
      'broken gatehouse of pale cut stone',
      'rusted portcullis sealing the western arch',
      'three rune-carved stones: a sun, a moon, and a star',
      'weathered inscription beneath the runes',
      'wind moaning through empty arrow slits',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 8,
    npcs: [],
  },
  [WILD_WATCHTOWER]: {
    id: WILD_WATCHTOWER,
    name: 'Fallen Watchtower',
    biome: { mountains: 0.6, hills: 0.4 },
    props: [
      'shattered tower open to the sky',
      'spiral stair ending in empty air',
      'bones heaped in the tower well',
      'view of the whole western road below',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 9,
    isBossRoom: true,
    npcs: [],
  },

  // ============ Northern hills ============
  [WILD_MEADOW]: {
    id: WILD_MEADOW,
    name: 'Windswept Meadow',
    biome: { plains: 0.8, hills: 0.2 },
    props: [
      'tall grass rolling like water in the wind',
      'lone oak standing sentinel',
      'rabbit warrens dotting a low bank',
      'hawk circling high overhead',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 4,
    npcs: [],
  },
  [WILD_PINE_SLOPE]: {
    id: WILD_PINE_SLOPE,
    name: 'Pine Slope',
    biome: { forest: 0.6, hills: 0.4 },
    props: [
      'scattered pines climbing the hillside',
      'shed antlers bleaching in the grass',
      'tumbled boulders furred with lichen',
      'narrow deer path angling downslope',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 5,
    npcs: [],
  },
  [WILD_FOOTHILLS]: {
    id: WILD_FOOTHILLS,
    name: 'Rolling Foothills',
    biome: { hills: 0.9, plains: 0.1 },
    props: [
      'bare hills shouldering up toward the ridge',
      'scree slope loose underfoot',
      'old shepherd cairn on a rise',
      'tufts of grey wool snagged on thorns',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 5,
    npcs: [],
  },
  [WILD_RIDGE]: {
    id: WILD_RIDGE,
    name: 'Howling Ridge',
    biome: { hills: 0.7, mountains: 0.3 },
    props: [
      'knife-edge ridge walked by cold wind',
      'gnawed bones scattered among the rocks',
      'distant howls answering one another',
      'paw prints bigger than a spread hand',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 6,
    npcs: [],
  },
  [WILD_WOLF_DEN]: {
    id: WILD_WOLF_DEN,
    name: 'Wolf Den',
    biome: { hills: 0.8, mountains: 0.2 },
    props: [
      'dark cleft in the rock breathing musk',
      'kill mound of antlers and cracked bones',
      'worn bedding hollows in the dirt',
      'low growls rolling from the shadows',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 7,
    isBossRoom: true,
    npcs: [],
  },

  // ============ Southern marsh ============
  [WILD_STREAM_BANK]: {
    id: WILD_STREAM_BANK,
    name: 'Silverbrook Bank',
    biome: { plains: 0.5, forest: 0.5 },
    props: [
      'clear stream chattering over stones',
      'willows trailing leaves in the current',
      'minnows scattering in the shallows',
      'flat rock worn smooth by fishermen',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 4,
    npcs: [],
  },
  [WILD_FORD]: {
    id: WILD_FORD,
    name: 'Silverbrook Ford',
    biome: { forest: 0.6, plains: 0.4 },
    props: [
      'stepping stones crossing the brook',
      'snapped fishing pole abandoned on the bank',
      'heron standing motionless midstream',
      'water darkening as it flows south',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 4,
    npcs: [],
  },
  [WILD_THICKET]: {
    id: WILD_THICKET,
    name: 'Bramble Thicket',
    biome: { forest: 0.8, swamp: 0.2 },
    props: [
      'walls of briar taller than a man',
      'tunnels pushed through the brush by animals',
      'scraps of cloth snagged on thorns',
      'ground growing softer southward',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 5,
    npcs: [],
  },
  [WILD_MARSH_EDGE]: {
    id: WILD_MARSH_EDGE,
    name: 'Marsh Edge',
    biome: { swamp: 0.7, forest: 0.3 },
    props: [
      'firm ground giving way to sucking mud',
      'dead trees standing in black water',
      'frog song rising and cutting off at once',
      'smell of rot on the low wind',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 6,
    npcs: [],
  },
  [WILD_MARSH]: {
    id: WILD_MARSH,
    name: 'Sunken Marsh',
    biome: { swamp: 1 },
    props: [
      'hummocks of grass in stagnant pools',
      'half-sunk wagon claimed by the mire',
      'pale mist coiling over the water',
      'bubbles rising where nothing should breathe',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 7,
    npcs: [],
  },
  [WILD_MARSH_HUT]: {
    id: WILD_MARSH_HUT,
    name: 'Sunken Hut',
    biome: { swamp: 1 },
    props: [
      'stilted hut listing into the bog',
      'door hanging open on a dark interior',
      'strings of bird skulls clacking softly',
      'dugout canoe rotted through',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 8,
    npcs: [],
  },
};

// ============ Exits (all bidirectional, compass-consistent) ============
function twoWay(
  idA: string,
  from: string,
  to: string,
  label: 'north' | 'south' | 'east' | 'west'
): Record<string, Exit> {
  const opposites = { north: 'south', south: 'north', east: 'west', west: 'east' } as const;
  const idB = `${idA}_return`;
  return {
    [idA]: { id: idA, from, to, label, type: 'open' },
    [idB]: { id: idB, from: to, to: from, label: opposites[label], type: 'open' },
  };
}

export const WILD_ENTRANCE = WILD_ROAD_1;

export const WILD_EXITS: Record<string, Exit> = {
  // Town bridge + the road west
  ...twoWay('exit_outside_wild1', TOWN_OUTSIDE_WALLS, WILD_ROAD_1, 'west'),
  ...twoWay('exit_wild1_wild2', WILD_ROAD_1, WILD_ROAD_2, 'west'),
  ...twoWay('exit_wild2_crossroads', WILD_ROAD_2, WILD_CROSSROADS, 'west'),
  ...twoWay('exit_crossroads_forest1', WILD_CROSSROADS, WILD_FOREST_1, 'west'),
  ...twoWay('exit_forest1_forest2', WILD_FOREST_1, WILD_FOREST_2, 'west'),
  ...twoWay('exit_forest2_banditcamp', WILD_FOREST_2, WILD_BANDIT_CAMP, 'west'),
  ...twoWay('exit_banditcamp_oldroad', WILD_BANDIT_CAMP, WILD_OLD_ROAD, 'west'),
  ...twoWay('exit_oldroad_ruinsgate', WILD_OLD_ROAD, WILD_RUINS_GATE, 'west'),
  ...twoWay('exit_ruinsgate_watchtower', WILD_RUINS_GATE, WILD_WATCHTOWER, 'west'),

  // Northern hills
  ...twoWay('exit_crossroads_meadow', WILD_CROSSROADS, WILD_MEADOW, 'north'),
  ...twoWay('exit_meadow_foothills', WILD_MEADOW, WILD_FOOTHILLS, 'north'),
  ...twoWay('exit_foothills_ridge', WILD_FOOTHILLS, WILD_RIDGE, 'north'),
  ...twoWay('exit_ridge_wolfden', WILD_RIDGE, WILD_WOLF_DEN, 'west'),
  ...twoWay('exit_meadow_pineslope', WILD_MEADOW, WILD_PINE_SLOPE, 'west'),
  ...twoWay('exit_pineslope_forest1', WILD_PINE_SLOPE, WILD_FOREST_1, 'south'),

  // Southern marsh
  ...twoWay('exit_crossroads_streambank', WILD_CROSSROADS, WILD_STREAM_BANK, 'south'),
  ...twoWay('exit_streambank_ford', WILD_STREAM_BANK, WILD_FORD, 'west'),
  ...twoWay('exit_forest1_ford', WILD_FOREST_1, WILD_FORD, 'south'),
  ...twoWay('exit_ford_thicket', WILD_FORD, WILD_THICKET, 'south'),
  ...twoWay('exit_thicket_marshedge', WILD_THICKET, WILD_MARSH_EDGE, 'south'),
  ...twoWay('exit_marshedge_marsh', WILD_MARSH_EDGE, WILD_MARSH, 'south'),
  ...twoWay('exit_marsh_marshhut', WILD_MARSH, WILD_MARSH_HUT, 'west'),
};

// ============ Puzzles ============

export const WILD_RUNE_GATE_PUZZLE = 'wild_rune_gate';

/** Rune-stone sequence puzzle sealing the way to the Fallen Watchtower */
export const WILD_PUZZLES: Record<string, SequencePuzzle> = {
  [WILD_RUNE_GATE_PUZZLE]: {
    id: WILD_RUNE_GATE_PUZZLE,
    locationId: WILD_RUINS_GATE,
    keyword: 'rune',
    elements: [
      { id: 'sun', name: 'sun rune' },
      { id: 'moon', name: 'moon rune' },
      { id: 'star', name: 'star rune' },
    ],
    solution: ['sun', 'moon', 'star'],
    prompt: 'Three rune-carved stones flank the sealed arch: a sun, a moon, and a star. Each looks like it could be pressed.',
    hint: 'The weathered inscription reads: "Day dies first, night follows after, and the heavens watch over all."',
    activateText: 'You press the {name}. It flares with pale light.',
    solvedText: 'The three runes blaze in unison. With a sound like distant thunder, the rusted portcullis grinds upward into the arch. The way west is open.',
    failText: 'The runes gutter and go dark. Somewhere beneath the gatehouse, a mechanism resets with a hollow clunk.',
    alreadySolvedText: 'The runes glow steadily. The portcullis stands open; the way west is clear.',
    gateLockedText: 'A rusted portcullis seals the western arch. Three rune-carved stones flank the gate, waiting. (Try "use runes".)',
  },
};

// The west gate to the Watchtower is sealed by the rune puzzle.
// One-way gate: returning east from the watchtower is always open.
WILD_EXITS['exit_ruinsgate_watchtower']!.type = 'locked';
WILD_EXITS['exit_ruinsgate_watchtower']!.requirement = { kind: 'puzzle', value: WILD_RUNE_GATE_PUZZLE };

/** A creature placed by hand at world assembly (boss/POI anchor) */
export interface BossAnchor {
  templateId: string;
  level: number;
  locationId: string;
  /** Optional display-name override (e.g. a named boss) */
  name?: string;
}

/** Named boss anchors placed at generation time */
export const WILD_BOSS_ANCHORS: readonly BossAnchor[] = [
  { templateId: 'wolf', level: 7, locationId: WILD_WOLF_DEN, name: 'Packleader' },
  { templateId: 'wolf', level: 6, locationId: WILD_WOLF_DEN },
  { templateId: 'wolf', level: 6, locationId: WILD_WOLF_DEN },
  { templateId: 'troll', level: 9, locationId: WILD_WATCHTOWER, name: 'Elder Troll' },
];
