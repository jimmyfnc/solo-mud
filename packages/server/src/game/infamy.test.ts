/**
 * Tests for the player infamy system.
 */

import { describe, it, expect } from 'vitest';
import {
  getInfamyLevel,
  createInfamy,
  addAssaultBounty,
  addMurderBounty,
  tickInfamyDecay,
  shouldGuardsAttack,
  willNpcRefuseService,
  getInfamyDisplay,
  clearInfamy,
  INFAMY_THRESHOLDS,
  BOUNTY_VALUES,
} from './infamy';
import type { Player } from '@solo-mud/shared';

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test_player',
    name: 'Test Player',
    class: 'warrior',
    level: 10,
    xp: 0,
    xpToNextLevel: 1000,
    baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10 },
    currentHp: 100,
    maxHp: 100,
    currentMp: 50,
    maxMp: 50,
    subclass: undefined,
    talentPointsAvailable: 0,
    equipment: {},
    inventory: [],
    inventorySlots: 40,
    keyring: [],
    carryWeight: 0,
    maxCarryWeight: 100,
    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],
    locationId: 'town_square',
    boundTownId: 'town_inn',
    inCombat: false,
    autoAttack: false,
    tutorial: { skipped: true, complete: true, completedSteps: [] },
    globalCooldown: 0,
    abilityCooldowns: {},
    currency: { copper: 0, silver: 0, gold: 0 },
    statusEffects: [],
    questFlags: [],
    spells: { known: [], slots: [] },
    propCooldowns: {},
    ...overrides,
  };
}

