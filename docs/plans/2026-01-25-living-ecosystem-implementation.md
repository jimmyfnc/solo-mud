# Living Ecosystem Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a creature-centric ecosystem where creatures hunt, flee, fight each other, and respawn — creating a living world independent of player actions.

**Architecture:** Extend the existing tick-based game loop with new phases: hunting detection, flee response, creature combat, corpse management, and respawn processing. Use Level-of-Detail (LOD) to optimize — full simulation near the player, instant resolution far away.

**Tech Stack:** TypeScript, Vitest for testing, existing Socket.io notification system

---

## Task 1: Add Creature Tier Type and Constants

**Files:**
- Modify: `packages/shared/src/types/world.ts`
- Create: `packages/shared/src/constants/ecosystem.ts`
- Modify: `packages/shared/src/constants/index.ts`

**Step 1: Add CreatureTier type to world.ts**

In `packages/shared/src/types/world.ts`, add after line 87 (after CreatureMobility):

```typescript
/** Creature ecological tier - determines respawn time and intimidation threshold */
export type CreatureTier = 'ambient' | 'common' | 'dangerous' | 'apex';
```

**Step 2: Add tier to CreatureTemplate interface**

In `packages/shared/src/types/world.ts`, modify the CreatureTemplate interface (around line 117) to add tier:

```typescript
/** Creature template for spawning */
export interface CreatureTemplate {
  id: string;
  name: string;
  behavior: CreatureBehavior;
  mobility: CreatureMobility;
  tier: CreatureTier;  // ADD THIS LINE
  biomes: (keyof BiomeWeights)[];
  minDepth: number;
  maxDepth: number;
  baseHp: number;
  baseLevel: number;
  spawnWeight: number;
  descriptions: {
    idle: string[];
    alert?: string[];
  };
}
```

**Step 3: Create ecosystem constants file**

Create `packages/shared/src/constants/ecosystem.ts`:

```typescript
/**
 * Ecosystem constants for creature behavior, respawn, and combat.
 */

import type { CreatureTier } from '../types/world';

/** Configuration per creature tier */
export const TIER_CONFIG: Record<CreatureTier, { respawnMs: number; intimidationGap: number }> = {
  ambient: { respawnMs: 120_000, intimidationGap: 3 },    // 2 minutes
  common: { respawnMs: 300_000, intimidationGap: 5 },     // 5 minutes
  dangerous: { respawnMs: 600_000, intimidationGap: 8 },  // 10 minutes
  apex: { respawnMs: 900_000, intimidationGap: 12 },      // 15 minutes
};

/** Corpse duration by cause of death */
export const CORPSE_DURATION = {
  creature_kill: 60_000,   // 1 minute - predator fed
  player_kill: 180_000,    // 3 minutes - player needs time to loot
  looted: 30_000,          // 30 seconds after looting
};

/** Hunting and fleeing constants */
export const HUNT_LEVEL_THRESHOLD = 2;  // Hunt creatures 2+ levels below
export const MAX_CHASE_DISTANCE = 3;    // Max rooms a predator will chase
export const CHASE_CHANCE = 0.5;        // 50% chance to chase fleeing prey

/** Combat constants */
export const EVENLY_MATCHED_THRESHOLD = 3;  // Less than 3 level difference = tick-based combat
export const TERRITORIAL_HOME_BONUS = 0.2;  // 20% power bonus when defending territory
```

**Step 4: Export ecosystem constants**

In `packages/shared/src/constants/index.ts`, add:

```typescript
export * from './ecosystem';
```

**Step 5: Run TypeScript to verify no errors**

Run: `cd packages/shared && pnpm tsc --noEmit`
Expected: No errors (will have errors until we update creature templates)

**Step 6: Commit**

```bash
git add packages/shared/src/types/world.ts packages/shared/src/constants/ecosystem.ts packages/shared/src/constants/index.ts
git commit -m "feat: add creature tier type and ecosystem constants"
```

---

## Task 2: Add Tier to Creature Templates

**Files:**
- Modify: `packages/shared/src/constants/creatures.ts`
- Test: `packages/server/src/world/creatures.test.ts`

**Step 1: Write test for tier existence**

In `packages/server/src/world/creatures.test.ts`, add test:

```typescript
import { describe, it, expect } from 'vitest';
import { CREATURE_TEMPLATES } from '@solo-mud/shared';

describe('creature templates', () => {
  it('all templates have a tier defined', () => {
    for (const [id, template] of Object.entries(CREATURE_TEMPLATES)) {
      expect(template.tier, `${id} missing tier`).toBeDefined();
      expect(['ambient', 'common', 'dangerous', 'apex']).toContain(template.tier);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test -- --run src/world/creatures.test.ts`
Expected: FAIL with "missing tier"

**Step 3: Add tier to all creature templates**

In `packages/shared/src/constants/creatures.ts`, add `tier` to each template:

```typescript
// Ambient tier (passive prey)
const SHEEP: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

const RABBIT: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

const DEER: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

const SQUIRREL: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

const GOAT: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

const FROG: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

const RAVEN: CreatureTemplate = {
  // ... existing fields ...
  tier: 'ambient',
};

// Common tier (basic threats)
const WOLF: CreatureTemplate = {
  // ... existing fields ...
  tier: 'common',
};

const GOBLIN: CreatureTemplate = {
  // ... existing fields ...
  tier: 'common',
};

const SNAKE: CreatureTemplate = {
  // ... existing fields ...
  tier: 'common',
};

// Dangerous tier (serious threats)
const SPIDER: CreatureTemplate = {
  // ... existing fields ...
  tier: 'dangerous',
};

const BANDIT: CreatureTemplate = {
  // ... existing fields ...
  tier: 'dangerous',
};

const BEAR: CreatureTemplate = {
  // ... existing fields ...
  tier: 'dangerous',
};

// Apex tier (boss-level)
const TROLL: CreatureTemplate = {
  // ... existing fields ...
  tier: 'apex',
};
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && pnpm test -- --run src/world/creatures.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared/src/constants/creatures.ts packages/server/src/world/creatures.test.ts
git commit -m "feat: add tier to all creature templates"
```

---

## Task 3: Add spawnLocationId to Creature Interface

**Files:**
- Modify: `packages/shared/src/types/world.ts`
- Modify: `packages/server/src/world/generate.ts`

**Step 1: Add spawnLocationId to Creature interface**

In `packages/shared/src/types/world.ts`, modify the Creature interface (around line 90):

```typescript
/** A creature in the world */
export interface Creature {
  id: CreatureId;
  templateId: string;
  name: string;
  level: number;

  // Type
  behavior: CreatureBehavior;
  mobility: CreatureMobility;

  // Stats
  currentHp: number;
  maxHp: number;

  // Position
  locationId: NodeId;
  homeLocationId: NodeId;
  spawnLocationId: NodeId;  // ADD THIS LINE - original spawn point for respawn

  // Combat state
  inCombat: boolean;
  targetId?: string;

  // Prose description
  description: string;
}
```

