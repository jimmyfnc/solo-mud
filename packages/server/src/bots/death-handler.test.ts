import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateDeathPenalties,
  applyDeathPenalties,
  recordDeath,
  type BotDeathInfo,
  type BotDeathPenalties,
} from './death-handler';
import { createBotPlayer } from './bot-factory';
import type { BotPlayer } from './bot-player';

describe('Bot Death Handler', () => {
  let bot: BotPlayer;
  let deathInfo: BotDeathInfo;

  beforeEach(() => {
    bot = createBotPlayer({
      id: 'test-bot',
      name: 'TestBot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: true,
    });
    // Set up some XP and currency for testing
    bot.xp = 1000;
    bot.currency = { copper: 50, silver: 20, gold: 5 };

    deathInfo = {
      botId: 'test-bot',
      botName: 'TestBot',
      killedBy: 'creature_rat_king',
      killerName: 'Rat King',
      location: 'sewer_kings_lair',
      wasHeroic: true,
      timestamp: Date.now(),
    };
  });

  describe('calculateDeathPenalties', () => {
    it('should calculate 5% XP loss', () => {
      bot.xp = 1000;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.xpLost).toBe(50); // 5% of 1000
    });

    it('should calculate 10% gold loss in copper', () => {
      // 50c + 20s*10 + 5g*100 = 50 + 200 + 500 = 750 copper total
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.goldLost).toBe(75); // 10% of 750
    });

    it('should return fears_killer when bravery < 30', () => {
      bot.botProfile.personality.bravery = 20;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.memoryEffect).toBe('fears_killer');
    });

    it('should return gains_caution when bravery is 30-70', () => {
      bot.botProfile.personality.bravery = 50;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.memoryEffect).toBe('gains_caution');
    });

    it('should return seeks_revenge when bravery > 70', () => {
      bot.botProfile.personality.bravery = 85;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.memoryEffect).toBe('seeks_revenge');
    });

    it('should handle edge case bravery = 30 as gains_caution', () => {
      bot.botProfile.personality.bravery = 30;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.memoryEffect).toBe('gains_caution');
    });

    it('should handle edge case bravery = 70 as gains_caution', () => {
      bot.botProfile.personality.bravery = 70;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.memoryEffect).toBe('gains_caution');
    });

    it('should handle zero XP', () => {
      bot.xp = 0;
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.xpLost).toBe(0);
    });

    it('should handle zero currency', () => {
      bot.currency = { copper: 0, silver: 0, gold: 0 };
      const penalties = calculateDeathPenalties(bot, deathInfo);

      expect(penalties.goldLost).toBe(0);
    });
  });

  describe('applyDeathPenalties', () => {
    it('should subtract XP correctly', () => {
      bot.xp = 1000;
      const penalties: BotDeathPenalties = {
        xpLost: 100,
        goldLost: 0,
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      expect(bot.xp).toBe(900);
    });

    it('should not allow XP to go below 0', () => {
      bot.xp = 50;
      const penalties: BotDeathPenalties = {
        xpLost: 100,
        goldLost: 0,
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      expect(bot.xp).toBe(0);
    });

    it('should subtract gold from copper first', () => {
      bot.currency = { copper: 30, silver: 0, gold: 0 };
      const penalties: BotDeathPenalties = {
        xpLost: 0,
        goldLost: 20,
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      expect(bot.currency.copper).toBe(10);
      expect(bot.currency.silver).toBe(0);
      expect(bot.currency.gold).toBe(0);
    });

    it('should convert silver to copper when copper is insufficient', () => {
      bot.currency = { copper: 5, silver: 2, gold: 0 };
      const penalties: BotDeathPenalties = {
        xpLost: 0,
        goldLost: 15, // 15 copper needed, only 5 available
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      // After: 5c taken, 10c needed from silver (1s = 10c), 1s left
      expect(bot.currency.copper).toBe(0);
      expect(bot.currency.silver).toBe(1);
      expect(bot.currency.gold).toBe(0);
    });

    it('should convert gold to copper when silver is insufficient', () => {
      bot.currency = { copper: 5, silver: 0, gold: 1 };
      const penalties: BotDeathPenalties = {
        xpLost: 0,
        goldLost: 50, // 50 copper needed
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      // After: (5 + 100) - 50 = 55 copper, 0 gold left
      // 55 copper = 5 silver 5 copper
      expect(bot.currency.copper).toBe(55);
      expect(bot.currency.silver).toBe(0);
      expect(bot.currency.gold).toBe(0);
    });

    it('should handle complex currency conversion', () => {
      bot.currency = { copper: 10, silver: 2, gold: 1 };
      // Total: 10 + 20 + 100 = 130 copper
      const penalties: BotDeathPenalties = {
        xpLost: 0,
        goldLost: 75, // 75 copper needed
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      // Need 75, have 10 copper. Need 65 more.
      // Take from silver: 2 silver = 20 copper. Now have 30 copper. Still need 45.
      // Take from gold: 1 gold = 100 copper. Now have 130 copper.
      // 130 - 75 = 55 copper remaining
      expect(bot.currency.copper).toBe(55);
      expect(bot.currency.silver).toBe(0);
      expect(bot.currency.gold).toBe(0);
    });

    it('should handle when total currency is less than penalty', () => {
      bot.currency = { copper: 5, silver: 0, gold: 0 };
      const penalties: BotDeathPenalties = {
        xpLost: 0,
        goldLost: 100, // More than available
        memoryEffect: 'gains_caution',
      };

      applyDeathPenalties(bot, penalties);

      // Should take everything, not go negative
      expect(bot.currency.copper).toBe(0);
      expect(bot.currency.silver).toBe(0);
      expect(bot.currency.gold).toBe(0);
    });
  });

  describe('recordDeath', () => {
    it('should add death record to memory.deaths', () => {
      expect(bot.botProfile.memory.deaths.length).toBe(0);

      recordDeath(bot, deathInfo);

      expect(bot.botProfile.memory.deaths.length).toBe(1);
      expect(bot.botProfile.memory.deaths[0].location).toBe('sewer_kings_lair');
      expect(bot.botProfile.memory.deaths[0].killedBy).toBe('Rat King');
    });

    it('should include timestamp in death record', () => {
      recordDeath(bot, deathInfo);

      expect(bot.botProfile.memory.deaths[0].timestamp).toBe(deathInfo.timestamp);
    });

    it('should update relationship with killer - decrease opinion by 30-50', () => {
      recordDeath(bot, deathInfo);

      const relationship = bot.botProfile.relationships.opinions['creature_rat_king'];
      expect(relationship).toBeDefined();
      expect(relationship.opinion).toBeLessThanOrEqual(-30);
      expect(relationship.opinion).toBeGreaterThanOrEqual(-50);
    });

    it('should decrease opinion more for low aggression personality', () => {
      bot.botProfile.personality.aggression = 10;
      recordDeath(bot, deathInfo);

      const relationship = bot.botProfile.relationships.opinions['creature_rat_king'];
      // Low aggression = bigger decrease (closer to -50)
      expect(relationship.opinion).toBeLessThan(-40);
    });

    it('should decrease opinion less for high aggression personality', () => {
      bot.botProfile.personality.aggression = 90;
      recordDeath(bot, deathInfo);

      const relationship = bot.botProfile.relationships.opinions['creature_rat_king'];
      // High aggression = smaller decrease (closer to -30)
      expect(relationship.opinion).toBeGreaterThan(-40);
    });

    it('should accumulate relationship changes on multiple deaths', () => {
      recordDeath(bot, deathInfo);
      const firstOpinion = bot.botProfile.relationships.opinions['creature_rat_king'].opinion;

      recordDeath(bot, deathInfo);
      const secondOpinion = bot.botProfile.relationships.opinions['creature_rat_king'].opinion;

      expect(secondOpinion).toBeLessThan(firstOpinion);
    });

    it('should record hadHelp as false for solo death', () => {
      recordDeath(bot, deathInfo);

      expect(bot.botProfile.memory.deaths[0].hadHelp).toBe(false);
    });

    it('should record empty lostItems array', () => {
      recordDeath(bot, deathInfo);

      expect(bot.botProfile.memory.deaths[0].lostItems).toEqual([]);
    });
  });
});
