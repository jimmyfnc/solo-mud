/**
 * Fastify application setup.
 */

import Fastify, { type FastifyInstance } from 'fastify';

export interface AppOptions {
  logger?: boolean;
}

/**
 * Create and configure the Fastify application.
 */
export function createApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  // API info endpoint
  app.get('/api', async () => {
    return {
      name: 'Solo MUD Server',
      version: '0.1.0',
      endpoints: {
        health: '/health',
        socket: '/socket.io',
      },
    };
  });

  return app;
}

/**
 * Start the server on the specified port.
 */
export async function startServer(
  app: FastifyInstance,
  port: number = 3001
): Promise<string> {
  const address = await app.listen({ port, host: '0.0.0.0' });
  return address;
}
