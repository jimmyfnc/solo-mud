# Whispering Woods Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a level 7-20 Fey-themed zone with 5 sub-zones, set piece system, and bank storage.

**Architecture:** Static location/creature data in `packages/shared/src/data/whispering-woods/`, set bonus logic in character stats calculation, bank storage via SQLite with personal + shared tabs.

**Tech Stack:** TypeScript, SQLite (better-sqlite3), existing item/creature template patterns

---

## Phase 1: Data Foundation (Parallelizable)

These tasks create data definitions with no dependencies on each other.

### Task 1.1: Create Whispering Woods Directory Structure

**Files:**
- Create: `packages/shared/src/data/whispering-woods/index.ts`
- Create: `packages/shared/src/data/whispering-woods/locations.ts`
- Create: `packages/shared/src/data/whispering-woods/creatures.ts`
- Create: `packages/shared/src/data/whispering-woods/items.ts`
- Create: `packages/shared/src/data/whispering-woods/sets.ts`

**Step 1: Create directory and index file**

```typescript
// packages/shared/src/data/whispering-woods/index.ts
/**
 * Whispering Woods - Level 7-20 Fey-themed dark forest zone.
 */

export * from './locations';
export * from './creatures';
export * from './items';
export * from './sets';
```

**Step 2: Create placeholder files**

```typescript
// packages/shared/src/data/whispering-woods/locations.ts
/**
 * Whispering Woods location definitions.
 */

import type { Location, Exit } from '../../types';

// Location IDs will be added in Task 1.2
export const WOODS_LOCATIONS: Record<string, Location> = {};
export const WOODS_EXITS: Record<string, Exit> = {};
```

```typescript
// packages/shared/src/data/whispering-woods/creatures.ts
/**
 * Whispering Woods creature templates.
 */

import type { CreatureTemplate } from '../../types/world';

// Creature templates will be added in Task 1.3
export const WOODS_CREATURE_TEMPLATES: Record<string, CreatureTemplate> = {};
```

```typescript
// packages/shared/src/data/whispering-woods/items.ts
/**
 * Whispering Woods item templates - uniques and set pieces.
 */

import type { ItemTemplate } from '../../constants/items';

// Items will be added in Tasks 1.4 and 1.5
export const WOODS_UNIQUE_ITEMS: ItemTemplate[] = [];
export const WOODS_SET_ITEMS: ItemTemplate[] = [];
```

```typescript
// packages/shared/src/data/whispering-woods/sets.ts
/**
 * Whispering Woods set bonus definitions.
 */

export interface SetBonus {
  pieces: number;
  description: string;
  stats?: Record<string, number>;
  special?: string; // Special effect ID
}

export interface SetDefinition {
  id: string;
  name: string;
  class: string;
  bonuses: SetBonus[];
  pieceIds: string[]; // Item baseIds that belong to this set
}

// Sets will be added in Task 1.6
export const WOODS_SETS: SetDefinition[] = [];
```

**Step 3: Commit**

```bash
git add packages/shared/src/data/whispering-woods/
git commit -m "feat(woods): create whispering woods data structure"
```

---

### Task 1.2: Transition Zone Locations (Farms → Gate → Old Road)

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/locations.ts`

**Step 1: Add location ID constants and transition locations**

```typescript
// packages/shared/src/data/whispering-woods/locations.ts
/**
 * Whispering Woods location definitions.
 */

import type { Location, Exit } from '../../types';

// ============ Location IDs ============

// Transition Zone
export const WOODS_FARMHOUSE = 'woods_farmhouse';
export const WOODS_FIELDS = 'woods_fields';
export const WOODS_EAST_GATE = 'woods_east_gate';
export const WOODS_OLD_ROAD_1 = 'woods_old_road_1';
export const WOODS_OLD_ROAD_2 = 'woods_old_road_2';
export const WOODS_OLD_ROAD_3 = 'woods_old_road_3';
export const WOODS_OLD_ROAD_4 = 'woods_old_road_4';
export const WOODS_OLD_ROAD_5 = 'woods_old_road_5';
export const WOODS_CLEARING = 'woods_clearing';

// ============ Transition Zone Locations ============

