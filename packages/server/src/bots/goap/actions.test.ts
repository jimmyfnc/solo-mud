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

    it('should have lower explore cost for exploration-focused bots', () => {
      const explorerBot = createBotPlayer({
        id: 'explorer',
        name: 'Explorer',
        className: 'ranger',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      explorerBot.botProfile.personality.preferredActivities = ['exploration'];

      const fighterBot = createBotPlayer({
        id: 'fighter',
        name: 'Fighter',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      fighterBot.botProfile.personality.preferredActivities = ['combat'];

      const explorerCost = getActionCost('explore', explorerBot);
      const fighterCost = getActionCost('explore', fighterBot);

      expect(explorerCost).toBeLessThan(fighterCost);
    });

    it('should have lower flee cost after recent death', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.botProfile.personality.bravery = 50;

      const normalCost = getActionCost('flee', bot);

      // Add recent death to memory
      bot.botProfile.memory.deaths.push({
        timestamp: Date.now() - 60000, // 1 minute ago
        location: 'sewer',
        killedBy: 'rat_king',
        hadHelp: false,
        lostItems: [],
      });

      const postDeathCost = getActionCost('flee', bot);

      // Fleeing should be cheaper after recent death (learned caution)
      expect(postDeathCost).toBeLessThan(normalCost);
    });

    it('should have lower explore cost when havent explored recently', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.botProfile.personality.preferredActivities = ['exploration'];

      // Recent exploration
      bot.botProfile.memory.recentEvents.push({
        type: 'explored_location',
        timestamp: Date.now() - 10000, // 10 seconds ago
        data: { location: 'town_square' },
      });

      const recentCost = getActionCost('explore', bot);

      // Clear recent events (no recent exploration)
      bot.botProfile.memory.recentEvents = [];

      const notRecentCost = getActionCost('explore', bot);

      // Should be cheaper when haven't explored recently
      expect(notRecentCost).toBeLessThan(recentCost);
    });
  });
});
