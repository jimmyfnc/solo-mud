/**
 * Faction system tests.
 */

import { describe, it, expect } from 'vitest';
import {
  FACTIONS,
  getFaction,
  areSameFaction,
  getFactionOpinionModifier,
  getFactionByRole,
} from './factions';

describe('Faction System', () => {
  describe('FACTIONS constant', () => {
    it('should have easthollow_defenders faction', () => {
      expect(FACTIONS.easthollow_defenders).toBeDefined();
      expect(FACTIONS.easthollow_defenders.id).toBe('easthollow_defenders');
      expect(FACTIONS.easthollow_defenders.name).toBeDefined();
      expect(FACTIONS.easthollow_defenders.description).toBeDefined();
      expect(FACTIONS.easthollow_defenders.baseOpinionBoost).toBeGreaterThanOrEqual(20);
      expect(FACTIONS.easthollow_defenders.baseOpinionBoost).toBeLessThanOrEqual(40);
    });

    it('should have lone_wolves faction', () => {
      expect(FACTIONS.lone_wolves).toBeDefined();
      expect(FACTIONS.lone_wolves.id).toBe('lone_wolves');
    });

    it('should have sewer_dwellers faction', () => {
      expect(FACTIONS.sewer_dwellers).toBeDefined();
      expect(FACTIONS.sewer_dwellers.id).toBe('sewer_dwellers');
    });

    it('should have at least 5 factions', () => {
      expect(Object.keys(FACTIONS).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('getFaction', () => {
    it('should return correct faction for valid ID', () => {
      const faction = getFaction('easthollow_defenders');
      expect(faction).toBeDefined();
      expect(faction?.id).toBe('easthollow_defenders');
      expect(faction?.name).toBeDefined();
    });

    it('should return undefined for unknown faction ID', () => {
      const faction = getFaction('nonexistent_faction');
      expect(faction).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const faction = getFaction('');
      expect(faction).toBeUndefined();
    });
  });

  describe('areSameFaction', () => {
    it('should return true for matching factions', () => {
      expect(areSameFaction('easthollow_defenders', 'easthollow_defenders')).toBe(true);
      expect(areSameFaction('lone_wolves', 'lone_wolves')).toBe(true);
    });

    it('should return false for different factions', () => {
      expect(areSameFaction('easthollow_defenders', 'lone_wolves')).toBe(false);
      expect(areSameFaction('sewer_dwellers', 'easthollow_defenders')).toBe(false);
    });

    it('should return false when first faction is undefined', () => {
      expect(areSameFaction(undefined, 'easthollow_defenders')).toBe(false);
    });

    it('should return false when second faction is undefined', () => {
      expect(areSameFaction('easthollow_defenders', undefined)).toBe(false);
    });

    it('should return false when both factions are undefined', () => {
      expect(areSameFaction(undefined, undefined)).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(areSameFaction('', '')).toBe(false);
      expect(areSameFaction('easthollow_defenders', '')).toBe(false);
    });
  });

  describe('getFactionOpinionModifier', () => {
    it('should return boost for same faction', () => {
      const boost = getFactionOpinionModifier('easthollow_defenders', 'easthollow_defenders');
      expect(boost).toBeGreaterThanOrEqual(20);
      expect(boost).toBeLessThanOrEqual(40);
    });

    it('should return 0 for different factions', () => {
      expect(getFactionOpinionModifier('easthollow_defenders', 'lone_wolves')).toBe(0);
    });

    it('should return 0 when first faction is undefined', () => {
      expect(getFactionOpinionModifier(undefined, 'easthollow_defenders')).toBe(0);
    });

    it('should return 0 when second faction is undefined', () => {
      expect(getFactionOpinionModifier('easthollow_defenders', undefined)).toBe(0);
    });

    it('should return 0 when both factions are undefined', () => {
      expect(getFactionOpinionModifier(undefined, undefined)).toBe(0);
    });

    it('should return correct boost for each faction', () => {
      // Each faction should return its own baseOpinionBoost
      for (const faction of Object.values(FACTIONS)) {
        const boost = getFactionOpinionModifier(faction.id, faction.id);
        expect(boost).toBe(faction.baseOpinionBoost);
      }
    });
  });

  describe('getFactionByRole', () => {
    it('should return higher modifier for leader', () => {
      const leaderMod = getFactionByRole('easthollow_defenders', 'leader');
      const memberMod = getFactionByRole('easthollow_defenders', 'member');
      expect(leaderMod).toBeGreaterThan(memberMod);
    });

    it('should return higher modifier for member than recruit', () => {
      const memberMod = getFactionByRole('easthollow_defenders', 'member');
      const recruitMod = getFactionByRole('easthollow_defenders', 'recruit');
      expect(memberMod).toBeGreaterThan(recruitMod);
    });

    it('should return positive modifier for leader', () => {
      const leaderMod = getFactionByRole('easthollow_defenders', 'leader');
      expect(leaderMod).toBeGreaterThan(0);
    });

    it('should return positive modifier for member', () => {
      const memberMod = getFactionByRole('easthollow_defenders', 'member');
      expect(memberMod).toBeGreaterThan(0);
    });

    it('should return non-negative modifier for recruit', () => {
      const recruitMod = getFactionByRole('easthollow_defenders', 'recruit');
      expect(recruitMod).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for unknown faction', () => {
      const mod = getFactionByRole('nonexistent_faction', 'leader');
      expect(mod).toBe(0);
    });
  });
});
