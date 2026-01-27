/**
 * NPC utility functions for location-based lookups with schedule support.
 */

import type { NPC, TimeOfDay, NodeId } from '../types';

/**
 * Get the current location of an NPC based on time of day.
 * Returns the scheduled location if the NPC has a schedule, otherwise the static locationId.
 */
export function getNpcLocation(npc: NPC, timeOfDay: TimeOfDay): NodeId {
  if (npc.schedule) {
    return npc.schedule[timeOfDay].locationId;
  }
  return npc.locationId;
}

/**
 * Get all NPCs at a specific location, considering schedules.
 *
 * @param allNpcs - Record of all NPCs in the world
 * @param locationNpcIds - Array of NPC IDs statically assigned to the location
 * @param locationId - The location to check
 * @param timeOfDay - Current time of day for schedule checking
 * @returns Array of NPCs currently at this location
 */
export function getNpcsAtLocation(
  allNpcs: Record<string, NPC>,
  locationNpcIds: string[],
  locationId: NodeId,
  timeOfDay: TimeOfDay
): NPC[] {
  const npcsAtLocation: NPC[] = [];
  const seenIds = new Set<string>();

  // First, add static NPCs from the location's list (if they don't have schedules)
  for (const npcId of locationNpcIds) {
    const npc = allNpcs[npcId];
    if (npc && !seenIds.has(npc.id)) {
      // If NPC has a schedule, check if they're actually here at this time
      if (npc.schedule) {
        if (getNpcLocation(npc, timeOfDay) === locationId) {
          npcsAtLocation.push(npc);
          seenIds.add(npc.id);
        }
      } else {
        // Static NPC, add them
        npcsAtLocation.push(npc);
        seenIds.add(npc.id);
      }
    }
  }

  // Then, check all NPCs with schedules to see if they're at this location
  for (const npc of Object.values(allNpcs)) {
    if (npc.schedule && !seenIds.has(npc.id)) {
      if (getNpcLocation(npc, timeOfDay) === locationId) {
        npcsAtLocation.push(npc);
        seenIds.add(npc.id);
      }
    }
  }

  return npcsAtLocation;
}

/**
 * Get NPC activity description based on current time.
 */
export function getNpcActivity(npc: NPC, timeOfDay: TimeOfDay): string | undefined {
  if (npc.schedule) {
    return npc.schedule[timeOfDay].activity;
  }
  return undefined;
}

/**
 * Check if an NPC is a guard (has guard role and combat stats).
 */
export function isGuard(npc: NPC): boolean {
  return npc.role === 'guard' && npc.combat !== undefined;
}

/**
 * Check if an NPC is combat-capable (has combat stats).
 */
export function isCombatCapable(npc: NPC): boolean {
  return npc.combat !== undefined && npc.combat.maxHp > 0;
}

/**
 * Get all guards at a location.
 */
export function getGuardsAtLocation(
  allNpcs: Record<string, NPC>,
  locationNpcIds: string[],
  locationId: NodeId,
  timeOfDay: TimeOfDay
): NPC[] {
  return getNpcsAtLocation(allNpcs, locationNpcIds, locationId, timeOfDay)
    .filter(isGuard);
}

/**
 * Get all combat-capable NPCs at a location (guards, shopkeepers, trainers, etc. with combat stats).
 */
export function getCombatNpcsAtLocation(
  allNpcs: Record<string, NPC>,
  locationNpcIds: string[],
  locationId: NodeId,
  timeOfDay: TimeOfDay
): NPC[] {
  return getNpcsAtLocation(allNpcs, locationNpcIds, locationId, timeOfDay)
    .filter(isCombatCapable);
}