**Step 2: Update creature spawning in generate.ts**

In `packages/server/src/world/generate.ts`, find where creatures are created and add `spawnLocationId`:

```typescript
// When creating a creature instance, ensure spawnLocationId is set:
const creature: Creature = {
  id: creatureId,
  templateId: template.id,
  name: template.name,
  level: baseLevel,
  behavior: template.behavior,
  mobility: template.mobility,
  currentHp: hp,
  maxHp: hp,
  locationId: locationId,
  homeLocationId: locationId,
  spawnLocationId: locationId,  // ADD THIS LINE
  inCombat: false,
  description: idleDesc,
};
```

**Step 3: Run TypeScript to verify**

Run: `cd packages/server && pnpm tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/shared/src/types/world.ts packages/server/src/world/generate.ts
git commit -m "feat: add spawnLocationId to Creature for respawn tracking"
```

---

## Task 4: Add Corpse and RespawnEntry Types

**Files:**
- Modify: `packages/shared/src/types/world.ts`

**Step 1: Add Corpse interface**

In `packages/shared/src/types/world.ts`, add after the Creature interface:

```typescript
/** A corpse left behind when a creature dies */
export interface Corpse {
  id: string;
  creatureId: CreatureId;
  templateId: string;
  name: string;
  locationId: NodeId;
  createdAt: number;
  killedBy: 'creature' | 'player';
  looted: boolean;
  lootedAt?: number;
  loot: ItemId[];  // Items that can be taken from corpse
}

/** Entry in the respawn queue */
export interface RespawnEntry {
  templateId: string;
  spawnLocationId: NodeId;
  respawnAt: number;
  level: number;  // Remember the creature's level
}
```

**Step 2: Add corpses and respawnQueue to World interface**

In `packages/shared/src/types/world.ts`, modify the World interface:

```typescript
/** The complete world state */
export interface World {
  seed: string;
  startId: NodeId;
  goalId: NodeId;
  locations: Record<NodeId, Location>;
  exits: Record<EdgeId, Exit>;
  adjacency: Record<NodeId, EdgeId[]>;
  items: Record<ItemId, Item>;
  creatures: Record<CreatureId, Creature>;
  corpses: Record<string, Corpse>;      // ADD THIS LINE
  respawnQueue: RespawnEntry[];         // ADD THIS LINE
  time: GameTime;
  weather: WeatherState;
}
```

**Step 3: Update world generation to initialize new fields**

In `packages/server/src/world/generate.ts`, ensure the generated world initializes:

```typescript
const world: World = {
  // ... existing fields ...
  corpses: {},
  respawnQueue: [],
  // ... rest of fields ...
};
```

**Step 4: Run TypeScript to verify**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/shared/src/types/world.ts packages/server/src/world/generate.ts
git commit -m "feat: add Corpse and RespawnEntry types, add to World state"
```

---

## Task 5: Create Ecosystem Logic Module

**Files:**
- Create: `packages/server/src/game/ecosystem.ts`
- Create: `packages/server/src/game/ecosystem.test.ts`

**Step 1: Write failing test for isIntimidated**

Create `packages/server/src/game/ecosystem.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isIntimidated, canHunt, getDistanceFromPlayer } from './ecosystem';
import type { Creature, World, Player } from '@solo-mud/shared';

