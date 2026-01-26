# Easthollow Starter Town Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Easthollow starter town with NPCs, tutorial system, and shops so new players spawn in a safe town instead of wilderness.

**Architecture:** Static town data defined in shared package, merged into world during generation. New command handlers for `talk`, `buy`, `sell`, `tutorial`. Tutorial progress tracked on Player type. Safe zones prevent combat.

**Tech Stack:** TypeScript, Vitest for tests, existing @solo-mud/shared and @solo-mud/server packages.

---

## Task 1: Add NPC and Town Types to Shared Package

**Files:**
- Create: `packages/shared/src/types/town.ts`
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/types/world.ts`
- Modify: `packages/shared/src/types/character.ts`

**Step 1: Create town.ts with NPC and shop types**

```typescript
// packages/shared/src/types/town.ts
/**
 * Town, NPC, and shop type definitions.
 */

import type { NodeId, ItemId } from './world';

/** A dialogue topic an NPC can discuss */
export interface DialogueTopic {
  id: string;
  prompt: string;
  response: string;
  /** If set, completing this topic marks a tutorial step done */
  teachesCommand?: string;
}

/** Shop item with price and optional stock limit */
export interface ShopItem {
  baseId: string;
  basePrice: number;
  /** undefined = unlimited stock */
  stock?: number;
}

/** Shop inventory for merchant NPCs */
export interface ShopInventory {
  items: ShopItem[];
  buyMultiplier: number;
  sellMultiplier: number;
}

/** An NPC in the game world */
export interface NPC {
  id: string;
  name: string;
  title?: string;
  locationId: NodeId;
  dialogue: DialogueTopic[];
  shop?: ShopInventory;
  /** Tutorial topics this NPC can teach */
  tutorialTopics?: string[];
}

/** Tutorial progress tracker */
export interface TutorialProgress {
  /** Whether player chose to skip tutorial */
  skipped: boolean;
  /** Whether tutorial is complete (all steps done or skipped) */
  complete: boolean;
  /** Completed tutorial steps */
  completedSteps: string[];
}

/** Tutorial step definition */
export interface TutorialStep {
  id: string;
  description: string;
}

/** All tutorial steps */
export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'talk_mira', description: 'Speak with Innkeeper Mira' },
  { id: 'class_training', description: 'Complete class training' },
  { id: 'hit_dummy', description: 'Practice on Training Dummy' },
  { id: 'visit_shop', description: 'Visit a shop' },
  { id: 'leave_town', description: 'Leave through Town Gate' },
];
```

**Step 2: Export town types from types/index.ts**

Add to `packages/shared/src/types/index.ts`:
```typescript
export * from './town';
```

**Step 3: Add isSafeZone and npcs to Location type**

In `packages/shared/src/types/world.ts`, modify the Location interface:
```typescript
/** A location in the world graph */
export interface Location {
  id: NodeId;
  name: string;
  biome: BiomeWeights;
  props: string[]; // "altar", "campfire", "broken statue"
  items: ItemId[];
  enemies: EnemyId[];
  creatures: CreatureId[]; // Creatures currently in this location
  visitState: VisitState;
  depth: number; // Distance from start (for difficulty scaling)
  /** If true, no combat allowed and no creature spawns */
  isSafeZone?: boolean;
  /** NPCs present in this location */
  npcs?: string[];
}
```

**Step 4: Add tutorial progress to Player type**

In `packages/shared/src/types/character.ts`, add to Player interface:
```typescript
  // Tutorial
  tutorial: TutorialProgress;
```

And add import at top:
```typescript
import type { TutorialProgress } from './town';
```

**Step 5: Add NPCs record to World type**

In `packages/shared/src/types/world.ts`, add to World interface:
```typescript
  npcs: Record<string, NPC>;
```

And add import:
```typescript
import type { NPC } from './town';
```

**Step 6: Run tests to verify types compile**

Run: `cd packages/shared && pnpm build`
Expected: Build succeeds with no type errors

**Step 7: Commit**

```bash
git add packages/shared/src/types/
git commit -m "feat(shared): add NPC, shop, and tutorial types"
```

---

## Task 2: Create Easthollow Town Data

**Files:**
- Create: `packages/shared/src/data/easthollow.ts`
- Create: `packages/shared/src/data/index.ts`
- Modify: `packages/shared/src/index.ts`

**Step 1: Create easthollow.ts with all town data**

```typescript
// packages/shared/src/data/easthollow.ts
/**
 * Easthollow starter town - static location and NPC definitions.
 */

import type { Location, Exit, NPC, Item } from '../types';

// ============ Town Location IDs ============
export const TOWN_INN = 'town_inn';
export const TOWN_SQUARE = 'town_square';
export const TOWN_TRAINING = 'town_training';
export const TOWN_MARKET = 'town_market';
export const TOWN_BLACKSMITH = 'town_blacksmith';
export const TOWN_ALCHEMIST = 'town_alchemist';
export const TOWN_GENERAL = 'town_general';
export const TOWN_GATE = 'town_gate';

