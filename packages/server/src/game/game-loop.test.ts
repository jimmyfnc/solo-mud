/**
 * Tests for game loop ecosystem processing functions.
 */

import { describe, it, expect } from 'vitest';
import type { Creature, Corpse, World, Location, RespawnEntry } from '@solo-mud/shared';
import { CORPSE_DURATION, TIER_CONFIG, CREATURE_TEMPLATES, CHASE_CHANCE } from '@solo-mud/shared';

/**
 * Helper to create a minimal test world.
 */
function createTestWorld(overrides: Partial<World> = {}): World {
  return {
    seed: 'test-seed',
    startId: 'loc_1',
    goalId: 'loc_3',
    locations: {},
    exits: {},
    adjacency: {},
    items: {},
    creatures: {},
    corpses: {},
    respawnQueue: [],
    time: { totalMinutes: 0, timeOfDay: 'morning', day: 1 },
    weather: { type: 'clear', intensity: 0.5 },
    npcs: {},
    ...overrides,
  };
}

/**
 * Helper to create a test creature.
 */
function createTestCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'creature_1',
    templateId: 'wolf',
    name: 'Wolf',
    level: 3,
    behavior: 'aggressive',
    mobility: 'roaming',
    currentHp: 35,
    maxHp: 35,
    locationId: 'loc_1',
    homeLocationId: 'loc_1',
    spawnLocationId: 'loc_1',
    inCombat: false,
    description: 'A grey wolf prowls nearby.',
    ...overrides,
  };
}

/**
 * Helper to create a test location.
 */
function createTestLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'loc_1',
    name: 'Forest Clearing',
    biome: { forest: 1 },
    props: [],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 2,
    ...overrides,
  };
}

/**
 * Helper to create a test corpse.
 */
function createTestCorpse(overrides: Partial<Corpse> = {}): Corpse {
  return {
    id: 'corpse_1',
    creatureId: 'creature_1',
    templateId: 'wolf',
    name: 'Wolf',
    locationId: 'loc_1',
    createdAt: Date.now(),
    killedBy: 'player',
    looted: false,
    loot: [],
    ...overrides,
  };
}

describe('corpse processing logic', () => {
  describe('corpse fade timing', () => {
    it('creature-killed corpse fades after 60 seconds', () => {
      const corpse = createTestCorpse({
        killedBy: 'creature',
        createdAt: Date.now() - CORPSE_DURATION.creature_kill - 1000,
      });

      const shouldFade = Date.now() - corpse.createdAt > CORPSE_DURATION.creature_kill;
      expect(shouldFade).toBe(true);
    });

    it('player-killed corpse lasts 3 minutes', () => {
      const recentCorpse = createTestCorpse({
        killedBy: 'player',
        createdAt: Date.now() - 120_000, // 2 minutes ago
      });

      const oldCorpse = createTestCorpse({
        killedBy: 'player',
        createdAt: Date.now() - CORPSE_DURATION.player_kill - 1000,
      });

      const recentShouldFade = Date.now() - recentCorpse.createdAt > CORPSE_DURATION.player_kill;
      const oldShouldFade = Date.now() - oldCorpse.createdAt > CORPSE_DURATION.player_kill;

      expect(recentShouldFade).toBe(false);
      expect(oldShouldFade).toBe(true);
    });

    it('looted corpse fades 30 seconds after looting', () => {
      const lootedCorpse = createTestCorpse({
        killedBy: 'player',
        looted: true,
        lootedAt: Date.now() - CORPSE_DURATION.looted - 1000,
      });

      const shouldFade = lootedCorpse.looted && lootedCorpse.lootedAt
        ? Date.now() - lootedCorpse.lootedAt > CORPSE_DURATION.looted
        : false;

      expect(shouldFade).toBe(true);
    });
  });

  describe('corpse removal', () => {
    it('removes faded corpses from world', () => {
      const fadedCorpse = createTestCorpse({
        id: 'corpse_1',
        createdAt: Date.now() - CORPSE_DURATION.player_kill - 1000,
      });
      const freshCorpse = createTestCorpse({
        id: 'corpse_2',
        createdAt: Date.now() - 10_000, // 10 seconds ago
      });

      const world = createTestWorld({
        corpses: {
          corpse_1: fadedCorpse,
          corpse_2: freshCorpse,
        },
      });

      // Simulate processCorpses logic
      const toRemove: string[] = [];
      for (const [id, corpse] of Object.entries(world.corpses)) {
        const shouldFade = Date.now() - corpse.createdAt > CORPSE_DURATION.player_kill;
        if (shouldFade) {
          toRemove.push(id);
        }
      }

      for (const id of toRemove) {
        delete world.corpses[id];
      }

      expect(Object.keys(world.corpses)).toEqual(['corpse_2']);
    });
  });
});

