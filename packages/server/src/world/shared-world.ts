/**
 * Shared Server World - Single world instance for all players and bots.
 *
 * This is the foundation for multiplayer - everyone operates in the same world,
 * seeing the same creatures, items, and other players/bots.
 */

import type { World } from '@solo-mud/shared';
import { generateWorld } from './generate';

/** The single shared world instance */
let sharedWorld: World | null = null;

/** The seed used to generate the shared world */
let worldSeed: string | null = null;

/**
 * Initialize the shared server world.
 * Called once at server startup.
 */
export function initializeSharedWorld(seed?: string): World {
  worldSeed = seed ?? `server-${Date.now()}`;

  sharedWorld = generateWorld({
    seed: worldSeed,
    nodeCount: 20,
    extraEdges: 5,
    lockedEdges: 2,
  });

  console.log(`Shared world initialized with seed: ${worldSeed}`);
  return sharedWorld;
}

/**
 * Get the shared world instance.
 * Throws if world hasn't been initialized.
 */
export function getSharedWorld(): World {
  if (!sharedWorld) {
    throw new Error('Shared world not initialized. Call initializeSharedWorld() first.');
  }
  return sharedWorld;
}

/**
 * Get the shared world seed.
 */
export function getSharedWorldSeed(): string {
  if (!worldSeed) {
    throw new Error('Shared world not initialized.');
  }
  return worldSeed;
}

/**
 * Check if the shared world has been initialized.
 */
export function isSharedWorldInitialized(): boolean {
  return sharedWorld !== null;
}

/**
 * Reset the shared world (for testing or server restart).
 */
export function resetSharedWorld(): void {
  sharedWorld = null;
  worldSeed = null;
}