describe('ecosystem logic', () => {
  describe('isIntimidated', () => {
    it('ambient creature is intimidated by 3+ level gap', () => {
      const creature = { level: 2 } as Creature;
      const targetLevel = 5;
      expect(isIntimidated(creature, targetLevel, 'ambient')).toBe(true);
      expect(isIntimidated(creature, targetLevel - 1, 'ambient')).toBe(false);
    });

    it('common creature is intimidated by 5+ level gap', () => {
      const creature = { level: 5 } as Creature;
      expect(isIntimidated(creature, 10, 'common')).toBe(true);
      expect(isIntimidated(creature, 9, 'common')).toBe(false);
    });

    it('dangerous creature is intimidated by 8+ level gap', () => {
      const creature = { level: 6 } as Creature;
      expect(isIntimidated(creature, 14, 'dangerous')).toBe(true);
      expect(isIntimidated(creature, 13, 'dangerous')).toBe(false);
    });

    it('apex creature is intimidated by 12+ level gap', () => {
      const creature = { level: 7 } as Creature;
      expect(isIntimidated(creature, 19, 'apex')).toBe(true);
      expect(isIntimidated(creature, 18, 'apex')).toBe(false);
    });
  });

  describe('canHunt', () => {
    it('returns true when predator is 2+ levels above prey', () => {
      const predator = { level: 5, behavior: 'aggressive' } as Creature;
      const prey = { level: 3 } as Creature;
      expect(canHunt(predator, prey, 'common')).toBe(true);
    });

    it('returns false when level gap is less than 2', () => {
      const predator = { level: 5, behavior: 'aggressive' } as Creature;
      const prey = { level: 4 } as Creature;
      expect(canHunt(predator, prey, 'common')).toBe(false);
    });

    it('returns false for passive creatures', () => {
      const creature = { level: 10, behavior: 'passive' } as Creature;
      const prey = { level: 1 } as Creature;
      expect(canHunt(creature, prey, 'ambient')).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test -- --run src/game/ecosystem.test.ts`
Expected: FAIL with "cannot find module"

**Step 3: Implement ecosystem logic**

Create `packages/server/src/game/ecosystem.ts`:

```typescript
/**
 * Ecosystem logic - hunting, fleeing, intimidation, and combat resolution.
 */

import type { Creature, CreatureTier, World, NodeId } from '@solo-mud/shared';
import { TIER_CONFIG, HUNT_LEVEL_THRESHOLD } from '@solo-mud/shared';

/**
 * Check if a creature is intimidated by a target's level.
 */
export function isIntimidated(
  creature: Creature,
  targetLevel: number,
  tier: CreatureTier
): boolean {
  const gap = targetLevel - creature.level;
  return gap >= TIER_CONFIG[tier].intimidationGap;
}

/**
 * Check if a predator can hunt a prey creature.
 * Must be aggressive/territorial and 2+ levels above.
 */
export function canHunt(
  predator: Creature,
  prey: Creature,
  predatorTier: CreatureTier
): boolean {
  // Passive creatures don't hunt
  if (predator.behavior === 'passive') {
    return false;
  }

  // Must be 2+ levels above prey
  const levelGap = predator.level - prey.level;
  if (levelGap < HUNT_LEVEL_THRESHOLD) {
    return false;
  }

  // Check if predator would be intimidated by prey (shouldn't happen but safety check)
  if (isIntimidated(predator, prey.level, predatorTier)) {
    return false;
  }

  return true;
}

/**
 * Get the distance in rooms from the player to a location.
 * Uses BFS to find shortest path.
 */
export function getDistanceFromPlayer(
  world: World,
  playerLocationId: NodeId,
  targetLocationId: NodeId
): number {
  if (playerLocationId === targetLocationId) {
    return 0;
  }

  const visited = new Set<NodeId>();
  const queue: Array<{ id: NodeId; distance: number }> = [
    { id: playerLocationId, distance: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const exitIds = world.adjacency[current.id] ?? [];
    for (const exitId of exitIds) {
      const exit = world.exits[exitId];
      if (!exit) continue;

      if (exit.to === targetLocationId) {
        return current.distance + 1;
      }

      if (!visited.has(exit.to)) {
        queue.push({ id: exit.to, distance: current.distance + 1 });
      }
    }
  }

  return Infinity; // Not reachable
}

/**
 * Check if a location is within a creature's territory.
 * Territory = spawn location + adjacent locations.
 */
export function isInTerritory(
  world: World,
  creature: Creature,
  locationId: NodeId
): boolean {
  // Home is always territory
  if (creature.spawnLocationId === locationId) {
    return true;
  }

  // Check if locationId is adjacent to spawn location
  const exitIds = world.adjacency[creature.spawnLocationId] ?? [];
  for (const exitId of exitIds) {
    const exit = world.exits[exitId];
    if (exit && exit.to === locationId) {
      return true;
    }
  }

  return false;
}

/**
 * Get adjacent location IDs from a given location.
 */
export function getAdjacentLocations(world: World, locationId: NodeId): NodeId[] {
  const exitIds = world.adjacency[locationId] ?? [];
  const adjacentIds: NodeId[] = [];

  for (const exitId of exitIds) {
    const exit = world.exits[exitId];
    if (exit && exit.type !== 'locked') {
      adjacentIds.push(exit.to);
    }
  }

  return adjacentIds;
}

/**
 * Find prey creatures in adjacent locations.
 * Returns array of { locationId, creatures } for locations with valid prey.
 */
export function findPreyInAdjacentLocations(
  world: World,
  predator: Creature,
  predatorTier: CreatureTier
): Array<{ locationId: NodeId; creatures: Creature[] }> {
  const adjacent = getAdjacentLocations(world, predator.locationId);
  const results: Array<{ locationId: NodeId; creatures: Creature[] }> = [];

  for (const locId of adjacent) {
    const location = world.locations[locId];
    if (!location) continue;

    const prey = location.creatures
      .map((id) => world.creatures[id])
      .filter((c): c is Creature => {
        if (!c || c.currentHp <= 0 || c.inCombat) return false;
        return canHunt(predator, c, predatorTier);
      });

    if (prey.length > 0) {
      results.push({ locationId: locId, creatures: prey });
    }
  }

  return results;
}

/**
 * Calculate combat power for instant resolution.
 */
export function calculateCombatPower(
  creature: Creature,
  isDefendingTerritory: boolean
): number {
  let power = creature.level * creature.maxHp;

  if (isDefendingTerritory) {
    power *= 1 + 0.2; // 20% bonus for territorial defense
  }

  return power;
}

/**
 * Resolve instant combat between two creatures.
 * Returns the winner and damage dealt.
 */
export function resolveInstantCombat(
  attacker: Creature,
  defender: Creature,
  defenderInTerritory: boolean,
  rng: { next: () => number }
): { winner: Creature; loser: Creature } {
  const attackerPower = calculateCombatPower(attacker, false);
  const defenderPower = calculateCombatPower(defender, defenderInTerritory);

  // Add ±10% variance
  const attackerRoll = attackerPower * (0.9 + rng.next() * 0.2);
  const defenderRoll = defenderPower * (0.9 + rng.next() * 0.2);

  if (attackerRoll >= defenderRoll) {
    return { winner: attacker, loser: defender };
  } else {
    return { winner: defender, loser: attacker };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && pnpm test -- --run src/game/ecosystem.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/game/ecosystem.ts packages/server/src/game/ecosystem.test.ts
git commit -m "feat: add ecosystem logic module with hunting and intimidation"
```

---

## Task 6: Add Corpse Management Functions

**Files:**
- Modify: `packages/server/src/game/ecosystem.ts`
- Modify: `packages/server/src/game/ecosystem.test.ts`

**Step 1: Write failing test for createCorpse**

Add to `packages/server/src/game/ecosystem.test.ts`:

```typescript
import { createCorpse, shouldCorpseFade } from './ecosystem';
import type { Creature, Corpse } from '@solo-mud/shared';
import { CORPSE_DURATION } from '@solo-mud/shared';

describe('corpse management', () => {
  describe('createCorpse', () => {
    it('creates corpse with correct properties', () => {
      const creature: Creature = {
        id: 'creature_1',
        templateId: 'wolf',
        name: 'Wolf',
        level: 3,
        behavior: 'aggressive',
        mobility: 'roaming',
        currentHp: 0,
        maxHp: 35,
        locationId: 'loc_1',
        homeLocationId: 'loc_1',
        spawnLocationId: 'loc_1',
        inCombat: false,
        description: 'A wolf',
      };

      const corpse = createCorpse(creature, 'player', ['item_1']);

      expect(corpse.creatureId).toBe('creature_1');
      expect(corpse.templateId).toBe('wolf');
      expect(corpse.name).toBe('Wolf');
      expect(corpse.locationId).toBe('loc_1');
      expect(corpse.killedBy).toBe('player');
      expect(corpse.looted).toBe(false);
      expect(corpse.loot).toEqual(['item_1']);
    });
  });

  describe('shouldCorpseFade', () => {
    it('creature-killed corpse fades after 60s', () => {
      const corpse: Corpse = {
        id: 'corpse_1',
        creatureId: 'c1',
        templateId: 'deer',
        name: 'Deer',
        locationId: 'loc_1',
        createdAt: Date.now() - 70000, // 70 seconds ago
        killedBy: 'creature',
        looted: false,
        loot: [],
      };
      expect(shouldCorpseFade(corpse)).toBe(true);
    });

    it('player-killed corpse lasts 3 minutes', () => {
      const corpse: Corpse = {
        id: 'corpse_1',
        creatureId: 'c1',
        templateId: 'wolf',
        name: 'Wolf',
        locationId: 'loc_1',
        createdAt: Date.now() - 120000, // 2 minutes ago
        killedBy: 'player',
        looted: false,
        loot: [],
      };
      expect(shouldCorpseFade(corpse)).toBe(false);

      const oldCorpse: Corpse = {
        ...corpse,
        createdAt: Date.now() - 200000, // 3+ minutes ago
      };
      expect(shouldCorpseFade(oldCorpse)).toBe(true);
    });

    it('looted corpse fades after 30s from loot time', () => {
      const corpse: Corpse = {
        id: 'corpse_1',
        creatureId: 'c1',
        templateId: 'wolf',
        name: 'Wolf',
        locationId: 'loc_1',
        createdAt: Date.now() - 60000,
        killedBy: 'player',
        looted: true,
        lootedAt: Date.now() - 35000, // looted 35s ago
        loot: [],
      };
      expect(shouldCorpseFade(corpse)).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test -- --run src/game/ecosystem.test.ts`
Expected: FAIL

**Step 3: Implement corpse functions**

Add to `packages/server/src/game/ecosystem.ts`:

```typescript
import type { Corpse, ItemId } from '@solo-mud/shared';
import { CORPSE_DURATION } from '@solo-mud/shared';

/**
 * Create a corpse from a dead creature.
 */
export function createCorpse(
  creature: Creature,
  killedBy: 'creature' | 'player',
  loot: ItemId[]
): Corpse {
  return {
    id: `corpse_${creature.id}_${Date.now()}`,
    creatureId: creature.id,
    templateId: creature.templateId,
    name: creature.name,
    locationId: creature.locationId,
    createdAt: Date.now(),
    killedBy,
    looted: false,
    loot,
  };
}

/**
 * Check if a corpse should fade away.
 */
export function shouldCorpseFade(corpse: Corpse): boolean {
  const now = Date.now();

  // If looted, use shorter duration from loot time
  if (corpse.looted && corpse.lootedAt) {
    return now - corpse.lootedAt >= CORPSE_DURATION.looted;
  }

  // Otherwise use duration based on who killed it
  const duration = corpse.killedBy === 'player'
    ? CORPSE_DURATION.player_kill
    : CORPSE_DURATION.creature_kill;

  return now - corpse.createdAt >= duration;
}

/**
 * Queue a creature for respawn.
 */
export function queueRespawn(
  creature: Creature,
  tier: CreatureTier
): RespawnEntry {
  return {
    templateId: creature.templateId,
    spawnLocationId: creature.spawnLocationId,
    respawnAt: Date.now() + TIER_CONFIG[tier].respawnMs,
    level: creature.level,
  };
}
```

Don't forget to import `RespawnEntry` at the top.

**Step 4: Run test to verify it passes**

Run: `cd packages/server && pnpm test -- --run src/game/ecosystem.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/game/ecosystem.ts packages/server/src/game/ecosystem.test.ts
git commit -m "feat: add corpse creation and fade logic"
```

---

## Task 7: Implement Creature Death Handler

**Files:**
- Modify: `packages/server/src/game/ecosystem.ts`
- Modify: `packages/server/src/game/ecosystem.test.ts`

**Step 1: Write test for handleCreatureDeath**

Add to `packages/server/src/game/ecosystem.test.ts`:

```typescript
import { handleCreatureDeath } from './ecosystem';
import type { World, Creature, Location } from '@solo-mud/shared';

describe('handleCreatureDeath', () => {
  it('removes creature from location and world, creates corpse, queues respawn', () => {
    const creature: Creature = {
      id: 'wolf_1',
      templateId: 'wolf',
      name: 'Wolf',
      level: 3,
      behavior: 'aggressive',
      mobility: 'roaming',
      currentHp: 0,
      maxHp: 35,
      locationId: 'loc_1',
      homeLocationId: 'loc_1',
      spawnLocationId: 'loc_1',
      inCombat: false,
      description: 'A wolf',
    };

    const location: Location = {
      id: 'loc_1',
      name: 'Forest',
      biome: { forest: 1 },
      props: [],
      items: [],
      enemies: [],
      creatures: ['wolf_1'],
      visitState: { visitCount: 0 },
      depth: 2,
    };

    const world: World = {
      seed: 'test',
      startId: 'loc_1',
      goalId: 'loc_2',
      locations: { loc_1: location },
      exits: {},
      adjacency: {},
      items: {},
      creatures: { wolf_1: creature },
      corpses: {},
      respawnQueue: [],
      time: { totalMinutes: 0, timeOfDay: 'morning', day: 1 },
      weather: { type: 'clear', intensity: 0.5 },
    };

    const result = handleCreatureDeath(world, creature, 'player', 'common');

    // Creature removed from location
    expect(location.creatures).not.toContain('wolf_1');

    // Creature removed from world
    expect(world.creatures['wolf_1']).toBeUndefined();

    // Corpse created
    expect(Object.keys(world.corpses).length).toBe(1);
    const corpse = Object.values(world.corpses)[0]!;
    expect(corpse.name).toBe('Wolf');
    expect(corpse.killedBy).toBe('player');

    // Respawn queued
    expect(world.respawnQueue.length).toBe(1);
    expect(world.respawnQueue[0]!.templateId).toBe('wolf');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/server && pnpm test -- --run src/game/ecosystem.test.ts`
Expected: FAIL

**Step 3: Implement handleCreatureDeath**

Add to `packages/server/src/game/ecosystem.ts`:

```typescript
/**
 * Handle a creature's death - remove from world, create corpse, queue respawn.
 */
export function handleCreatureDeath(
  world: World,
  creature: Creature,
  killedBy: 'creature' | 'player',
  tier: CreatureTier,
  loot: ItemId[] = []
): Corpse {
  // Remove from location
  const location = world.locations[creature.locationId];
  if (location) {
    const idx = location.creatures.indexOf(creature.id);
    if (idx !== -1) {
      location.creatures.splice(idx, 1);
    }
  }

  // Remove from world creatures
  delete world.creatures[creature.id];

  // Create corpse
  // If killed by creature, reduce loot (predator ate it)
  const actualLoot = killedBy === 'creature' ? [] : loot;
  const corpse = createCorpse(creature, killedBy, actualLoot);
  world.corpses[corpse.id] = corpse;

  // Queue respawn
  const respawnEntry = queueRespawn(creature, tier);
  world.respawnQueue.push(respawnEntry);

  return corpse;
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/server && pnpm test -- --run src/game/ecosystem.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/game/ecosystem.ts packages/server/src/game/ecosystem.test.ts
git commit -m "feat: add handleCreatureDeath to manage death lifecycle"
```

---

## Task 8: Add Loot Command Handler

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Add loot handler to registry**

In `packages/server/src/commands/handlers.ts`, add to the handlers object:

```typescript
const handlers: Record<string, CommandHandler> = {
  // ... existing handlers ...
  loot: handleLoot,
};
```

**Step 2: Implement handleLoot function**

Add to `packages/server/src/commands/handlers.ts`:

```typescript
/**
 * Handle the "loot" command - examine a corpse for items.
 */
function handleLoot(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot loot anything here.', style: 'error' }],
    };
  }

  // Find corpses in this location
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );

  if (corpses.length === 0) {
    return {
      output: [{ text: 'There are no corpses here to loot.', style: 'error' }],
    };
  }

  // If no target specified, use the only corpse or prompt
  let targetCorpse: Corpse | undefined;

  if (!parsed.target) {
    if (corpses.length === 1) {
      targetCorpse = corpses[0];
    } else {
      const names = corpses.map((c) => c.name).join(', ');
      return {
        output: [
          { text: 'Multiple corpses here. Specify which one:', style: 'system' },
          { text: `  ${names}`, style: 'normal' },
        ],
      };
    }
  } else {
    const targetLower = parsed.target.toLowerCase();
    targetCorpse = corpses.find((c) =>
      c.name.toLowerCase().includes(targetLower)
    );
  }

  if (!targetCorpse) {
    return {
      output: [{ text: `You don't see a "${parsed.target}" corpse here.`, style: 'error' }],
    };
  }

  // Show loot
  if (targetCorpse.loot.length === 0) {
    return {
      output: [{ text: `The ${targetCorpse.name}'s corpse has nothing left of value.`, style: 'normal' }],
    };
  }

  const output: OutputLine[] = [
    { text: `The ${targetCorpse.name}'s corpse contains:`, style: 'system' },
  ];

  targetCorpse.loot.forEach((itemId, index) => {
    const item = world.items[itemId];
    const name = item?.name ?? 'Unknown item';
    output.push({ text: `  ${index + 1}. ${name}`, style: 'normal' });
  });

  return { output };
}
```

Don't forget to import `Corpse` type at the top of the file.

**Step 3: Update help command**

In the `handleHelp` function, add loot command:

```typescript
{ text: '  loot [corpse] - Examine a corpse for loot', style: 'normal' },
```

**Step 4: Run TypeScript to verify**

Run: `cd packages/server && pnpm tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "feat: add loot command to examine corpses"
```

---

## Task 9: Extend Take Command for Corpse Looting

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`
- Modify: `packages/server/src/commands/parser.ts`

**Step 1: Update parser to handle "from" syntax**

In `packages/server/src/commands/parser.ts`, update the parseCommand function to capture source:

```typescript
export interface ParsedCommand {
  command: string;
  target?: string;
  destination?: string;  // for "go X to Y"
  source?: string;       // ADD THIS - for "take X from Y"
}

export function parseCommand(input: string): ParsedCommand {
  // ... existing parsing logic ...

  // Handle "take X from Y" syntax
  const fromMatch = remaining.match(/^(.+?)\s+from\s+(.+)$/i);
  if (fromMatch && (command === 'take' || command === 'get')) {
    return {
      command,
      target: fromMatch[1]!.trim(),
      source: fromMatch[2]!.trim(),
    };
  }

  // ... rest of existing logic ...
}
```

**Step 2: Update handleTake to support corpse looting**

Modify `handleTake` in `packages/server/src/commands/handlers.ts`:

```typescript
function handleTake(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Take what?', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot take anything here.', style: 'error' }],
    };
  }

  // Check if taking from a corpse
  if (parsed.source) {
    return handleTakeFromCorpse(ctx, location);
  }

  // ... existing room item logic ...
}

/**
 * Handle taking items from a corpse.
 */
function handleTakeFromCorpse(ctx: CommandContext, location: Location): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;
  const sourceLower = parsed.source!.toLowerCase();
  const targetLower = parsed.target!.toLowerCase();

  // Find the corpse
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );

  let corpse = corpses.find((c) =>
    c.name.toLowerCase().includes(sourceLower) ||
    sourceLower === 'corpse'
  );

  if (!corpse) {
    return {
      output: [{ text: `You don't see a "${parsed.source}" to take from.`, style: 'error' }],
    };
  }

  if (corpse.loot.length === 0) {
    return {
      output: [{ text: `The ${corpse.name}'s corpse has nothing left.`, style: 'normal' }],
    };
  }

  // Handle "take all from corpse"
  if (targetLower === 'all') {
    const taken: string[] = [];
    for (const itemId of [...corpse.loot]) {
      const item = world.items[itemId];
      if (item && player.inventory.length < player.inventorySlots) {
        player.inventory.push({ itemId, quantity: 1 });
        taken.push(item.name);
        const idx = corpse.loot.indexOf(itemId);
        if (idx !== -1) corpse.loot.splice(idx, 1);
      }
    }

    if (taken.length === 0) {
      return {
        output: [{ text: 'Your inventory is full.', style: 'error' }],
      };
    }

    // Mark corpse as looted
    if (corpse.loot.length === 0) {
      corpse.looted = true;
      corpse.lootedAt = Date.now();
    }

    return {
      output: [{ text: `You take ${taken.join(' and ')}.`, style: 'success' }],
      updatePlayer: true,
    };
  }

  // Handle "take 1 from corpse" (by number)
  const numMatch = targetLower.match(/^(\d+)$/);
  if (numMatch) {
    const index = parseInt(numMatch[1]!, 10) - 1;
    if (index < 0 || index >= corpse.loot.length) {
      return {
        output: [{ text: `Invalid number. Use 1-${corpse.loot.length}.`, style: 'error' }],
      };
    }

    const itemId = corpse.loot[index]!;
    const item = world.items[itemId];

    if (player.inventory.length >= player.inventorySlots) {
      return {
        output: [{ text: 'Your inventory is full.', style: 'error' }],
      };
    }

    player.inventory.push({ itemId, quantity: 1 });
    corpse.loot.splice(index, 1);

    if (corpse.loot.length === 0) {
      corpse.looted = true;
      corpse.lootedAt = Date.now();
    }

    return {
      output: [{ text: `You take the ${item?.name ?? 'item'}.`, style: 'success' }],
      updatePlayer: true,
    };
  }

  // Handle "take dagger from corpse" (by name)
  const itemIndex = corpse.loot.findIndex((id) => {
    const item = world.items[id];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (itemIndex === -1) {
    return {
      output: [{ text: `The corpse doesn't have a "${parsed.target}".`, style: 'error' }],
    };
  }

  if (player.inventory.length >= player.inventorySlots) {
    return {
      output: [{ text: 'Your inventory is full.', style: 'error' }],
    };
  }

  const itemId = corpse.loot[itemIndex]!;
  const item = world.items[itemId];

  player.inventory.push({ itemId, quantity: 1 });
  corpse.loot.splice(itemIndex, 1);

  if (corpse.loot.length === 0) {
    corpse.looted = true;
    corpse.lootedAt = Date.now();
  }

  return {
    output: [{ text: `You take the ${item?.name ?? 'item'}.`, style: 'success' }],
    updatePlayer: true,
  };
}
```

**Step 3: Run TypeScript to verify**

Run: `cd packages/server && pnpm tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/server/src/commands/handlers.ts packages/server/src/commands/parser.ts
git commit -m "feat: extend take command to support looting from corpses"
```

---

## Task 10: Integrate Ecosystem into Game Loop

**Files:**
- Modify: `packages/server/src/game/game-loop.ts`

**Step 1: Import ecosystem functions**

At the top of `game-loop.ts`:

```typescript
import {
  isIntimidated,
  canHunt,
  getDistanceFromPlayer,
  isInTerritory,
  findPreyInAdjacentLocations,
  resolveInstantCombat,
  handleCreatureDeath,
  shouldCorpseFade,
} from './ecosystem';
import { CREATURE_TEMPLATES, createRng, TIER_CONFIG, EVENLY_MATCHED_THRESHOLD } from '@solo-mud/shared';
```

**Step 2: Add processCorpses to worldTick**

Modify the `worldTick` function:

```typescript
function worldTick(): void {
  const sessions = sessionManager.getAllSessions();

  for (const session of sessions) {
    processCorpses(session);
    processRespawns(session);
    processHunting(session);
    processCreatureMovement(session);
  }
}
```

**Step 3: Implement processCorpses**

```typescript
/**
 * Process corpse decay - remove faded corpses and notify players.
 */
function processCorpses(session: GameSession): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  const toRemove: string[] = [];

  for (const [id, corpse] of Object.entries(world.corpses)) {
    if (shouldCorpseFade(corpse)) {
      toRemove.push(id);

      // Notify player if in same room
      if (socket && corpse.locationId === player.locationId) {
        sendNotification(socket, {
          text: `The ${corpse.name}'s remains are picked clean by scavengers.`,
          style: 'normal',
        });
      }
    }
  }

  for (const id of toRemove) {
    delete world.corpses[id];
  }
}
```

**Step 4: Implement processRespawns**

```typescript
/**
 * Process respawn queue - spawn creatures whose timer has elapsed.
 */
function processRespawns(session: GameSession): void {
  const { world, player } = session;
  const now = Date.now();
  const socket = getSocketForSession(session);

  const toProcess: number[] = [];

  for (let i = 0; i < world.respawnQueue.length; i++) {
    const entry = world.respawnQueue[i]!;
    if (now >= entry.respawnAt) {
      // Delay if player is at spawn location
      if (entry.spawnLocationId === player.locationId) {
        entry.respawnAt = now + WORLD_TICK_INTERVAL;
        continue;
      }

      toProcess.push(i);
    }
  }

  // Process in reverse order to safely splice
  for (let i = toProcess.length - 1; i >= 0; i--) {
    const idx = toProcess[i]!;
    const entry = world.respawnQueue[idx]!;

    const template = CREATURE_TEMPLATES[entry.templateId];
    if (!template) {
      world.respawnQueue.splice(idx, 1);
      continue;
    }

    // Create new creature
    const creatureId = `creature_${entry.templateId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hp = template.baseHp + (entry.level - template.baseLevel) * 5;
    const rng = createRng(`respawn-${creatureId}`);
    const idleDesc = template.descriptions.idle[Math.floor(rng.next() * template.descriptions.idle.length)] ?? '';

    const creature: Creature = {
      id: creatureId,
      templateId: entry.templateId,
      name: template.name,
      level: entry.level,
      behavior: template.behavior,
      mobility: template.mobility,
      currentHp: hp,
      maxHp: hp,
      locationId: entry.spawnLocationId,
      homeLocationId: entry.spawnLocationId,
      spawnLocationId: entry.spawnLocationId,
      inCombat: false,
      description: idleDesc,
    };

    world.creatures[creatureId] = creature;

    const location = world.locations[entry.spawnLocationId];
    if (location) {
      location.creatures.push(creatureId);
    }

    world.respawnQueue.splice(idx, 1);

    // Notify player if in adjacent room (ambient hint)
    if (socket) {
      const distance = getDistanceFromPlayer(world, player.locationId, entry.spawnLocationId);
      if (distance === 1) {
        sendNotification(socket, {
          text: `You sense movement nearby.`,
          style: 'normal',
        });
      }
    }
  }
}
```

**Step 5: Implement processHunting**

```typescript
/**
 * Process active hunting - predators seek prey in adjacent locations.
 */
function processHunting(session: GameSession): void {
  const { world, player } = session;
  const rng = createRng(`hunt-${Date.now()}`);
  const socket = getSocketForSession(session);

  // Get all predators (aggressive/territorial, alive, not in combat)
  const predators = Object.values(world.creatures).filter(
    (c) =>
      c.behavior !== 'passive' &&
      c.currentHp > 0 &&
      !c.inCombat &&
      c.mobility === 'roaming'
  );

  for (const predator of predators) {
    const template = CREATURE_TEMPLATES[predator.templateId];
    if (!template) continue;

    const preyLocations = findPreyInAdjacentLocations(world, predator, template.tier);

    if (preyLocations.length === 0) continue;

    // Pick closest level match (easiest prey)
    let bestPrey: { locationId: string; creature: Creature } | null = null;
    let bestLevelDiff = Infinity;

    for (const { locationId, creatures } of preyLocations) {
      for (const prey of creatures) {
        const diff = predator.level - prey.level;
        if (diff >= 2 && diff < bestLevelDiff) {
          bestLevelDiff = diff;
          bestPrey = { locationId, creature: prey };
        }
      }
    }

    if (!bestPrey) continue;

    // Move predator to prey location
    const oldLocationId = predator.locationId;
    moveCreature(session, predator, oldLocationId, bestPrey.locationId);

    // Trigger flee/combat after move (handled in moveCreature or separate function)
  }
}
```

**Step 6: Run TypeScript to verify**

Run: `cd packages/server && pnpm tsc --noEmit`
Expected: No errors (may need to fix some imports)

**Step 7: Commit**

```bash
git add packages/server/src/game/game-loop.ts
git commit -m "feat: integrate ecosystem into game loop with respawn and hunting"
```

---

## Task 11: Add Flee Response and Creature Combat

**Files:**
- Modify: `packages/server/src/game/game-loop.ts`

**Step 1: Modify moveCreature to trigger flee response**

Update the `moveCreature` function to trigger flee when predator arrives:

```typescript
function moveCreature(
  session: GameSession,
  creature: Creature,
  fromLocationId: string,
  toLocationId: string
): void {
  const { world, player } = session;

  // ... existing movement code ...

  // After creature arrives, check for flee response
  if (creature.behavior !== 'passive') {
    triggerFleeResponse(session, creature, toLocationId);
  }

  // Aggressive creatures attack player on sight (existing code)
  // BUT check intimidation first
  if (player.locationId === toLocationId) {
    const template = CREATURE_TEMPLATES[creature.templateId];
    if (template && creature.behavior === 'aggressive') {
      if (!isIntimidated(creature, player.level, template.tier) && !player.inCombat) {
        initiateCreatureAggro(session, creature, socket);
      }
    }
  }
}
```

**Step 2: Implement triggerFleeResponse**

```typescript
/**
 * When a predator arrives at a location, prey may flee.
 */
function triggerFleeResponse(
  session: GameSession,
  predator: Creature,
  locationId: string
): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);
  const location = world.locations[locationId];
  if (!location) return;

  const template = CREATURE_TEMPLATES[predator.templateId];
  if (!template) return;

  // Find prey that should flee
  const preyToFlee = location.creatures
    .map((id) => world.creatures[id])
    .filter((c): c is Creature => {
      if (!c || c.id === predator.id || c.currentHp <= 0 || c.inCombat) return false;
      return c.behavior === 'passive' && canHunt(predator, c, template.tier);
    });

  for (const prey of preyToFlee) {
    // Prey flees to random adjacent room
    const fleeOptions = getAdjacentLocations(world, locationId);
    if (fleeOptions.length === 0) {
      // Trapped - combat begins
      initiateCreatureCombat(session, predator, prey);
      continue;
    }

    const rng = createRng(`flee-${prey.id}-${Date.now()}`);
    const fleeToId = fleeOptions[Math.floor(rng.next() * fleeOptions.length)]!;

    // Notify player
    if (socket && player.locationId === locationId) {
      sendNotification(socket, {
        text: `The ${prey.name} bolts away in fear!`,
        style: 'normal',
      });
    }

    // Move prey
    moveCreatureInternal(world, prey, locationId, fleeToId);

    // 50% chance predator gives chase
    if (rng.next() < CHASE_CHANCE) {
      // Queue chase (could be recursive, but limit depth)
      // For simplicity, just move predator too
      moveCreatureInternal(world, predator, locationId, fleeToId);

      if (socket && player.locationId === locationId) {
        sendNotification(socket, {
          text: `The ${predator.name} gives chase!`,
          style: 'combat',
        });
      }

      // After chase, trigger another flee check (with depth limit)
      // This is handled by the next tick for simplicity
    }
  }
}

/**
 * Internal creature movement without notifications (for chase sequences).
 */
function moveCreatureInternal(
  world: World,
  creature: Creature,
  fromId: string,
  toId: string
): void {
  const fromLocation = world.locations[fromId];
  const toLocation = world.locations[toId];

  if (!fromLocation || !toLocation) return;

  const idx = fromLocation.creatures.indexOf(creature.id);
  if (idx !== -1) fromLocation.creatures.splice(idx, 1);

  toLocation.creatures.push(creature.id);
  creature.locationId = toId;
}
```

**Step 3: Implement initiateCreatureCombat**

```typescript
/**
 * Initiate combat between two creatures.
 */
function initiateCreatureCombat(
  session: GameSession,
  attacker: Creature,
  defender: Creature
): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  const distance = getDistanceFromPlayer(world, player.locationId, attacker.locationId);
  const attackerTemplate = CREATURE_TEMPLATES[attacker.templateId];
  const defenderTemplate = CREATURE_TEMPLATES[defender.templateId];

  if (!attackerTemplate || !defenderTemplate) return;

  const levelDiff = Math.abs(attacker.level - defender.level);
  const isEvenlyMatched = levelDiff < EVENLY_MATCHED_THRESHOLD;

  // Determine if defender is in territory
  const defenderInTerritory =
    defender.behavior === 'territorial' &&
    isInTerritory(world, defender, defender.locationId);

  if (distance === 0 && isEvenlyMatched) {
    // Same room, evenly matched - tick-based combat
    attacker.inCombat = true;
    attacker.targetId = defender.id;
    defender.inCombat = true;
    defender.targetId = attacker.id;

    if (socket) {
      sendNotification(socket, {
        text: `The ${attacker.name} attacks the ${defender.name}!`,
        style: 'combat',
      });
    }
    // Combat will resolve in combatTick
  } else {
    // Instant resolution
    const rng = createRng(`combat-${attacker.id}-${defender.id}-${Date.now()}`);
    const { winner, loser } = resolveInstantCombat(
      attacker,
      defender,
      defenderInTerritory,
      rng
    );

    // Kill the loser
    loser.currentHp = 0;
    const loserTemplate = CREATURE_TEMPLATES[loser.templateId];
    handleCreatureDeath(world, loser, 'creature', loserTemplate?.tier ?? 'common');

    // Notify based on distance
    if (socket) {
      if (distance === 0) {
        sendNotification(socket, {
          text: `The ${winner.name} kills the ${loser.name}!`,
          style: 'combat',
        });
      } else if (distance === 1) {
        sendNotification(socket, {
          text: `You hear sounds of a brief struggle nearby.`,
          style: 'normal',
        });
      } else if (distance <= 3) {
        sendNotification(socket, {
          text: `A distant cry echoes through the area.`,
          style: 'normal',
        });
      }
    }
  }
}
```

**Step 4: Update combatTick for creature-vs-creature**

Modify `combatTick` to handle creature-vs-creature combat:

```typescript
function combatTick(): void {
  const sessions = sessionManager.getAllSessions();

  for (const session of sessions) {
    processPlayerCombat(session);
    processCreatureVsCreatureCombat(session);
  }
}

// Rename existing processCombat to processPlayerCombat
function processPlayerCombat(session: GameSession): void {
  // ... existing player combat code ...
}

/**
 * Process creature-vs-creature combat for tick-based fights.
 */
function processCreatureVsCreatureCombat(session: GameSession): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  // Find creatures in combat with other creatures (not player)
  const creaturesInCombat = Object.values(world.creatures).filter(
    (c) => c.inCombat && c.targetId && !c.targetId.startsWith('player')
  );

  const processed = new Set<string>();

  for (const attacker of creaturesInCombat) {
    if (processed.has(attacker.id)) continue;

    const defender = world.creatures[attacker.targetId!];
    if (!defender || defender.currentHp <= 0) {
      attacker.inCombat = false;
      attacker.targetId = undefined;
      continue;
    }

    processed.add(attacker.id);
    processed.add(defender.id);

    const rng = createRng(`cvc-tick-${Date.now()}-${attacker.id}`);

    // Both creatures attack each other
    const attackerDmg = Math.max(1, attacker.level + Math.floor(rng.next() * attacker.level));
    const defenderDmg = Math.max(1, defender.level + Math.floor(rng.next() * defender.level));

    defender.currentHp -= attackerDmg;
    attacker.currentHp -= defenderDmg;

    // Notify if player is watching
    const distance = getDistanceFromPlayer(world, player.locationId, attacker.locationId);
    if (socket && distance === 0) {
      sendNotification(socket, {
        text: `The ${attacker.name} and ${defender.name} exchange blows!`,
        style: 'combat',
      });
    }

    // Check for deaths
    if (defender.currentHp <= 0) {
      const defenderTemplate = CREATURE_TEMPLATES[defender.templateId];
      handleCreatureDeath(world, defender, 'creature', defenderTemplate?.tier ?? 'common');
      attacker.inCombat = false;
      attacker.targetId = undefined;

      if (socket && distance === 0) {
        sendNotification(socket, {
          text: `The ${attacker.name} kills the ${defender.name}!`,
          style: 'combat',
        });
      }
    }

    if (attacker.currentHp <= 0) {
      const attackerTemplate = CREATURE_TEMPLATES[attacker.templateId];
      handleCreatureDeath(world, attacker, 'creature', attackerTemplate?.tier ?? 'common');
      if (defender.currentHp > 0) {
        defender.inCombat = false;
        defender.targetId = undefined;
      }

      if (socket && distance === 0) {
        sendNotification(socket, {
          text: `The ${defender.name} kills the ${attacker.name}!`,
          style: 'combat',
        });
      }
    }
  }
}
```

**Step 5: Run TypeScript to verify**

Run: `cd packages/server && pnpm tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add packages/server/src/game/game-loop.ts
git commit -m "feat: add flee response and creature-vs-creature combat"
```

---

## Task 12: Update Player Attack to Use Corpse System

**Files:**
- Modify: `packages/server/src/commands/handlers.ts`

**Step 1: Update handleAttack to create corpses**

In `handleAttack`, when a creature dies, use the corpse system:

```typescript
// In handleAttack, replace the death handling section:

if (targetCreature.currentHp <= 0) {
  output.push({
    text: `The ${targetCreature.name} collapses and dies!`,
    style: 'success',
  });

  // Get template for tier
  const template = CREATURE_TEMPLATES[targetCreature.templateId];
  const tier = template?.tier ?? 'common';

  // Generate loot (placeholder - use existing loot system)
  const loot: string[] = [];
  // TODO: Generate actual loot based on creature template

  // Use ecosystem death handler
  const { handleCreatureDeath } = await import('../game/ecosystem');
  handleCreatureDeath(world, targetCreature, 'player', tier, loot);

  // Calculate rewards
  const xpReward = targetCreature.level * 10;
  const goldReward = targetCreature.behavior === 'passive' ? 0 : Math.floor(targetCreature.level * (2 + rng.next() * 3));

  player.xp += xpReward;
  player.gold += goldReward;

  output.push({
    text: `You gain ${xpReward} XP${goldReward > 0 ? ` and ${goldReward} gold` : ''}.`,
    style: 'success',
  });

  // Note about looting
  output.push({
    text: `Use "loot ${targetCreature.name.toLowerCase()}" to check the corpse.`,
    style: 'system',
  });

  // Check for level up
  if (player.xp >= player.xpToNextLevel) {
    player.level++;
    player.xpToNextLevel = player.level * 100 + (player.level - 1) * 50;
    output.push({
      text: `LEVEL UP! You are now level ${player.level}!`,
      style: 'success',
    });
  }

  // Mark player not in combat
  player.inCombat = false;
  player.targetId = undefined;

  return { output, updateRoom: true, updatePlayer: true };
}
```

**Step 2: Add import at top of handlers.ts**

```typescript
import { handleCreatureDeath } from '../game/ecosystem';
import { CREATURE_TEMPLATES } from '@solo-mud/shared';
```

**Step 3: Run TypeScript to verify**

Run: `cd packages/server && pnpm tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/server/src/commands/handlers.ts
git commit -m "feat: update player attack to use corpse system"
```

---

## Task 13: Add Integration Tests

**Files:**
- Modify: `packages/server/src/integration/game-loop.test.ts`

**Step 1: Add ecosystem integration tests**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// ... existing imports ...

describe('ecosystem integration', () => {
  it('creature respawns after tier-based delay', async () => {
    // Create world with a creature
    // Kill creature
    // Fast-forward time
    // Verify creature respawns
  });

  it('predator hunts prey in adjacent room', async () => {
    // Create world with wolf and rabbit in adjacent rooms
    // Run worldTick
    // Verify wolf moved toward rabbit
  });

  it('prey flees when predator arrives', async () => {
    // Create world with wolf and rabbit in same room
    // Trigger flee response
    // Verify rabbit moved away
  });

  it('corpse fades after duration', async () => {
    // Create corpse
    // Fast-forward time
    // Run processCorpses
    // Verify corpse removed
  });

  it('player can loot corpse', async () => {
    // Create corpse with loot
    // Execute loot command
    // Verify loot listed
    // Execute take command
    // Verify item in inventory
  });
});
```

**Step 2: Run tests**

Run: `cd packages/server && pnpm test -- --run src/integration/game-loop.test.ts`

**Step 3: Commit**

```bash
git add packages/server/src/integration/game-loop.test.ts
git commit -m "test: add ecosystem integration tests"
```

---

## Task 14: Final Verification and Cleanup

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Run the server manually and test**

Run: `cd packages/server && pnpm dev`

Test scenarios:
1. Find a creature and kill it - verify corpse appears
2. Use `loot` command - verify items listed
3. Use `take X from corpse` - verify item moves to inventory
4. Wait for respawn (use shorter timers for testing)
5. Watch creatures hunt each other

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete living ecosystem implementation

- Creatures hunt prey in adjacent rooms
- Prey flees when predators arrive (with chase mechanic)
- Distance-based combat LOD (tick-based near player, instant far)
- Corpses persist with tier-based duration
- Player can loot corpses with loot/take commands
- Creatures respawn at spawn location after tier-based delay
- Territorial creatures defend home + adjacent areas
- Intimidation system prevents low-tier attacks on high-level players"
```

---

## Summary

This implementation plan covers:

1. **Types & Constants** (Tasks 1-4): CreatureTier, ecosystem constants, Corpse, RespawnEntry
2. **Ecosystem Logic** (Tasks 5-7): Intimidation, hunting, corpse management, death handling
3. **Commands** (Tasks 8-9): Loot command, extended take command
4. **Game Loop** (Tasks 10-11): Hunting, fleeing, creature combat, respawn processing
5. **Integration** (Tasks 12-14): Connect player combat, integration tests, verification

Each task is designed to be completed in 2-5 minutes with clear test-first approach.
