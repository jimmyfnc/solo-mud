/**
 * Fastify application setup.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import type { Server as HttpServer } from 'http';

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
      version: process.env['npm_package_version'] ?? '0.2.0',
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
 * Returns the address and the underlying HTTP server for Socket.io integration.
 */
export async function startServer(
  app: FastifyInstance,
  port: number = 3001
): Promise<{ address: string; server: HttpServer }> {
  const address = await app.listen({ port, host: '0.0.0.0' });
  return { address, server: app.server as HttpServer };
}
