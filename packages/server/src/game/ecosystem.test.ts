import { describe, it, expect } from 'vitest';
import { isIntimidated, canHunt, getDistanceFromPlayer, createCorpse, shouldCorpseFade, queueRespawn, handleCreatureDeath } from './ecosystem';
import type { Creature, Corpse, World, Location } from '@solo-mud/shared';
import { CORPSE_DURATION } from '@solo-mud/shared';

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

  describe('queueRespawn', () => {
    it('creates respawn entry with correct properties', () => {
      const creature: Creature = {
        id: 'creature_1',
        templateId: 'wolf',
        name: 'Wolf',
        level: 5,
        behavior: 'aggressive',
        mobility: 'roaming',
        currentHp: 0,
        maxHp: 35,
        locationId: 'loc_1',
        homeLocationId: 'loc_1',
        spawnLocationId: 'loc_2',
        inCombat: false,
        description: 'A wolf',
      };

      const entry = queueRespawn(creature, 'common');

      expect(entry.templateId).toBe('wolf');
      expect(entry.spawnLocationId).toBe('loc_2');
      expect(entry.level).toBe(5);
      expect(entry.respawnAt).toBeGreaterThan(Date.now());
    });
  });
});

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
