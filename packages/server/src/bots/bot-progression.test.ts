/**
 * Tests that bots really live in the world: they fight through the real
 * command pipeline, earn XP, level up, and hub populations respect their
 * per-zone bands.
 */

import { describe, it, expect } from 'vitest';
import type { BotSpawnConfig, Creature } from '@solo-mud/shared';
import { BotManager } from './bot-manager';
import { executeBotCommand } from './bot-command-handler';
import { worldManager } from '../world/world-manager';

describe('bot combat progression', () => {
  it('a bot kill through the real command pipeline grants XP and levels', async () => {
    const config: BotSpawnConfig = {
      minPopulation: 1, maxPopulation: 1, namedBotCount: 0,
      spawnLocations: ['town_outside_walls'], levelRange: [2, 2],
      namedBotRespawnDelay: 1440,
    };
    const manager = new BotManager(config);
    const session = manager.spawnGenericBot();
    const bot = session.player;
    const world = session.world;

    // Bot shares the one authoritative world
    expect(world).toBe(worldManager.getWorld());

    // Stage a dying rat in front of the bot
    bot.locationId = 'town_outside_walls';
    const rat: Creature = {
      id: 'test_rat_botxp', templateId: 'sewer_rat', name: 'Rat', level: 2,
      behavior: 'aggressive', mobility: 'static',
      currentHp: 1, maxHp: 15,
      locationId: 'town_outside_walls', homeLocationId: 'town_outside_walls',
      spawnLocationId: 'town_outside_walls', inCombat: false, description: 'A rat.',
    };
    world.creatures[rat.id] = rat;
    world.locations['town_outside_walls']!.creatures.push(rat.id);

    const xpBefore = bot.xp;
    // One point of HP — the bot's first swing kills (hit is near-certain,
    // but allow a few attempts for misses)
    for (let i = 0; i < 5 && world.creatures[rat.id]; i++) {
      bot.inCombat = false; // allow re-engage after a miss round
      bot.targetId = undefined;
      await executeBotCommand(session, 'attack rat');
    }

    expect(world.creatures[rat.id]).toBeUndefined(); // dead and cleaned up
    expect(bot.xp).toBeGreaterThan(xpBefore);        // XP granted to the bot
  });

  it('a bot with enough XP levels up from its kill', async () => {
    const config: BotSpawnConfig = {
      minPopulation: 1, maxPopulation: 1, namedBotCount: 0,
      spawnLocations: ['town_outside_walls'], levelRange: [2, 2],
      namedBotRespawnDelay: 1440,
    };
    const manager = new BotManager(config);
    const session = manager.spawnGenericBot();
    const bot = session.player;
    const world = session.world;

    bot.locationId = 'town_outside_walls';
    bot.xpToNextLevel = bot.xp + 1; // next kill levels
    const levelBefore = bot.level;

    const rat: Creature = {
      id: 'test_rat_botlevel', templateId: 'sewer_rat', name: 'Rat', level: 2,
      behavior: 'aggressive', mobility: 'static',
      currentHp: 1, maxHp: 15,
      locationId: 'town_outside_walls', homeLocationId: 'town_outside_walls',
      spawnLocationId: 'town_outside_walls', inCombat: false, description: 'A rat.',
    };
    world.creatures[rat.id] = rat;
    world.locations['town_outside_walls']!.creatures.push(rat.id);

    for (let i = 0; i < 5 && world.creatures[rat.id]; i++) {
      bot.inCombat = false;
      bot.targetId = undefined;
      await executeBotCommand(session, 'attack rat');
    }

    expect(bot.level).toBe(levelBefore + 1);
  });
});

describe('zone-based bot populations', () => {
  it('each hub maintains its own population band', () => {
    const config: BotSpawnConfig = {
      zones: [
        { id: 'hamlet', spawnLocations: ['town_inn'], minPopulation: 2, maxPopulation: 3, levelRange: [1, 3] },
        { id: 'city', spawnLocations: ['town_square'], minPopulation: 6, maxPopulation: 8, levelRange: [5, 10] },
      ],
      minPopulation: 0, maxPopulation: 0, namedBotCount: 0,
      spawnLocations: [], levelRange: [1, 1], namedBotRespawnDelay: 1440,
    };
    const manager = new BotManager(config);
    manager.maintainPopulation();

    const bots = manager.getAllBotSessions();
    const hamletBots = bots.filter(b => b.player.locationId === 'town_inn');
    const cityBots = bots.filter(b => b.player.locationId === 'town_square');

    expect(hamletBots.length).toBe(2);       // scarce frontier
    expect(cityBots.length).toBe(6);         // busy city
    // City bots come in at the hub's level range
    for (const b of cityBots) {
      expect(b.player.level).toBeGreaterThanOrEqual(5);
      expect(b.player.level).toBeLessThanOrEqual(10);
    }
  });

  it('legacy configs without zones still work as a single band', () => {
    const config: BotSpawnConfig = {
      minPopulation: 4, maxPopulation: 6, namedBotCount: 0,
      spawnLocations: ['town_square'], levelRange: [1, 5],
      namedBotRespawnDelay: 1440,
    };
    const manager = new BotManager(config);
    manager.maintainPopulation();
    expect(manager.getBotCount()).toBe(4);
  });
});
