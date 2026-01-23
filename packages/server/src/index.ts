// @solo-mud/server - Game server entry point

import { createApp, startServer } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

async function main() {
  const app = createApp({ logger: true });

  try {
    const address = await startServer(app, PORT);
    console.log(`Solo MUD Server listening at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
