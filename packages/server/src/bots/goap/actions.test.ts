import { describe, it, expect } from 'vitest';
import { ACTIONS, checkPreconditions, getAvailableActions, getActionCost } from './actions';
import { createBotPlayer } from '../bot-factory';

describe('Action System', () => {
  describe('ACTIONS', () => {
    it('should define attack action', () => {
      expect(ACTIONS.attack).toBeDefined();
      expect(ACTIONS.attack.category).toBe('combat');
    });

    it('should define flee action', () => {
      expect(ACTIONS.flee).toBeDefined();
      expect(ACTIONS.flee.category).toBe('combat');
    });

    it('should define travel action', () => {
      expect(ACTIONS.travel).toBeDefined();
      expect(ACTIONS.travel.category).toBe('movement');
    });
  });

  describe('checkPreconditions', () => {
    it('should pass attack preconditions when in combat with target', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';

      expect(checkPreconditions('attack', bot)).toBe(true);
    });

    it('should fail attack preconditions when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      expect(checkPreconditions('attack', bot)).toBe(false);
    });

    it('should pass flee preconditions when in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;

      expect(checkPreconditions('flee', bot)).toBe(true);
    });

    it('should pass rest preconditions when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      expect(checkPreconditions('rest', bot)).toBe(true);
    });
  });

  describe('getAvailableActions', () => {
    it('should return combat actions when in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';

      const actions = getAvailableActions(bot);
      expect(actions).toContain('attack');
      expect(actions).toContain('flee');
    });

    it('should return movement actions when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const actions = getAvailableActions(bot);
      expect(actions).toContain('travel');
      expect(actions).toContain('explore');
      expect(actions).toContain('rest');
    });
  });

  describe('getActionCost', () => {
    it('should return higher flee cost for brave bots', () => {
      const braveBotP = createBotPlayer({
        id: 'brave',
        name: 'Brave',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      braveBotP.botProfile.personality.bravery = 90;

      const cowardBotP = createBotPlayer({
        id: 'coward',
        name: 'Coward',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      cowardBotP.botProfile.personality.bravery = 10;

      const braveCost = getActionCost('flee', braveBotP);
      const cowardCost = getActionCost('flee', cowardBotP);

      expect(braveCost).toBeGreaterThan(cowardCost);
    });
  });
});
