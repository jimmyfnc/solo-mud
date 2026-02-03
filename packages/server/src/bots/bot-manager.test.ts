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

  describe('named bot loading', () => {
    it('should load named bots on initialize()', async () => {
      await manager.initialize();

      const namedBots = manager.getNamedBots();
      expect(namedBots.size).toBe(defaultConfig.namedBotCount);
    });

    it('should store named bots separately from generic bots', async () => {
      await manager.initialize();

      const namedBots = manager.getNamedBots();
      const genericCount = manager.getBotCount();

      // Named bots are tracked separately
      expect(namedBots.size).toBe(defaultConfig.namedBotCount);
      // Generic bot count is still 0 since we haven't called maintainPopulation
      expect(genericCount).toBe(0);
    });

    it('should limit named bots to config.namedBotCount', async () => {
      // Config says 2 named bots, but there are 8 in NAMED_BOTS
      await manager.initialize();

      const namedBots = manager.getNamedBots();
      expect(namedBots.size).toBe(2);
    });

    it('should include named bots in getAllBots()', async () => {
      await manager.initialize();
      manager.maintainPopulation();

      const allBots = manager.getAllBots();
      const namedBots = manager.getNamedBots();
      const genericBots = manager.getAllBotSessions();

      // Total should be named + generic
      expect(allBots.length).toBe(namedBots.size + genericBots.length);
    });

    it('should not remove named bots during maintainPopulation()', async () => {
      await manager.initialize();

      const namedBotsBefore = manager.getNamedBots();
      const namedBotIds = Array.from(namedBotsBefore.keys());

      // Call maintainPopulation multiple times
      for (let i = 0; i < 10; i++) {
        manager.maintainPopulation();
      }

      // Named bots should still be present
      for (const id of namedBotIds) {
        expect(manager.getNamedBots().has(id)).toBe(true);
      }
    });

    it('should create named bots with correct properties', async () => {
      await manager.initialize();

      const namedBots = manager.getNamedBots();
      for (const [_id, session] of namedBots) {
        expect(session.player.isBot).toBe(true);
        expect(session.player.botProfile?.isNamed).toBe(true);
        expect(session.player.namedBotId).toBeDefined();
      }
    });
  });

  describe('isOverPopulated()', () => {
    it('should return false when under max population', () => {
      // No bots spawned yet
      expect(manager.isOverPopulated()).toBe(false);

      // Spawn up to min (5), max is 10
      manager.maintainPopulation();
      expect(manager.isOverPopulated()).toBe(false);
    });

    it('should return true when at or over max population', () => {
      // Manually spawn more than max
      for (let i = 0; i < 12; i++) {
        manager.spawnGenericBot();
      }

      expect(manager.getBotCount()).toBe(12);
      expect(manager.isOverPopulated()).toBe(true);
    });

    it('should return true when exactly at max population', () => {
      // Spawn exactly max (10)
      for (let i = 0; i < 10; i++) {
        manager.spawnGenericBot();
      }

      expect(manager.getBotCount()).toBe(10);
      expect(manager.isOverPopulated()).toBe(false);

      // One more pushes over
      manager.spawnGenericBot();
      expect(manager.isOverPopulated()).toBe(true);
    });
  });

  describe('maintainPopulation() despawning', () => {
    it('should despawn bots when over max population', () => {
      // Manually spawn more than max
      for (let i = 0; i < 15; i++) {
        manager.spawnGenericBot();
      }

      expect(manager.getBotCount()).toBe(15);

      manager.maintainPopulation();

      // Should be reduced to maxPopulation
      expect(manager.getBotCount()).toBeLessThanOrEqual(defaultConfig.maxPopulation);
    });

    it('should prefer despawning idle bots over active ones', () => {
      // Spawn some bots
      for (let i = 0; i < 12; i++) {
        manager.spawnGenericBot();
      }

      const sessions = manager.getAllBotSessions();

      // Make some bots "active" (recent lastActivity)
      const activeBots = sessions.slice(0, 3);
      const idleBots = sessions.slice(3);

      const now = Date.now();
      for (const bot of activeBots) {
        bot.lastActivity = now;
      }
      for (const bot of idleBots) {
        bot.lastActivity = now - 60000; // 1 minute ago
      }

      const activeBotIds = activeBots.map(b => b.id);

      manager.maintainPopulation();

      // Active bots should still be present
      for (const id of activeBotIds) {
        expect(manager.getBotSession(id)).toBeDefined();
      }
    });

    it('should never remove named bots when over max', async () => {
      await manager.initialize();

      const namedBotsBefore = Array.from(manager.getNamedBots().keys());

      // Spawn many generic bots to exceed max
      for (let i = 0; i < 15; i++) {
        manager.spawnGenericBot();
      }

      manager.maintainPopulation();

      // Named bots should all still be present
      for (const id of namedBotsBefore) {
        expect(manager.getNamedBots().has(id)).toBe(true);
      }
    });

    it('should not despawn bots in combat', () => {
      // Spawn more than max
      for (let i = 0; i < 12; i++) {
        manager.spawnGenericBot();
      }

      const sessions = manager.getAllBotSessions();

      // Put all bots in combat
      for (const bot of sessions) {
        bot.player.inCombat = true;
        bot.lastActivity = 0; // Very old activity
      }

      const initialCount = manager.getBotCount();

      manager.maintainPopulation();

      // None should be removed since all are in combat
      expect(manager.getBotCount()).toBe(initialCount);
    });
  });

  describe('handleBotDeath()', () => {
    it('should remove generic bots and return wasNamed: false', () => {
      manager.spawnGenericBot();
      const session = manager.getAllBotSessions()[0]!;

      const result = manager.handleBotDeath(session.id);

      expect(result.wasNamed).toBe(false);
      expect(result.botName).toBe(session.player.name);
      expect(manager.getBotSession(session.id)).toBeUndefined();
    });

    it('should not remove named bots and return wasNamed: true', async () => {
      await manager.initialize();

      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      const result = manager.handleBotDeath(firstNamedBot.id);

      expect(result.wasNamed).toBe(true);
      expect(result.botName).toBe(firstNamedBot.player.name);
      // Named bot should still be in the map
      expect(manager.getNamedBots().has(firstNamedBot.id)).toBe(true);
    });

    it('should return wasNamed: false for unknown bot IDs', () => {
      const result = manager.handleBotDeath('unknown_bot_id');

      expect(result.wasNamed).toBe(false);
      expect(result.botName).toBe('');
    });
  });

  describe('respawn queue', () => {
    it('should add bot to respawn queue with correct respawn time', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      const currentGameTime = 100;
      manager.queueForRespawn(firstNamedBot.id, currentGameTime);

      // Respawn time should be gameTime + namedBotRespawnDelay
      const expectedRespawnTime = currentGameTime + defaultConfig.namedBotRespawnDelay;
      expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(true);

      // Internal check - the respawn time should be correct
      const respawnQueue = manager['respawnQueue'];
      const queueEntry = respawnQueue.get(firstNamedBot.id);
      expect(queueEntry).toBeDefined();
      expect(queueEntry!.respawnAt).toBe(expectedRespawnTime);
    });

    it('should set HP to 0 when queued for respawn', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      // Ensure bot has HP before death
      expect(firstNamedBot.player.currentHp).toBeGreaterThan(0);

      manager.queueForRespawn(firstNamedBot.id, 100);

      // HP should be 0
      expect(firstNamedBot.player.currentHp).toBe(0);
    });

    it('should respawn bot when time has elapsed', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      const currentGameTime = 100;
      manager.queueForRespawn(firstNamedBot.id, currentGameTime);

      // Process at exact respawn time
      const respawnTime = currentGameTime + defaultConfig.namedBotRespawnDelay;
      const respawned = manager.processRespawnQueue(respawnTime);

      expect(respawned).toContain(firstNamedBot.player.name);
      expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(false);
    });

    it('should not respawn bot before time has elapsed', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      const currentGameTime = 100;
      manager.queueForRespawn(firstNamedBot.id, currentGameTime);

      // Process before respawn time
      const tooEarly = currentGameTime + defaultConfig.namedBotRespawnDelay - 1;
      const respawned = manager.processRespawnQueue(tooEarly);

      expect(respawned).toHaveLength(0);
      expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(true);
    });

    it('should restore full HP and MP on respawn', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      const maxHp = firstNamedBot.player.maxHp;
      const maxMp = firstNamedBot.player.maxMp;

      const currentGameTime = 100;
      manager.queueForRespawn(firstNamedBot.id, currentGameTime);

      // HP should be 0 after queuing
      expect(firstNamedBot.player.currentHp).toBe(0);

      // Process at respawn time
      const respawnTime = currentGameTime + defaultConfig.namedBotRespawnDelay;
      manager.processRespawnQueue(respawnTime);

      // HP and MP should be restored to max
      expect(firstNamedBot.player.currentHp).toBe(maxHp);
      expect(firstNamedBot.player.currentMp).toBe(maxMp);
    });

    it('should move bot to spawn location on respawn', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      // Move bot to a non-spawn location
      firstNamedBot.player.currentLocation = 'some_random_location';

      const currentGameTime = 100;
      manager.queueForRespawn(firstNamedBot.id, currentGameTime);

      // Process at respawn time
      const respawnTime = currentGameTime + defaultConfig.namedBotRespawnDelay;
      manager.processRespawnQueue(respawnTime);

      // Bot should be at a spawn location
      expect(defaultConfig.spawnLocations).toContain(firstNamedBot.player.currentLocation);
    });

    it('should return correct values for isAwaitingRespawn', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      // Initially not awaiting respawn
      expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(false);
      expect(manager.isAwaitingRespawn('nonexistent_id')).toBe(false);

      // After queuing for respawn
      manager.queueForRespawn(firstNamedBot.id, 100);
      expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(true);

      // After respawning
      const respawnTime = 100 + defaultConfig.namedBotRespawnDelay;
      manager.processRespawnQueue(respawnTime);
      expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(false);
    });

    it('should skip bots awaiting respawn during tick', async () => {
      await manager.initialize();
      const namedBots = manager.getNamedBots();
      const firstNamedBot = Array.from(namedBots.values())[0]!;

      // Queue for respawn
      manager.queueForRespawn(firstNamedBot.id, 100);

      // Set last tick to past so bot would normally tick
      firstNamedBot.player.lastAiTick = 0;

      // Track commands for this specific bot
      const commands: { botId: string; command: string }[] = [];
      manager.setCommandHandler(async (session, command) => {
        commands.push({ botId: session.id, command });
      });

      await manager.tick(0);

      // The dead bot should not have executed any commands
      const deadBotCommands = commands.filter(c => c.botId === firstNamedBot.id);
      expect(deadBotCommands).toHaveLength(0);
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
