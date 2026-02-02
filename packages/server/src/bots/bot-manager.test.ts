/**
 * Tests for BotManager.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BotManager } from './bot-manager';
import type { BotSpawnConfig } from '@solo-mud/shared';

describe('BotManager', () => {
  let manager: BotManager;
  const defaultConfig: BotSpawnConfig = {
    minPopulation: 5,
    maxPopulation: 10,
    namedBotCount: 2,
    spawnLocations: ['town_inn', 'town_square'],
    levelRange: [1, 5],
    namedBotRespawnDelay: 1440,
  };

  beforeEach(() => {
    manager = new BotManager(defaultConfig);
  });

  describe('initialization', () => {
    it('should start with zero bots', () => {
      expect(manager.getBotCount()).toBe(0);
    });

    it('should store config', () => {
      expect(manager.getConfig()).toEqual(defaultConfig);
    });
  });

  describe('population management', () => {
    it('should spawn bots when below minimum', () => {
      manager.maintainPopulation();

      // Should spawn up to minPopulation
      expect(manager.getBotCount()).toBeGreaterThanOrEqual(defaultConfig.minPopulation);
    });

    it('should not exceed maximum population', () => {
      // Force spawn many times
      for (let i = 0; i < 20; i++) {
        manager.maintainPopulation();
      }

      expect(manager.getBotCount()).toBeLessThanOrEqual(defaultConfig.maxPopulation);
    });

    it('should return all bot sessions', () => {
      manager.maintainPopulation();

      const sessions = manager.getAllBotSessions();
      expect(sessions.length).toBe(manager.getBotCount());
    });
  });

  describe('bot retrieval', () => {
    it('should get bot by ID', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      if (sessions.length > 0) {
        const firstBot = sessions[0]!;
        const retrieved = manager.getBotSession(firstBot.id);
        expect(retrieved).toBe(firstBot);
      }
    });

    it('should return undefined for unknown ID', () => {
      const retrieved = manager.getBotSession('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('bot removal', () => {
    it('should remove bot by ID', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      if (sessions.length > 0) {
        const firstBot = sessions[0]!;
        const removed = manager.removeBot(firstBot.id);
        expect(removed).toBe(true);
        expect(manager.getBotSession(firstBot.id)).toBeUndefined();
      }
    });

    it('should return false for unknown ID', () => {
      const removed = manager.removeBot('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('AI tick', () => {
    it('should use executor for bot commands', async () => {
      manager.maintainPopulation();

      // Set last tick to past so bots will tick
      for (const session of manager.getAllBotSessions()) {
        session.player.lastAiTick = 0;
      }

      // Mock command handler
      const commands: string[] = [];
      manager.setCommandHandler(async (_session, command) => {
        commands.push(command);
      });

      await manager.tick(0);

      // Should have generated some commands
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should skip bots in combat', async () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      // Put all bots in combat
      for (const session of sessions) {
        session.player.inCombat = true;
        session.player.lastAiTick = 0;
      }

      const commands: string[] = [];
      manager.setCommandHandler(async (_session, command) => {
        commands.push(command);
      });

      await manager.tick(0);

      // No commands - combat bots are skipped
      expect(commands.length).toBe(0);
    });

    it('should skip bots that ticked recently', async () => {
      manager.maintainPopulation();

      // Set last tick to now
      for (const session of manager.getAllBotSessions()) {
        session.player.lastAiTick = Date.now();
      }

      const commands: string[] = [];
      manager.setCommandHandler(async (_session, command) => {
        commands.push(command);
      });

      await manager.tick(0);

      // No commands - bots ticked recently
      expect(commands.length).toBe(0);
    });
  });
});
