// @solo-mud/server - Game server entry point

import { createApp, startServer } from './app';
import { createSocketServer } from './socket';
import { createTelnetServer } from './telnet';
import { startGameLoop, stopGameLoop, setBotManager } from './game/game-loop';
import { setBotManager as setAdminBotManager } from './commands/admin-handlers';
import { BotManager, executeBotCommand } from './bots';
import { initializeSharedWorld } from './world/shared-world';
import type { BotSpawnConfig } from '@solo-mud/shared';

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

    // Start the game loop for creature movement, etc.
    startGameLoop(io);

    // Initialize bot system
    const botConfig: BotSpawnConfig = {
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