describe('Infamy System', () => {
  describe('getInfamyLevel', () => {
    it('should return none for zero bounty', () => {
      expect(getInfamyLevel(0)).toBe('none');
    });

    it('should return suspect at threshold', () => {
      expect(getInfamyLevel(INFAMY_THRESHOLDS.suspect)).toBe('suspect');
    });

    it('should return criminal at threshold', () => {
      expect(getInfamyLevel(INFAMY_THRESHOLDS.criminal)).toBe('criminal');
    });

    it('should return murderer at threshold', () => {
      expect(getInfamyLevel(INFAMY_THRESHOLDS.murderer)).toBe('murderer');
    });

    it('should return correct level between thresholds', () => {
      expect(getInfamyLevel(49)).toBe('none');
      expect(getInfamyLevel(100)).toBe('suspect');
      expect(getInfamyLevel(499)).toBe('suspect');
      expect(getInfamyLevel(1000)).toBe('criminal');
    });
  });

  describe('createInfamy', () => {
    it('should create initial infamy state', () => {
      const infamy = createInfamy('easthollow');
      expect(infamy.level).toBe('none');
      expect(infamy.townId).toBe('easthollow');
      expect(infamy.bounty).toBe(0);
    });
  });

  describe('addAssaultBounty', () => {
    it('should add bounty for assault', () => {
      const player = createTestPlayer();
      const infamy = addAssaultBounty(player, 'easthollow', 1000);

      expect(infamy.bounty).toBe(BOUNTY_VALUES.assault);
      expect(infamy.townId).toBe('easthollow');
      expect(infamy.decayAt).toBeDefined();
    });

    it('should accumulate bounty from multiple assaults', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'suspect',
          townId: 'easthollow',
          bounty: BOUNTY_VALUES.assault,
          decayAt: 2000,
        },
      });

      const infamy = addAssaultBounty(player, 'easthollow', 1000);
      expect(infamy.bounty).toBe(BOUNTY_VALUES.assault * 2);
    });

    it('should reset infamy when changing towns', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'suspect',
          townId: 'oldtown',
          bounty: 100,
        },
      });

      const infamy = addAssaultBounty(player, 'easthollow', 1000);
      expect(infamy.townId).toBe('easthollow');
      expect(infamy.bounty).toBe(BOUNTY_VALUES.assault);
    });
  });

  describe('addMurderBounty', () => {
    it('should add bounty for murder', () => {
      const player = createTestPlayer();
      const victimLevel = 30;
      const expectedBounty = BOUNTY_VALUES.murderBase + (victimLevel * BOUNTY_VALUES.murderPerLevel);

      const infamy = addMurderBounty(player, 'easthollow', victimLevel, 1000);

      expect(infamy.bounty).toBe(expectedBounty);
      expect(infamy.level).toBe('murderer');
    });

    it('should scale bounty with victim level', () => {
      const player = createTestPlayer();

      const lowLevelInfamy = addMurderBounty(player, 'easthollow', 1, 1000);
      const highLevelInfamy = addMurderBounty(createTestPlayer(), 'easthollow', 50, 1000);

      expect(highLevelInfamy.bounty).toBeGreaterThan(lowLevelInfamy.bounty);
    });
  });

  describe('tickInfamyDecay', () => {
    it('should not decay if time has not passed', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'suspect',
          townId: 'easthollow',
          bounty: 100,
          decayAt: 2000,
        },
      });

      const result = tickInfamyDecay(player, 1000);
      expect(result?.level).toBe('suspect');
    });

    it('should decay suspect to none when time passes', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'suspect',
          townId: 'easthollow',
          bounty: 100,
          decayAt: 1000,
        },
      });

      const result = tickInfamyDecay(player, 2000);
      expect(result).toBeUndefined(); // Cleared
    });

    it('should decay murderer to criminal', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'murderer',
          townId: 'easthollow',
          bounty: 10000,
          decayAt: 1000,
        },
      });

      const result = tickInfamyDecay(player, 2000);
      expect(result?.level).toBe('criminal');
    });

    it('should decay criminal to suspect', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'criminal',
          townId: 'easthollow',
          bounty: 1000,
          decayAt: 1000,
        },
      });

      const result = tickInfamyDecay(player, 2000);
      expect(result?.level).toBe('suspect');
    });
  });

  describe('shouldGuardsAttack', () => {
    it('should return false for no infamy', () => {
      const player = createTestPlayer();
      expect(shouldGuardsAttack(player, 'easthollow')).toBe(false);
    });

    it('should return false for suspect', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'suspect',
          townId: 'easthollow',
          bounty: 100,
        },
      });
      expect(shouldGuardsAttack(player, 'easthollow')).toBe(false);
    });

    it('should return true for criminal', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'criminal',
          townId: 'easthollow',
          bounty: 1000,
        },
      });
      expect(shouldGuardsAttack(player, 'easthollow')).toBe(true);
    });

    it('should return true for murderer', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'murderer',
          townId: 'easthollow',
          bounty: 10000,
        },
      });
      expect(shouldGuardsAttack(player, 'easthollow')).toBe(true);
    });

    it('should return false for different town', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'murderer',
          townId: 'othertown',
          bounty: 10000,
        },
      });
      expect(shouldGuardsAttack(player, 'easthollow')).toBe(false);
    });
  });

  describe('willNpcRefuseService', () => {
    it('should return false for non-murderer', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'criminal',
          townId: 'easthollow',
          bounty: 1000,
        },
      });
      expect(willNpcRefuseService(player, 'easthollow')).toBe(false);
    });

    it('should return true for murderer', () => {
      const player = createTestPlayer({
        infamy: {
          level: 'murderer',
          townId: 'easthollow',
          bounty: 10000,
        },
      });
      expect(willNpcRefuseService(player, 'easthollow')).toBe(true);
    });
  });

  describe('getInfamyDisplay', () => {
    it('should return null for no infamy', () => {
      expect(getInfamyDisplay(undefined)).toBeNull();
      expect(getInfamyDisplay({ level: 'none', townId: 'test', bounty: 0 })).toBeNull();
    });

    it('should format suspect display', () => {
      const display = getInfamyDisplay({
        level: 'suspect',
        townId: 'easthollow',
        bounty: 55, // 5s 5c
      });
      expect(display).toContain('Suspect');
      expect(display).toContain('easthollow');
    });

    it('should format criminal display with guard warning', () => {
      const display = getInfamyDisplay({
        level: 'criminal',
        townId: 'easthollow',
        bounty: 1000,
      });
      expect(display).toContain('Criminal');
      expect(display).toContain('Guards hostile');
    });

    it('should format murderer display with service warning', () => {
      const display = getInfamyDisplay({
        level: 'murderer',
        townId: 'easthollow',
        bounty: 10000,
      });
      expect(display).toContain('Murderer');
      expect(display).toContain('NPCs refuse service');
    });
  });

  describe('clearInfamy', () => {
    it('should return undefined', () => {
      expect(clearInfamy()).toBeUndefined();
    });
  });
});
