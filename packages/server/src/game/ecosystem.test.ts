import { describe, it, expect } from 'vitest';
import { isIntimidated, canHunt, getDistanceFromPlayer } from './ecosystem';
import type { Creature, World } from '@solo-mud/shared';

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
