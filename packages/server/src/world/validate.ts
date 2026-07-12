/**
 * World validation - ensures generated worlds are solvable.
 */

import type { World, NodeId, ItemId, Requirement } from '@solo-mud/shared';

export interface ReachabilityResult {
  reachable: Set<NodeId>;
  inventory: Set<ItemId>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  reachability?: ReachabilityResult;
}

/**
 * Simulate player traversal to determine reachable locations.
 * Starts at startId, collects items, unlocks paths until no progress.
 */
export function simulateReachability(world: World): ReachabilityResult {
  const reachable = new Set<NodeId>([world.startId]);
  const inventory = new Set<ItemId>();

  // Collect items from starting location
  collectItems(world, world.startId, inventory);

  let changed = true;
  while (changed) {
    changed = false;

    // Try to traverse all exits from reachable locations
    for (const locationId of reachable) {
      const exitIds = world.adjacency[locationId] ?? [];

      for (const exitId of exitIds) {
        const exit = world.exits[exitId];
        if (!exit) continue;

        const targetId = exit.to;
        if (reachable.has(targetId)) continue;

        // Check if we can traverse this exit
        if (canTraverse(exit, inventory)) {
          reachable.add(targetId);
          collectItems(world, targetId, inventory);
          changed = true;
        }
      }
    }
  }

  return { reachable, inventory };
}

/**
 * Check if an exit can be traversed with current inventory.
 */
function canTraverse(exit: { type: string; requirement?: Requirement }, inventory: Set<ItemId>): boolean {
  if (exit.type === 'open') return true;
  if (exit.type === 'locked' && exit.requirement) {
    if (exit.requirement.kind === 'item') {
      return inventory.has(exit.requirement.value as string);
    }
    if (exit.requirement.kind === 'puzzle') {
      // Puzzles are always solvable in place — no item needed
      return true;
    }
    // TODO: Handle level/quest requirements
  }
  return false;
}

/**
 * Collect all items from a location into inventory.
 */
function collectItems(world: World, locationId: NodeId, inventory: Set<ItemId>): void {
  const location = world.locations[locationId];
  if (!location) return;

  for (const itemId of location.items) {
    inventory.add(itemId);
  }
}

/**
 * Validate that a world is solvable and well-formed.
 */
export function validateWorld(world: World): ValidationResult {
  const errors: string[] = [];

  // Check basic structure
  if (!world.locations[world.startId]) {
    errors.push(`Start location '${world.startId}' does not exist`);
  }
  if (!world.locations[world.goalId]) {
    errors.push(`Goal location '${world.goalId}' does not exist`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Check connectivity (ignoring lock requirements)
  const allReachable = checkConnectivity(world);
  if (!allReachable) {
    errors.push('World graph is not fully connected');
  }

  // Simulate reachability with locks/keys
  const reachability = simulateReachability(world);

  if (!reachability.reachable.has(world.goalId)) {
    errors.push(`Goal '${world.goalId}' is unreachable from start`);
  }

  return {
    valid: errors.length === 0,
    errors,
    reachability,
  };
}

/**
 * Check if all locations are connected (ignoring lock requirements).
 */
function checkConnectivity(world: World): boolean {
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [world.startId];
  visited.add(world.startId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const exitIds = world.adjacency[current] ?? [];

    for (const exitId of exitIds) {
      const exit = world.exits[exitId];
      if (!exit) continue;

      if (!visited.has(exit.to)) {
        visited.add(exit.to);
        queue.push(exit.to);
      }
    }
  }

  // All locations should be visited
  const locationCount = Object.keys(world.locations).length;
  return visited.size === locationCount;
}
