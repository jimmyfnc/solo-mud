# Bot Player System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement AI-controlled player characters (bots) that are indistinguishable from real players - they quest, fight, trade, form relationships, and could theoretically "beat the game."

**Architecture:** GOAP (Goal-Oriented Action Planning) for decision making, tiered persistence (named bots persist, generics are ephemeral), full player interaction with relationship memory, personality-driven behavior.

**Tech Stack:** TypeScript, Vitest for tests, integrates with existing GameLoop, CommandHandler, and Player systems.

---

## Phase 1: Foundation (Tasks 1-6)

### Task 1: Create Shared Bot Types

**Files:**
- Create: `packages/shared/src/types/bot.ts`
- Modify: `packages/shared/src/types/index.ts`

**Step 1: Write the type file**

```typescript
// packages/shared/src/types/bot.ts
/**
 * Bot player types - AI-controlled characters that act like real players.
 */

import type { ClassName } from './character';

// ============================================================================
// Personality System
// ============================================================================

/** Core personality traits (0-100 scale) */
export interface BotPersonalityTraits {
  /** 0=flees early, 100=fights to death */
  bravery: number;
  /** 0=generous, 100=hoards everything */
  greed: number;
  /** 0=loner, 100=always seeks company */
  sociability: number;
  /** 0=impulsive, 100=methodical planner */
  patience: number;
  /** 0=peaceful, 100=attacks on sight */
  aggression: number;
}

/** Bot quirk - unique behavioral modifier */
export interface BotQuirk {
  id: string;
  description: string;
}

/** Speech style for conversation system */
export type BotSpeechStyle = 'formal' | 'casual' | 'gruff' | 'cheerful' | 'mysterious';

/** Full personality profile */
export interface BotPersonality extends BotPersonalityTraits {
  preferredActivities: ('combat' | 'exploration' | 'trading' | 'socializing')[];
  preferredZones: string[];
  dislikedCreatures: string[];
  quirks: BotQuirk[];
  speechStyle: BotSpeechStyle;
  catchphrases: string[];
}

// ============================================================================
// Relationship System
// ============================================================================

/** Types of relationship events */
export type RelationshipEventType =
  | 'helped_in_combat'
  | 'healed_me'
  | 'grouped_together'
  | 'abandoned_me'
  | 'stole_kill'
  | 'refused_trade'
  | 'saved_my_life'
  | 'completed_quest_together';

/** A single event that affected a relationship */
export interface RelationshipEvent {
  type: RelationshipEventType;
  timestamp: number;
  opinionChange: number;
}

/** Relationship status derived from opinion score */
export type RelationshipStatus =
  | 'enemy'      // -100 to -50
  | 'disliked'   // -49 to -10
  | 'neutral'    // -9 to +9
  | 'friendly'   // +10 to +49
  | 'ally'       // +50 to +89
  | 'best_friend'; // +90 to +100

/** Relationship with a single entity */
export interface BotRelationship {
  entityId: string;
  entityName: string;
  isPlayer: boolean;
  opinion: number; // -100 to +100
  history: RelationshipEvent[];
}

/** All relationships a bot has */
export interface BotRelationships {
  opinions: Record<string, BotRelationship>;
  faction?: string;
  factionRole?: 'leader' | 'member' | 'recruit';
  blocked: string[];
}

// ============================================================================
// Memory System
// ============================================================================

/** Knowledge about a creature type */
export interface CreatureKnowledge {
  creatureType: string;
  timesDefeated: number;
  timesDiedTo: number;
  estimatedDifficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  lastEncounter: number;
}

/** Knowledge about a shop */
export interface ShopKnowledge {
  locationId: string;
  npcId: string;
  lastVisit: number;
  itemsSeen: string[];
}

/** Record of a death */
export interface DeathRecord {
  timestamp: number;
  location: string;
  killedBy: string;
  hadHelp: boolean;
  lostItems: string[];
}

/** Record of a notable victory */
export interface VictoryRecord {
  timestamp: number;
  location: string;
  creatureType: string;
  wasBoss: boolean;
}

/** Quest the bot is pursuing */
export interface BotQuest {
  id: string;
  name: string;
  objective: string;
  targetLocation?: string;
  progress: number; // 0-100
  priority: number;
}

/** Memory event for short-term tracking */
export interface MemoryEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/** Bot's complete memory state */
export interface BotMemory {
  // World knowledge
  knownLocations: string[];
  knownPaths: Record<string, string[]>; // destination -> path of location IDs
  knownCreatures: Record<string, CreatureKnowledge>;
  knownShops: Record<string, ShopKnowledge>;

  // Quest tracking
  activeQuests: BotQuest[];
  completedQuests: string[];
  aspirationProgress: Record<string, number>; // aspiration ID -> progress (0-100)

  // Personal history
  deaths: DeathRecord[];
  victories: VictoryRecord[];
  friendsMade: string[];
  placesExplored: number;

  // Short-term memory
  recentEvents: MemoryEvent[];
  lastCombat: number;
  lastSocialInteraction: number;
  lastShopVisit?: string;
}

// ============================================================================
// GOAP System
// ============================================================================

/** Goal categories */
export type GoalCategory = 'survival' | 'progression' | 'social' | 'economic' | 'aspiration';

/** Goal definition (static) */
export interface BotGoalDef {
  id: string;
  category: GoalCategory;
  description: string;
  isAspiration?: boolean;
}

/** Action categories */
export type ActionCategory = 'combat' | 'movement' | 'economy' | 'social' | 'survival' | 'utility';

/** Precondition types for actions */
export type ActionPreconditionType =
  | 'has_item'
  | 'has_currency'
  | 'in_location'
  | 'in_combat'
  | 'hp_above'
  | 'hp_below'
  | 'mp_above'
  | 'has_target'
  | 'knows_location'
  | 'has_spell'
  | 'not_in_combat';

/** Action precondition */
export interface ActionPrecondition {
  type: ActionPreconditionType;
  value?: string | number | boolean;
}

/** Action definition (static) */
export interface BotActionDef {
  id: string;
  category: ActionCategory;
  description: string;
  preconditions: ActionPrecondition[];
  effects: string[];
}

// ============================================================================
// Bot Profile (Combined State)
// ============================================================================

/** Complete bot profile attached to BotPlayer */
export interface BotProfile {
  /** Whether this is a named (persistent) or generic (ephemeral) bot */
  isNamed: boolean;
  /** Bot personality */
  personality: BotPersonality;
  /** Relationships with other entities */
  relationships: BotRelationships;
  /** Bot's memory and knowledge */
  memory: BotMemory;
  /** Backstory for LLM conversations */
  backstory?: string;
  /** Long-term aspirations */
  aspirations: string[];
}

// ============================================================================
// Named Bot Definition (Data File)
// ============================================================================

/** Aspiration type */
export type AspirationType =
  | 'kill_bosses'
  | 'max_wealth'
  | 'max_level'
  | 'explore_all'
  | 'collect_items'
  | 'help_newbies'
  | 'become_famous'
  | 'clear_dungeon';

/** Aspiration definition */
export interface BotAspiration {
  id: string;
  type: AspirationType;
  description: string;
  target?: string | number;
}

/** Special behavior trigger */
export type SpecialBehaviorTrigger =
  | 'player_low_health'
  | 'boss_nearby'
  | 'faction_member_attacked'
  | 'specific_location'
  | 'time_of_day';

/** Special behavior definition */
export interface SpecialBehavior {
  trigger: SpecialBehaviorTrigger;
  action: string;
  priority: number;
}

/** Named bot definition (loaded from data files) */
export interface NamedBotDefinition {
  id: string;
  name: string;
  class: ClassName;
  startingLevel: number;
  personality: BotPersonality;
  aspirations: BotAspiration[];
  initialRelationships?: Record<string, number>;
  faction?: string;
  factionRole?: 'leader' | 'member';
  backstory: string;
  specialBehaviors?: SpecialBehavior[];
}

// ============================================================================
// Bot Spawn Configuration
// ============================================================================

/** Configuration for bot population management */
export interface BotSpawnConfig {
  minPopulation: number;
  maxPopulation: number;
  namedBotCount: number;
  spawnLocations: string[];
  levelRange: [number, number];
  namedBotRespawnDelay: number; // in game-minutes
}

/** Death penalty configuration */
export interface BotDeathPenalty {
  xpLossPercent: number;
  goldLossPercent: number;
  reputationLoss: number;
  memoryEffect: 'gains_caution' | 'seeks_revenge' | 'fears_killer';
}
```

**Step 2: Export from index**

Add to `packages/shared/src/types/index.ts`:
```typescript
export * from './bot';
```

**Step 3: Commit**

```bash
git add packages/shared/src/types/bot.ts packages/shared/src/types/index.ts
git commit -m "$(cat <<'EOF'
feat(shared): add bot player types

Add comprehensive type definitions for the bot player system:
- Personality traits and quirks
- Relationship tracking with opinion scores
- Memory system for world knowledge
- GOAP goal and action definitions
- Named bot definition format
- Spawn configuration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create BotPlayer Type Extending Player

**Files:**
- Create: `packages/server/src/bots/bot-player.ts`
- Create: `packages/server/src/bots/index.ts`

**Step 1: Write the BotPlayer type**

```typescript
// packages/server/src/bots/bot-player.ts
/**
 * BotPlayer - extends Player with bot-specific properties.
 */

