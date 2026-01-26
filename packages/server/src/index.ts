// @solo-mud/server - Game server entry point

import { createApp, startServer } from './app';
import { createSocketServer } from './socket';
import { startGameLoop, stopGameLoop } from './game/game-loop';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

async function main() {
  const app = createApp({ logger: true });

  try {
    const { address, server } = await startServer(app, PORT);

    // Initialize Socket.io
    const io = createSocketServer(server);
    console.log(`Solo MUD Server listening at ${address}`);
    console.log(`Socket.io server ready for connections`);

    // Start the game loop for creature movement, etc.
    startGameLoop(io);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      stopGameLoop();
      io.close();
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