export const WOODS_LOCATIONS: Record<string, Location> = {
  [WOODS_FARMHOUSE]: {
    id: WOODS_FARMHOUSE,
    name: 'Weathered Farmhouse',
    biome: { plains: 1 },
    props: [
      'small stone farmhouse with thatched roof',
      'vegetable garden with wilting plants',
      'wooden fence in need of repair',
      'chicken coop with nervous hens',
      'old well with a rusty bucket',
      'farmer\'s tools leaning against the wall',
      'distant view of dark treeline to the east',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_farmer_tom'],
  },
  [WOODS_FIELDS]: {
    id: WOODS_FIELDS,
    name: 'Eastern Fields',
    biome: { plains: 1 },
    props: [
      'rows of wheat swaying in the breeze',
      'scarecrow with a crooked hat',
      'worn dirt path through the crops',
      'wooden cart loaded with hay',
      'wildflowers along the field edges',
      'birds circling overhead',
      'dark forest visible on the horizon',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
  [WOODS_EAST_GATE]: {
    id: WOODS_EAST_GATE,
    name: 'East Guard Gate',
    biome: { plains: 1 },
    props: [
      'sturdy wooden gatehouse',
      'iron-banded gate standing open',
      'guard tower with watchful sentries',
      'warning signs posted on the walls',
      'weapon rack beside the guard post',
      'worn map of the surrounding area',
      'lanterns ready for night patrol',
      'the dark treeline looms beyond',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_guard_elena_east', 'npc_guard_thomas'],
  },
  [WOODS_OLD_ROAD_1]: {
    id: WOODS_OLD_ROAD_1,
    name: 'Old Farm Road',
    biome: { plains: 1 },
    props: [
      'overgrown cobblestone road',
      'abandoned cart with broken wheel',
      'untended fields gone to seed',
      'rusted farm tools half-buried',
      'crows watching from fence posts',
      'the forest grows closer ahead',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 1,
    isSafeZone: false,
    npcs: [],
  },
  [WOODS_OLD_ROAD_2]: {
    id: WOODS_OLD_ROAD_2,
    name: 'Abandoned Homestead',
    biome: { plains: 1 },
    props: [
      'collapsed farmhouse foundation',
      'overgrown herb garden',
      'broken wooden fence',
      'well filled with debris',
      'child\'s toy half-buried in dirt',
      'unnatural silence hangs in the air',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 2,
    isSafeZone: false,
    npcs: [],
  },
  [WOODS_OLD_ROAD_3]: {
    id: WOODS_OLD_ROAD_3,
    name: 'Fog-Shrouded Path',
    biome: { plains: 0.5, forest: 0.5 },
    props: [
      'thick fog rolling in from the east',
      'gnarled trees beginning to appear',
      'path becoming harder to follow',
      'strange whispers on the wind',
      'dead crops in abandoned fields',
      'flickering lights in the distance',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 3,
    isSafeZone: false,
    npcs: [],
  },
  [WOODS_OLD_ROAD_4]: {
    id: WOODS_OLD_ROAD_4,
    name: 'Edge of the Woods',
    biome: { forest: 1 },
    props: [
      'massive twisted trees block the sky',
      'the road ends at a wall of brambles',
      'carved warning stone covered in moss',
      'bones of small animals scattered about',
      'cold air seeping from the forest',
      'eyes watching from the shadows',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 4,
    isSafeZone: false,
    npcs: [],
  },
  [WOODS_OLD_ROAD_5]: {
    id: WOODS_OLD_ROAD_5,
    name: 'Forest Threshold',
    biome: { forest: 1 },
    props: [
      'ancient stone archway covered in vines',
      'faded runes carved into the stones',
      'the forest seems to breathe',
      'path of white stones leading inward',
      'wind carries faint music',
      'your skin prickles with magic',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 5,
    isSafeZone: false,
    npcs: [],
  },
  [WOODS_CLEARING]: {
    id: WOODS_CLEARING,
    name: 'Whispering Clearing',
    biome: { forest: 1 },
    props: [
      'ancient tree stumps arranged in a circle',
      'soft bioluminescent moss',
      'five paths leading into darkness',
      'stone pedestal in the center',
      'wind carries distant whispers',
      'the canopy blocks all but dappled light',
      'flowers that glow faintly',
      'sense of being watched from all directions',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 6,
    isSafeZone: false,
    npcs: [],
  },
};

export const WOODS_EXITS: Record<string, Exit> = {};
```

**Step 2: Commit**

```bash
git add packages/shared/src/data/whispering-woods/locations.ts
git commit -m "feat(woods): add transition zone locations"
```

---

### Task 1.3: Creature Templates (22 creatures)

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/creatures.ts`

**Step 1: Add all creature templates**

```typescript
// packages/shared/src/data/whispering-woods/creatures.ts
/**
 * Whispering Woods creature templates.
 */

import type { CreatureTemplate } from '../../types/world';

// ============ Pixie Dell Creatures (L7-10) ============

const MISCHIEVOUS_SPRITE: CreatureTemplate = {
  id: 'mischievous_sprite',
  name: 'Mischievous Sprite',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 6,
  maxDepth: 10,
  baseHp: 45,
  baseLevel: 7,
  spawnWeight: 8,
  damageType: 'arcane',
  descriptions: {
    idle: [
      'A tiny winged creature giggles maliciously.',
      'A sprite darts between the flowers, watching you.',
      'Glowing wings flutter just out of reach.',
    ],
    alert: [
      'The sprite\'s laughter turns cruel!',
      'Tiny claws extend as the sprite attacks!',
    ],
  },
};

const QUICKLING: CreatureTemplate = {
  id: 'quickling',
  name: 'Quickling',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 6,
  maxDepth: 10,
  baseHp: 35,
  baseLevel: 8,
  spawnWeight: 6,
  damageType: 'physical',
  descriptions: {
    idle: [
      'Something moves too fast to see clearly.',
      'A blur of motion darts between the trees.',
      'You catch glimpses of a tiny, twisted form.',
    ],
    alert: [
      'The quickling appears in a flash, striking!',
      'Too fast! The quickling is already attacking!',
    ],
  },
};

const HOSTILE_PIXIE: CreatureTemplate = {
  id: 'hostile_pixie',
  name: 'Hostile Pixie',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 7,
  maxDepth: 11,
  baseHp: 55,
  baseLevel: 9,
  spawnWeight: 5,
  damageType: 'arcane',
  descriptions: {
    idle: [
      'A pixie with blackened wings hovers nearby.',
      'The pixie\'s once-beautiful face is twisted with malice.',
      'Dark magic crackles around the corrupted pixie.',
    ],
    alert: [
      'The pixie shrieks and hurls dark magic!',
      'Corrupted fairy dust burns where it touches!',
    ],
  },
};

const SPRITE_TRICKSTER: CreatureTemplate = {
  id: 'sprite_trickster',
  name: 'Sprite Trickster',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 8,
  maxDepth: 12,
  baseHp: 180,
  baseLevel: 10,
  spawnWeight: 0, // Boss - manually placed
  damageType: 'arcane',
  descriptions: {
    idle: [
      'The Sprite Trickster lounges on a throne of flowers.',
      'A crown of stolen trinkets adorns the Trickster\'s head.',
      'The most devious of sprites watches you with cunning eyes.',
    ],
    alert: [
      'The Trickster cackles and vanishes, reappearing behind you!',
      '"Let\'s play a game!" the Trickster laughs cruelly.',
    ],
  },
};

// ============ Murky Fen Creatures (L9-12) ============

const SHADOW_HOUND: CreatureTemplate = {
  id: 'shadow_hound',
  name: 'Shadow Hound',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['forest', 'swamp'],
  minDepth: 7,
  maxDepth: 12,
  baseHp: 65,
  baseLevel: 9,
  spawnWeight: 6,
  damageType: 'shadow',
  descriptions: {
    idle: [
      'A hound made of living shadow stalks nearby.',
      'Red eyes glow in a mass of darkness.',
      'The shadow hound phases in and out of visibility.',
    ],
    alert: [
      'The shadow hound lunges from the darkness!',
      'Teeth of pure shadow tear at you!',
    ],
  },
};

const REDCAP: CreatureTemplate = {
  id: 'redcap',
  name: 'Redcap',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['swamp', 'forest'],
  minDepth: 8,
  maxDepth: 13,
  baseHp: 75,
  baseLevel: 10,
  spawnWeight: 5,
  damageType: 'physical',
  descriptions: {
    idle: [
      'A murderous fey in a blood-soaked cap grins at you.',
      'The redcap sharpens a wicked iron pike.',
      'Dried blood cakes the small creature\'s cap.',
    ],
    alert: [
      'The redcap charges with murderous glee!',
      '"Fresh blood for me cap!" the redcap shrieks!',
    ],
  },
};

const BOG_LURKER: CreatureTemplate = {
  id: 'bog_lurker',
  name: 'Bog Lurker',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['swamp'],
  minDepth: 9,
  maxDepth: 14,
  baseHp: 90,
  baseLevel: 11,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'Something stirs beneath the murky water.',
      'A shape rises from the bog, dripping slime.',
      'The bog lurker watches with unblinking eyes.',
    ],
    alert: [
      'The lurker erupts from the water!',
      'Slimy tendrils lash out from the bog!',
    ],
  },
};

const REDCAP_CHIEFTAIN: CreatureTemplate = {
  id: 'redcap_chieftain',
  name: 'Redcap Chieftain',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['swamp'],
  minDepth: 10,
  maxDepth: 14,
  baseHp: 250,
  baseLevel: 12,
  spawnWeight: 0, // Boss
  damageType: 'physical',
  descriptions: {
    idle: [
      'The Chieftain\'s cap drips with fresh blood.',
      'A massive redcap sits on a throne of bones.',
      'The other redcaps cower before their Chieftain.',
    ],
    alert: [
      '"KILL! KILL FOR THE CAP!" the Chieftain roars!',
      'The Chieftain\'s iron boots thunder as it charges!',
    ],
  },
};

// ============ Standing Stones Creatures (L11-14) ============

const WILL_O_WISP: CreatureTemplate = {
  id: 'will_o_wisp',
  name: 'Will-o\'-wisp',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['swamp', 'forest'],
  minDepth: 9,
  maxDepth: 15,
  baseHp: 50,
  baseLevel: 11,
  spawnWeight: 7,
  damageType: 'arcane',
  descriptions: {
    idle: [
      'A ghostly light bobs in the darkness.',
      'The wisp flickers, trying to lead you astray.',
      'An eerie glow dances just ahead.',
    ],
    alert: [
      'The wisp flares with deadly light!',
      'Lightning crackles from the will-o\'-wisp!',
    ],
  },
};

const DARK_SATYR: CreatureTemplate = {
  id: 'dark_satyr',
  name: 'Dark Satyr',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 10,
  maxDepth: 15,
  baseHp: 95,
  baseLevel: 12,
  spawnWeight: 5,
  damageType: 'shadow',
  descriptions: {
    idle: [
      'A satyr with blackened horns plays a haunting tune.',
      'The dark satyr\'s eyes hold ancient malice.',
      'Corruption has twisted this once-playful fey.',
    ],
    alert: [
      'The satyr\'s music turns to a battle cry!',
      'Hooves thunder as the dark satyr charges!',
    ],
  },
};

const CORRUPTED_DRUID: CreatureTemplate = {
  id: 'corrupted_druid',
  name: 'Corrupted Druid',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 11,
  maxDepth: 16,
  baseHp: 85,
  baseLevel: 13,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A figure in rotting robes tends to dead plants.',
      'The druid\'s eyes glow with sickly green light.',
      'Corruption seeps from the druid\'s fingertips.',
    ],
    alert: [
      'The druid calls upon twisted nature magic!',
      'Thorns and poison answer the druid\'s call!',
    ],
  },
};

const SATYR_SHAMAN: CreatureTemplate = {
  id: 'satyr_shaman',
  name: 'Satyr Shaman',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 12,
  maxDepth: 16,
  baseHp: 300,
  baseLevel: 14,
  spawnWeight: 0, // Boss
  damageType: 'shadow',
  descriptions: {
    idle: [
      'The Shaman chants before the ancient stones.',
      'Dark spirits swirl around the Satyr Shaman.',
      'The most powerful of the corrupted satyrs.',
    ],
    alert: [
      'The Shaman\'s chant becomes a curse!',
      '"The old ways demand blood!" the Shaman screams!',
    ],
  },
};

// ============ Spider Hollow Creatures (L13-16) ============

const GIANT_SPIDER: CreatureTemplate = {
  id: 'giant_spider',
  name: 'Giant Spider',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 11,
  maxDepth: 17,
  baseHp: 100,
  baseLevel: 13,
  spawnWeight: 6,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A massive spider lurks in its web.',
      'Eight eyes gleam in the darkness.',
      'Webs stretch between the trees like curtains.',
    ],
    alert: [
      'The spider drops from above!',
      'Venomous fangs drip as the spider strikes!',
    ],
  },
};

const ETTERCAP: CreatureTemplate = {
  id: 'ettercap',
  name: 'Ettercap',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 12,
  maxDepth: 18,
  baseHp: 120,
  baseLevel: 14,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A hunched spider-like humanoid tends its webs.',
      'The ettercap\'s mandibles click hungrily.',
      'Webbing hangs from the creature\'s clawed hands.',
    ],
    alert: [
      'The ettercap hisses and throws webbing!',
      'Claws and webs lash out simultaneously!',
    ],
  },
};

const BROODMOTHER_SPIDER: CreatureTemplate = {
  id: 'broodmother_spider',
  name: 'Broodmother Spider',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 13,
  maxDepth: 19,
  baseHp: 140,
  baseLevel: 15,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A massive spider guards egg sacs.',
      'The broodmother\'s abdomen pulses with eggs.',
      'Small spiders swarm around their mother.',
    ],
    alert: [
      'The broodmother shrieks in rage!',
      'Protect the eggs! The broodmother attacks!',
    ],
  },
};

const SPIDER_QUEEN: CreatureTemplate = {
  id: 'spider_queen',
  name: 'Spider Queen',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 14,
  maxDepth: 18,
  baseHp: 380,
  baseLevel: 16,
  spawnWeight: 0, // Boss
  damageType: 'nature',
  descriptions: {
    idle: [
      'The Spider Queen sits at the center of a massive web.',
      'A crown of skulls adorns the Queen\'s head.',
      'Thousands of tiny spiders attend their Queen.',
    ],
    alert: [
      'The Queen descends from her throne of webs!',
      '"My children hunger!" the Queen\'s voice echoes!',
    ],
  },
};

// ============ Thornwood Maze Creatures (L16-18) ============

const THORN_CRAWLER: CreatureTemplate = {
  id: 'thorn_crawler',
  name: 'Thorn Crawler',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 14,
  maxDepth: 20,
  baseHp: 130,
  baseLevel: 16,
  spawnWeight: 5,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A mass of animated thorns creeps along.',
      'Vines covered in razor thorns writhe nearby.',
      'The brambles themselves seem alive.',
    ],
    alert: [
      'Thorns lash out from all directions!',
      'The crawler erupts in a flurry of spines!',
    ],
  },
};

const BRAMBLE_BEAST: CreatureTemplate = {
  id: 'bramble_beast',
  name: 'Bramble Beast',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 15,
  maxDepth: 21,
  baseHp: 160,
  baseLevel: 17,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A hulking mass of thorns and vines.',
      'The beast\'s form shifts like a thorn bush in wind.',
      'Roses bloom on the creature - beautiful and deadly.',
    ],
    alert: [
      'The bramble beast roars without a mouth!',
      'Thorns extend into deadly claws!',
    ],
  },
};

const TWISTED_TREANT: CreatureTemplate = {
  id: 'twisted_treant',
  name: 'Twisted Treant',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 15,
  maxDepth: 21,
  baseHp: 180,
  baseLevel: 17,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A corrupted tree creature watches with hollow eyes.',
      'The treant\'s bark is blackened and cracked.',
      'Fungus and rot cover the twisted treant.',
    ],
    alert: [
      'Ancient limbs swing with crushing force!',
      'The forest itself rises against you!',
    ],
  },
};

const THORNLORD: CreatureTemplate = {
  id: 'thornlord',
  name: 'Thornlord',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 16,
  maxDepth: 20,
  baseHp: 450,
  baseLevel: 18,
  spawnWeight: 0, // Boss
  damageType: 'nature',
  descriptions: {
    idle: [
      'The Thornlord is one with the maze itself.',
      'A towering figure of brambles and hate.',
      'The very thorns bow before their Lord.',
    ],
    alert: [
      'The maze closes in as the Thornlord attacks!',
      '"None leave my domain!" the Thornlord bellows!',
    ],
  },
};

// ============ Matriarch's Sanctum Creatures (L18-20) ============

const CORRUPTED_DRYAD: CreatureTemplate = {
  id: 'corrupted_dryad',
  name: 'Corrupted Dryad',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 16,
  maxDepth: 22,
  baseHp: 170,
  baseLevel: 18,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A dryad with bark-like skin and hollow eyes.',
      'What was once beautiful is now twisted.',
      'Corruption flows through the dryad\'s veins.',
    ],
    alert: [
      'The dryad\'s beauty becomes terrible!',
      'Nature magic turned dark lashes out!',
    ],
  },
};

const MATRIARCHS_HANDMAIDEN: CreatureTemplate = {
  id: 'matriarchs_handmaiden',
  name: 'Matriarch\'s Handmaiden',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 17,
  maxDepth: 22,
  baseHp: 220,
  baseLevel: 19,
  spawnWeight: 0, // Placed manually
  damageType: 'nature',
  descriptions: {
    idle: [
      'An elite dryad guards the path to the Matriarch.',
      'The Handmaiden\'s form is almost beautiful.',
      'Deadly devotion burns in her eyes.',
    ],
    alert: [
      'The Handmaiden fights to protect her mistress!',
      '"For the Matriarch!" she screams!',
    ],
  },
};

const CORRUPTED_DRYAD_MATRIARCH: CreatureTemplate = {
  id: 'corrupted_dryad_matriarch',
  name: 'Corrupted Dryad Matriarch',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'apex',
  biomes: ['forest'],
  minDepth: 18,
  maxDepth: 22,
  baseHp: 800,
  baseLevel: 20,
  spawnWeight: 0, // Final Boss
  damageType: 'nature',
  descriptions: {
    idle: [
      'The Matriarch sits upon a throne of living wood.',
      'Once the forest\'s guardian, now its doom.',
      'Power and corruption radiate from her form.',
    ],
    alert: [
      '"You dare enter my sanctuary?!" she roars!',
      'The entire grove awakens to destroy you!',
    ],
  },
};

// ============ Export All Templates ============

export const WOODS_CREATURE_TEMPLATES: Record<string, CreatureTemplate> = {
  // Pixie Dell
  mischievous_sprite: MISCHIEVOUS_SPRITE,
  quickling: QUICKLING,
  hostile_pixie: HOSTILE_PIXIE,
  sprite_trickster: SPRITE_TRICKSTER,
  // Murky Fen
  shadow_hound: SHADOW_HOUND,
  redcap: REDCAP,
  bog_lurker: BOG_LURKER,
  redcap_chieftain: REDCAP_CHIEFTAIN,
  // Standing Stones
  will_o_wisp: WILL_O_WISP,
  dark_satyr: DARK_SATYR,
  corrupted_druid: CORRUPTED_DRUID,
  satyr_shaman: SATYR_SHAMAN,
  // Spider Hollow
  giant_spider: GIANT_SPIDER,
  ettercap: ETTERCAP,
  broodmother_spider: BROODMOTHER_SPIDER,
  spider_queen: SPIDER_QUEEN,
  // Thornwood Maze
  thorn_crawler: THORN_CRAWLER,
  bramble_beast: BRAMBLE_BEAST,
  twisted_treant: TWISTED_TREANT,
  thornlord: THORNLORD,
  // Matriarch's Sanctum
  corrupted_dryad: CORRUPTED_DRYAD,
  matriarchs_handmaiden: MATRIARCHS_HANDMAIDEN,
  corrupted_dryad_matriarch: CORRUPTED_DRYAD_MATRIARCH,
};

// Boss list for easy reference
export const WOODS_BOSSES = [
  'sprite_trickster',
  'redcap_chieftain',
  'satyr_shaman',
  'spider_queen',
  'thornlord',
  'corrupted_dryad_matriarch',
] as const;
```

**Step 2: Commit**

```bash
git add packages/shared/src/data/whispering-woods/creatures.ts
git commit -m "feat(woods): add 22 creature templates"
```

---

### Task 1.4: Unique Item Templates (6 items)

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/items.ts`

**Step 1: Add unique item templates**

```typescript
// packages/shared/src/data/whispering-woods/items.ts
/**
 * Whispering Woods item templates - uniques and set pieces.
 */

import type { ItemTemplate } from '../../constants/items';

// ============ Class-Specific Unique Items ============

export const WOODS_UNIQUE_ITEMS: ItemTemplate[] = [
  // Rogue - Sprite Trickster drop
  {
    baseId: 'flickerblade',
    name: 'Flickerblade',
    tags: ['weapon', 'dagger', 'melee', 'unique', 'rogue'],
    rarity: 'epic',
    description: 'A dagger that phases through armor. The blade seems to exist in two places at once.',
  },
  // Warrior - Redcap Chieftain drop
  {
    baseId: 'bloodcap_cleaver',
    name: 'Bloodcap Cleaver',
    tags: ['weapon', 'axe', 'melee', 'unique', 'warrior'],
    rarity: 'epic',
    description: 'A brutal axe stained with the blood of countless victims. Heals you when you slay an enemy.',
  },
  // Cleric - Satyr Shaman drop
  {
    baseId: 'totem_wild_spirit',
    name: 'Totem of the Wild Spirit',
    tags: ['offhand', 'totem', 'unique', 'cleric'],
    rarity: 'epic',
    description: 'A carved totem pulsing with nature spirits. Greatly enhances healing magic.',
  },
  // Mage - Spider Queen drop
  {
    baseId: 'venomweave_wand',
    name: 'Venomweave Wand',
    tags: ['weapon', 'wand', 'magic', 'unique', 'mage'],
    rarity: 'epic',
    description: 'A wand wrapped in spider silk. Spells leave lingering poison.',
  },
  // Ranger - Thornlord drop
  {
    baseId: 'bramblewood_bow',
    name: 'Bramblewood Bow',
    tags: ['weapon', 'bow', 'ranged', 'unique', 'ranger'],
    rarity: 'epic',
    description: 'A living bow that grows thorns. Arrows may root enemies in place.',
  },
  // Universal - Matriarch drop
  {
    baseId: 'heartwood_amulet',
    name: 'Heartwood Amulet',
    tags: ['necklace', 'jewelry', 'unique'],
    rarity: 'epic',
    description: 'Carved from the Matriarch\'s heartwood. Pulses with ancient forest magic.',
  },
];

// ============ Key Fragments ============

export const WOODS_FRAGMENTS: ItemTemplate[] = [
  {
    baseId: 'fragment_innocence',
    name: 'Fragment of Innocence',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized fey essence. It glows with childlike light.',
  },
  {
    baseId: 'fragment_fury',
    name: 'Fragment of Fury',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized fey essence. It pulses with violent red.',
  },
  {
    baseId: 'fragment_spirit',
    name: 'Fragment of Spirit',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized fey essence. Ghostly whispers emanate from within.',
  },
  {
    baseId: 'fragment_hunger',
    name: 'Fragment of Hunger',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized fey essence. It seems to absorb the light.',
  },
  {
    baseId: 'fragment_growth',
    name: 'Fragment of Growth',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized fey essence. Tiny vines grow from its surface.',
  },
];

export const DRYADS_HEART_KEY: ItemTemplate = {
  baseId: 'dryads_heart_key',
  name: 'Dryad\'s Heart Key',
  tags: ['quest', 'key'],
  rarity: 'epic',
  description: 'A complete key formed from five fragments. It thrums with the forest\'s heartbeat.',
};

export const WOODS_SET_ITEMS: ItemTemplate[] = [];
// Set items added in Task 1.5
```

**Step 2: Commit**

```bash
git add packages/shared/src/data/whispering-woods/items.ts
git commit -m "feat(woods): add unique items and key fragments"
```

---

### Task 1.5: Set Piece Items (30 items)

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/items.ts`

**Step 1: Add all 30 set piece templates**

Replace the `WOODS_SET_ITEMS` export at the end of items.ts:

```typescript
// ============ Set Piece Items (5 classes x 6 pieces) ============

// Helper to create set items for a class
function createClassSetItems(
  setId: string,
  setName: string,
  className: string
): ItemTemplate[] {
  return [
    {
      baseId: `${setId}_gloves`,
      name: `${setName} Gloves`,
      tags: ['armor', 'hands', 'set', className],
      rarity: 'rare',
      description: `Gloves from the ${setName}. (2) piece bonus when worn with other set items.`,
    },
    {
      baseId: `${setId}_boots`,
      name: `${setName} Boots`,
      tags: ['armor', 'feet', 'set', className],
      rarity: 'rare',
      description: `Boots from the ${setName}. (2) piece bonus when worn with other set items.`,
    },
    {
      baseId: `${setId}_belt`,
      name: `${setName} Belt`,
      tags: ['armor', 'belt', 'set', className],
      rarity: 'rare',
      description: `Belt from the ${setName}. (2) piece bonus when worn with other set items.`,
    },
    {
      baseId: `${setId}_shoulders`,
      name: `${setName} Shoulders`,
      tags: ['armor', 'shoulders', 'set', className],
      rarity: 'rare',
      description: `Shoulders from the ${setName}. (4) piece bonus when worn with other set items.`,
    },
    {
      baseId: `${setId}_helm`,
      name: `${setName} Helm`,
      tags: ['armor', 'head', 'set', className],
      rarity: 'rare',
      description: `Helm from the ${setName}. (4) piece bonus when worn with other set items.`,
    },
    {
      baseId: `${setId}_chest`,
      name: `${setName} Chestpiece`,
      tags: ['armor', 'chest', 'set', className],
      rarity: 'epic',
      description: `Chestpiece from the ${setName}. (6) piece bonus completes the set.`,
    },
  ];
}

export const WOODS_SET_ITEMS: ItemTemplate[] = [
  // Warrior - Thornguard Set
  ...createClassSetItems('thornguard', 'Thornguard', 'warrior'),
  // Mage - Veilweave Set
  ...createClassSetItems('veilweave', 'Veilweave', 'mage'),
  // Rogue - Shadowthorn Set
  ...createClassSetItems('shadowthorn', 'Shadowthorn', 'rogue'),
  // Cleric - Spiritwood Set
  ...createClassSetItems('spiritwood', 'Spiritwood', 'cleric'),
  // Ranger - Wildwood Set
  ...createClassSetItems('wildwood', 'Wildwood', 'ranger'),
];
```

**Step 2: Commit**

```bash
git add packages/shared/src/data/whispering-woods/items.ts
git commit -m "feat(woods): add 30 set piece items"
```

---

### Task 1.6: Set Bonus Definitions

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/sets.ts`

**Step 1: Define all 5 class sets with bonuses**

```typescript
// packages/shared/src/data/whispering-woods/sets.ts
/**
 * Whispering Woods set bonus definitions.
 */

export interface SetBonus {
  pieces: number;
  description: string;
  stats?: Record<string, number>;
  special?: string; // Special effect ID for complex bonuses
}

export interface SetDefinition {
  id: string;
  name: string;
  class: string;
  bonuses: SetBonus[];
  pieceIds: string[]; // Item baseIds that belong to this set
}

export const WOODS_SETS: SetDefinition[] = [
  // Warrior - Thornguard Set
  {
    id: 'thornguard',
    name: 'Thornguard Set',
    class: 'warrior',
    bonuses: [
      { pieces: 2, description: '+50 Max HP', stats: { maxHp: 50 } },
      { pieces: 4, description: '+10% Physical Resistance', stats: { physicalResistance: 10 } },
      { pieces: 6, description: 'Thorns Aura - Attackers take damage', special: 'thorns_aura' },
    ],
    pieceIds: [
      'thornguard_gloves',
      'thornguard_boots',
      'thornguard_belt',
      'thornguard_shoulders',
      'thornguard_helm',
      'thornguard_chest',
    ],
  },
  // Mage - Veilweave Set
  {
    id: 'veilweave',
    name: 'Veilweave Set',
    class: 'mage',
    bonuses: [
      { pieces: 2, description: '+30 Max MP', stats: { maxMp: 30 } },
      { pieces: 4, description: '+15% Spell Power', stats: { spellPower: 15 } },
      { pieces: 6, description: 'Veil of Shadows - 10% to avoid damage', special: 'veil_of_shadows' },
    ],
    pieceIds: [
      'veilweave_gloves',
      'veilweave_boots',
      'veilweave_belt',
      'veilweave_shoulders',
      'veilweave_helm',
      'veilweave_chest',
    ],
  },
  // Rogue - Shadowthorn Set
  {
    id: 'shadowthorn',
    name: 'Shadowthorn Set',
    class: 'rogue',
    bonuses: [
      { pieces: 2, description: '+10% Crit Chance', stats: { critChance: 10 } },
      { pieces: 4, description: '+20% Crit Damage', stats: { critDamage: 20 } },
      { pieces: 6, description: 'Fey Step - First attack in combat always crits', special: 'fey_step' },
    ],
    pieceIds: [
      'shadowthorn_gloves',
      'shadowthorn_boots',
      'shadowthorn_belt',
      'shadowthorn_shoulders',
      'shadowthorn_helm',
      'shadowthorn_chest',
    ],
  },
  // Cleric - Spiritwood Set
  {
    id: 'spiritwood',
    name: 'Spiritwood Set',
    class: 'cleric',
    bonuses: [
      { pieces: 2, description: '+20% Healing Power', stats: { healingPower: 20 } },
      { pieces: 4, description: '+25 Max MP, +5 MP Regen', stats: { maxMp: 25, mpRegen: 5 } },
      { pieces: 6, description: "Nature's Grace - 15% for heals to cost no mana", special: 'natures_grace' },
    ],
    pieceIds: [
      'spiritwood_gloves',
      'spiritwood_boots',
      'spiritwood_belt',
      'spiritwood_shoulders',
      'spiritwood_helm',
      'spiritwood_chest',
    ],
  },
  // Ranger - Wildwood Set
  {
    id: 'wildwood',
    name: 'Wildwood Set',
    class: 'ranger',
    bonuses: [
      { pieces: 2, description: '+15% Ranged Damage', stats: { rangedDamage: 15 } },
      { pieces: 4, description: '+10% Dodge Chance', stats: { dodgeChance: 10 } },
      { pieces: 6, description: "Predator's Mark - Stacking damage on same target", special: 'predators_mark' },
    ],
    pieceIds: [
      'wildwood_gloves',
      'wildwood_boots',
      'wildwood_belt',
      'wildwood_shoulders',
      'wildwood_helm',
      'wildwood_chest',
    ],
  },
];

/**
 * Get set definition by ID.
 */
export function getSetDefinition(setId: string): SetDefinition | undefined {
  return WOODS_SETS.find(s => s.id === setId);
}

/**
 * Get which set an item belongs to (if any).
 */
export function getItemSet(itemBaseId: string): SetDefinition | undefined {
  return WOODS_SETS.find(s => s.pieceIds.includes(itemBaseId));
}
```

**Step 2: Commit**

```bash
git add packages/shared/src/data/whispering-woods/sets.ts
git commit -m "feat(woods): add set bonus definitions"
```

---

## Phase 2: Sub-Zone Locations (Can be parallelized)

Each sub-zone's locations can be implemented independently.

### Task 2.1: Pixie Dell Locations (8 rooms)

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/locations.ts`

**Step 1: Add Pixie Dell location IDs after existing IDs**

```typescript
// Pixie Dell (North from hub)
export const WOODS_PIXIE_ENTRANCE = 'woods_pixie_entrance';
export const WOODS_PIXIE_GLADE = 'woods_pixie_glade';
export const WOODS_PIXIE_MAZE_1 = 'woods_pixie_maze_1';
export const WOODS_PIXIE_MAZE_2 = 'woods_pixie_maze_2';
export const WOODS_PIXIE_MAZE_3 = 'woods_pixie_maze_3';
export const WOODS_PIXIE_TRAPPED = 'woods_pixie_trapped';
export const WOODS_PIXIE_COURT = 'woods_pixie_court';
```

**Step 2: Add Pixie Dell locations to WOODS_LOCATIONS**

```typescript
  [WOODS_PIXIE_ENTRANCE]: {
    id: WOODS_PIXIE_ENTRANCE,
    name: 'Dell Entrance',
    biome: { forest: 1 },
    props: [
      'archway of flowering vines',
      'sweet intoxicating scent',
      'bioluminescent mushrooms',
      'tiny footprints in the moss',
      'distant tinkling laughter',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_sprite_1', 'creature_sprite_2'],
    visitState: { visitCount: 0 },
    depth: 7,
    npcs: [],
  },
  [WOODS_PIXIE_GLADE]: {
    id: WOODS_PIXIE_GLADE,
    name: 'Glittering Glade',
    biome: { forest: 1 },
    props: [
      'flowers that glow in shifting colors',
      'butterflies made of pure light',
      'soft grass that cushions your steps',
      'ring of toadstools',
      'sprites watching from flowers',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_sprite_3', 'creature_sprite_4'],
    visitState: { visitCount: 0 },
    depth: 7,
    npcs: [],
  },
  [WOODS_PIXIE_MAZE_1]: {
    id: WOODS_PIXIE_MAZE_1,
    name: 'Flower Maze',
    biome: { forest: 1 },
    props: [
      'towering flowers form maze walls',
      'petals that snap at passersby',
      'paths that seem to shift',
      'giggling from all directions',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_quickling_1'],
    visitState: { visitCount: 0 },
    depth: 8,
    npcs: [],
  },
  [WOODS_PIXIE_MAZE_2]: {
    id: WOODS_PIXIE_MAZE_2,
    name: 'Flower Maze',
    biome: { forest: 1 },
    props: [
      'identical paths in every direction',
      'your footprints disappear behind you',
      'flowers turning to watch you',
      'something fast moves between stems',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_quickling_2'],
    visitState: { visitCount: 0 },
    depth: 8,
    npcs: [],
  },
  [WOODS_PIXIE_MAZE_3]: {
    id: WOODS_PIXIE_MAZE_3,
    name: 'Flower Maze',
    biome: { forest: 1 },
    props: [
      'dead end with a suspicious clearing',
      'treasure glinting in the center',
      'flowers closing in around you',
      'trap! The flowers attack!',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_quickling_3', 'creature_quickling_4'],
    visitState: { visitCount: 0 },
    depth: 8,
    npcs: [],
  },
  [WOODS_PIXIE_TRAPPED]: {
    id: WOODS_PIXIE_TRAPPED,
    name: 'Trapped Grove',
    biome: { forest: 1 },
    props: [
      'pixies have set snares everywhere',
      'bones of small animals in traps',
      'cruel laughter echoes',
      'the beauty here is a lie',
      'corrupted pixies circle above',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_hostile_pixie_1', 'creature_hostile_pixie_2'],
    visitState: { visitCount: 0 },
    depth: 9,
    npcs: [],
  },
  [WOODS_PIXIE_COURT]: {
    id: WOODS_PIXIE_COURT,
    name: "Trickster's Court",
    biome: { forest: 1 },
    props: [
      'throne of woven flowers and stolen gold',
      'piles of trinkets and treasures',
      'sprites attending their master',
      'the air crackles with wild magic',
      'the Sprite Trickster awaits',
    ],
    items: [],
    enemies: [],
    creatures: ['creature_sprite_trickster'],
    visitState: { visitCount: 0 },
    depth: 10,
    npcs: [],
    isBossRoom: true,
  },
```

**Step 3: Commit**

```bash
git add packages/shared/src/data/whispering-woods/locations.ts
git commit -m "feat(woods): add Pixie Dell locations"
```

---

### Task 2.2: Murky Fen Locations (7 rooms)

*[Similar pattern - add location IDs and Location objects for:]*
- woods_fen_entrance
- woods_fen_bog_path
- woods_fen_ruins_1
- woods_fen_ruins_2
- woods_fen_redcap_camp
- woods_fen_chieftain_mound

**Commit:** `feat(woods): add Murky Fen locations`

---

### Task 2.3: Standing Stones Locations (7 rooms)

*[Similar pattern for Standing Stones sub-zone]*

**Commit:** `feat(woods): add Standing Stones locations`

---

### Task 2.4: Spider Hollow Locations (8 rooms)

*[Similar pattern for Spider Hollow sub-zone]*

**Commit:** `feat(woods): add Spider Hollow locations`

---

### Task 2.5: Thornwood Maze Locations (8 rooms)

*[Similar pattern for Thornwood Maze sub-zone]*

**Commit:** `feat(woods): add Thornwood Maze locations`

---

### Task 2.6: Matriarch's Sanctum Locations (4 rooms)

*[Similar pattern for final boss area]*

**Commit:** `feat(woods): add Matriarch's Sanctum locations`

---

## Phase 3: Exits and Integration

### Task 3.1: Define All Exits

**Files:**
- Modify: `packages/shared/src/data/whispering-woods/locations.ts`

**Step 1: Add all exit definitions to WOODS_EXITS**

This includes:
- Eastern Road → Farmhouse → Fields → Gate → Old Road (chain)
- Old Road → Clearing (hub)
- Clearing → Each sub-zone entrance
- Internal sub-zone connections
- Boss room exits

**Step 2: Commit**

```bash
git commit -m "feat(woods): add all exit definitions"
```

---

### Task 3.2: Integrate with Easthollow

**Files:**
- Modify: `packages/shared/src/data/easthollow.ts`
- Modify: `packages/server/src/world/generate.ts`

**Step 1: Add exit from Eastern Road to Farmhouse**

In easthollow.ts, add to EASTHOLLOW_EXITS:

```typescript
  // East from Eastern Road to Whispering Woods zone
  exit_eastroad_farmhouse: {
    id: 'exit_eastroad_farmhouse',
    from: TOWN_EAST_ROAD,
    to: 'woods_farmhouse',
    label: 'east',
    type: 'open',
  },
```

**Step 2: Import and merge woods data in generate.ts**

**Step 3: Commit**

```bash
git commit -m "feat(woods): integrate with easthollow and world generation"
```

---

## Phase 4: Bank System

### Task 4.1: Bank Database Schema

**Files:**
- Modify: `packages/server/src/db/schema.sql`
- Modify: `packages/server/src/db/database.ts`

**Step 1: Add bank_storage table to schema.sql**

```sql
-- Bank storage for items
CREATE TABLE IF NOT EXISTS bank_storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,           -- For shared storage
  character_id TEXT,                   -- NULL for shared, character ID for personal
  slot INTEGER NOT NULL,
  item_data TEXT NOT NULL,             -- JSON serialized item
  tab TEXT NOT NULL DEFAULT 'personal', -- 'personal' or 'shared'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, character_id, slot, tab)
);

CREATE INDEX IF NOT EXISTS idx_bank_account ON bank_storage(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_character ON bank_storage(character_id);
```

**Step 2: Add migration in database.ts**

**Step 3: Commit**

```bash
git commit -m "feat(bank): add bank storage database schema"
```

---

### Task 4.2: Bank Repository

**Files:**
- Create: `packages/server/src/db/repositories/BankRepository.ts`

**Step 1: Create repository with deposit/withdraw/list methods**

```typescript
// packages/server/src/db/repositories/BankRepository.ts
import { getDatabase } from '../database';
import type { Item } from '@solo-mud/shared';

export interface BankSlot {
  slot: number;
  item: Item;
}

export class BankRepository {
  // Personal storage methods
  getPersonalStorage(characterId: string): BankSlot[];
  depositPersonal(characterId: string, accountId: string, item: Item): number;
  withdrawPersonal(characterId: string, slot: number): Item | null;

  // Shared storage methods
  getSharedStorage(accountId: string): BankSlot[];
  depositShared(accountId: string, item: Item): number;
  withdrawShared(accountId: string, slot: number): Item | null;
}
```

**Step 2: Commit**

```bash
git commit -m "feat(bank): add BankRepository"
```

---

### Task 4.3: Bank Location and NPC

**Files:**
- Modify: `packages/shared/src/data/easthollow.ts`

**Step 1: Add bank location and Thaddeus NPC**

**Step 2: Add exits from Market Street**

**Step 3: Commit**

```bash
git commit -m "feat(bank): add Easthollow Vault location and banker NPC"
```

---

### Task 4.4: Bank Commands

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Add bank command handlers**

- `bank` - talk to banker / show help
- `deposit <item>` - personal deposit
- `deposit <item> shared` - shared deposit
- `withdraw <item>` - personal withdraw
- `withdraw <item> shared` - shared withdraw
- `bank list` - view storage

**Step 2: Commit**

```bash
git commit -m "feat(bank): add bank commands"
```

---

## Phase 5: Set Bonus System

### Task 5.1: Set Bonus Calculation

**Files:**
- Create: `packages/server/src/character/set-bonuses.ts`
- Modify: `packages/server/src/character/stats.ts`

**Step 1: Create set bonus calculation logic**

```typescript
// packages/server/src/character/set-bonuses.ts
import { WOODS_SETS, getItemSet } from '@solo-mud/shared';
import type { Player, Item, World } from '@solo-mud/shared';

export interface ActiveSetBonus {
  setId: string;
  setName: string;
  piecesEquipped: number;
  activeBonuses: { pieces: number; description: string; stats?: Record<string, number> }[];
}

export function calculateSetBonuses(player: Player, world: World): ActiveSetBonus[];
export function applySetBonusStats(baseStats: CombatStats, setBonuses: ActiveSetBonus[]): CombatStats;
```

**Step 2: Integrate into stats.ts calculateCombatStats**

**Step 3: Commit**

```bash
git commit -m "feat(sets): add set bonus calculation"
```

---

### Task 5.2: Set Bonus Display

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Add set bonuses to `status` command output**

**Step 2: Add `sets` command to view equipped set info**

**Step 3: Commit**

```bash
git commit -m "feat(sets): add set bonus display commands"
```

---

## Phase 6: Loot Tables and Boss Drops

### Task 6.1: Woods Loot Tables

**Files:**
- Create: `packages/server/src/loot/woods-loot.ts`

**Step 1: Create loot tables for each boss**

Each boss drops:
1. Their class-specific unique (100% first kill, lower after)
2. A random class set piece for their slot
3. Gold/copper
4. Their heart fragment (100%)

**Step 2: Commit**

```bash
git commit -m "feat(woods): add loot tables"
```

---

### Task 6.2: Fragment/Key System

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`
- Modify: `packages/shared/src/types/character.ts`

**Step 1: Track collected fragments in player state**

**Step 2: Add `assemble` command at Blighted Altar**

**Step 3: Add locked exit that requires key**

**Step 4: Commit**

```bash
git commit -m "feat(woods): add fragment collection and key assembly"
```

---

## Phase 7: Testing and Polish

### Task 7.1: Creature Spawn Tests

**Files:**
- Create: `packages/server/src/world/woods-creatures.test.ts`

### Task 7.2: Set Bonus Tests

**Files:**
- Create: `packages/server/src/character/set-bonuses.test.ts`

### Task 7.3: Bank Tests

**Files:**
- Create: `packages/server/src/db/repositories/BankRepository.test.ts`

### Task 7.4: Integration Testing

Manual testing walkthrough:
1. Travel from town to woods
2. Fight through each sub-zone
3. Collect all fragments
4. Defeat the Matriarch
5. Verify loot drops and set bonuses
6. Test bank deposit/withdraw

---

## Parallelization Summary

**Can run in parallel:**
- Task 1.2, 1.3, 1.4, 1.5, 1.6 (all data definitions)
- Task 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 (sub-zone locations)
- Task 4.1-4.4 (bank system - independent of zone)
- Task 5.1-5.2 (set system - needs items defined first)

**Must be sequential:**
- Phase 1 before Phase 2 (need location IDs)
- Phase 2 before Phase 3 (need locations for exits)
- Phase 3 before Phase 6 (need full zone for loot)
- Phase 5 needs Phase 1.5-1.6 (set items and definitions)

**Recommended parallel batches:**
1. **Batch 1:** Tasks 1.1-1.6 + 4.1 (all foundation)
2. **Batch 2:** Tasks 2.1-2.6 + 4.2-4.4 + 5.1-5.2 (locations + bank + sets)
3. **Batch 3:** Tasks 3.1-3.2 + 6.1-6.2 (integration + loot)
4. **Batch 4:** Tasks 7.1-7.4 (testing)