import type { Player } from '@solo-mud/shared';
import type { BotProfile } from '@solo-mud/shared';

/** A bot player is a Player with additional bot state */
export interface BotPlayer extends Player {
  /** Flag indicating this is a bot, not a real player */
  isBot: true;
  /** Bot's personality, relationships, and memory */
  botProfile: BotProfile;
  /** Current goal being pursued */
  currentGoalId?: string;
  /** Current action plan (list of action IDs) */
  currentPlan?: string[];
  /** Timestamp of last AI tick */
  lastAiTick: number;
  /** Named bot definition ID (if this is a named bot) */
  namedBotId?: string;
}

/** Type guard to check if a Player is a BotPlayer */
export function isBotPlayer(player: Player): player is BotPlayer {
  return 'isBot' in player && player.isBot === true;
}
```

**Step 2: Create index file**

```typescript
// packages/server/src/bots/index.ts
/**
 * Bot player system - AI-controlled characters.
 */

export * from './bot-player';
```

**Step 3: Commit**

```bash
git add packages/server/src/bots/bot-player.ts packages/server/src/bots/index.ts
git commit -m "$(cat <<'EOF'
feat(bots): add BotPlayer type extending Player

Create BotPlayer interface that extends Player with:
- isBot flag for type checking
- botProfile for personality/memory/relationships
- currentGoalId and currentPlan for GOAP
- lastAiTick for tick scheduling
- isBotPlayer type guard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create BotSession Type (No Socket)

**Files:**
- Create: `packages/server/src/bots/bot-session.ts`
- Modify: `packages/server/src/bots/index.ts`

**Step 1: Write the BotSession type**

```typescript
// packages/server/src/bots/bot-session.ts
/**
 * BotSession - a session for bot players (no socket connection).
 */

import type { World, CombatStats } from '@solo-mud/shared';
import type { BotPlayer } from './bot-player';
import type { IncursionState } from '../game/incursion';

/** Bot session mimics GameSession but without socket */
export interface BotSession {
  id: string;
  playerId: string;
  player: BotPlayer;
  combatStats: CombatStats;
  world: World;
  createdAt: number;
  lastActivity: number;

  /** Flag indicating this is a bot session */
  isBot: true;

  /** Incursion state (shared with all sessions) */
  incursionState?: IncursionState;

  /** Valve puzzle state */
  valveSequence?: string[];
  puzzleSolution?: string[];
  sewerGateOpen?: boolean;
}

/** Type guard to check if a session is a BotSession */
export function isBotSession(session: unknown): session is BotSession {
  return (
    typeof session === 'object' &&
    session !== null &&
    'isBot' in session &&
    (session as BotSession).isBot === true
  );
}
```

**Step 2: Update index**

Add to `packages/server/src/bots/index.ts`:
```typescript
export * from './bot-session';
```

**Step 3: Commit**

```bash
git add packages/server/src/bots/bot-session.ts packages/server/src/bots/index.ts
git commit -m "$(cat <<'EOF'
feat(bots): add BotSession type for socket-less sessions

Create BotSession that mimics GameSession without socket:
- Same structure as GameSession
- isBot flag for type checking
- isBotSession type guard
- Shares world and incursion state

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create Bot Factory

**Files:**
- Create: `packages/server/src/bots/bot-factory.ts`
- Create: `packages/server/src/bots/bot-factory.test.ts`
- Modify: `packages/server/src/bots/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/bot-factory.test.ts
/**
 * Tests for bot factory.
 */

import { describe, it, expect } from 'vitest';
import { createBotPlayer, createBotSession, createDefaultPersonality, createDefaultMemory } from './bot-factory';

describe('createDefaultPersonality', () => {
  it('should create personality with all traits in valid range', () => {
    const personality = createDefaultPersonality();

    expect(personality.bravery).toBeGreaterThanOrEqual(0);
    expect(personality.bravery).toBeLessThanOrEqual(100);
    expect(personality.greed).toBeGreaterThanOrEqual(0);
    expect(personality.greed).toBeLessThanOrEqual(100);
    expect(personality.sociability).toBeGreaterThanOrEqual(0);
    expect(personality.sociability).toBeLessThanOrEqual(100);
    expect(personality.patience).toBeGreaterThanOrEqual(0);
    expect(personality.patience).toBeLessThanOrEqual(100);
    expect(personality.aggression).toBeGreaterThanOrEqual(0);
    expect(personality.aggression).toBeLessThanOrEqual(100);
  });

  it('should have default arrays populated', () => {
    const personality = createDefaultPersonality();

    expect(personality.preferredActivities.length).toBeGreaterThan(0);
    expect(personality.preferredZones.length).toBeGreaterThan(0);
    expect(personality.quirks).toBeDefined();
    expect(personality.catchphrases.length).toBeGreaterThan(0);
  });
});

describe('createDefaultMemory', () => {
  it('should create empty memory state', () => {
    const memory = createDefaultMemory();

    expect(memory.knownLocations).toEqual([]);
    expect(memory.knownPaths).toEqual({});
    expect(memory.knownCreatures).toEqual({});
    expect(memory.knownShops).toEqual({});
    expect(memory.activeQuests).toEqual([]);
    expect(memory.completedQuests).toEqual([]);
    expect(memory.deaths).toEqual([]);
    expect(memory.victories).toEqual([]);
    expect(memory.recentEvents).toEqual([]);
  });
});

describe('createBotPlayer', () => {
  it('should create a bot player with isBot flag', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    expect(bot.isBot).toBe(true);
    expect(bot.name).toBe('TestBot');
    expect(bot.class).toBe('warrior');
    expect(bot.locationId).toBe('town_inn');
  });

  it('should create bot profile with personality', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'mage',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    expect(bot.botProfile).toBeDefined();
    expect(bot.botProfile.personality).toBeDefined();
    expect(bot.botProfile.personality.bravery).toBeGreaterThanOrEqual(0);
  });

  it('should use provided personality for named bots', () => {
    const customPersonality = createDefaultPersonality();
    customPersonality.bravery = 95;
    customPersonality.catchphrases = ['For glory!'];

    const bot = createBotPlayer({
      id: 'bot-aldric',
      name: 'Aldric',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: true,
      personality: customPersonality,
      backstory: 'A brave warrior.',
    });

    expect(bot.botProfile.isNamed).toBe(true);
    expect(bot.botProfile.personality.bravery).toBe(95);
    expect(bot.botProfile.personality.catchphrases).toContain('For glory!');
    expect(bot.botProfile.backstory).toBe('A brave warrior.');
  });

  it('should set starting level correctly', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'rogue',
      startLocationId: 'town_inn',
      isNamed: false,
      level: 5,
    });

    expect(bot.level).toBe(5);
  });
});

