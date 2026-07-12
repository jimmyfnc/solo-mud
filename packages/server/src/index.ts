// @solo-mud/server - Game server entry point

import { createApp, startServer } from './app';
import { createSocketServer } from './socket';
import { createTelnetServer } from './telnet';
import { worldManager, WORLD_SEED } from './world/world-manager';
import { loadWorldSnapshot, saveWorldSnapshot } from './db';
import { startGameLoop, stopGameLoop, setBotManager } from './game/game-loop';
import { setBotManager as setAdminBotManager } from './commands/admin-handlers';
import { BotManager, executeBotCommand } from './bots';
import { initializeSharedWorld } from './world/shared-world';
import type { BotSpawnConfig } from '@solo-mud/shared';
import { ensureEconomyState } from './economy/economy-manager';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const TELNET_PORT = parseInt(process.env['TELNET_PORT'] ?? '4000', 10);

async function main() {
  const app = createApp({ logger: true });

  try {
    // Initialize the shared world FIRST - all players and bots share this
    const sharedWorld = initializeSharedWorld();
    console.log(`Shared world ready: ${Object.keys(sharedWorld.locations).length} locations`);

    const { address, server } = await startServer(app, PORT);

    // Initialize Socket.io (for web clients)
    const io = createSocketServer(server);
    console.log(`Solo MUD Server listening at ${address}`);
    console.log(`Socket.io server ready for connections`);

    // Initialize Telnet server (for MUD clients)
    const telnetServer = createTelnetServer(TELNET_PORT);

    // Restore the shared world from its snapshot, or generate a fresh one.
    // A snapshot from a different seed — or from a pre-Western-Reaches world
    // layout — is ignored (regenerate instead).
    try {
      const snapshot = loadWorldSnapshot();
      const isCurrentLayout = snapshot?.locations['wild_road_1'] !== undefined;
      if (snapshot && snapshot.seed === WORLD_SEED && isCurrentLayout) {
        worldManager.setWorld(snapshot);
        console.log(`Shared world restored from snapshot (day ${snapshot.time.day})`);
      } else if (snapshot) {
        console.log('World snapshot is from an old seed/layout — generating a fresh world.');
      }
    } catch (err) {
      console.error('Failed to load world snapshot, generating fresh world:', err);
    }
    const world = worldManager.getWorld();
    ensureEconomyState(world);
    console.log(`Shared world ready (seed: ${world.seed}, ${Object.keys(world.locations).length} locations)`);

    // Start the game loop for creature movement, etc.
    startGameLoop(io);

    // Initialize bot system
    // Per-hub population bands: small towns stay scarce, future castle
    // hubs get big bands (e.g. 15-25) for that busy city feel.
    const botConfig: BotSpawnConfig = {
      zones: [
        {
          id: 'easthollow',
          spawnLocations: ['town_inn', 'town_square'],
          minPopulation: 5,
          maxPopulation: 10,
          levelRange: [1, 5],
        },
        // Future hubs plug in here, e.g.:
        // { id: 'castle_hub', spawnLocations: [...], minPopulation: 15, maxPopulation: 25, levelRange: [20, 35] },
      ],
      // Legacy fallback fields (used when zones is absent)
      minPopulation: 5,
      maxPopulation: 10,
      namedBotCount: 8,
      spawnLocations: ['town_inn', 'town_square'],
      levelRange: [1, 5],
      namedBotRespawnDelay: 1440, // 24 game-hours
    };

    const botManager = new BotManager(botConfig);
    await botManager.initialize();
    botManager.setCommandHandler(executeBotCommand);
    botManager.maintainPopulation(); // Spawn initial bots
    setBotManager(botManager); // game-loop
    setAdminBotManager(botManager); // admin-handlers
    console.log(`Bot system initialized: ${botManager.getAllBots().length} bots active`);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      try {
        saveWorldSnapshot(worldManager.getWorld());
        console.log('World snapshot saved.');
      } catch (err) {
        console.error('Failed to save world snapshot on shutdown:', err);
      }
      stopGameLoop();
      io.close();
      telnetServer.close();
      // Bot manager cleanup (stop AI ticks, etc.)
      setBotManager(undefined as unknown as BotManager);
      setAdminBotManager(undefined as unknown as BotManager);
      await app.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
