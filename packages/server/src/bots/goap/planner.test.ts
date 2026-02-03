import { describe, it, expect } from 'vitest';
import { planActions, selectBestAction, getNextAction, completeAction } from './planner';
import { createBotPlayer } from '../bot-factory';

describe('GOAP Planner', () => {
  describe('selectBestAction', () => {
    it('should select flee when HP low and survive goal', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 10;
      bot.maxHp = 100;
      bot.inCombat = true;
      bot.targetId = 'enemy_1';
      bot.botProfile.personality.bravery = 20; // Not brave

      const action = selectBestAction(bot, 'survive');
      expect(action).toBe('flee');
    });

    it('should select attack when in combat and level_up goal', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 80;
      bot.maxHp = 100;
      bot.inCombat = true;
      bot.targetId = 'enemy_1';

      const action = selectBestAction(bot, 'level_up');
      expect(action).toBe('attack');
    });

    it('should select movement when not in combat and explore goal', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const action = selectBestAction(bot, 'explore');
      expect(['explore', 'travel']).toContain(action);
    });
  });

  describe('planActions', () => {
    it('should return action list for bot', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const plan = planActions(bot);
      expect(plan.length).toBeGreaterThan(0);
      expect(plan[0]).toBeDefined();
    });

    it('should prioritize survival when HP low', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 10;
      bot.maxHp = 100;
      bot.inCombat = true;
      bot.botProfile.personality.bravery = 10;

      const plan = planActions(bot);
      expect(plan[0]).toBe('flee');
    });

    it('should set currentGoalId on bot', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      planActions(bot);
      expect(bot.currentGoalId).toBeDefined();
    });
  });

  describe('getNextAction', () => {
    it('should return first action from plan', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;
      bot.currentPlan = ['explore', 'rest'];

      const action = getNextAction(bot);
      expect(action).toBe('explore');
    });

    it('should create new plan if none exists', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;
      bot.currentPlan = undefined;

      const action = getNextAction(bot);
      expect(action).toBeDefined();
      expect(bot.currentPlan).toBeDefined();
    });
  });

  describe('completeAction', () => {
    it('should remove first action from plan', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentPlan = ['explore', 'rest'];

      completeAction(bot);
      expect(bot.currentPlan).toEqual(['rest']);
    });
  });
});