describe('createBotSession', () => {
  it('should create a bot session with isBot flag', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    const session = createBotSession(bot);

    expect(session.isBot).toBe(true);
    expect(session.player).toBe(bot);
    expect(session.id).toBe('bot-test');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/bots/bot-factory.test.ts`
Expected: FAIL (module not found)

**Step 3: Write the implementation**

```typescript
// packages/server/src/bots/bot-factory.ts
/**
 * Factory functions for creating bot players and sessions.
 */

import type { ClassName, BotPersonality, BotMemory, BotProfile, CombatStats, World } from '@solo-mud/shared';
import { CLASSES, xpForLevel, getStarterSpellId, generateStarterGear } from '@solo-mud/shared';
import type { BotPlayer } from './bot-player';
import type { BotSession } from './bot-session';
import { calculateMaxHp, calculateMaxMp, calculateMaxCarryWeight } from '../character/player-factory';
import { calculateCombatStats } from '../character/stats';
import { generateWorld } from '../world/generate';

/** Options for creating a bot player */
export interface CreateBotPlayerOptions {
  id: string;
  name: string;
  className: ClassName;
  startLocationId: string;
  isNamed: boolean;
  level?: number;
  personality?: BotPersonality;
  backstory?: string;
  aspirations?: string[];
}

/** Random number in range (inclusive) */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick random item from array */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Create a default personality with randomized traits */
export function createDefaultPersonality(): BotPersonality {
  const activities: ('combat' | 'exploration' | 'trading' | 'socializing')[] =
    ['combat', 'exploration', 'trading', 'socializing'];
  const zones = ['town', 'sewer', 'wilderness'];
  const styles: BotPersonality['speechStyle'][] = ['formal', 'casual', 'gruff', 'cheerful', 'mysterious'];

  // Pick 1-2 preferred activities
  const shuffledActivities = [...activities].sort(() => Math.random() - 0.5);
  const numActivities = randomInRange(1, 2);
  const preferredActivities = shuffledActivities.slice(0, numActivities);

  // Pick 1-2 preferred zones
  const shuffledZones = [...zones].sort(() => Math.random() - 0.5);
  const numZones = randomInRange(1, 2);
  const preferredZones = shuffledZones.slice(0, numZones);

  return {
    bravery: randomInRange(20, 80),
    greed: randomInRange(20, 80),
    sociability: randomInRange(20, 80),
    patience: randomInRange(20, 80),
    aggression: randomInRange(20, 80),
    preferredActivities,
    preferredZones,
    dislikedCreatures: [],
    quirks: [],
    speechStyle: pickRandom(styles),
    catchphrases: ['...', 'Hmm.', 'Indeed.'],
  };
}

/** Create empty memory state */
export function createDefaultMemory(): BotMemory {
  return {
    knownLocations: [],
    knownPaths: {},
    knownCreatures: {},
    knownShops: {},
    activeQuests: [],
    completedQuests: [],
    aspirationProgress: {},
    deaths: [],
    victories: [],
    friendsMade: [],
    placesExplored: 0,
    recentEvents: [],
    lastCombat: 0,
    lastSocialInteraction: 0,
    lastShopVisit: undefined,
  };
}

/** Create a bot player */
export function createBotPlayer(options: CreateBotPlayerOptions): BotPlayer {
  const {
    id,
    name,
    className,
    startLocationId,
    isNamed,
    level = 1,
    personality,
    backstory,
    aspirations = [],
  } = options;

  const classDef = CLASSES[className];
  const maxHp = calculateMaxHp(classDef, level);
  const maxMp = calculateMaxMp(classDef, level);
  const maxCarryWeight = calculateMaxCarryWeight(classDef.baseStats.str);

  // Calculate XP for the level
  let xp = 0;
  for (let l = 1; l < level; l++) {
    xp += xpForLevel(l + 1);
  }

  const botProfile: BotProfile = {
    isNamed,
    personality: personality ?? createDefaultPersonality(),
    relationships: {
      opinions: {},
      blocked: [],
    },
    memory: createDefaultMemory(),
    backstory,
    aspirations,
  };

  return {
    id,
    name,
    class: className,
    level,
    xp,
    xpToNextLevel: xpForLevel(level + 1),

    baseStats: { ...classDef.baseStats },
    currentHp: maxHp,
    maxHp,
    currentMp: maxMp,
    maxMp,

    subclass: undefined,
    talentPointsAvailable: 0,

    equipment: {},
    inventory: [],
    inventorySlots: 40,
    keyring: [],
    carryWeight: 0,
    maxCarryWeight,

    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],

    locationId: startLocationId,
    boundTownId: startLocationId,

    inCombat: false,
    autoAttack: false,
    targetId: undefined,
    globalCooldown: 0,
    abilityCooldowns: {},

    currency: { copper: 0, silver: 0, gold: 0 },

    tutorial: {
      skipped: true, // Bots skip tutorial
      complete: true,
      completedSteps: [],
    },

    corpseLocationId: undefined,
    corpseItems: undefined,

    statusEffects: [],
    questFlags: [],

    spells: {
      known: getStarterSpellId(className) ? [getStarterSpellId(className)!] : [],
      slots: [getStarterSpellId(className) ?? null, null, null, null],
    },

    propCooldowns: {},

    // Bot-specific fields
    isBot: true,
    botProfile,
    lastAiTick: 0,
    namedBotId: isNamed ? id : undefined,
  };
}

/** Create a bot session */
export function createBotSession(bot: BotPlayer, existingWorld?: World): BotSession {
  // Generate world or use existing
  const world = existingWorld ?? generateWorld({
    seed: `bot-${bot.id}-${Date.now()}`,
    nodeCount: 18,
    extraEdges: 5,
    lockedEdges: 2,
  });

  // Generate and equip starter gear
  const starterGear = generateStarterGear(bot.class);
  for (const item of starterGear.items) {
    world.items[item.id] = item;
  }
  if (starterGear.equipmentIds.weapon) {
    bot.equipment.weapon = starterGear.equipmentIds.weapon;
  }
  if (starterGear.equipmentIds.chest) {
    bot.equipment.chest = starterGear.equipmentIds.chest;
  }
  if (starterGear.equipmentIds.legs) {
    bot.equipment.legs = starterGear.equipmentIds.legs;
  }
  if (starterGear.equipmentIds.feet) {
    bot.equipment.feet = starterGear.equipmentIds.feet;
  }

  const combatStats: CombatStats = calculateCombatStats(bot.baseStats);

  return {
    id: bot.id,
    playerId: bot.id,
    player: bot,
    combatStats,
    world,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isBot: true,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/bots/bot-factory.test.ts`
Expected: PASS

**Step 5: Update index**

Add to `packages/server/src/bots/index.ts`:
```typescript
export * from './bot-factory';
```

**Step 6: Commit**

```bash
git add packages/server/src/bots/bot-factory.ts packages/server/src/bots/bot-factory.test.ts packages/server/src/bots/index.ts
git commit -m "$(cat <<'EOF'
feat(bots): add bot factory for creating bots and sessions

Create factory functions:
- createDefaultPersonality() - randomized traits
- createDefaultMemory() - empty memory state
- createBotPlayer() - creates BotPlayer with profile
- createBotSession() - creates session with world

Includes 9 tests covering all factory functions.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create BotManager Skeleton

**Files:**
- Create: `packages/server/src/bots/bot-manager.ts`
- Create: `packages/server/src/bots/bot-manager.test.ts`
- Modify: `packages/server/src/bots/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/bot-manager.test.ts
/**
 * Tests for BotManager.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BotManager } from './bot-manager';
import type { BotSpawnConfig } from '@solo-mud/shared';

describe('BotManager', () => {
  let manager: BotManager;
  const defaultConfig: BotSpawnConfig = {
    minPopulation: 5,
    maxPopulation: 10,
    namedBotCount: 2,
    spawnLocations: ['town_inn', 'town_square'],
    levelRange: [1, 5],
    namedBotRespawnDelay: 1440,
  };

  beforeEach(() => {
    manager = new BotManager(defaultConfig);
  });

  describe('initialization', () => {
    it('should start with zero bots', () => {
      expect(manager.getBotCount()).toBe(0);
    });

    it('should store config', () => {
      expect(manager.getConfig()).toEqual(defaultConfig);
    });
  });

  describe('population management', () => {
    it('should spawn bots when below minimum', () => {
      manager.maintainPopulation();

      // Should spawn up to minPopulation
      expect(manager.getBotCount()).toBeGreaterThanOrEqual(defaultConfig.minPopulation);
    });

    it('should not exceed maximum population', () => {
      // Force spawn many times
      for (let i = 0; i < 20; i++) {
        manager.maintainPopulation();
      }

      expect(manager.getBotCount()).toBeLessThanOrEqual(defaultConfig.maxPopulation);
    });

    it('should return all bot sessions', () => {
      manager.maintainPopulation();

      const sessions = manager.getAllBotSessions();
      expect(sessions.length).toBe(manager.getBotCount());
    });
  });

  describe('bot retrieval', () => {
    it('should get bot by ID', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      if (sessions.length > 0) {
        const firstBot = sessions[0];
        const retrieved = manager.getBotSession(firstBot.id);
        expect(retrieved).toBe(firstBot);
      }
    });

    it('should return undefined for unknown ID', () => {
      const retrieved = manager.getBotSession('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('bot removal', () => {
    it('should remove bot by ID', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      if (sessions.length > 0) {
        const firstBot = sessions[0];
        const removed = manager.removeBot(firstBot.id);
        expect(removed).toBe(true);
        expect(manager.getBotSession(firstBot.id)).toBeUndefined();
      }
    });

    it('should return false for unknown ID', () => {
      const removed = manager.removeBot('nonexistent');
      expect(removed).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/bots/bot-manager.test.ts`
Expected: FAIL (module not found)

**Step 3: Write the implementation**

```typescript
// packages/server/src/bots/bot-manager.ts
/**
 * BotManager - manages bot population and lifecycle.
 */

import type { BotSpawnConfig, ClassName } from '@solo-mud/shared';
import type { BotPlayer } from './bot-player';
import type { BotSession } from './bot-session';
import { createBotPlayer, createBotSession } from './bot-factory';

/** Random bot names for generic bots */
const BOT_NAMES = [
  'Wanderer', 'Traveler', 'Adventurer', 'Seeker', 'Explorer',
  'Drifter', 'Nomad', 'Pilgrim', 'Wayfarer', 'Rover',
  'Scout', 'Hunter', 'Tracker', 'Ranger', 'Guardian',
  'Sentinel', 'Watcher', 'Keeper', 'Defender', 'Protector',
];

/** Classes for random selection */
const CLASSES: ClassName[] = ['warrior', 'rogue', 'mage', 'cleric', 'ranger'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class BotManager {
  private config: BotSpawnConfig;
  private bots: Map<string, BotSession> = new Map();
  private nextBotId = 1;

  constructor(config: BotSpawnConfig) {
    this.config = config;
  }

  /** Get current configuration */
  getConfig(): BotSpawnConfig {
    return this.config;
  }

  /** Get current bot count */
  getBotCount(): number {
    return this.bots.size;
  }

  /** Get all bot sessions */
  getAllBotSessions(): BotSession[] {
    return Array.from(this.bots.values());
  }

  /** Get a specific bot session by ID */
  getBotSession(botId: string): BotSession | undefined {
    return this.bots.get(botId);
  }

  /** Remove a bot by ID */
  removeBot(botId: string): boolean {
    return this.bots.delete(botId);
  }

  /** Spawn a generic bot */
  spawnGenericBot(): BotSession {
    const id = `bot_generic_${this.nextBotId++}`;
    const name = `${pickRandom(BOT_NAMES)} #${this.nextBotId}`;
    const className = pickRandom(CLASSES);
    const level = randomInRange(this.config.levelRange[0], this.config.levelRange[1]);
    const startLocation = pickRandom(this.config.spawnLocations);

    const bot = createBotPlayer({
      id,
      name,
      className,
      startLocationId: startLocation,
      isNamed: false,
      level,
    });

    const session = createBotSession(bot);
    this.bots.set(id, session);

    return session;
  }

  /** Maintain population at configured levels */
  maintainPopulation(): void {
    // Spawn bots until we reach minimum
    while (this.bots.size < this.config.minPopulation) {
      this.spawnGenericBot();
    }
  }

  /** Run AI tick for all bots (placeholder for now) */
  async tick(_gameTime: number): Promise<void> {
    // TODO: Implement GOAP planning and action execution
    // For now, this is a placeholder
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/bots/bot-manager.test.ts`
Expected: PASS

**Step 5: Update index**

Add to `packages/server/src/bots/index.ts`:
```typescript
export * from './bot-manager';
```

**Step 6: Commit**

```bash
git add packages/server/src/bots/bot-manager.ts packages/server/src/bots/bot-manager.test.ts packages/server/src/bots/index.ts
git commit -m "$(cat <<'EOF'
feat(bots): add BotManager for population management

Create BotManager class with:
- Population tracking and limits
- Generic bot spawning with random names/classes
- Bot retrieval and removal
- maintainPopulation() for automatic spawning
- Placeholder tick() for future GOAP

Includes 8 tests for manager functionality.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Integrate BotManager with GameLoop

**Files:**
- Modify: `packages/server/src/game/game-loop.ts`
- Create: `packages/server/src/bots/integration.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/integration.test.ts
/**
 * Integration tests for bot system with game loop.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BotManager } from './bot-manager';
import type { BotSpawnConfig } from '@solo-mud/shared';

describe('BotManager integration', () => {
  let manager: BotManager;
  const config: BotSpawnConfig = {
    minPopulation: 3,
    maxPopulation: 5,
    namedBotCount: 1,
    spawnLocations: ['town_inn'],
    levelRange: [1, 3],
    namedBotRespawnDelay: 1440,
  };

  beforeEach(() => {
    manager = new BotManager(config);
  });

  describe('tick integration', () => {
    it('should run tick without errors', async () => {
      manager.maintainPopulation();

      // Should not throw
      await expect(manager.tick(0)).resolves.not.toThrow();
    });

    it('should maintain population across ticks', async () => {
      manager.maintainPopulation();
      const initialCount = manager.getBotCount();

      await manager.tick(1000);

      expect(manager.getBotCount()).toBe(initialCount);
    });
  });

  describe('bot sessions', () => {
    it('should create valid bot sessions', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      for (const session of sessions) {
        expect(session.isBot).toBe(true);
        expect(session.player.isBot).toBe(true);
        expect(session.player.botProfile).toBeDefined();
        expect(session.world).toBeDefined();
        expect(session.combatStats).toBeDefined();
      }
    });

    it('should have unique IDs for all bots', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();
      const ids = sessions.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
```

**Step 2: Run test to verify it passes (already implemented)**

Run: `cd packages/server && npx vitest run src/bots/integration.test.ts`
Expected: PASS

**Step 3: Modify game-loop.ts to add BotManager**

Read the current game-loop.ts and add BotManager integration at the appropriate place. The key changes are:

1. Import BotManager
2. Add optional botManager property
3. Call botManager.tick() in worldTick()

Add these imports at the top:
```typescript
import { BotManager } from '../bots';
```

Add property to GameLoop class:
```typescript
private botManager?: BotManager;
```

Add method to set bot manager:
```typescript
setBotManager(manager: BotManager): void {
  this.botManager = manager;
}

getBotManager(): BotManager | undefined {
  return this.botManager;
}
```

In worldTick(), after simulation tick, add:
```typescript
// Bot AI tick
if (this.botManager) {
  await this.botManager.tick(this.gameTime.totalMinutes);
}
```

**Step 4: Commit**

```bash
git add packages/server/src/game/game-loop.ts packages/server/src/bots/integration.test.ts
git commit -m "$(cat <<'EOF'
feat(game-loop): integrate BotManager with game loop

Add BotManager integration to GameLoop:
- Import and store BotManager instance
- setBotManager/getBotManager methods
- Call botManager.tick() in worldTick()

Includes 4 integration tests.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: GOAP Brain (Tasks 7-12)

### Task 7: Create Goal System

**Files:**
- Create: `packages/server/src/bots/goap/goals.ts`
- Create: `packages/server/src/bots/goap/goals.test.ts`
- Create: `packages/server/src/bots/goap/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/goap/goals.test.ts
import { describe, it, expect } from 'vitest';
import { GOALS, calculateGoalPriority, isGoalComplete } from './goals';
import { createBotPlayer } from '../bot-factory';

describe('Goal System', () => {
  describe('GOALS', () => {
    it('should define survive goal', () => {
      expect(GOALS.survive).toBeDefined();
      expect(GOALS.survive.id).toBe('survive');
      expect(GOALS.survive.category).toBe('survival');
    });

    it('should define level_up goal', () => {
      expect(GOALS.level_up).toBeDefined();
      expect(GOALS.level_up.category).toBe('progression');
    });

    it('should define socialize goal', () => {
      expect(GOALS.socialize).toBeDefined();
      expect(GOALS.socialize.category).toBe('social');
    });
  });

  describe('calculateGoalPriority', () => {
    it('should return high priority for survive when HP low', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 10;
      bot.maxHp = 100;

      const priority = calculateGoalPriority('survive', bot);
      expect(priority).toBeGreaterThanOrEqual(80);
    });

    it('should return low priority for survive when HP high', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 90;
      bot.maxHp = 100;

      const priority = calculateGoalPriority('survive', bot);
      expect(priority).toBeLessThan(30);
    });

    it('should modify priority based on personality', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.botProfile.personality.greed = 100;

      const priority = calculateGoalPriority('get_richer', bot);
      expect(priority).toBeGreaterThan(50);
    });
  });

  describe('isGoalComplete', () => {
    it('should mark survive complete when HP above threshold', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 60;
      bot.maxHp = 100;

      expect(isGoalComplete('survive', bot)).toBe(true);
    });

    it('should mark survive incomplete when HP below threshold', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 20;
      bot.maxHp = 100;

      expect(isGoalComplete('survive', bot)).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/bots/goap/goals.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
// packages/server/src/bots/goap/goals.ts
/**
 * GOAP Goal definitions and priority calculations.
 */

import type { BotGoalDef, GoalCategory } from '@solo-mud/shared';
import type { BotPlayer } from '../bot-player';

/** Goal definition with runtime functions */
export interface Goal extends BotGoalDef {
  /** Calculate priority for this goal (0-100) */
  getPriority: (bot: BotPlayer) => number;
  /** Check if goal is complete */
  isComplete: (bot: BotPlayer) => boolean;
}

/** All defined goals */
export const GOALS: Record<string, Goal> = {
  survive: {
    id: 'survive',
    category: 'survival',
    description: 'Stay alive - flee, heal, or find safety',
    getPriority: (bot) => {
      const hpPercent = (bot.currentHp / bot.maxHp) * 100;
      // High priority when HP is low, modified by bravery
      if (hpPercent < 30) {
        // Brave bots have lower survive priority (fight longer)
        const braveryMod = bot.botProfile.personality.bravery / 100;
        return Math.max(10, 100 - (braveryMod * 30));
      }
      if (hpPercent < 50) {
        return 50 - (bot.botProfile.personality.bravery / 5);
      }
      return 10;
    },
    isComplete: (bot) => {
      return (bot.currentHp / bot.maxHp) >= 0.5;
    },
  },

  heal_up: {
    id: 'heal_up',
    category: 'survival',
    description: 'Restore HP to full',
    getPriority: (bot) => {
      const hpPercent = (bot.currentHp / bot.maxHp) * 100;
      if (hpPercent < 70) {
        return 80 - (hpPercent / 2);
      }
      return 0;
    },
    isComplete: (bot) => {
      return bot.currentHp >= bot.maxHp;
    },
  },

  level_up: {
    id: 'level_up',
    category: 'progression',
    description: 'Gain experience and level up',
    getPriority: (bot) => {
      // Base priority 50, modified by patience (patient bots prioritize leveling)
      const patienceMod = bot.botProfile.personality.patience / 100;
      return 40 + (patienceMod * 20);
    },
    isComplete: (_bot) => {
      // Never "complete" - always want more levels
      return false;
    },
  },

  get_richer: {
    id: 'get_richer',
    category: 'economic',
    description: 'Accumulate wealth',
    getPriority: (bot) => {
      // Greedy bots have higher priority
      const greedMod = bot.botProfile.personality.greed / 100;
      return 30 + (greedMod * 40);
    },
    isComplete: (_bot) => {
      // Never complete - always want more gold
      return false;
    },
  },

  socialize: {
    id: 'socialize',
    category: 'social',
    description: 'Interact with other players or bots',
    getPriority: (bot) => {
      // Social bots have higher priority
      const socialMod = bot.botProfile.personality.sociability / 100;
      const baseP = 20 + (socialMod * 30);

      // Lower priority if recently socialized
      const timeSince = Date.now() - bot.botProfile.memory.lastSocialInteraction;
      if (timeSince < 60000) { // Less than 1 minute
        return baseP * 0.5;
      }
      return baseP;
    },
    isComplete: (bot) => {
      // Complete if socialized recently
      const timeSince = Date.now() - bot.botProfile.memory.lastSocialInteraction;
      return timeSince < 30000; // Within 30 seconds
    },
  },

  explore: {
    id: 'explore',
    category: 'progression',
    description: 'Discover new locations',
    getPriority: (bot) => {
      // Higher if exploration is preferred activity
      if (bot.botProfile.personality.preferredActivities.includes('exploration')) {
        return 45;
      }
      return 25;
    },
    isComplete: (_bot) => {
      // Never complete - always more to explore
      return false;
    },
  },

  rest: {
    id: 'rest',
    category: 'survival',
    description: 'Rest to regenerate faster',
    getPriority: (bot) => {
      const hpPercent = (bot.currentHp / bot.maxHp) * 100;
      const mpPercent = (bot.currentMp / bot.maxMp) * 100;

      // Only rest if not at full and not in immediate danger
      if (hpPercent < 70 || mpPercent < 50) {
        return 35;
      }
      return 0;
    },
    isComplete: (bot) => {
      return bot.currentHp >= bot.maxHp && bot.currentMp >= bot.maxMp;
    },
  },
};

/** Calculate priority for a goal */
export function calculateGoalPriority(goalId: string, bot: BotPlayer): number {
  const goal = GOALS[goalId];
  if (!goal) return 0;
  return goal.getPriority(bot);
}

/** Check if a goal is complete */
export function isGoalComplete(goalId: string, bot: BotPlayer): boolean {
  const goal = GOALS[goalId];
  if (!goal) return true;
  return goal.isComplete(bot);
}

/** Get the highest priority goal for a bot */
export function selectHighestPriorityGoal(bot: BotPlayer): string {
  let highestPriority = -1;
  let selectedGoal = 'level_up'; // Default

  for (const [goalId, goal] of Object.entries(GOALS)) {
    // Skip completed goals
    if (goal.isComplete(bot)) continue;

    const priority = goal.getPriority(bot);
    if (priority > highestPriority) {
      highestPriority = priority;
      selectedGoal = goalId;
    }
  }

  return selectedGoal;
}
```

**Step 4: Create index file**

```typescript
// packages/server/src/bots/goap/index.ts
export * from './goals';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/bots/goap/goals.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/server/src/bots/goap/goals.ts packages/server/src/bots/goap/goals.test.ts packages/server/src/bots/goap/index.ts
git commit -m "$(cat <<'EOF'
feat(goap): add goal system with priority calculation

Create GOAP goal system with:
- 7 goals: survive, heal_up, level_up, get_richer, socialize, explore, rest
- Dynamic priority based on bot state and personality
- Completion conditions for each goal
- selectHighestPriorityGoal() for decision making

Includes 7 tests for goal priorities and completion.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Create Action System

**Files:**
- Create: `packages/server/src/bots/goap/actions.ts`
- Create: `packages/server/src/bots/goap/actions.test.ts`
- Modify: `packages/server/src/bots/goap/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/goap/actions.test.ts
import { describe, it, expect } from 'vitest';
import { ACTIONS, checkPreconditions, getAvailableActions } from './actions';
import { createBotPlayer } from '../bot-factory';

describe('Action System', () => {
  describe('ACTIONS', () => {
    it('should define attack action', () => {
      expect(ACTIONS.attack).toBeDefined();
      expect(ACTIONS.attack.category).toBe('combat');
    });

    it('should define flee action', () => {
      expect(ACTIONS.flee).toBeDefined();
      expect(ACTIONS.flee.category).toBe('combat');
    });

    it('should define travel action', () => {
      expect(ACTIONS.travel).toBeDefined();
      expect(ACTIONS.travel.category).toBe('movement');
    });
  });

  describe('checkPreconditions', () => {
    it('should pass attack preconditions when in combat with target', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';

      expect(checkPreconditions('attack', bot)).toBe(true);
    });

    it('should fail attack preconditions when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      expect(checkPreconditions('attack', bot)).toBe(false);
    });

    it('should pass flee preconditions when in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;

      expect(checkPreconditions('flee', bot)).toBe(true);
    });
  });

  describe('getAvailableActions', () => {
    it('should return combat actions when in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';

      const actions = getAvailableActions(bot);
      expect(actions).toContain('attack');
      expect(actions).toContain('flee');
    });

    it('should return movement actions when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const actions = getAvailableActions(bot);
      expect(actions).toContain('travel');
      expect(actions).toContain('explore');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/bots/goap/actions.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
// packages/server/src/bots/goap/actions.ts
/**
 * GOAP Action definitions and precondition checking.
 */

import type { BotActionDef, ActionCategory, ActionPrecondition } from '@solo-mud/shared';
import type { BotPlayer } from '../bot-player';

/** Action definition with cost function */
export interface Action extends BotActionDef {
  /** Calculate cost for this action (lower = preferred) */
  getCost: (bot: BotPlayer) => number;
  /** Get the command to execute */
  getCommand: (bot: BotPlayer, context?: Record<string, string>) => string | null;
}

/** All defined actions */
export const ACTIONS: Record<string, Action> = {
  // Combat actions
  attack: {
    id: 'attack',
    category: 'combat',
    description: 'Attack current target',
    preconditions: [
      { type: 'in_combat', value: true },
      { type: 'has_target' },
    ],
    effects: ['damage_target'],
    getCost: () => 10,
    getCommand: () => 'attack',
  },

  flee: {
    id: 'flee',
    category: 'combat',
    description: 'Flee from combat',
    preconditions: [
      { type: 'in_combat', value: true },
    ],
    effects: ['exit_combat'],
    getCost: (bot) => {
      // Brave bots find fleeing costly
      return 20 + (bot.botProfile.personality.bravery / 5);
    },
    getCommand: () => 'flee',
  },

  // Survival actions
  use_potion: {
    id: 'use_potion',
    category: 'survival',
    description: 'Use a healing potion',
    preconditions: [
      { type: 'has_item', value: 'health_potion' },
      { type: 'hp_below', value: 70 },
    ],
    effects: ['restore_hp'],
    getCost: () => 5,
    getCommand: () => 'use health_potion',
  },

  rest: {
    id: 'rest',
    category: 'survival',
    description: 'Rest to regenerate',
    preconditions: [
      { type: 'not_in_combat' },
    ],
    effects: ['regenerate'],
    getCost: (bot) => {
      // Impatient bots find resting costly
      return 15 + ((100 - bot.botProfile.personality.patience) / 5);
    },
    getCommand: () => 'rest',
  },

  // Movement actions
  travel: {
    id: 'travel',
    category: 'movement',
    description: 'Travel to a known location',
    preconditions: [
      { type: 'not_in_combat' },
    ],
    effects: ['change_location'],
    getCost: () => 10,
    getCommand: (_bot, context) => {
      if (context?.direction) {
        return context.direction;
      }
      return null;
    },
  },

  explore: {
    id: 'explore',
    category: 'movement',
    description: 'Explore a new direction',
    preconditions: [
      { type: 'not_in_combat' },
    ],
    effects: ['discover_location'],
    getCost: (bot) => {
      // Explorers find this cheaper
      if (bot.botProfile.personality.preferredActivities.includes('exploration')) {
        return 5;
      }
      return 15;
    },
    getCommand: (_bot, context) => {
      if (context?.direction) {
        return context.direction;
      }
      // Default to a random direction
      const directions = ['north', 'south', 'east', 'west'];
      return directions[Math.floor(Math.random() * directions.length)];
    },
  },

  // Economy actions
  buy_item: {
    id: 'buy_item',
    category: 'economy',
    description: 'Buy an item from a shop',
    preconditions: [
      { type: 'not_in_combat' },
      // In a shop location checked at runtime
    ],
    effects: ['gain_item', 'lose_gold'],
    getCost: (bot) => {
      // Greedy bots find spending costly
      return 10 + (bot.botProfile.personality.greed / 5);
    },
    getCommand: (_bot, context) => {
      if (context?.item) {
        return `buy ${context.item}`;
      }
      return null;
    },
  },

  sell_item: {
    id: 'sell_item',
    category: 'economy',
    description: 'Sell an item to a shop',
    preconditions: [
      { type: 'not_in_combat' },
    ],
    effects: ['lose_item', 'gain_gold'],
    getCost: () => 10,
    getCommand: (_bot, context) => {
      if (context?.item) {
        return `sell ${context.item}`;
      }
      return null;
    },
  },

  // Social actions
  say: {
    id: 'say',
    category: 'social',
    description: 'Say something to the room',
    preconditions: [],
    effects: ['social_interaction'],
    getCost: (bot) => {
      // Social bots find this cheap
      return 15 - (bot.botProfile.personality.sociability / 10);
    },
    getCommand: (_bot, context) => {
      if (context?.message) {
        return `say ${context.message}`;
      }
      return null;
    },
  },

  // Utility actions
  loot: {
    id: 'loot',
    category: 'utility',
    description: 'Loot items from ground',
    preconditions: [
      { type: 'not_in_combat' },
    ],
    effects: ['gain_items'],
    getCost: () => 5,
    getCommand: () => 'take all',
  },

  equip: {
    id: 'equip',
    category: 'utility',
    description: 'Equip an item',
    preconditions: [],
    effects: ['improve_stats'],
    getCost: () => 5,
    getCommand: (_bot, context) => {
      if (context?.item) {
        return `equip ${context.item}`;
      }
      return null;
    },
  },
};

/** Check if a single precondition is met */
function checkSinglePrecondition(precondition: ActionPrecondition, bot: BotPlayer): boolean {
  switch (precondition.type) {
    case 'in_combat':
      return bot.inCombat === precondition.value;
    case 'not_in_combat':
      return !bot.inCombat;
    case 'has_target':
      return bot.targetId !== undefined;
    case 'hp_above':
      return (bot.currentHp / bot.maxHp) * 100 >= (precondition.value as number);
    case 'hp_below':
      return (bot.currentHp / bot.maxHp) * 100 < (precondition.value as number);
    case 'mp_above':
      return (bot.currentMp / bot.maxMp) * 100 >= (precondition.value as number);
    case 'has_item':
      return bot.inventory.some(slot => slot.itemId.includes(precondition.value as string));
    case 'has_currency':
      const total = bot.currency.copper + bot.currency.silver * 10 + bot.currency.gold * 100;
      return total >= (precondition.value as number);
    case 'knows_location':
      return bot.botProfile.memory.knownLocations.includes(precondition.value as string);
    case 'has_spell':
      return bot.spells.known.includes(precondition.value as string);
    default:
      return true;
  }
}

/** Check if all preconditions for an action are met */
export function checkPreconditions(actionId: string, bot: BotPlayer): boolean {
  const action = ACTIONS[actionId];
  if (!action) return false;

  return action.preconditions.every(pre => checkSinglePrecondition(pre, bot));
}

/** Get all actions available to a bot */
export function getAvailableActions(bot: BotPlayer): string[] {
  return Object.keys(ACTIONS).filter(actionId => checkPreconditions(actionId, bot));
}

/** Get action cost */
export function getActionCost(actionId: string, bot: BotPlayer): number {
  const action = ACTIONS[actionId];
  if (!action) return Infinity;
  return action.getCost(bot);
}

/** Get command for an action */
export function getActionCommand(actionId: string, bot: BotPlayer, context?: Record<string, string>): string | null {
  const action = ACTIONS[actionId];
  if (!action) return null;
  return action.getCommand(bot, context);
}
```

**Step 4: Update index**

Add to `packages/server/src/bots/goap/index.ts`:
```typescript
export * from './actions';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/bots/goap/actions.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/server/src/bots/goap/actions.ts packages/server/src/bots/goap/actions.test.ts packages/server/src/bots/goap/index.ts
git commit -m "$(cat <<'EOF'
feat(goap): add action system with preconditions

Create GOAP action system with:
- 11 actions across 5 categories (combat, survival, movement, economy, social)
- Precondition checking for each action
- Cost calculation modified by personality
- Command generation for game execution

Includes 6 tests for preconditions and availability.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Create GOAP Planner

**Files:**
- Create: `packages/server/src/bots/goap/planner.ts`
- Create: `packages/server/src/bots/goap/planner.test.ts`
- Modify: `packages/server/src/bots/goap/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/goap/planner.test.ts
import { describe, it, expect } from 'vitest';
import { planActions, selectBestAction } from './planner';
import { createBotPlayer } from '../bot-factory';

describe('GOAP Planner', () => {
  describe('selectBestAction', () => {
    it('should select flee when HP low and survive goal', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 10;
      bot.maxHp = 100;
      bot.inCombat = true;
      bot.targetId = 'enemy_1';
      // Make bot not brave so flee is preferred
      bot.botProfile.personality.bravery = 20;

      const action = selectBestAction(bot, 'survive');
      expect(action).toBe('flee');
    });

    it('should select attack when in combat and level_up goal', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 80;
      bot.maxHp = 100;
      bot.inCombat = true;
      bot.targetId = 'enemy_1';

      const action = selectBestAction(bot, 'level_up');
      expect(action).toBe('attack');
    });

    it('should select explore when not in combat and explore goal', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const action = selectBestAction(bot, 'explore');
      expect(['explore', 'travel']).toContain(action);
    });
  });

  describe('planActions', () => {
    it('should return action list for bot', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const plan = planActions(bot);
      expect(plan.length).toBeGreaterThan(0);
      expect(plan[0]).toBeDefined();
    });

    it('should prioritize survival when HP low', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 10;
      bot.maxHp = 100;
      bot.inCombat = true;
      bot.botProfile.personality.bravery = 10;

      const plan = planActions(bot);
      expect(plan[0]).toBe('flee');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/bots/goap/planner.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
// packages/server/src/bots/goap/planner.ts
/**
 * GOAP Planner - selects actions based on goals and available actions.
 */

import type { BotPlayer } from '../bot-player';
import { GOALS, selectHighestPriorityGoal } from './goals';
import { ACTIONS, getAvailableActions, getActionCost } from './actions';

/** Map of goals to actions that can help achieve them */
const GOAL_TO_ACTIONS: Record<string, string[]> = {
  survive: ['flee', 'use_potion', 'rest'],
  heal_up: ['use_potion', 'rest'],
  level_up: ['attack', 'explore', 'travel'],
  get_richer: ['loot', 'sell_item', 'attack'], // Attack for XP/drops
  socialize: ['say'],
  explore: ['explore', 'travel'],
  rest: ['rest'],
};

/** Select the best action for a given goal */
export function selectBestAction(bot: BotPlayer, goalId: string): string | null {
  const availableActions = getAvailableActions(bot);
  const goalActions = GOAL_TO_ACTIONS[goalId] || [];

  // Filter to actions that are both available and relevant to the goal
  const candidateActions = availableActions.filter(a => goalActions.includes(a));

  if (candidateActions.length === 0) {
    // Fall back to any available action
    if (availableActions.length === 0) return null;

    // Sort by cost and pick cheapest
    candidateActions.push(...availableActions);
  }

  // Sort by cost (lower is better)
  candidateActions.sort((a, b) => getActionCost(a, bot) - getActionCost(b, bot));

  return candidateActions[0] || null;
}

/** Create a plan (list of actions) for the bot */
export function planActions(bot: BotPlayer): string[] {
  // Select highest priority goal
  const goalId = selectHighestPriorityGoal(bot);

  // Store current goal on bot
  bot.currentGoalId = goalId;

  // Select best action for this goal
  const action = selectBestAction(bot, goalId);

  if (!action) {
    return [];
  }

  // For now, return single-step plan
  // Future: implement multi-step planning with A*
  return [action];
}

/** Get the next action to execute */
export function getNextAction(bot: BotPlayer): string | null {
  // If we have a plan, use it
  if (bot.currentPlan && bot.currentPlan.length > 0) {
    return bot.currentPlan[0];
  }

  // Otherwise, create a new plan
  const plan = planActions(bot);
  bot.currentPlan = plan;

  return plan[0] || null;
}

/** Mark current action as complete */
export function completeAction(bot: BotPlayer): void {
  if (bot.currentPlan && bot.currentPlan.length > 0) {
    bot.currentPlan.shift();
  }
}
```

**Step 4: Update index**

Add to `packages/server/src/bots/goap/index.ts`:
```typescript
export * from './planner';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/bots/goap/planner.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/server/src/bots/goap/planner.ts packages/server/src/bots/goap/planner.test.ts packages/server/src/bots/goap/index.ts
git commit -m "$(cat <<'EOF'
feat(goap): add planner for action selection

Create GOAP planner with:
- Goal-to-action mapping
- selectBestAction() picks lowest cost relevant action
- planActions() creates action list from goals
- getNextAction() and completeAction() for execution

Includes 5 tests for action selection and planning.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Connect Planner to Command Execution

**Files:**
- Create: `packages/server/src/bots/bot-executor.ts`
- Create: `packages/server/src/bots/bot-executor.test.ts`
- Modify: `packages/server/src/bots/index.ts`

**Step 1: Write the failing test**

```typescript
// packages/server/src/bots/bot-executor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { BotExecutor } from './bot-executor';
import { createBotPlayer, createBotSession } from './bot-factory';

describe('BotExecutor', () => {
  describe('getNextCommand', () => {
    it('should return attack command when in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';
      bot.currentHp = 80;
      bot.maxHp = 100;

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const command = executor.getNextCommand(session);
      expect(command).toBe('attack');
    });

    it('should return flee command when HP low', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';
      bot.currentHp = 10;
      bot.maxHp = 100;
      bot.botProfile.personality.bravery = 10;

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const command = executor.getNextCommand(session);
      expect(command).toBe('flee');
    });

    it('should return movement command when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const command = executor.getNextCommand(session);
      // Should be a movement command
      expect(['north', 'south', 'east', 'west', 'rest', 'take all']).toContain(command);
    });
  });

  describe('shouldTick', () => {
    it('should return true if enough time passed', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.lastAiTick = Date.now() - 10000; // 10 seconds ago

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      expect(executor.shouldTick(session)).toBe(true);
    });

    it('should return false if ticked recently', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.lastAiTick = Date.now();

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      expect(executor.shouldTick(session)).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run src/bots/bot-executor.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
// packages/server/src/bots/bot-executor.ts
/**
 * BotExecutor - executes bot AI decisions as game commands.
 */

import type { BotSession } from './bot-session';
import type { BotPlayer } from './bot-player';
import { getNextAction, completeAction } from './goap/planner';
import { getActionCommand, ACTIONS } from './goap/actions';

/** Minimum time between AI ticks in ms */
const MIN_TICK_INTERVAL = 3000; // 3 seconds

/** Get random exit from current location */
function getRandomExit(session: BotSession): string | null {
  const location = session.world.locations[session.player.locationId];
  if (!location || !location.exits || location.exits.length === 0) {
    return null;
  }

  const exit = location.exits[Math.floor(Math.random() * location.exits.length)];
  return exit.direction;
}

export class BotExecutor {
  /** Check if bot should tick based on time */
  shouldTick(session: BotSession): boolean {
    const bot = session.player;
    const now = Date.now();
    return (now - bot.lastAiTick) >= MIN_TICK_INTERVAL;
  }

  /** Get the next command for a bot to execute */
  getNextCommand(session: BotSession): string | null {
    const bot = session.player;

    // Get next action from GOAP
    const actionId = getNextAction(bot);
    if (!actionId) {
      return null;
    }

    // Build context for command generation
    const context: Record<string, string> = {};

    // For movement actions, pick a direction
    if (actionId === 'travel' || actionId === 'explore') {
      const direction = getRandomExit(session);
      if (direction) {
        context.direction = direction;
      }
    }

    // For say action, pick a catchphrase
    if (actionId === 'say') {
      const catchphrases = bot.botProfile.personality.catchphrases;
      if (catchphrases.length > 0) {
        context.message = catchphrases[Math.floor(Math.random() * catchphrases.length)];
      }
    }

    // Get command from action
    const command = getActionCommand(actionId, bot, context);

    // Mark action complete (for single-step actions)
    completeAction(bot);

    return command;
  }

  /** Update last tick time */
  markTicked(session: BotSession): void {
    session.player.lastAiTick = Date.now();
  }
}
```

**Step 4: Update index**

Add to `packages/server/src/bots/index.ts`:
```typescript
export * from './bot-executor';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/server && npx vitest run src/bots/bot-executor.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/server/src/bots/bot-executor.ts packages/server/src/bots/bot-executor.test.ts packages/server/src/bots/index.ts
git commit -m "$(cat <<'EOF'
feat(bots): add BotExecutor for command generation

Create BotExecutor that:
- Converts GOAP actions to game commands
- Manages tick timing (3s minimum interval)
- Builds context for movement/speech commands
- Integrates with GOAP planner

Includes 4 tests for command generation and timing.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Update BotManager with AI Tick

**Files:**
- Modify: `packages/server/src/bots/bot-manager.ts`
- Modify: `packages/server/src/bots/bot-manager.test.ts`

**Step 1: Write additional tests**

Add to `packages/server/src/bots/bot-manager.test.ts`:

```typescript
describe('AI tick', () => {
  it('should call executor for each bot', async () => {
    manager.maintainPopulation();
    const initialSessions = manager.getAllBotSessions();

    // Run tick
    await manager.tick(0);

    // Verify bots still exist
    expect(manager.getBotCount()).toBe(initialSessions.length);
  });

  it('should generate commands for bots', async () => {
    manager.maintainPopulation();

    // Set last tick to past so bots will tick
    for (const session of manager.getAllBotSessions()) {
      session.player.lastAiTick = 0;
    }

    // Tick should process without error
    await expect(manager.tick(0)).resolves.not.toThrow();
  });
});
```

**Step 2: Update BotManager implementation**

Update `packages/server/src/bots/bot-manager.ts`:

```typescript
// packages/server/src/bots/bot-manager.ts
/**
 * BotManager - manages bot population and lifecycle.
 */

import type { BotSpawnConfig, ClassName } from '@solo-mud/shared';
import type { BotSession } from './bot-session';
import { createBotPlayer, createBotSession } from './bot-factory';
import { BotExecutor } from './bot-executor';

/** Random bot names for generic bots */
const BOT_NAMES = [
  'Wanderer', 'Traveler', 'Adventurer', 'Seeker', 'Explorer',
  'Drifter', 'Nomad', 'Pilgrim', 'Wayfarer', 'Rover',
  'Scout', 'Hunter', 'Tracker', 'Ranger', 'Guardian',
  'Sentinel', 'Watcher', 'Keeper', 'Defender', 'Protector',
];

/** Classes for random selection */
const CLASSES: ClassName[] = ['warrior', 'rogue', 'mage', 'cleric', 'ranger'];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Command handler type for executing bot commands */
export type CommandHandler = (session: BotSession, command: string) => Promise<void>;

export class BotManager {
  private config: BotSpawnConfig;
  private bots: Map<string, BotSession> = new Map();
  private nextBotId = 1;
  private executor: BotExecutor;
  private commandHandler?: CommandHandler;

  constructor(config: BotSpawnConfig) {
    this.config = config;
    this.executor = new BotExecutor();
  }

  /** Set command handler for executing bot commands */
  setCommandHandler(handler: CommandHandler): void {
    this.commandHandler = handler;
  }

  /** Get current configuration */
  getConfig(): BotSpawnConfig {
    return this.config;
  }

  /** Get current bot count */
  getBotCount(): number {
    return this.bots.size;
  }

  /** Get all bot sessions */
  getAllBotSessions(): BotSession[] {
    return Array.from(this.bots.values());
  }

  /** Get a specific bot session by ID */
  getBotSession(botId: string): BotSession | undefined {
    return this.bots.get(botId);
  }

  /** Remove a bot by ID */
  removeBot(botId: string): boolean {
    return this.bots.delete(botId);
  }

  /** Spawn a generic bot */
  spawnGenericBot(): BotSession {
    const id = `bot_generic_${this.nextBotId++}`;
    const name = `${pickRandom(BOT_NAMES)} #${this.nextBotId}`;
    const className = pickRandom(CLASSES);
    const level = randomInRange(this.config.levelRange[0], this.config.levelRange[1]);
    const startLocation = pickRandom(this.config.spawnLocations);

    const bot = createBotPlayer({
      id,
      name,
      className,
      startLocationId: startLocation,
      isNamed: false,
      level,
    });

    const session = createBotSession(bot);
    this.bots.set(id, session);

    return session;
  }

  /** Maintain population at configured levels */
  maintainPopulation(): void {
    // Spawn bots until we reach minimum
    while (this.bots.size < this.config.minPopulation) {
      this.spawnGenericBot();
    }
  }

  /** Run AI tick for all bots */
  async tick(_gameTime: number): Promise<void> {
    for (const session of this.bots.values()) {
      // Skip if in combat (combat tick handles this)
      if (session.player.inCombat) {
        continue;
      }

      // Check if bot should tick
      if (!this.executor.shouldTick(session)) {
        continue;
      }

      // Get next command
      const command = this.executor.getNextCommand(session);
      if (!command) {
        continue;
      }

      // Execute command if handler is set
      if (this.commandHandler) {
        try {
          await this.commandHandler(session, command);
        } catch (error) {
          // Log but don't crash
          console.error(`Bot ${session.id} command error:`, error);
        }
      }

      // Mark as ticked
      this.executor.markTicked(session);
    }
  }
}
```

**Step 3: Run tests**

Run: `cd packages/server && npx vitest run src/bots/bot-manager.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/server/src/bots/bot-manager.ts packages/server/src/bots/bot-manager.test.ts
git commit -m "$(cat <<'EOF'
feat(bots): add AI tick to BotManager

Update BotManager with:
- BotExecutor integration for command generation
- setCommandHandler() for game command execution
- tick() processes each bot's AI
- Error handling for failed commands

Includes 2 additional tests for AI ticking.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Add Bot Visibility in Who/Look Commands

**Files:**
- Modify: `packages/server/src/commands/handlers.ts` (look and who commands)

**Step 1: Read current handlers**

Read the handlers.ts file to understand the current `look` and `who` command implementations.

**Step 2: Update look command to show bots**

In the `look` handler, after showing players, add a section to show bots:

```typescript
// In handleLook, after showing other players:

// Show bots at this location
const botSessions = gameLoop.getBotManager()?.getAllBotSessions() || [];
const botsHere = botSessions.filter(bs => bs.player.locationId === player.locationId && bs.id !== session.id);

for (const botSession of botsHere) {
  const bot = botSession.player;
  const classIcon = CLASS_ICONS[bot.class] || '👤';
  parts.push(`${classIcon} **${bot.name}** (Lvl ${bot.level} ${bot.class}) is here.`);
}
```

**Step 3: Update who command to show bots**

In the `who` handler, include bots in the player list:

```typescript
// In handleWho:

// Get bot sessions
const botSessions = gameLoop.getBotManager()?.getAllBotSessions() || [];

// Combine real players and bots
const allPlayers = [
  ...sessions.map(s => ({ name: s.player.name, level: s.player.level, class: s.player.class, isBot: false })),
  ...botSessions.map(bs => ({ name: bs.player.name, level: bs.player.level, class: bs.player.class, isBot: true })),
];

// Sort by level descending
allPlayers.sort((a, b) => b.level - a.level);
```

**Step 4: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "$(cat <<'EOF'
feat(commands): show bots in who and look commands

Update commands to display bots:
- look: Shows bots present at location
- who: Includes bots in online player list
- Bots appear identical to real players

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Personality & Memory (Tasks 13-16)

### Task 13: Implement Personality Generator

**Files:**
- Create: `packages/server/src/bots/personality/generator.ts`
- Create: `packages/server/src/bots/personality/generator.test.ts`
- Create: `packages/server/src/bots/personality/index.ts`

Create a personality generator that creates unique, coherent personalities for generic bots. The generator should:
- Randomize base traits (bravery, greed, etc.)
- Pick coherent combinations (brave + aggressive, cautious + patient)
- Generate matching catchphrases
- Assign quirks occasionally

Include tests for trait ranges and coherence.

---

### Task 14: Implement Memory System

**Files:**
- Create: `packages/server/src/bots/memory/knowledge.ts`
- Create: `packages/server/src/bots/memory/knowledge.test.ts`
- Create: `packages/server/src/bots/memory/index.ts`

Create memory tracking functions:
- `learnLocation(bot, locationId)` - add location to known
- `recordCreatureEncounter(bot, creatureType, won)` - track creature difficulty
- `recordDeath(bot, killer, location)` - remember deaths
- `recordVictory(bot, creature, wasBoss)` - remember notable wins
- `addRecentEvent(bot, event)` - short-term memory

Include tests for each function.

---

### Task 15: Implement Relationship Tracking

**Files:**
- Create: `packages/server/src/bots/social/relationships.ts`
- Create: `packages/server/src/bots/social/relationships.test.ts`
- Create: `packages/server/src/bots/social/index.ts`

Create relationship functions:
- `getOpinion(bot, entityId)` - get opinion score
- `modifyOpinion(bot, entityId, change, event)` - change opinion with history
- `getRelationshipStatus(opinion)` - derive status from score
- `recordRelationshipEvent(bot, entityId, event)` - track event history

Include tests for opinion changes and status derivation.

---

### Task 16: Connect Personality to GOAP

**Files:**
- Modify: `packages/server/src/bots/goap/goals.ts`
- Modify: `packages/server/src/bots/goap/actions.ts`

Update goals and actions to use personality traits:
- Bravery affects survive/flee thresholds
- Greed affects get_richer priority
- Sociability affects socialize priority
- Patience affects rest cost
- Aggression affects attack preference

---

## Phase 4: Named Bots (Tasks 17-20)

### Task 17: Create Named Bot Definitions

**Files:**
- Create: `packages/server/src/bots/roster/named-bots.ts`
- Create: `packages/server/src/bots/roster/index.ts`

Define the 8 starter named bots:
1. Aldric the Brave (Warrior)
2. Sister Mira (Cleric)
3. Shadow (Rogue)
4. Thornwick (Mage)
5. Brutus (Warrior)
6. Elena Swift (Ranger)
7. Old Gareth (Cleric)
8. The Rat Catcher (Rogue)

Each with full personality, backstory, and aspirations.

---

### Task 18: Add Named Bot Loading to BotManager

**Files:**
- Modify: `packages/server/src/bots/bot-manager.ts`
- Create: `packages/server/src/bots/bot-manager-named.test.ts`

Update BotManager to:
- Load named bot definitions on init
- Spawn named bots up to namedBotCount
- Track named bots separately
- Handle named bot respawn queue

---

### Task 19: Implement Named Bot Persistence

**Files:**
- Create: `packages/server/src/db/repositories/BotRepository.ts`
- Create: `packages/server/src/db/repositories/BotRepository.test.ts`

Create database repository for named bots:
- Save named bot state on tick/logout
- Load named bot state on startup
- Track respawn times
- Store relationship history

---

### Task 20: Implement Faction System

**Files:**
- Create: `packages/server/src/bots/social/factions.ts`
- Create: `packages/server/src/bots/social/factions.test.ts`

Create faction system:
- Define faction structure
- Track faction membership
- Faction reputation effects
- Faction-based grouping preferences

---

## Phase 5: Lifecycle (Tasks 21-24)

### Task 21: Implement Generic Bot Spawning/Despawning

**Files:**
- Modify: `packages/server/src/bots/bot-manager.ts`

Add population management:
- Spawn bots when below minimum
- Despawn idle bots when above maximum
- Handle bot death (remove immediately)
- Replace dead bots with new spawns

---

### Task 22: Implement Named Bot Death Handling

**Files:**
- Modify: `packages/server/src/bots/bot-manager.ts`
- Create: `packages/server/src/bots/death-handler.ts`

Handle named bot death:
- Announce death to server
- Apply death penalties
- Add to respawn queue
- Apply memory effects (fear/revenge)

---

### Task 23: Implement Named Bot Respawn

**Files:**
- Modify: `packages/server/src/bots/bot-manager.ts`

Process respawn queue:
- Check respawn times each tick
- Respawn named bots after delay
- Announce return to server
- Restore with penalties applied

---

### Task 24: Add Death Announcements

**Files:**
- Create: `packages/server/src/bots/announcements.ts`

Create announcement system:
- Named bot death announcements
- Named bot respawn announcements
- Heroic death detection
- Server-wide broadcast

---

## Phase 6: Conversation (Tasks 25-26)

### Task 25: Implement Template Conversation System

**Files:**
- Create: `packages/server/src/bots/conversation/templates.ts`
- Create: `packages/server/src/bots/conversation/templates.test.ts`
- Create: `packages/server/src/bots/conversation/index.ts`

Create template-based conversations:
- Greeting templates by speech style
- Combat bark templates
- Trade response templates
- Idle chat templates
- Relationship-modified responses

---

### Task 26: Add Conversation Triggers

**Files:**
- Modify: `packages/server/src/bots/bot-executor.ts`

Add conversation triggers:
- Greet players entering room (30% chance)
- Battle cries on combat start
- Victory celebrations
- Call for help when low HP
- Thanks when healed

---

## Phase 7: Polish (Tasks 27-29)

### Task 27: Write Comprehensive Tests

**Files:**
- Create: `packages/server/src/bots/integration.test.ts`

Write integration tests:
- Full bot lifecycle (spawn → adventure → death)
- Named bot persistence
- GOAP decision making
- Relationship building
- Combat behavior

---

### Task 28: Balance and Tune Bot Behaviors

Review and adjust:
- Goal priorities
- Action costs
- Personality effects
- Tick intervals
- Population limits

---

### Task 29: Add Bot Admin Commands

**Files:**
- Modify: `packages/server/src/commands/admin-handlers.ts`

Add admin commands:
- `/botspawn [name]` - spawn a bot
- `/botkill [name]` - kill a bot
- `/botlist` - list all bots
- `/botinfo [name]` - show bot details
- `/botpopulation [min] [max]` - adjust limits

---

## Success Criteria

After completing all tasks:

- [ ] 20-30 bots active at any time
- [ ] Bots level up naturally over time
- [ ] Players can see bots in `who` and `look`
- [ ] Named bots become recognizable server characters
- [ ] Bots make intelligent combat decisions
- [ ] Bots have distinct personalities
- [ ] Named bots remember relationships
- [ ] Economy remains stable with bot participation
- [ ] Server performance remains acceptable

---

## Execution Notes

- Each task is independent and can be completed in one session
- Tests must pass before moving to next task
- Commit after each task
- Phase 1-2 are required for basic functionality
- Phase 3-7 add depth and polish
