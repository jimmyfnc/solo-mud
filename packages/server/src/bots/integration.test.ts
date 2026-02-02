/**
 * Integration tests for bot system with game loop.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BotManager } from './bot-manager';
import type { BotSpawnConfig } from '@solo-mud/shared';

describe('BotManager integration', () => {
  let manager: BotManager;
  const config: BotSpawnConfig = {
    minPopulation: 3,
    maxPopulation: 5,
    namedBotCount: 1,
    spawnLocations: ['town_inn'],
    levelRange: [1, 3],
    namedBotRespawnDelay: 1440,
  };

  beforeEach(() => {
    manager = new BotManager(config);
  });

  describe('tick integration', () => {
    it('should run tick without errors', async () => {
      manager.maintainPopulation();

      // Should not throw
      await expect(manager.tick(0)).resolves.not.toThrow();
    });

    it('should maintain population across ticks', async () => {
      manager.maintainPopulation();
      const initialCount = manager.getBotCount();

      await manager.tick(1000);

      expect(manager.getBotCount()).toBe(initialCount);
    });
  });

  describe('bot sessions', () => {
    it('should create valid bot sessions', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      for (const session of sessions) {
        expect(session.isBot).toBe(true);
        expect(session.player.isBot).toBe(true);
        expect(session.player.botProfile).toBeDefined();
        expect(session.world).toBeDefined();
        expect(session.combatStats).toBeDefined();
      }
    });

    it('should have unique IDs for all bots', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();
      const ids = sessions.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
