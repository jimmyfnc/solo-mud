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
