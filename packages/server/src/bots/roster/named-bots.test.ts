import { describe, it, expect } from 'vitest';
import { NAMED_BOTS, getNamedBotDefinition, getAllNamedBotIds } from './named-bots';

describe('Named Bot Definitions', () => {
  describe('NAMED_BOTS', () => {
    it('should define exactly 8 named bots', () => {
      expect(Object.keys(NAMED_BOTS).length).toBe(8);
    });

    it('should have unique IDs for all bots', () => {
      const ids = Object.keys(NAMED_BOTS);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names for all bots', () => {
      const names = Object.values(NAMED_BOTS).map(b => b.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Aldric the Brave', () => {
    it('should be a warrior with high bravery', () => {
      const aldric = NAMED_BOTS.bot_aldric!;
      expect(aldric).toBeDefined();
      expect(aldric.class).toBe('warrior');
      expect(aldric.personality.bravery).toBeGreaterThanOrEqual(85);
    });

    it('should prefer combat and socializing', () => {
      const aldric = NAMED_BOTS.bot_aldric!;
      expect(aldric.personality.preferredActivities).toContain('combat');
      expect(aldric.personality.preferredActivities).toContain('socializing');
    });

    it('should have boss-slaying aspiration', () => {
      const aldric = NAMED_BOTS.bot_aldric!;
      expect(aldric.aspirations.some(a => a.type === 'kill_bosses')).toBe(true);
    });
  });

  describe('Sister Mira', () => {
    it('should be a cleric with high patience', () => {
      const mira = NAMED_BOTS.bot_mira!;
      expect(mira).toBeDefined();
      expect(mira.class).toBe('cleric');
      expect(mira.personality.patience).toBeGreaterThanOrEqual(80);
    });

    it('should have help_newbies aspiration', () => {
      const mira = NAMED_BOTS.bot_mira!;
      expect(mira.aspirations.some(a => a.type === 'help_newbies')).toBe(true);
    });
  });

  describe('Shadow', () => {
    it('should be a rogue with high greed and low sociability', () => {
      const shadow = NAMED_BOTS.bot_shadow!;
      expect(shadow).toBeDefined();
      expect(shadow.class).toBe('rogue');
      expect(shadow.personality.greed).toBeGreaterThanOrEqual(85);
      expect(shadow.personality.sociability).toBeLessThanOrEqual(30);
    });
  });

  describe('The Rat Catcher', () => {
    it('should be a rogue with sewer zone preference', () => {
      const ratCatcher = NAMED_BOTS.bot_rat_catcher!;
      expect(ratCatcher).toBeDefined();
      expect(ratCatcher.class).toBe('rogue');
      expect(ratCatcher.personality.preferredZones).toContain('sewer');
    });

    it('should have clear_dungeon aspiration for sewer', () => {
      const ratCatcher = NAMED_BOTS.bot_rat_catcher!;
      expect(ratCatcher.aspirations.some(a =>
        a.type === 'clear_dungeon' && a.target === 'sewer'
      )).toBe(true);
    });
  });

  describe('getNamedBotDefinition', () => {
    it('should return bot definition by ID', () => {
      const aldric = getNamedBotDefinition('bot_aldric');
      expect(aldric).toBeDefined();
      expect(aldric?.name).toBe('Aldric the Brave');
    });

    it('should return undefined for unknown ID', () => {
      const unknown = getNamedBotDefinition('bot_unknown');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getAllNamedBotIds', () => {
    it('should return all 8 bot IDs', () => {
      const ids = getAllNamedBotIds();
      expect(ids.length).toBe(8);
      expect(ids).toContain('bot_aldric');
      expect(ids).toContain('bot_mira');
    });
  });
});