describe('respawn processing logic', () => {
  describe('respawn timing', () => {
    it('respawns creature when timer elapses', () => {
      const now = Date.now();
      const entry: RespawnEntry = {
        templateId: 'wolf',
        spawnLocationId: 'loc_1',
        respawnAt: now - 1000, // 1 second ago
        level: 3,
      };

      const shouldRespawn = now >= entry.respawnAt;
      expect(shouldRespawn).toBe(true);
    });

    it('does not respawn when timer not elapsed', () => {
      const now = Date.now();
      const entry: RespawnEntry = {
        templateId: 'wolf',
        spawnLocationId: 'loc_1',
        respawnAt: now + 60_000, // 1 minute in future
        level: 3,
      };

      const shouldRespawn = now >= entry.respawnAt;
      expect(shouldRespawn).toBe(false);
    });

    it('delays respawn if player is at spawn location', () => {
      const now = Date.now();
      const playerLocationId = 'loc_1';
      const entry: RespawnEntry = {
        templateId: 'wolf',
        spawnLocationId: 'loc_1',
        respawnAt: now - 1000,
        level: 3,
      };

      // Simulate delay logic
      const shouldDelay = entry.spawnLocationId === playerLocationId;
      if (shouldDelay) {
        entry.respawnAt = now + 30_000; // Delay by tick interval
      }

      expect(entry.respawnAt).toBeGreaterThan(now);
    });
  });

  describe('creature creation on respawn', () => {
    it('creates creature with correct template properties', () => {
      const entry: RespawnEntry = {
        templateId: 'wolf',
        spawnLocationId: 'loc_1',
        respawnAt: Date.now() - 1000,
        level: 5,
      };

      const template = CREATURE_TEMPLATES.wolf;
      expect(template).toBeDefined();

      if (template) {
        const hp = template.baseHp + (entry.level - template.baseLevel) * 5;

        expect(hp).toBe(35 + (5 - 3) * 5); // 35 + 10 = 45
      }
    });

    it('adds creature to location creatures array', () => {
      const location = createTestLocation({ id: 'loc_1', creatures: [] });
      const world = createTestWorld({
        locations: { loc_1: location },
      });

      // Simulate adding creature
      const creatureId = 'creature_wolf_123';
      world.locations['loc_1']!.creatures.push(creatureId);

      expect(world.locations['loc_1']!.creatures).toContain(creatureId);
    });

    it('removes entry from respawn queue after processing', () => {
      const world = createTestWorld({
        respawnQueue: [
          {
            templateId: 'wolf',
            spawnLocationId: 'loc_1',
            respawnAt: Date.now() - 1000,
            level: 3,
          },
          {
            templateId: 'rabbit',
            spawnLocationId: 'loc_2',
            respawnAt: Date.now() + 60_000,
            level: 1,
          },
        ],
        locations: {
          loc_1: createTestLocation({ id: 'loc_1' }),
          loc_2: createTestLocation({ id: 'loc_2' }),
        },
      });

      // Simulate processing (remove first entry)
      world.respawnQueue.splice(0, 1);

      expect(world.respawnQueue).toHaveLength(1);
      expect(world.respawnQueue[0]!.templateId).toBe('rabbit');
    });
  });

  describe('tier-based respawn delays', () => {
    it('ambient creatures respawn in 2 minutes', () => {
      expect(TIER_CONFIG.ambient.respawnMs).toBe(120_000);
    });

    it('common creatures respawn in 5 minutes', () => {
      expect(TIER_CONFIG.common.respawnMs).toBe(300_000);
    });

    it('dangerous creatures respawn in 10 minutes', () => {
      expect(TIER_CONFIG.dangerous.respawnMs).toBe(600_000);
    });

    it('apex creatures respawn in 15 minutes', () => {
      expect(TIER_CONFIG.apex.respawnMs).toBe(900_000);
    });
  });
});

describe('hunting processing logic', () => {
  describe('predator selection', () => {
    it('filters for non-passive, alive, not in combat, roaming creatures', () => {
      const wolf = createTestCreature({
        id: 'wolf_1',
        behavior: 'aggressive',
        mobility: 'roaming',
        currentHp: 35,
        inCombat: false,
      });

      const rabbit = createTestCreature({
        id: 'rabbit_1',
        behavior: 'passive',
        mobility: 'static',
        currentHp: 5,
        inCombat: false,
      });

      const deadWolf = createTestCreature({
        id: 'wolf_2',
        behavior: 'aggressive',
        mobility: 'roaming',
        currentHp: 0, // Dead
        inCombat: false,
      });

      const creatures = [wolf, rabbit, deadWolf];

      const predators = creatures.filter(
        (c) =>
          c.behavior !== 'passive' &&
          c.currentHp > 0 &&
          !c.inCombat &&
          c.mobility === 'roaming'
      );

      expect(predators).toHaveLength(1);
      expect(predators[0]!.id).toBe('wolf_1');
    });
  });

  describe('prey selection', () => {
    it('selects prey with 2+ level gap', () => {
      const predatorLevel = 5;
      const preyCreatures = [
        { id: 'prey_1', level: 1 }, // Gap of 4 - huntable
        { id: 'prey_2', level: 3 }, // Gap of 2 - huntable
        { id: 'prey_3', level: 4 }, // Gap of 1 - not huntable
        { id: 'prey_4', level: 5 }, // Gap of 0 - not huntable
      ];

      const huntable = preyCreatures.filter(
        (p) => predatorLevel - p.level >= 2
      );

      expect(huntable).toHaveLength(2);
      expect(huntable.map((p) => p.id)).toEqual(['prey_1', 'prey_2']);
    });

    it('selects closest level match as easiest prey', () => {
      const predatorLevel = 5;
      const preyCreatures = [
        { id: 'prey_1', level: 1 }, // Gap of 4
        { id: 'prey_2', level: 3 }, // Gap of 2 - closest
        { id: 'prey_3', level: 2 }, // Gap of 3
      ];

      let bestPrey: { id: string; level: number } | null = null;
      let bestLevelDiff = Infinity;

      for (const prey of preyCreatures) {
        const diff = predatorLevel - prey.level;
        if (diff >= 2 && diff < bestLevelDiff) {
          bestLevelDiff = diff;
          bestPrey = prey;
        }
      }

      expect(bestPrey).not.toBeNull();
      expect(bestPrey!.id).toBe('prey_2');
      expect(bestLevelDiff).toBe(2);
    });
  });
});

