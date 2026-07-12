/**
 * WorldManager — owns the single shared authoritative world.
 *
 * All player sessions and bot sessions reference this one World instance.
 * This replaces the old model where every session (and every bot) generated
 * its own private world copy. See docs/design/living-world.md, Phase 1.
 */

import type { World, WorldGenParams, TimeOfDay } from '@solo-mud/shared';
import { generateWorld } from './generate';

/** The seed the shared world is generated from. */
export const WORLD_SEED = process.env['WORLD_SEED'] ?? 'easthollow-prime';

/** Default generation parameters for the shared world. */
const DEFAULT_PARAMS: WorldGenParams = {
  seed: WORLD_SEED,
  nodeCount: 18,
  extraEdges: 5,
  lockedEdges: 2,
};

class WorldManager {
  private world: World | null = null;
  private params: WorldGenParams = DEFAULT_PARAMS;

  /** Get the shared world, generating it on first access. */
  getWorld(): World {
    if (!this.world) {
      this.world = generateWorld(this.params);
    }
    return this.world;
  }

  /** Replace the world instance (server reset / tests). */
  setWorld(world: World): void {
    this.world = world;
  }

  /** Drop the world so the next getWorld() regenerates (tests). */
  reset(params?: WorldGenParams): void {
    this.world = null;
    if (params) {
      this.params = params;
    }
  }
}

/** Singleton instance — the one world everyone lives in. */
export const worldManager = new WorldManager();

/**
 * Advance the shared world clock and recompute time of day.
 */
export function advanceWorldTime(world: World, minutes: number): void {
  world.time.totalMinutes += minutes;
  world.time.day = Math.floor(world.time.totalMinutes / (24 * 60)) + 1;
  world.time.timeOfDay = timeOfDayForMinutes(world.time.totalMinutes);
}

/** Map a world-clock value to a time-of-day band. */
export function timeOfDayForMinutes(totalMinutes: number): TimeOfDay {
  const hour = Math.floor((totalMinutes % (24 * 60)) / 60);

  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}
