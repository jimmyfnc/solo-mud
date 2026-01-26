/**
 * Integration tests for the ecosystem behavior.
 * Verifies that all ecosystem components work together correctly.
 */

import { describe, it, expect } from 'vitest';
import {
  canHunt,
  shouldCorpseFade,
  queueRespawn,
  handleCreatureDeath,
  findPreyInAdjacentLocations,
  getAdjacentLocations,
} from './ecosystem';
import type { Creature, World, Location, Corpse, CreatureTier } from '@solo-mud/shared';
import { TIER_CONFIG, CORPSE_DURATION } from '@solo-mud/shared';

/**
 * Helper to create a minimal test world with customizable structure.
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

describe('ecosystem integration', () => {
  describe('respawn system', () => {
    it('creature respawns after tier-based delay', () => {
      const wolf = createTestCreature({
        id: 'wolf_1',
        templateId: 'wolf',
        level: 3,
      });

      // Test each tier's respawn timing
      const tiers: CreatureTier[] = ['ambient', 'common', 'dangerous', 'apex'];

      for (const tier of tiers) {
        const entry = queueRespawn(wolf, tier);

        expect(entry.templateId).toBe('wolf');
        expect(entry.spawnLocationId).toBe(wolf.spawnLocationId);
        expect(entry.level).toBe(wolf.level);

        // Verify respawn time matches tier config
        const expectedDelay = TIER_CONFIG[tier].respawnMs;
        const actualDelay = entry.respawnAt - Date.now();

        // Allow 100ms tolerance for test execution time
        expect(actualDelay).toBeGreaterThan(expectedDelay - 100);
        expect(actualDelay).toBeLessThanOrEqual(expectedDelay + 100);
      }
    });

    it('respawn queue is populated on creature death', () => {
      const location = createTestLocation({
        id: 'loc_1',
        creatures: ['wolf_1'],
      });

      const wolf = createTestCreature({
        id: 'wolf_1',
        locationId: 'loc_1',
        spawnLocationId: 'loc_1',
        currentHp: 0,
      });

      const world = createTestWorld({
        locations: { loc_1: location },
        creatures: { wolf_1: wolf },
      });

      expect(world.respawnQueue).toHaveLength(0);

      handleCreatureDeath(world, wolf, 'player', 'common');

      expect(world.respawnQueue).toHaveLength(1);
      expect(world.respawnQueue[0]!.templateId).toBe('wolf');
      expect(world.respawnQueue[0]!.spawnLocationId).toBe('loc_1');
    });
  });

  describe('hunting behavior', () => {
    it('predator hunts prey in adjacent room', () => {
      // Create locations with exits between them
      const forestClearing = createTestLocation({
        id: 'loc_1',
        name: 'Forest Clearing',
        creatures: ['wolf_1'],
      });

      const meadow = createTestLocation({
        id: 'loc_2',
        name: 'Meadow',
        creatures: ['rabbit_1'],
      });

      const wolf = createTestCreature({
        id: 'wolf_1',
        templateId: 'wolf',
        name: 'Wolf',
        level: 5,
        behavior: 'aggressive',
        locationId: 'loc_1',
      });

      const rabbit = createTestCreature({
        id: 'rabbit_1',
        templateId: 'rabbit',
        name: 'Rabbit',
        level: 1,
        behavior: 'passive',
        locationId: 'loc_2',
        currentHp: 5,
        maxHp: 5,
      });

      const world = createTestWorld({
        locations: {
          loc_1: forestClearing,
          loc_2: meadow,
        },
        exits: {
          exit_1: {
            id: 'exit_1',
            from: 'loc_1',
            to: 'loc_2',
            label: 'east',
            type: 'open',
          },
        },
        adjacency: {
          loc_1: ['exit_1'],
          loc_2: [],
        },
        creatures: {
          wolf_1: wolf,
          rabbit_1: rabbit,
        },
      });

      // Wolf should be able to find prey in adjacent location
      const preyLocations = findPreyInAdjacentLocations(world, wolf, 'common');

      expect(preyLocations).toHaveLength(1);
      expect(preyLocations[0]!.locationId).toBe('loc_2');
      expect(preyLocations[0]!.creatures).toHaveLength(1);
      expect(preyLocations[0]!.creatures[0]!.id).toBe('rabbit_1');
    });

    it('predator does not hunt through locked exits', () => {
      const forestClearing = createTestLocation({
        id: 'loc_1',
        creatures: ['wolf_1'],
      });

      const safeZone = createTestLocation({
        id: 'loc_2',
        creatures: ['rabbit_1'],
      });

      const wolf = createTestCreature({
        id: 'wolf_1',
        level: 5,
        behavior: 'aggressive',
        locationId: 'loc_1',
      });

      const rabbit = createTestCreature({
        id: 'rabbit_1',
        level: 1,
        behavior: 'passive',
        locationId: 'loc_2',
      });

      const world = createTestWorld({
        locations: {
          loc_1: forestClearing,
          loc_2: safeZone,
        },
        exits: {
          exit_1: {
            id: 'exit_1',
            from: 'loc_1',
            to: 'loc_2',
            label: 'locked gate',
            type: 'locked',
          },
        },
        adjacency: {
          loc_1: ['exit_1'],
        },
        creatures: {
          wolf_1: wolf,
          rabbit_1: rabbit,
        },
      });

      // Should not find prey through locked exit
      const preyLocations = findPreyInAdjacentLocations(world, wolf, 'common');
      expect(preyLocations).toHaveLength(0);
    });
  });

  describe('flee mechanics', () => {
    it('canHunt returns true when predator is stronger', () => {
      const predator = createTestCreature({
        id: 'wolf_1',
        level: 5,
        behavior: 'aggressive',
      });

      const prey = createTestCreature({
        id: 'rabbit_1',
        level: 1,
        behavior: 'passive',
      });

      // Wolf (level 5) can hunt rabbit (level 1) - 4 level gap >= 2
      expect(canHunt(predator, prey, 'common')).toBe(true);
    });

    it('canHunt returns false when level gap is insufficient', () => {
      const predator = createTestCreature({
        id: 'wolf_1',
        level: 3,
        behavior: 'aggressive',
      });

      const prey = createTestCreature({
        id: 'deer_1',
        level: 2,
        behavior: 'passive',
      });

      // Wolf (level 3) cannot hunt deer (level 2) - only 1 level gap < 2
      expect(canHunt(predator, prey, 'common')).toBe(false);
    });

    it('passive creatures cannot hunt', () => {
      const sheep = createTestCreature({
        id: 'sheep_1',
        level: 10, // Even with high level
        behavior: 'passive',
      });

      const rabbit = createTestCreature({
        id: 'rabbit_1',
        level: 1,
        behavior: 'passive',
      });

      expect(canHunt(sheep, rabbit, 'ambient')).toBe(false);
    });
  });

  describe('corpse lifecycle', () => {
    it('corpse is created on creature death', () => {
      const location = createTestLocation({
        id: 'loc_1',
        creatures: ['deer_1'],
      });

      const deer = createTestCreature({
        id: 'deer_1',
        templateId: 'deer',
        name: 'Deer',
        level: 2,
        behavior: 'passive',
        locationId: 'loc_1',
        currentHp: 0,
      });

      const world = createTestWorld({
        locations: { loc_1: location },
        creatures: { deer_1: deer },
      });

      expect(Object.keys(world.corpses)).toHaveLength(0);

      const corpse = handleCreatureDeath(world, deer, 'player', 'ambient', ['item_1']);

      // Verify corpse was created
      expect(Object.keys(world.corpses)).toHaveLength(1);
      expect(corpse.name).toBe('Deer');
      expect(corpse.templateId).toBe('deer');
      expect(corpse.locationId).toBe('loc_1');
      expect(corpse.killedBy).toBe('player');
      expect(corpse.looted).toBe(false);
      expect(corpse.loot).toEqual(['item_1']);

      // Verify creature was removed
      expect(world.creatures['deer_1']).toBeUndefined();
      expect(location.creatures).not.toContain('deer_1');
    });

    it('corpse has no loot when killed by creature', () => {
      const location = createTestLocation({
        id: 'loc_1',
        creatures: ['rabbit_1'],
      });

      const rabbit = createTestCreature({
        id: 'rabbit_1',
        templateId: 'rabbit',
        name: 'Rabbit',
        level: 1,
        behavior: 'passive',
        locationId: 'loc_1',
        currentHp: 0,
      });

      const world = createTestWorld({
        locations: { loc_1: location },
        creatures: { rabbit_1: rabbit },
      });

      // Loot is passed but should be empty because killed by creature (predator ate it)
      const corpse = handleCreatureDeath(world, rabbit, 'creature', 'ambient', ['fur_1']);

      expect(corpse.loot).toEqual([]);
      expect(corpse.killedBy).toBe('creature');
    });

    it('shouldCorpseFade returns correct values based on time', () => {
      // Fresh player-kill corpse should not fade
      const freshPlayerKillCorpse: Corpse = {
        id: 'corpse_1',
        creatureId: 'wolf_1',
        templateId: 'wolf',
        name: 'Wolf',
        locationId: 'loc_1',
        createdAt: Date.now() - 60_000, // 1 minute ago
        killedBy: 'player',
        looted: false,
        loot: [],
      };
      expect(shouldCorpseFade(freshPlayerKillCorpse)).toBe(false);

      // Old player-kill corpse should fade (> 3 minutes)
      const oldPlayerKillCorpse: Corpse = {
        ...freshPlayerKillCorpse,
        createdAt: Date.now() - CORPSE_DURATION.player_kill - 1000,
      };
      expect(shouldCorpseFade(oldPlayerKillCorpse)).toBe(true);

      // Creature-kill corpse fades faster (1 minute)
      const creatureKillCorpse: Corpse = {
        ...freshPlayerKillCorpse,
        killedBy: 'creature',
        createdAt: Date.now() - CORPSE_DURATION.creature_kill - 1000,
      };
      expect(shouldCorpseFade(creatureKillCorpse)).toBe(true);

      // Looted corpse fades 30s after looting
      const lootedCorpse: Corpse = {
        ...freshPlayerKillCorpse,
        looted: true,
        lootedAt: Date.now() - CORPSE_DURATION.looted - 1000,
      };
      expect(shouldCorpseFade(lootedCorpse)).toBe(true);

      // Recently looted corpse should not fade yet
      const recentlyLootedCorpse: Corpse = {
        ...freshPlayerKillCorpse,
        looted: true,
        lootedAt: Date.now() - 10_000, // 10 seconds ago
      };
      expect(shouldCorpseFade(recentlyLootedCorpse)).toBe(false);
    });
  });

  describe('adjacent location detection', () => {
    it('getAdjacentLocations returns connected locations', () => {
      const world = createTestWorld({
        locations: {
          loc_1: createTestLocation({ id: 'loc_1' }),
          loc_2: createTestLocation({ id: 'loc_2' }),
          loc_3: createTestLocation({ id: 'loc_3' }),
        },
        exits: {
          exit_1: { id: 'exit_1', from: 'loc_1', to: 'loc_2', label: 'north', type: 'open' },
          exit_2: { id: 'exit_2', from: 'loc_1', to: 'loc_3', label: 'east', type: 'open' },
        },
        adjacency: {
          loc_1: ['exit_1', 'exit_2'],
        },
      });

      const adjacent = getAdjacentLocations(world, 'loc_1');

      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContain('loc_2');
      expect(adjacent).toContain('loc_3');
    });

    it('getAdjacentLocations excludes locked exits', () => {
      const world = createTestWorld({
        locations: {
          loc_1: createTestLocation({ id: 'loc_1' }),
          loc_2: createTestLocation({ id: 'loc_2' }),
        },
        exits: {
          exit_1: { id: 'exit_1', from: 'loc_1', to: 'loc_2', label: 'locked door', type: 'locked' },
        },
        adjacency: {
          loc_1: ['exit_1'],
        },
      });

      const adjacent = getAdjacentLocations(world, 'loc_1');
      expect(adjacent).toHaveLength(0);
    });
  });

  describe('full death-to-respawn cycle', () => {
    it('handles complete creature death lifecycle', () => {
      // Setup: World with wolf in forest
      const forest = createTestLocation({
        id: 'loc_1',
        name: 'Dark Forest',
        creatures: ['wolf_1'],
      });

      const wolf = createTestCreature({
        id: 'wolf_1',
        templateId: 'wolf',
        name: 'Grey Wolf',
        level: 4,
        spawnLocationId: 'loc_1',
        locationId: 'loc_1',
        currentHp: 0,
      });

      const world = createTestWorld({
        locations: { loc_1: forest },
        creatures: { wolf_1: wolf },
      });

      // Verify initial state
      expect(forest.creatures).toContain('wolf_1');
      expect(world.creatures['wolf_1']).toBeDefined();
      expect(world.respawnQueue).toHaveLength(0);
      expect(Object.keys(world.corpses)).toHaveLength(0);

      // Kill the wolf
      const corpse = handleCreatureDeath(world, wolf, 'player', 'common', ['wolf_pelt']);

      // Verify creature removed
      expect(forest.creatures).not.toContain('wolf_1');
      expect(world.creatures['wolf_1']).toBeUndefined();

      // Verify corpse created with correct properties
      expect(world.corpses[corpse.id]).toBeDefined();
      expect(corpse.name).toBe('Grey Wolf');
      expect(corpse.locationId).toBe('loc_1');
      expect(corpse.killedBy).toBe('player');
      expect(corpse.loot).toEqual(['wolf_pelt']);

      // Verify respawn queued
      expect(world.respawnQueue).toHaveLength(1);
      const respawnEntry = world.respawnQueue[0]!;
      expect(respawnEntry.templateId).toBe('wolf');
      expect(respawnEntry.spawnLocationId).toBe('loc_1');
      expect(respawnEntry.level).toBe(4);

      // Respawn time should be ~5 minutes (common tier)
      const expectedRespawnDelay = TIER_CONFIG.common.respawnMs;
      const actualDelay = respawnEntry.respawnAt - Date.now();
      expect(actualDelay).toBeGreaterThan(expectedRespawnDelay - 100);
      expect(actualDelay).toBeLessThanOrEqual(expectedRespawnDelay + 100);
    });
  });
});