// ============ Town Locations ============
export const EASTHOLLOW_LOCATIONS: Record<string, Location> = {
  [TOWN_INN]: {
    id: TOWN_INN,
    name: 'The Rusty Blade Inn',
    biome: { plains: 1 },
    props: ['fireplace', 'wooden tables', 'bar counter'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_mira'],
  },
  [TOWN_SQUARE]: {
    id: TOWN_SQUARE,
    name: 'Town Square',
    biome: { plains: 1 },
    props: ['stone well', 'notice board', 'cobblestones'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
  [TOWN_TRAINING]: {
    id: TOWN_TRAINING,
    name: 'Training Yard',
    biome: { plains: 1 },
    props: ['training dummies', 'weapon racks', 'archery targets'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_holt', 'npc_sera', 'npc_shadow'],
  },
  [TOWN_MARKET]: {
    id: TOWN_MARKET,
    name: 'Market Street',
    biome: { plains: 1 },
    props: ['market stalls', 'hanging lanterns', 'cobblestone path'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
  [TOWN_BLACKSMITH]: {
    id: TOWN_BLACKSMITH,
    name: 'The Iron Anvil',
    biome: { plains: 1 },
    props: ['forge', 'anvil', 'weapon displays'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_kira'],
  },
  [TOWN_ALCHEMIST]: {
    id: TOWN_ALCHEMIST,
    name: "Elwin's Remedies",
    biome: { plains: 1 },
    props: ['bubbling cauldrons', 'herb shelves', 'glass vials'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_elwin'],
  },
  [TOWN_GENERAL]: {
    id: TOWN_GENERAL,
    name: "Thom's Supplies",
    biome: { plains: 1 },
    props: ['wooden shelves', 'barrels', 'supply crates'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_thom'],
  },
  [TOWN_GATE]: {
    id: TOWN_GATE,
    name: 'Town Gate',
    biome: { plains: 1 },
    props: ['stone archway', 'iron gates', 'guard post'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
};

// ============ Town Exits ============
export const EASTHOLLOW_EXITS: Record<string, Exit> = {
  // Inn <-> Square
  exit_inn_square: {
    id: 'exit_inn_square',
    from: TOWN_INN,
    to: TOWN_SQUARE,
    label: 'west',
    type: 'open',
  },
  exit_square_inn: {
    id: 'exit_square_inn',
    from: TOWN_SQUARE,
    to: TOWN_INN,
    label: 'east',
    type: 'open',
  },
  // Square <-> Training
  exit_square_training: {
    id: 'exit_square_training',
    from: TOWN_SQUARE,
    to: TOWN_TRAINING,
    label: 'north',
    type: 'open',
  },
  exit_training_square: {
    id: 'exit_training_square',
    from: TOWN_TRAINING,
    to: TOWN_SQUARE,
    label: 'south',
    type: 'open',
  },
  // Square <-> Market
  exit_square_market: {
    id: 'exit_square_market',
    from: TOWN_SQUARE,
    to: TOWN_MARKET,
    label: 'south',
    type: 'open',
  },
  exit_market_square: {
    id: 'exit_market_square',
    from: TOWN_MARKET,
    to: TOWN_SQUARE,
    label: 'north',
    type: 'open',
  },
  // Square <-> Gate
  exit_square_gate: {
    id: 'exit_square_gate',
    from: TOWN_SQUARE,
    to: TOWN_GATE,
    label: 'west',
    type: 'open',
  },
  exit_gate_square: {
    id: 'exit_gate_square',
    from: TOWN_GATE,
    to: TOWN_SQUARE,
    label: 'east',
    type: 'open',
  },
  // Market <-> Blacksmith
  exit_market_blacksmith: {
    id: 'exit_market_blacksmith',
    from: TOWN_MARKET,
    to: TOWN_BLACKSMITH,
    label: 'west',
    type: 'open',
  },
  exit_blacksmith_market: {
    id: 'exit_blacksmith_market',
    from: TOWN_BLACKSMITH,
    to: TOWN_MARKET,
    label: 'east',
    type: 'open',
  },
  // Market <-> Alchemist
  exit_market_alchemist: {
    id: 'exit_market_alchemist',
    from: TOWN_MARKET,
    to: TOWN_ALCHEMIST,
    label: 'east',
    type: 'open',
  },
  exit_alchemist_market: {
    id: 'exit_alchemist_market',
    from: TOWN_ALCHEMIST,
    to: TOWN_MARKET,
    label: 'west',
    type: 'open',
  },
  // Blacksmith <-> General
  exit_blacksmith_general: {
    id: 'exit_blacksmith_general',
    from: TOWN_BLACKSMITH,
    to: TOWN_GENERAL,
    label: 'south',
    type: 'open',
  },
  exit_general_blacksmith: {
    id: 'exit_general_blacksmith',
    from: TOWN_GENERAL,
    to: TOWN_BLACKSMITH,
    label: 'north',
    type: 'open',
  },
  // Alchemist <-> General
  exit_alchemist_general: {
    id: 'exit_alchemist_general',
    from: TOWN_ALCHEMIST,
    to: TOWN_GENERAL,
    label: 'south',
    type: 'open',
  },
  exit_general_alchemist: {
    id: 'exit_general_alchemist',
    from: TOWN_GENERAL,
    to: TOWN_ALCHEMIST,
    label: 'north',
    type: 'open',
  },
};

// ============ Town Adjacency ============
export const EASTHOLLOW_ADJACENCY: Record<string, string[]> = {
  [TOWN_INN]: ['exit_inn_square'],
  [TOWN_SQUARE]: ['exit_square_inn', 'exit_square_training', 'exit_square_market', 'exit_square_gate'],
  [TOWN_TRAINING]: ['exit_training_square'],
  [TOWN_MARKET]: ['exit_market_square', 'exit_market_blacksmith', 'exit_market_alchemist'],
  [TOWN_BLACKSMITH]: ['exit_blacksmith_market', 'exit_blacksmith_general'],
  [TOWN_ALCHEMIST]: ['exit_alchemist_market', 'exit_alchemist_general'],
  [TOWN_GENERAL]: ['exit_general_blacksmith', 'exit_general_alchemist'],
  [TOWN_GATE]: ['exit_gate_square'],
};

// ============ NPCs ============
export const EASTHOLLOW_NPCS: Record<string, NPC> = {
  npc_mira: {
    id: 'npc_mira',
    name: 'Mira',
    title: 'Innkeeper',
    locationId: TOWN_INN,
    tutorialTopics: ['basics', 'movement', 'items'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Tell me about this place',
        response: "Welcome to The Rusty Blade! This is Easthollow, a quiet settlement at the edge of the wilderness. Many adventurers pass through here before heading into the wilds.",
      },
      {
        id: 'basics',
        prompt: 'How do I look around?',
        response: "Just type 'look' to see your surroundings. You can also 'look' at specific things, like 'look sword' or 'examine mira' to see them more closely.",
        teachesCommand: 'talk_mira',
      },
      {
        id: 'movement',
        prompt: 'How do I move around?',
        response: "Use compass directions like 'north', 'south', 'east', 'west' or shortcuts like 'n', 's', 'e', 'w'. You can also 'go' through named exits like 'go passage'.",
      },
      {
        id: 'items',
        prompt: 'How do I pick things up?',
        response: "Type 'take <item>' to pick something up, and 'drop <item>' to put it down. Check your 'inventory' to see what you're carrying.",
      },
      {
        id: 'farewell',
        prompt: 'Nothing right now, thanks',
        response: 'Safe travels, adventurer! Come back anytime.',
      },
    ],
  },
  npc_holt: {
    id: 'npc_holt',
    name: 'Captain Holt',
    title: 'Guard Captain',
    locationId: TOWN_TRAINING,
    tutorialTopics: ['combat'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Teach me to fight',
        response: "Ah, eager to learn! To attack, type 'attack <target>' or 'kill <target>'. Try it on the training dummy here - it won't fight back.",
        teachesCommand: 'class_training',
      },
      {
        id: 'flee',
        prompt: 'How do I escape combat?',
        response: "If things go badly, type 'flee' to try to escape. You have about a 50% chance to get away. Better to run than die!",
      },
      {
        id: 'dummy',
        prompt: 'Tell me about the training dummy',
        response: "The dummy is enchanted - it can take a beating but never breaks. Perfect for practice. Go ahead, give it a whack!",
      },
    ],
  },
  npc_sera: {
    id: 'npc_sera',
    name: 'Apprentice Sera',
    title: 'Mage Trainer',
    locationId: TOWN_TRAINING,
    tutorialTopics: ['magic'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Teach me about magic',
        response: "Magic flows through all things. As a mage, you can 'cast <spell>' to unleash your power. Watch your mana - it regenerates over time.",
        teachesCommand: 'class_training',
      },
      {
        id: 'spells',
        prompt: 'What spells can I use?',
        response: "You start with basic attack magic. As you grow stronger, you'll learn more powerful spells. Check your abilities with 'abilities'.",
      },
    ],
  },
  npc_shadow: {
    id: 'npc_shadow',
    name: 'Shadow',
    title: 'Rogue Trainer',
    locationId: TOWN_TRAINING,
    tutorialTopics: ['stealth'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Teach me your ways',
        response: "Stay quiet, strike fast, vanish before they know what hit them. Rogues deal extra damage from surprise attacks. Use 'sneak' to move unseen.",
        teachesCommand: 'class_training',
      },
      {
        id: 'backstab',
        prompt: 'How do I backstab?',
        response: "When hidden, your first attack deals bonus damage. Get behind your enemy, stay silent, then strike!",
      },
    ],
  },
  npc_thom: {
    id: 'npc_thom',
    name: 'Thom',
    title: 'Merchant',
    locationId: TOWN_GENERAL,
    tutorialTopics: ['shopping'],
    shop: {
      items: [
        { baseId: 'torch', basePrice: 5 },
        { baseId: 'rations', basePrice: 3 },
        { baseId: 'rope', basePrice: 10 },
        { baseId: 'empty_flask', basePrice: 5 },
        { baseId: 'bandage', basePrice: 8 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.5,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'What do you sell?',
        response: "General supplies for travelers! Type 'list' to see my wares, 'buy <item>' to purchase, or 'sell <item>' to sell me something.",
        teachesCommand: 'visit_shop',
      },
      {
        id: 'advice',
        prompt: 'Any advice for a new adventurer?',
        response: "Always carry torches - the wilderness gets dark. And rations! Nothing worse than starving in the middle of nowhere.",
      },
    ],
  },
  npc_kira: {
    id: 'npc_kira',
    name: 'Kira',
    title: 'Forge Master',
    locationId: TOWN_BLACKSMITH,
    shop: {
      items: [
        { baseId: 'iron_sword', basePrice: 50, stock: 3 },
        { baseId: 'iron_axe', basePrice: 55, stock: 2 },
        { baseId: 'wooden_shield', basePrice: 30, stock: 5 },
        { baseId: 'leather_armor', basePrice: 40, stock: 3 },
        { baseId: 'chain_mail', basePrice: 120, stock: 1 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.4,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Show me your weapons',
        response: "Fine steel, every piece! Type 'list' to browse. I buy and sell weapons and armor.",
        teachesCommand: 'visit_shop',
      },
      {
        id: 'equipment',
        prompt: 'How does equipment work?',
        response: "Type 'equip <item>' to wear gear from your inventory. 'unequip <slot>' to remove it. Check 'equipment' to see what you're wearing.",
      },
    ],
  },
  npc_elwin: {
    id: 'npc_elwin',
    name: 'Elwin',
    title: 'Sage',
    locationId: TOWN_ALCHEMIST,
    shop: {
      items: [
        { baseId: 'health_potion', basePrice: 25, stock: 10 },
        { baseId: 'mana_potion', basePrice: 25, stock: 10 },
        { baseId: 'antidote', basePrice: 15, stock: 5 },
        { baseId: 'stamina_tonic', basePrice: 20, stock: 5 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.3,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'What potions do you have?',
        response: "Remedies for all ailments! Health potions, mana restoratives, antidotes... Type 'list' to see everything.",
        teachesCommand: 'visit_shop',
      },
      {
        id: 'use',
        prompt: 'How do I use potions?',
        response: "Type 'use <potion>' to drink one. Health potions restore hit points, mana potions restore magical energy.",
      },
    ],
  },
};

// ============ Shop Items (templates for items NPCs sell) ============
export const SHOP_ITEM_TEMPLATES: Record<string, { name: string; tags: string[]; description: string }> = {
  torch: { name: 'Torch', tags: ['light', 'consumable'], description: 'A wooden torch that provides light.' },
  rations: { name: 'Rations', tags: ['food', 'consumable'], description: 'Dried meat and hardtack.' },
  rope: { name: 'Rope', tags: ['tool'], description: '50 feet of sturdy hemp rope.' },
  empty_flask: { name: 'Empty Flask', tags: ['container'], description: 'A glass flask for holding liquids.' },
  bandage: { name: 'Bandage', tags: ['healing', 'consumable'], description: 'Clean cloth bandages.' },
  iron_sword: { name: 'Iron Sword', tags: ['weapon', 'sword', 'melee'], description: 'A well-forged iron blade.' },
  iron_axe: { name: 'Iron Axe', tags: ['weapon', 'axe', 'melee'], description: 'A heavy iron axe.' },
  wooden_shield: { name: 'Wooden Shield', tags: ['armor', 'shield', 'offhand'], description: 'A sturdy wooden shield.' },
  leather_armor: { name: 'Leather Armor', tags: ['armor', 'chest', 'leather'], description: 'Supple leather armor.' },
  chain_mail: { name: 'Chain Mail', tags: ['armor', 'chest', 'metal'], description: 'Interlocking metal rings.' },
  health_potion: { name: 'Health Potion', tags: ['potion', 'consumable', 'healing'], description: 'Restores 50 HP.' },
  mana_potion: { name: 'Mana Potion', tags: ['potion', 'consumable', 'mana'], description: 'Restores 50 MP.' },
  antidote: { name: 'Antidote', tags: ['potion', 'consumable'], description: 'Cures poison.' },
  stamina_tonic: { name: 'Stamina Tonic', tags: ['potion', 'consumable'], description: 'Restores stamina.' },
};

// ============ Tutorial Rewards ============
export const TUTORIAL_COMPLETE_REWARD = {
  items: ['rations', 'rations', 'rations', 'rations', 'rations', 'torch', 'torch', 'torch', 'health_potion'],
  gold: 0,
};

export const TUTORIAL_SKIP_REWARD = {
  items: ['rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations',
          'torch', 'torch', 'torch', 'torch', 'torch', 'health_potion', 'health_potion', 'health_potion'],
  gold: 50,
  classBonus: {
    warrior: { baseId: 'whetstone', name: 'Steel Whetstone', tags: ['consumable', 'buff'], description: '+5% damage for 10 fights' },
    mage: { baseId: 'mana_crystal', name: 'Mana Crystal', tags: ['consumable', 'mana'], description: 'Restores 50 mana' },
    rogue: { baseId: 'smoke_bomb', name: 'Smoke Bomb', tags: ['consumable', 'escape'], description: 'Guaranteed flee' },
  },
};
```

**Step 2: Create data/index.ts**

```typescript
// packages/shared/src/data/index.ts
export * from './easthollow';
```

**Step 3: Export data from shared index**

Add to `packages/shared/src/index.ts`:
```typescript
export * from './data';
```

**Step 4: Run build to verify**

Run: `cd packages/shared && pnpm build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/shared/src/data/ packages/shared/src/index.ts
git commit -m "feat(shared): add Easthollow town data with NPCs and shops"
```

---

## Task 3: Integrate Town into World Generation

**Files:**
- Modify: `packages/server/src/world/generate.ts`
- Test: `packages/server/src/world/generate.test.ts`

**Step 1: Write failing test for town integration**

Add to `packages/server/src/world/generate.test.ts`:
```typescript
describe('town integration', () => {
  it('should include Easthollow town locations', () => {
    const world = generateWorld({
      seed: 'test-town',
      nodeCount: 10,
      extraEdges: 2,
      lockedEdges: 1,
    });

    expect(world.locations['town_inn']).toBeDefined();
    expect(world.locations['town_square']).toBeDefined();
    expect(world.locations['town_gate']).toBeDefined();
    expect(world.locations['town_inn']!.isSafeZone).toBe(true);
  });

  it('should set startId to town_inn', () => {
    const world = generateWorld({
      seed: 'test-town-start',
      nodeCount: 10,
      extraEdges: 2,
      lockedEdges: 1,
    });

    expect(world.startId).toBe('town_inn');
  });

  it('should connect town gate to wilderness loc_0', () => {
    const world = generateWorld({
      seed: 'test-town-gate',
      nodeCount: 10,
      extraEdges: 2,
      lockedEdges: 1,
    });

    const gateExits = world.adjacency['town_gate'] ?? [];
    const exitToWilderness = gateExits.find(exitId => {
      const exit = world.exits[exitId];
      return exit?.to === 'loc_0';
    });

    expect(exitToWilderness).toBeDefined();
  });

  it('should include town NPCs', () => {
    const world = generateWorld({
      seed: 'test-town-npcs',
      nodeCount: 10,
      extraEdges: 2,
      lockedEdges: 1,
    });

    expect(world.npcs['npc_mira']).toBeDefined();
    expect(world.npcs['npc_mira']!.name).toBe('Mira');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test src/world/generate.test.ts`
Expected: FAIL - town locations not found

**Step 3: Implement town integration in generate.ts**

Modify `packages/server/src/world/generate.ts`:

Add imports at top:
```typescript
import {
  EASTHOLLOW_LOCATIONS,
  EASTHOLLOW_EXITS,
  EASTHOLLOW_ADJACENCY,
  EASTHOLLOW_NPCS,
  TOWN_INN,
  TOWN_GATE,
} from '@solo-mud/shared';
```

Modify `generateWorldAttempt` function - after spawning creatures (line ~214), add town integration:

```typescript
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

  // Connect town gate to wilderness (loc_0)
  const gateToWildernessId = 'exit_gate_wilderness';
  const wildernessToGateId = 'exit_wilderness_gate';

  exits[gateToWildernessId] = {
    id: gateToWildernessId,
    from: TOWN_GATE,
    to: 'loc_0',
    label: 'wilderness',
    type: 'open',
  };
  exits[wildernessToGateId] = {
    id: wildernessToGateId,
    from: 'loc_0',
    to: TOWN_GATE,
    label: 'town',
    type: 'open',
  };

  adjacency[TOWN_GATE]!.push(gateToWildernessId);
  adjacency['loc_0']!.push(wildernessToGateId);

  // Set start to town inn instead of loc_0
  const townStartId = TOWN_INN;

  return {
    seed: params.seed,
    startId: townStartId,  // Changed from startId
    goalId,
    locations,
    exits,
    adjacency,
    items,
    creatures,
    corpses: {},
    respawnQueue: [],
    npcs: { ...EASTHOLLOW_NPCS },  // Add NPCs
    time: { totalMinutes: 480, timeOfDay: 'morning', day: 1 },
    weather: { type: 'clear', intensity: 0 },
  };
```

**Step 4: Run tests to verify they pass**

Run: `cd packages/server && pnpm test src/world/generate.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/server/src/world/generate.ts packages/server/src/world/generate.test.ts
git commit -m "feat(server): integrate Easthollow town into world generation"
```

---

## Task 4: Update Player Factory for Tutorial Progress

**Files:**
- Modify: `packages/server/src/character/player-factory.ts`
- Test: `packages/server/src/character/player-factory.test.ts`

**Step 1: Write failing test**

Add to `packages/server/src/character/player-factory.test.ts`:
```typescript
describe('tutorial progress', () => {
  it('should initialize tutorial progress for new player', () => {
    const player = createPlayer({
      id: 'test-player',
      name: 'Tester',
      className: 'warrior',
      startLocationId: 'town_inn',
    });

    expect(player.tutorial).toBeDefined();
    expect(player.tutorial.skipped).toBe(false);
    expect(player.tutorial.complete).toBe(false);
    expect(player.tutorial.completedSteps).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test src/character/player-factory.test.ts`
Expected: FAIL - tutorial property doesn't exist

**Step 3: Update player-factory.ts**

In `packages/server/src/character/player-factory.ts`, add tutorial initialization to the returned Player object:

```typescript
    // Tutorial (add this before the return)
    tutorial: {
      skipped: false,
      complete: false,
      completedSteps: [],
    },
```

**Step 4: Run tests**

Run: `cd packages/server && pnpm test src/character/player-factory.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/character/player-factory.ts packages/server/src/character/player-factory.test.ts
git commit -m "feat(server): initialize tutorial progress for new players"
```

---

## Task 5: Add Talk Command Handler

**Files:**
- Modify: `packages/server/src/commands/parser.ts`
- Modify: `packages/server/src/commands/handlers.ts`
- Test: `packages/server/src/commands/parser.test.ts`

**Step 1: Add parser test for talk command**

Add to `packages/server/src/commands/parser.test.ts`:
```typescript
describe('talk command', () => {
  it('should parse "talk mira"', () => {
    const result = parseCommand('talk mira');
    expect(result.command).toBe('talk');
    expect(result.target).toBe('mira');
  });

  it('should parse "talk to mira"', () => {
    const result = parseCommand('talk to mira');
    expect(result.command).toBe('talk');
    expect(result.target).toBe('mira');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test src/commands/parser.test.ts`
Expected: May pass for basic "talk mira", but "talk to X" needs handling

**Step 3: Update parser.ts to handle "talk to X"**

In `packages/server/src/commands/parser.ts`, after the "take X from Y" handling block (~line 97), add:

```typescript
  // Handle "talk to X" syntax
  if (command === 'talk' && args[0]?.toLowerCase() === 'to' && args.length >= 2) {
    return {
      command,
      args: args.slice(1),
      target: args.slice(1).join(' '),
      raw,
    };
  }
```

**Step 4: Run parser tests**

Run: `cd packages/server && pnpm test src/commands/parser.test.ts`
Expected: PASS

**Step 5: Add talk handler to handlers.ts**

In `packages/server/src/commands/handlers.ts`:

Add to imports:
```typescript
import type { NPC } from '@solo-mud/shared';
```

Add to handlers registry:
```typescript
  talk: handleTalk,
```

Add handler function:
```typescript
/**
 * Handle the "talk" command - talk to an NPC.
 */
function handleTalk(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Talk to whom? Try "talk <name>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot talk to anyone here.', style: 'error' }],
    };
  }

  // Find NPCs in this location
  const npcIds = location.npcs ?? [];
  if (npcIds.length === 0) {
    return {
      output: [{ text: 'There is no one here to talk to.', style: 'error' }],
    };
  }

  // Find the NPC by name
  const targetLower = parsed.target.toLowerCase();
  const npc = npcIds
    .map(id => world.npcs[id])
    .filter((n): n is NPC => n !== undefined)
    .find(n => n.name.toLowerCase().includes(targetLower));

  if (!npc) {
    return {
      output: [{ text: `You don't see "${parsed.target}" here.`, style: 'error' }],
    };
  }

  // Show NPC greeting and dialogue options
  const output: OutputLine[] = [];
  const title = npc.title ? `${npc.title} ` : '';
  output.push({ text: `${title}${npc.name} turns to you.`, style: 'normal' });

  if (npc.dialogue.length > 0) {
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'What would you like to discuss?', style: 'system' });
    npc.dialogue.forEach((topic, index) => {
      output.push({ text: `  ${index + 1}. ${topic.prompt}`, style: 'normal' });
    });
    output.push({ text: '', style: 'normal' });
    output.push({ text: `Type a number or "say <topic>" to respond.`, style: 'system' });
  }

  // Store current conversation for follow-up
  session.conversationNpc = npc.id;

  return { output };
}
```

**Step 6: Add conversationNpc to GameSession type**

In `packages/server/src/game/session.ts`, add to GameSession interface:
```typescript
  /** Current NPC the player is talking to */
  conversationNpc?: string;
```

**Step 7: Run all tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 8: Commit**

```bash
git add packages/server/src/commands/parser.ts packages/server/src/commands/handlers.ts packages/server/src/commands/parser.test.ts packages/server/src/game/session.ts
git commit -m "feat(server): add talk command for NPC conversations"
```

---

## Task 6: Add Say Command for Dialogue Responses

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`
- Modify: `packages/server/src/commands/parser.ts`

**Step 1: Add say to parser aliases**

In `packages/server/src/commands/parser.ts`, add to COMMAND_ALIASES:
```typescript
  reply: 'say',
```

**Step 2: Add say handler**

In `packages/server/src/commands/handlers.ts`:

Add to handlers registry:
```typescript
  say: handleSay,
```

Add handler:
```typescript
/**
 * Handle the "say" command - respond to NPC dialogue.
 */
function handleSay(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!session.conversationNpc) {
    return {
      output: [{ text: "You're not talking to anyone. Use 'talk <npc>' first.", style: 'error' }],
    };
  }

  const npc = world.npcs[session.conversationNpc];
  if (!npc) {
    session.conversationNpc = undefined;
    return {
      output: [{ text: 'That person seems to have left.', style: 'error' }],
    };
  }

  // Check if player is still in same location
  const location = world.locations[player.locationId];
  if (!location?.npcs?.includes(npc.id)) {
    session.conversationNpc = undefined;
    return {
      output: [{ text: `${npc.name} is no longer here.`, style: 'error' }],
    };
  }

  // Find the dialogue option - by number or keyword
  let topic = npc.dialogue.find((_, i) => parsed.target === String(i + 1));

  if (!topic && parsed.target) {
    const targetLower = parsed.target.toLowerCase();
    topic = npc.dialogue.find(t =>
      t.prompt.toLowerCase().includes(targetLower) ||
      t.id.toLowerCase().includes(targetLower)
    );
  }

  if (!topic) {
    return {
      output: [
        { text: `${npc.name} doesn't understand what you mean.`, style: 'normal' },
        { text: 'Pick a number from the list, or a keyword from one of the options.', style: 'system' },
      ],
    };
  }

  const output: OutputLine[] = [];
  const title = npc.title ? `${npc.title} ` : '';
  output.push({ text: `${title}${npc.name}: "${topic.response}"`, style: 'normal' });

  // Check if this completes a tutorial step
  if (topic.teachesCommand && !player.tutorial.completedSteps.includes(topic.teachesCommand)) {
    player.tutorial.completedSteps.push(topic.teachesCommand);
    output.push({ text: '', style: 'normal' });
    output.push({ text: `[Tutorial] ${topic.teachesCommand} complete!`, style: 'success' });
  }

  // Show remaining options or end conversation
  const remainingTopics = npc.dialogue.filter(t => t.id !== topic!.id && t.id !== 'farewell');
  if (remainingTopics.length > 0) {
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'Anything else?', style: 'system' });
    npc.dialogue.forEach((t, index) => {
      output.push({ text: `  ${index + 1}. ${t.prompt}`, style: 'normal' });
    });
  } else {
    session.conversationNpc = undefined;
  }

  // End conversation on farewell
  if (topic.id === 'farewell') {
    session.conversationNpc = undefined;
  }

  return { output, updatePlayer: true };
}
```

**Step 3: Handle numeric input as say**

In `packages/server/src/commands/handlers.ts`, modify `executeCommand`:

```typescript
export function executeCommand(session: GameSession, input: string): CommandResult {
  const parsed = parseCommand(input);

  if (!parsed.command) {
    return {
      output: [{ text: 'What would you like to do?', style: 'system' }],
    };
  }

  // If in conversation and input is a number, treat as dialogue response
  if (session.conversationNpc && /^\d+$/.test(parsed.command)) {
    return handleSay({ session, parsed: { ...parsed, command: 'say', target: parsed.command } });
  }

  const handler = handlers[parsed.command];
  if (!handler) {
    return {
      output: [{ text: `Unknown command: ${parsed.command}`, style: 'error' }],
    };
  }

  return handler({ session, parsed });
}
```

**Step 4: Run tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add packages/server/src/commands/handlers.ts packages/server/src/commands/parser.ts
git commit -m "feat(server): add say command for NPC dialogue responses"
```

---

## Task 7: Add Tutorial Command

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Add tutorial handler**

Add to handlers registry:
```typescript
  tutorial: handleTutorial,
```

Add handler:
```typescript
/**
 * Handle the "tutorial" command - show tutorial progress.
 */
function handleTutorial(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player } = session;

  if (player.tutorial.complete) {
    return {
      output: [{ text: 'Tutorial complete! You know all you need to venture forth.', style: 'success' }],
    };
  }

  if (player.tutorial.skipped) {
    return {
      output: [{ text: 'Tutorial skipped. Use "help" if you need command reminders.', style: 'system' }],
    };
  }

  const output: OutputLine[] = [
    { text: 'Tutorial Progress:', style: 'system' },
  ];

  const steps = [
    { id: 'talk_mira', desc: 'Speak with Innkeeper Mira' },
    { id: 'class_training', desc: 'Complete class training' },
    { id: 'hit_dummy', desc: 'Practice on Training Dummy' },
    { id: 'visit_shop', desc: 'Visit a shop' },
    { id: 'leave_town', desc: 'Leave through Town Gate' },
  ];

  for (const step of steps) {
    const done = player.tutorial.completedSteps.includes(step.id);
    const mark = done ? '[✓]' : '[ ]';
    output.push({ text: `  ${mark} ${step.desc}`, style: done ? 'success' : 'normal' });
  }

  const completed = player.tutorial.completedSteps.length;
  output.push({ text: '', style: 'normal' });
  output.push({ text: `${completed}/${steps.length} steps complete`, style: 'system' });

  return { output };
}
```

**Step 2: Run tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "feat(server): add tutorial command to check progress"
```

---

## Task 8: Add Training Dummy

**Files:**
- Modify: `packages/shared/src/constants/creatures.ts`
- Modify: `packages/shared/src/data/easthollow.ts`
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Add training dummy creature template**

In `packages/shared/src/constants/creatures.ts`, add:
```typescript
  training_dummy: {
    id: 'training_dummy',
    name: 'Training Dummy',
    behavior: 'passive',
    mobility: 'static',
    tier: 'ambient',
    biomes: ['plains'],
    minDepth: 0,
    maxDepth: 0,
    baseHp: 9999,
    baseLevel: 1,
    spawnWeight: 0, // Never spawns naturally
    descriptions: {
      idle: ['A straw-stuffed training dummy stands ready for practice.'],
    },
  },
```

**Step 2: Add training dummy to Training Yard**

In `packages/shared/src/data/easthollow.ts`, modify EASTHOLLOW_LOCATIONS[TOWN_TRAINING]:
```typescript
  [TOWN_TRAINING]: {
    id: TOWN_TRAINING,
    name: 'Training Yard',
    biome: { plains: 1 },
    props: ['training dummies', 'weapon racks', 'archery targets'],
    items: [],
    enemies: [],
    creatures: ['creature_training_dummy'], // Add training dummy
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_holt', 'npc_sera', 'npc_shadow'],
  },
```

Add training dummy creature data:
```typescript
export const EASTHOLLOW_CREATURES: Record<string, Creature> = {
  creature_training_dummy: {
    id: 'creature_training_dummy',
    templateId: 'training_dummy',
    name: 'Training Dummy',
    level: 1,
    behavior: 'passive',
    mobility: 'static',
    currentHp: 9999,
    maxHp: 9999,
    locationId: TOWN_TRAINING,
    homeLocationId: TOWN_TRAINING,
    spawnLocationId: TOWN_TRAINING,
    inCombat: false,
    description: 'A straw-stuffed training dummy stands ready for practice.',
  },
};
```

**Step 3: Update generate.ts to include town creatures**

In `packages/server/src/world/generate.ts`, after adding town NPCs:
```typescript
  // Add town creatures (training dummy)
  for (const [id, creature] of Object.entries(EASTHOLLOW_CREATURES)) {
    creatures[id] = { ...creature };
  }
```

Add import:
```typescript
import {
  EASTHOLLOW_LOCATIONS,
  EASTHOLLOW_EXITS,
  EASTHOLLOW_ADJACENCY,
  EASTHOLLOW_NPCS,
  EASTHOLLOW_CREATURES,
  TOWN_INN,
  TOWN_GATE,
} from '@solo-mud/shared';
```

**Step 4: Modify attack handler for training dummy**

In `packages/server/src/commands/handlers.ts`, in `handleAttack`, after damage is dealt, add special handling for training dummy:

```typescript
    // Special handling for training dummy - reset HP and complete tutorial
    if (targetCreature.templateId === 'training_dummy') {
      targetCreature.currentHp = targetCreature.maxHp; // Reset HP

      if (!player.tutorial.completedSteps.includes('hit_dummy')) {
        player.tutorial.completedSteps.push('hit_dummy');
        output.push({ text: '', style: 'normal' });
        output.push({ text: '[Tutorial] Combat practice complete!', style: 'success' });
      }

      output.push({ text: 'The training dummy wobbles but stays upright, ready for more.', style: 'normal' });

      return {
        output,
        updatePlayer: true,
      };
    }
```

**Step 5: Run tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add packages/shared/src/constants/creatures.ts packages/shared/src/data/easthollow.ts packages/server/src/world/generate.ts packages/server/src/commands/handlers.ts
git commit -m "feat: add training dummy for combat practice"
```

---

## Task 9: Add Buy and Sell Commands

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`
- Modify: `packages/server/src/commands/parser.ts`

**Step 1: Add list alias**

In `packages/server/src/commands/parser.ts`, add to COMMAND_ALIASES:
```typescript
  browse: 'list',
  shop: 'list',
```

**Step 2: Add handlers**

Add to handlers registry:
```typescript
  list: handleList,
  buy: handleBuy,
  sell: handleSell,
```

Add handlers:
```typescript
/**
 * Handle the "list" command - show shop inventory.
 */
function handleList(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { world, player } = session;

  const location = world.locations[player.locationId];
  if (!location?.npcs?.length) {
    return {
      output: [{ text: 'There is no shop here.', style: 'error' }],
    };
  }

  // Find merchant NPC
  const merchant = location.npcs
    .map(id => world.npcs[id])
    .find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  const output: OutputLine[] = [
    { text: `${merchant.name}'s Wares:`, style: 'system' },
    { text: '', style: 'normal' },
  ];

  const { SHOP_ITEM_TEMPLATES } = require('@solo-mud/shared');

  for (const item of merchant.shop.items) {
    const template = SHOP_ITEM_TEMPLATES[item.baseId];
    const name = template?.name ?? item.baseId;
    const price = Math.ceil(item.basePrice * merchant.shop.buyMultiplier);
    const stock = item.stock !== undefined ? ` (${item.stock} in stock)` : '';
    output.push({ text: `  ${name} - ${price}g${stock}`, style: 'normal' });
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: `Your gold: ${player.gold}`, style: 'system' });
  output.push({ text: "Use 'buy <item>' to purchase.", style: 'system' });

  // Mark tutorial step
  if (!player.tutorial.completedSteps.includes('visit_shop')) {
    player.tutorial.completedSteps.push('visit_shop');
    output.push({ text: '', style: 'normal' });
    output.push({ text: '[Tutorial] Visited a shop!', style: 'success' });
  }

  return { output, updatePlayer: true };
}

/**
 * Handle the "buy" command - purchase from shop.
 */
function handleBuy(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Buy what? Try "buy <item>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  const merchant = location?.npcs
    ?.map(id => world.npcs[id])
    .find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  const { SHOP_ITEM_TEMPLATES, createItemFromTemplate } = require('@solo-mud/shared');
  const targetLower = parsed.target.toLowerCase();

  // Find the item in shop
  const shopItem = merchant.shop.items.find(item => {
    const template = SHOP_ITEM_TEMPLATES[item.baseId];
    return template?.name.toLowerCase().includes(targetLower) || item.baseId.includes(targetLower);
  });

  if (!shopItem) {
    return {
      output: [{ text: `${merchant.name} doesn't sell "${parsed.target}".`, style: 'error' }],
    };
  }

  const template = SHOP_ITEM_TEMPLATES[shopItem.baseId];
  const price = Math.ceil(shopItem.basePrice * merchant.shop.buyMultiplier);

  // Check gold
  if (player.gold < price) {
    return {
      output: [{ text: `You need ${price} gold but only have ${player.gold}.`, style: 'error' }],
    };
  }

  // Check stock
  if (shopItem.stock !== undefined && shopItem.stock <= 0) {
    return {
      output: [{ text: `${merchant.name} is out of ${template?.name ?? shopItem.baseId}.`, style: 'error' }],
    };
  }

  // Check inventory space
  if (player.inventory.length >= player.inventorySlots) {
    return {
      output: [{ text: 'Your inventory is full.', style: 'error' }],
    };
  }

  // Create the item
  const newItem = createItemFromTemplate({
    baseId: shopItem.baseId,
    name: template?.name ?? shopItem.baseId,
    tags: template?.tags ?? [],
    rarity: 'common',
  }, 'shop');

  // Complete purchase
  player.gold -= price;
  if (shopItem.stock !== undefined) {
    shopItem.stock--;
  }
  world.items[newItem.id] = newItem;
  player.inventory.push({ itemId: newItem.id, quantity: 1 });

  return {
    output: [{ text: `You buy ${newItem.name} for ${price} gold.`, style: 'success' }],
    updatePlayer: true,
  };
}

/**
 * Handle the "sell" command - sell to shop.
 */
function handleSell(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Sell what? Try "sell <item>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  const merchant = location?.npcs
    ?.map(id => world.npcs[id])
    .find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Find item in inventory
  const invIndex = player.inventory.findIndex(slot => {
    const item = world.items[slot.itemId];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (invIndex === -1) {
    return {
      output: [{ text: `You don't have "${parsed.target}".`, style: 'error' }],
    };
  }

  const slot = player.inventory[invIndex]!;
  const item = world.items[slot.itemId]!;

  // Calculate sell price (base 10g for common items)
  const basePrice = 10;
  const sellPrice = Math.floor(basePrice * merchant.shop.sellMultiplier);

  // Complete sale
  player.gold += sellPrice;
  player.inventory.splice(invIndex, 1);

  return {
    output: [{ text: `You sell ${item.name} for ${sellPrice} gold.`, style: 'success' }],
    updatePlayer: true,
  };
}
```

**Step 3: Run tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add packages/server/src/commands/handlers.ts packages/server/src/commands/parser.ts
git commit -m "feat(server): add buy, sell, and list commands for shops"
```

---

## Task 10: Add Town Gate Tutorial Completion

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Modify handleMove for town gate**

In `handleMove`, after checking if exit exists and player can pass, add tutorial completion check:

Find where movement succeeds and add before the room output generation:
```typescript
  // Check for leaving town through gate
  if (player.locationId === 'town_gate' && exit.to === 'loc_0') {
    if (!player.tutorial.completedSteps.includes('leave_town')) {
      player.tutorial.completedSteps.push('leave_town');

      // Check if tutorial is now complete
      const allSteps = ['talk_mira', 'class_training', 'hit_dummy', 'visit_shop', 'leave_town'];
      const completedAll = allSteps.every(s => player.tutorial.completedSteps.includes(s));

      if (completedAll && !player.tutorial.complete) {
        player.tutorial.complete = true;
        // TODO: Grant tutorial completion reward
      }
    }
  }
```

**Step 2: Run tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "feat(server): complete tutorial when leaving through town gate"
```

---

## Task 11: Add Examine NPC Support

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Update handleExamine to support NPCs**

In `handleExamine`, add NPC lookup after checking for items:

```typescript
  // Check for NPC
  const npcIds = location.npcs ?? [];
  const npc = npcIds
    .map(id => world.npcs[id])
    .filter((n): n is NPC => n !== undefined)
    .find(n => n.name.toLowerCase().includes(targetLower));

  if (npc) {
    const title = npc.title ? `${npc.title} ` : '';
    const output: OutputLine[] = [
      { text: `${title}${npc.name}`, style: 'system' },
    ];

    if (npc.shop) {
      output.push({ text: 'This merchant has items for sale. Use "list" to see their wares.', style: 'normal' });
    } else {
      output.push({ text: `You can "talk to ${npc.name.toLowerCase()}" to start a conversation.`, style: 'normal' });
    }

    return { output };
  }
```

**Step 2: Run tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "feat(server): add NPC support to examine command"
```

---

## Task 12: Update Help Command

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Update handleHelp**

Add new commands to the help output:

```typescript
  { text: '  talk <npc> - Talk to someone', style: 'normal' },
  { text: '  say <number> - Respond in conversation', style: 'normal' },
  { text: '  list - View shop inventory', style: 'normal' },
  { text: '  buy <item> - Purchase from shop', style: 'normal' },
  { text: '  sell <item> - Sell to shop', style: 'normal' },
  { text: '  tutorial - Check tutorial progress', style: 'normal' },
```

**Step 2: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "feat(server): add new commands to help"
```

---

## Task 13: Integration Tests

**Files:**
- Create: `packages/server/src/town/town.test.ts`

**Step 1: Create integration tests**

```typescript
// packages/server/src/town/town.test.ts
/**
 * Integration tests for Easthollow town functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateWorld } from '../world/generate';
import { createPlayer } from '../character';
import { executeCommand } from '../commands/handlers';
import type { GameSession } from '../game/session';

function createTestSession(): GameSession {
  const world = generateWorld({
    seed: 'test-town-integration',
    nodeCount: 10,
    extraEdges: 2,
    lockedEdges: 1,
  });

  const player = createPlayer({
    id: 'test-player',
    name: 'Tester',
    className: 'warrior',
    startLocationId: world.startId,
  });

  return {
    id: 'test-session',
    playerId: 'test-player',
    player,
    combatStats: { attackPower: 10, spellPower: 5, defense: 5, magicResist: 5, hitChance: 0.9, dodgeChance: 0.1, critChance: 0.1, critDamage: 1.5, attackSpeed: 2 },
    world,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
}

describe('Easthollow town integration', () => {
  let session: GameSession;

  beforeEach(() => {
    session = createTestSession();
  });

  it('should spawn player in town inn', () => {
    expect(session.player.locationId).toBe('town_inn');
  });

  it('should show NPC in look output', () => {
    const result = executeCommand(session, 'look');
    const text = result.output.map(o => o.text).join(' ');
    expect(text).toContain('Mira');
  });

  it('should allow talking to NPC', () => {
    const result = executeCommand(session, 'talk mira');
    const text = result.output.map(o => o.text).join(' ');
    expect(text).toContain('Mira');
    expect(text).toContain('1.');
  });

  it('should track tutorial progress', () => {
    expect(session.player.tutorial.completedSteps).toHaveLength(0);

    executeCommand(session, 'talk mira');
    executeCommand(session, 'say 2'); // "How do I look around?"

    expect(session.player.tutorial.completedSteps).toContain('talk_mira');
  });

  it('should navigate to training yard', () => {
    executeCommand(session, 'west');
    expect(session.player.locationId).toBe('town_square');

    executeCommand(session, 'north');
    expect(session.player.locationId).toBe('town_training');
  });

  it('should show tutorial progress', () => {
    const result = executeCommand(session, 'tutorial');
    const text = result.output.map(o => o.text).join(' ');
    expect(text).toContain('Tutorial Progress');
    expect(text).toContain('[ ]'); // Uncompleted steps
  });
});
```

**Step 2: Run integration tests**

Run: `cd packages/server && pnpm test src/town/town.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/server/src/town/town.test.ts
git commit -m "test(server): add Easthollow town integration tests"
```

---

## Task 14: Final Verification

**Step 1: Run all tests**

Run: `cd packages/server && pnpm test`
Expected: All tests pass

**Step 2: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Manual testing**

Start the server and verify:
1. New player spawns in The Rusty Blade Inn
2. Can talk to Mira
3. Can navigate town
4. Can buy/sell items
5. Tutorial tracks progress
6. Can leave town to wilderness

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Easthollow starter town implementation"
```
