/**
 * BotExecutor tests - verify command generation from GOAP actions.
 */

import { describe, it, expect } from 'vitest';
import { BotExecutor } from './bot-executor';
import { createBotPlayer, createBotSession } from './bot-factory';

describe('BotExecutor', () => {
  describe('getNextCommand', () => {
    it('should return attack command when in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';
      bot.currentHp = 80;
      bot.maxHp = 100;
      // Set personality to prefer combat (ensures level_up goal is selected)
      bot.botProfile.personality.patience = 80; // High patience -> high level_up priority
      bot.botProfile.personality.sociability = 10; // Low sociability -> low socialize priority
      bot.botProfile.personality.greed = 10; // Low greed -> low get_richer priority

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const command = executor.getNextCommand(session);
      expect(command).toBe('attack');
    });

    it('should return flee command when HP low', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.targetId = 'enemy_1';
      bot.currentHp = 10;
      bot.maxHp = 100;
      bot.botProfile.personality.bravery = 10;

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const command = executor.getNextCommand(session);
      expect(command).toBe('flee');
    });

    it('should return movement command when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const command = executor.getNextCommand(session);
      // Should be a movement or idle command
      expect(command).toBeDefined();
    });
  });

  describe('shouldTick', () => {
    it('should return true if enough time passed', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.lastAiTick = Date.now() - 10000; // 10 seconds ago

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      expect(executor.shouldTick(session)).toBe(true);
    });

    it('should return false if ticked recently', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.lastAiTick = Date.now();

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      expect(executor.shouldTick(session)).toBe(false);
    });
  });

  describe('markTicked', () => {
    it('should update lastAiTick timestamp', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.lastAiTick = 0;

      const session = createBotSession(bot);
      const executor = new BotExecutor();

      const before = bot.lastAiTick;
      executor.markTicked(session);
      expect(bot.lastAiTick).toBeGreaterThan(before);
    });
  });
});