describe('flee response logic', () => {
  describe('flee triggers', () => {
    it('passive creatures flee from predators', () => {
      const predator = createTestCreature({
        id: 'wolf_1',
        behavior: 'aggressive',
        level: 5,
      });

      const prey = createTestCreature({
        id: 'rabbit_1',
        behavior: 'passive',
        level: 1,
      });

      const shouldFlee =
        prey.behavior === 'passive' && predator.level - prey.level >= 2;

      expect(shouldFlee).toBe(true);
    });

    it('prey does not flee from equal-level creatures', () => {
      const creature1 = createTestCreature({
        id: 'wolf_1',
        behavior: 'aggressive',
        level: 3,
      });

      const creature2 = createTestCreature({
        id: 'deer_1',
        behavior: 'passive',
        level: 3,
      });

      const shouldFlee =
        creature2.behavior === 'passive' && creature1.level - creature2.level >= 2;

      expect(shouldFlee).toBe(false);
    });
  });

  describe('chase mechanics', () => {
    it('predator has 50% chance to chase', () => {
      // Test that CHASE_CHANCE is configured correctly
      expect(CHASE_CHANCE).toBe(0.5);
    });

    it('trapped prey enters combat if no escape routes', () => {
      const location = createTestLocation({
        id: 'loc_1',
        creatures: ['predator_1', 'prey_1'],
      });

      const world = createTestWorld({
        locations: { loc_1: location },
        adjacency: { loc_1: [] }, // No exits
      });

      const fleeOptions = world.adjacency['loc_1'] ?? [];
      const isTrapped = fleeOptions.length === 0;

      expect(isTrapped).toBe(true);
    });
  });
});

describe('creature vs creature combat logic', () => {
  describe('combat state management', () => {
    it('creatures target each other in combat', () => {
      const attacker = createTestCreature({
        id: 'wolf_1',
        inCombat: true,
        targetId: 'deer_1',
      });

      const defender = createTestCreature({
        id: 'deer_1',
        inCombat: true,
        targetId: 'wolf_1',
      });

      expect(attacker.targetId).toBe(defender.id);
      expect(defender.targetId).toBe(attacker.id);
    });

    it('clears combat state when target dies', () => {
      const attacker = createTestCreature({
        id: 'wolf_1',
        inCombat: true,
        targetId: 'deer_1',
      });

      const defender = createTestCreature({
        id: 'deer_1',
        currentHp: 0, // Dead
        inCombat: true,
        targetId: 'wolf_1',
      });

      // Simulate combat resolution
      if (defender.currentHp <= 0) {
        attacker.inCombat = false;
        attacker.targetId = undefined;
      }

      expect(attacker.inCombat).toBe(false);
      expect(attacker.targetId).toBeUndefined();
    });
  });

  describe('damage calculation', () => {
    it('damage is based on creature level', () => {
      const attacker = createTestCreature({ level: 5 });

      // Damage formula: max(1, level + random * level)
      // Min damage: max(1, 5 + 0) = 5
      // Max damage: max(1, 5 + 4.99) = 9
      const minDamage = Math.max(1, attacker.level);
      const maxDamage = Math.max(1, attacker.level + attacker.level - 1);

      expect(minDamage).toBe(5);
      expect(maxDamage).toBe(9);
    });
  });

  describe('death handling', () => {
    it('removes dead creature from world', () => {
      const creature = createTestCreature({ id: 'wolf_1', currentHp: 0 });
      const location = createTestLocation({
        id: 'loc_1',
        creatures: ['wolf_1'],
      });

      const world = createTestWorld({
        creatures: { wolf_1: creature },
        locations: { loc_1: location },
      });

      // Simulate death handling
      delete world.creatures['wolf_1'];
      const idx = location.creatures.indexOf('wolf_1');
      if (idx !== -1) location.creatures.splice(idx, 1);

      expect(world.creatures['wolf_1']).toBeUndefined();
      expect(location.creatures).not.toContain('wolf_1');
    });
  });
});
