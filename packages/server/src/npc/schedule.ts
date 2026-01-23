/**
 * NPC schedule system for time-based NPC behavior and locations.
 */

import type { TimeOfDay, NodeId } from '@solo-mud/shared';
import type { NpcSnapshot } from '@solo-mud/shared';

/** Schedule entry for a time period */
export interface ScheduleEntry {
  locationId: NodeId;
  activity: string;
  dialogue?: string;
}

/** Full schedule mapping time periods to entries */
export type ScheduleMap = Record<TimeOfDay, ScheduleEntry>;

/** NPC schedule interface */
export interface NpcSchedule {
  getLocationAt(time: TimeOfDay): NodeId;
  getActivityAt(time: TimeOfDay): string;
  getDialogueAt(time: TimeOfDay): string | undefined;
}

/** NPC definition with schedule */
export interface NpcDefinition {
  id: string;
  name: string;
  role: string;
  schedule: NpcSchedule;
}

/** NPC manager interface */
export interface NpcManager {
  registerNpc(npc: NpcDefinition): void;
  unregisterNpc(id: string): void;
  getNpc(id: string): NpcDefinition | undefined;
  getAllNpcs(): NpcDefinition[];
  getNpcsAtLocation(locationId: NodeId, time: TimeOfDay): NpcDefinition[];
  getNpcSnapshot(id: string, time: TimeOfDay): NpcSnapshot | undefined;
  getNpcLocation(id: string, time: TimeOfDay): NodeId | undefined;
}

/**
 * Create an NPC schedule from a schedule map.
 */
export function createNpcSchedule(entries: ScheduleMap): NpcSchedule {
  return {
    getLocationAt(time: TimeOfDay): NodeId {
      return entries[time].locationId;
    },
    getActivityAt(time: TimeOfDay): string {
      return entries[time].activity;
    },
    getDialogueAt(time: TimeOfDay): string | undefined {
      return entries[time].dialogue;
    },
  };
}

/**
 * Create an NPC manager for tracking NPCs and their schedules.
 */
export function createNpcManager(): NpcManager {
  const npcs = new Map<string, NpcDefinition>();

  return {
    registerNpc(npc: NpcDefinition): void {
      npcs.set(npc.id, npc);
    },

    unregisterNpc(id: string): void {
      npcs.delete(id);
    },

    getNpc(id: string): NpcDefinition | undefined {
      return npcs.get(id);
    },

    getAllNpcs(): NpcDefinition[] {
      return Array.from(npcs.values());
    },

    getNpcsAtLocation(locationId: NodeId, time: TimeOfDay): NpcDefinition[] {
      return Array.from(npcs.values()).filter(
        (npc) => npc.schedule.getLocationAt(time) === locationId
      );
    },

    getNpcSnapshot(id: string, time: TimeOfDay): NpcSnapshot | undefined {
      const npc = npcs.get(id);
      if (!npc) return undefined;

      return {
        id: npc.id,
        name: npc.name,
        role: npc.role,
        dialogue: npc.schedule.getDialogueAt(time),
      };
    },

    getNpcLocation(id: string, time: TimeOfDay): NodeId | undefined {
      const npc = npcs.get(id);
      if (!npc) return undefined;
      return npc.schedule.getLocationAt(time);
    },
  };
}

/** Default dialogue by role and time */
const ROLE_DIALOGUE: Record<string, Partial<Record<TimeOfDay, string>>> = {
  shopkeeper: {
    dawn: 'Just opening up. Come back soon!',
    morning: 'Welcome! Take a look at my wares.',
    noon: 'Looking to buy or sell something?',
    afternoon: 'Best prices in town, I assure you.',
    evening: "Shop's closing soon, but I can help you.",
    night: 'The shop is closed. Come back tomorrow.',
  },
  guard: {
    dawn: 'Morning patrol begins. Stay safe, citizen.',
    morning: 'All is well. Move along, citizen.',
    noon: 'Standing watch. No trouble here.',
    afternoon: 'Stay vigilant on your travels.',
    evening: 'Heading home? Stay on the main roads.',
    night: 'Patrol continues. Keep your torch lit.',
  },
  innkeeper: {
    dawn: "Coffee's brewing. Early bird, are you?",
    morning: 'Breakfast is being served!',
    noon: 'Hungry? We have stew today.',
    afternoon: 'Need a room? We have vacancies.',
    evening: 'The common room is lively tonight!',
    night: "Last call! We close at midnight.",
  },
  trainer: {
    dawn: "Early practice makes perfect. Let's train!",
    morning: 'Ready to improve your skills?',
    noon: 'Taking a break. Come back later.',
    afternoon: 'Afternoon sessions are available.',
    evening: 'One more session before I rest?',
    night: 'Training is closed for the night.',
  },
  blacksmith: {
    dawn: 'Lighting the forge. Give me a moment.',
    morning: 'The forge is hot! What needs smithing?',
    noon: 'Fine steel takes time. I can repair your gear.',
    afternoon: 'Hammer and anvil, that is my life.',
    evening: 'Last orders for the day.',
    night: 'The forge is cold. Return at dawn.',
  },
};

/** Fallback dialogue for unknown roles */
const FALLBACK_DIALOGUE: Record<TimeOfDay, string> = {
  dawn: 'Good morning to you.',
  morning: 'Hello there.',
  noon: 'Good day.',
  afternoon: 'Good afternoon.',
  evening: 'Good evening.',
  night: 'A quiet night, is it not?',
};

/**
 * Get appropriate dialogue for an NPC role at a given time.
 */
export function getNpcDialogue(role: string, time: TimeOfDay): string {
  const roleDialogue = ROLE_DIALOGUE[role];
  if (roleDialogue && roleDialogue[time]) {
    return roleDialogue[time]!;
  }
  return FALLBACK_DIALOGUE[time];
}
