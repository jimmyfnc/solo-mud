import { describe, it, expect } from 'vitest';
import { GOALS, calculateGoalPriority, isGoalComplete, selectHighestPriorityGoal } from './goals';
import { createBotPlayer } from '../bot-factory';

describe('Goal System', () => {
  describe('GOALS', () => {
    it('should define survive goal', () => {
      const survive = GOALS.survive;
      expect(survive).toBeDefined();
      expect(survive!.id).toBe('survive');
      expect(survive!.category).toBe('survival');
    });

    it('should define level_up goal', () => {
      const levelUp = GOALS.level_up;
      expect(levelUp).toBeDefined();
      expect(levelUp!.category).toBe('progression');
    });

    it('should define socialize goal', () => {
      const socialize = GOALS.socialize;
      expect(socialize).toBeDefined();
      expect(socialize!.category).toBe('social');
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
      expect(priority).toBeGreaterThanOrEqual(70);
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

    it('should increase survive priority if died recently', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });

      // Bot at moderate HP
      bot.currentHp = 60;
      bot.maxHp = 100;

      const normalPriority = calculateGoalPriority('survive', bot);

      // Add recent death to memory
      bot.botProfile.memory.deaths.push({
        timestamp: Date.now() - 60000, // 1 minute ago
        location: 'sewer',
        killedBy: 'rat_king',
        hadHelp: false,
        lostItems: [],
      });

      const postDeathPriority = calculateGoalPriority('survive', bot);

      // Priority should be higher after recent death
      expect(postDeathPriority).toBeGreaterThan(normalPriority);
    });

    it('should increase explore priority for explorers who havent explored recently', () => {
      const explorerBot = createBotPlayer({
        id: 'explorer',
        name: 'Explorer',
        className: 'ranger',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      explorerBot.botProfile.personality.preferredActivities = ['exploration'];
      // Clear recent events (no recent exploration)
      explorerBot.botProfile.memory.recentEvents = [];

      const neverExploredPriority = calculateGoalPriority('explore', explorerBot);

      // Add a recent exploration event
      explorerBot.botProfile.memory.recentEvents.push({
        type: 'explored_location',
        timestamp: Date.now() - 10000, // 10 seconds ago
        data: { location: 'town_square' },
      });

      const recentlyExploredPriority = calculateGoalPriority('explore', explorerBot);

      // Priority should be higher when haven't explored recently
      expect(neverExploredPriority).toBeGreaterThan(recentlyExploredPriority);
    });

    it('should increase socialize priority for lonely social bots', () => {
      const socialBot = createBotPlayer({
        id: 'social',
        name: 'Social',
        className: 'cleric',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      socialBot.botProfile.personality.sociability = 80;

      // Recent social interaction
      socialBot.botProfile.memory.lastSocialInteraction = Date.now() - 30000; // 30 seconds ago
      const recentPriority = calculateGoalPriority('socialize', socialBot);

      // Long time since social interaction
      socialBot.botProfile.memory.lastSocialInteraction = Date.now() - 600000; // 10 minutes ago
      const lonelyPriority = calculateGoalPriority('socialize', socialBot);

      // Priority should be higher when feeling lonely
      expect(lonelyPriority).toBeGreaterThan(recentPriority);
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

  describe('selectHighestPriorityGoal', () => {
    it('should select survive when HP is critical', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 5;
      bot.maxHp = 100;
      bot.botProfile.personality.bravery = 10; // Not brave

      const goal = selectHighestPriorityGoal(bot);
      expect(goal).toBe('survive');
    });
  });
});
