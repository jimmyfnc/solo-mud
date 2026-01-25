/**
 * Ecosystem logic - hunting, fleeing, intimidation, and combat resolution.
 */

import type { Creature, CreatureTier, World, NodeId } from '@solo-mud/shared';
import { TIER_CONFIG, HUNT_LEVEL_THRESHOLD } from '@solo-mud/shared';

/**
 * Check if a creature is intimidated by a target's level.
 */
export function isIntimidated(
  creature: Creature,
  targetLevel: number,
  tier: CreatureTier
): boolean {
  const gap = targetLevel - creature.level;
  return gap >= TIER_CONFIG[tier].intimidationGap;
}

/**
 * Check if a predator can hunt a prey creature.
 * Must be aggressive/territorial and 2+ levels above.
 */
export function canHunt(
  predator: Creature,
  prey: Creature,
  predatorTier: CreatureTier
): boolean {
  // Passive creatures don't hunt
  if (predator.behavior === 'passive') {
    return false;
  }

  // Must be 2+ levels above prey
  const levelGap = predator.level - prey.level;
  if (levelGap < HUNT_LEVEL_THRESHOLD) {
    return false;
  }

  // Check if predator would be intimidated by prey (shouldn't happen but safety check)
  if (isIntimidated(predator, prey.level, predatorTier)) {
    return false;
  }

  return true;
}

/**
 * Get the distance in rooms from the player to a location.
 * Uses BFS to find shortest path.
 */
export function getDistanceFromPlayer(
  world: World,
  playerLocationId: NodeId,
  targetLocationId: NodeId
): number {
  if (playerLocationId === targetLocationId) {
    return 0;
  }

  const visited = new Set<NodeId>();
  const queue: Array<{ id: NodeId; distance: number }> = [
    { id: playerLocationId, distance: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const exitIds = world.adjacency[current.id] ?? [];
    for (const exitId of exitIds) {
      const exit = world.exits[exitId];
      if (!exit) continue;

      if (exit.to === targetLocationId) {
        return current.distance + 1;
      }

      if (!visited.has(exit.to)) {
        queue.push({ id: exit.to, distance: current.distance + 1 });
      }
    }
  }

  return Infinity; // Not reachable
}

/**
 * Check if a location is within a creature's territory.
 * Territory = spawn location + adjacent locations.
 */
export function isInTerritory(
  world: World,
  creature: Creature,
  locationId: NodeId
): boolean {
  // Home is always territory
  if (creature.spawnLocationId === locationId) {
    return true;
  }

  // Check if locationId is adjacent to spawn location
  const exitIds = world.adjacency[creature.spawnLocationId] ?? [];
  for (const exitId of exitIds) {
    const exit = world.exits[exitId];
    if (exit && exit.to === locationId) {
      return true;
    }
  }

  return false;
}

/**
 * Get adjacent location IDs from a given location.
 */
export function getAdjacentLocations(world: World, locationId: NodeId): NodeId[] {
  const exitIds = world.adjacency[locationId] ?? [];
  const adjacentIds: NodeId[] = [];

  for (const exitId of exitIds) {
    const exit = world.exits[exitId];
    if (exit && exit.type !== 'locked') {
      adjacentIds.push(exit.to);
    }
  }

  return adjacentIds;
}

/**
 * Find prey creatures in adjacent locations.
 * Returns array of { locationId, creatures } for locations with valid prey.
 */
export function findPreyInAdjacentLocations(
  world: World,
  predator: Creature,
  predatorTier: CreatureTier
): Array<{ locationId: NodeId; creatures: Creature[] }> {
  const adjacent = getAdjacentLocations(world, predator.locationId);
  const results: Array<{ locationId: NodeId; creatures: Creature[] }> = [];

  for (const locId of adjacent) {
    const location = world.locations[locId];
    if (!location) continue;

    const prey = location.creatures
      .map((id) => world.creatures[id])
      .filter((c): c is Creature => {
        if (!c || c.currentHp <= 0 || c.inCombat) return false;
        return canHunt(predator, c, predatorTier);
      });

    if (prey.length > 0) {
      results.push({ locationId: locId, creatures: prey });
    }
  }

  return results;
}

/**
 * Calculate combat power for instant resolution.
 */
export function calculateCombatPower(
  creature: Creature,
  isDefendingTerritory: boolean
): number {
  let power = creature.level * creature.maxHp;

  if (isDefendingTerritory) {
    power *= 1.2; // 20% bonus for territorial defense
  }

  return power;
}

/**
 * Resolve instant combat between two creatures.
 * Returns the winner and loser.
 */
export function resolveInstantCombat(
  attacker: Creature,
  defender: Creature,
  defenderInTerritory: boolean,
  rng: { next: () => number }
): { winner: Creature; loser: Creature } {
  const attackerPower = calculateCombatPower(attacker, false);
  const defenderPower = calculateCombatPower(defender, defenderInTerritory);

  // Add ±10% variance
  const attackerRoll = attackerPower * (0.9 + rng.next() * 0.2);
  const defenderRoll = defenderPower * (0.9 + rng.next() * 0.2);

  if (attackerRoll >= defenderRoll) {
    return { winner: attacker, loser: defender };
  } else {
    return { winner: defender, loser: attacker };
  }
}
