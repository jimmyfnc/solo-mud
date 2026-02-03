/**
 * BotExecutor tests - verify command generation from GOAP actions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BotExecutor } from './bot-executor';
import { createBotPlayer, createBotSession } from './bot-factory';
import type { ConversationTrigger, TriggerContext } from './bot-executor';

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

  describe('checkConversationTriggers', () => {
    let executor: BotExecutor;

    beforeEach(() => {
      executor = new BotExecutor();
    });

    it('should return greeting trigger when player enters and random < 0.3', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      // Mock Math.random to return 0.2 (< 0.3)
      vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const context: TriggerContext = { playerEntered: 'Hero' };
      const trigger = executor.checkConversationTriggers(session, context);

      expect(trigger).toEqual({ type: 'greeting', targetName: 'Hero' });

      vi.restoreAllMocks();
    });

    it('should not return greeting trigger when random >= 0.3', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      // Mock Math.random to return 0.5 (>= 0.3)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const context: TriggerContext = { playerEntered: 'Hero' };
      const trigger = executor.checkConversationTriggers(session, context);

      expect(trigger).toBeNull();

      vi.restoreAllMocks();
    });

    it('should return combat_start trigger when combat begins', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const context: TriggerContext = { combatStarted: true };
      const trigger = executor.checkConversationTriggers(session, context);

      expect(trigger).toEqual({ type: 'combat_start' });
    });

    it('should return victory trigger when combat ends with HP > 0', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 50;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      const context: TriggerContext = { combatEnded: true };
      const trigger = executor.checkConversationTriggers(session, context);

      expect(trigger).toEqual({ type: 'victory' });
    });

    it('should not return victory trigger when combat ends with HP <= 0', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.currentHp = 0;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      const context: TriggerContext = { combatEnded: true };
      const trigger = executor.checkConversationTriggers(session, context);

      expect(trigger).toBeNull();
    });

    it('should return low_hp trigger when HP < 30% of maxHp', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.currentHp = 20;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      const trigger = executor.checkConversationTriggers(session);

      expect(trigger).toEqual({ type: 'low_hp' });
    });

    it('should only trigger low_hp once per combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.currentHp = 20;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      // First call should trigger
      const trigger1 = executor.checkConversationTriggers(session);
      expect(trigger1).toEqual({ type: 'low_hp' });

      // Second call should not trigger (already called this combat)
      const trigger2 = executor.checkConversationTriggers(session);
      expect(trigger2).toBeNull();
    });

    it('should reset low_hp tracking when combat ends', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = true;
      bot.currentHp = 20;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      // First call triggers low_hp
      const trigger1 = executor.checkConversationTriggers(session);
      expect(trigger1).toEqual({ type: 'low_hp' });

      // Combat ends
      bot.currentHp = 100; // Healed up
      executor.checkConversationTriggers(session, { combatEnded: true });

      // New combat, low HP again
      bot.inCombat = true;
      bot.currentHp = 20;

      // Should trigger again
      const trigger2 = executor.checkConversationTriggers(session);
      expect(trigger2).toEqual({ type: 'low_hp' });
    });

    it('should return idle trigger with 5% chance when not in combat', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;
      bot.currentHp = 100;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      // Mock Math.random to return 0.03 (< 0.05)
      vi.spyOn(Math, 'random').mockReturnValue(0.03);

      const trigger = executor.checkConversationTriggers(session);

      expect(trigger).toEqual({ type: 'idle' });

      vi.restoreAllMocks();
    });

    it('should not return idle trigger when random >= 0.05', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      bot.inCombat = false;
      bot.currentHp = 100;
      bot.maxHp = 100;
      const session = createBotSession(bot);

      // Mock Math.random to return 0.1 (>= 0.05)
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const trigger = executor.checkConversationTriggers(session);

      expect(trigger).toBeNull();

      vi.restoreAllMocks();
    });
  });

  describe('generateSpeechCommand', () => {
    let executor: BotExecutor;

    beforeEach(() => {
      executor = new BotExecutor();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should generate say command for greeting trigger', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const trigger: ConversationTrigger = { type: 'greeting', targetName: 'Hero' };
      const command = executor.generateSpeechCommand(session, trigger);

      expect(command).toBeDefined();
      expect(command).toMatch(/^say .+/);
    });

    it('should generate say command for combat_start trigger', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const trigger: ConversationTrigger = { type: 'combat_start' };
      const command = executor.generateSpeechCommand(session, trigger);

      expect(command).toBeDefined();
      expect(command).toMatch(/^say .+/);
    });

    it('should generate say command for victory trigger', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const trigger: ConversationTrigger = { type: 'victory' };
      const command = executor.generateSpeechCommand(session, trigger);

      expect(command).toBeDefined();
      expect(command).toMatch(/^say .+/);
    });

    it('should generate say command for low_hp trigger', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const trigger: ConversationTrigger = { type: 'low_hp' };
      const command = executor.generateSpeechCommand(session, trigger);

      expect(command).toBeDefined();
      expect(command).toMatch(/^say .+/);
    });

    it('should generate say command for idle trigger', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const trigger: ConversationTrigger = { type: 'idle' };
      const command = executor.generateSpeechCommand(session, trigger);

      expect(command).toBeDefined();
      expect(command).toMatch(/^say .+/);
    });

    it('should return null for greeting without targetName', () => {
      const bot = createBotPlayer({
        id: 'test',
        name: 'Test',
        className: 'warrior',
        startLocationId: 'town_inn',
        isNamed: false,
      });
      const session = createBotSession(bot);

      const trigger: ConversationTrigger = { type: 'greeting' };
      const command = executor.generateSpeechCommand(session, trigger);

      expect(command).toBeNull();
    });
  });

  describe('getNextCommand with TriggerContext', () => {
    it('should return speech command when trigger context causes speech', () => {
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

      // Mock Math.random to trigger greeting (< 0.3)
      vi.spyOn(Math, 'random').mockReturnValue(0.2);

      const context: TriggerContext = { playerEntered: 'Hero' };
      const command = executor.getNextCommand(session, context);

      // Should return a say command for greeting
      expect(command).toMatch(/^say .+/);

      vi.restoreAllMocks();
    });
  });
});
