/**
 * Tests for NPC schedule system.
 */

import { describe, it, expect } from 'vitest';
import {
  createNpcSchedule,
  createNpcManager,
  getNpcDialogue,
  type NpcSchedule,
  type NpcManager,
  type NpcDefinition,
} from './schedule';
import type { TimeOfDay, NodeId } from '@solo-mud/shared';

describe('createNpcSchedule', () => {
  it('should create a schedule with all time periods', () => {
    const schedule = createNpcSchedule({
      dawn: { locationId: 'home', activity: 'sleeping' },
      morning: { locationId: 'shop', activity: 'working' },
      noon: { locationId: 'shop', activity: 'working' },
      afternoon: { locationId: 'shop', activity: 'working' },
      evening: { locationId: 'tavern', activity: 'relaxing' },
      night: { locationId: 'home', activity: 'sleeping' },
    });

    expect(schedule.getLocationAt('morning')).toBe('shop');
    expect(schedule.getLocationAt('evening')).toBe('tavern');
    expect(schedule.getLocationAt('night')).toBe('home');
  });

  it('should return activity for each time period', () => {
    const schedule = createNpcSchedule({
      dawn: { locationId: 'home', activity: 'waking' },
      morning: { locationId: 'shop', activity: 'opening shop' },
      noon: { locationId: 'shop', activity: 'serving customers' },
      afternoon: { locationId: 'shop', activity: 'restocking' },
      evening: { locationId: 'tavern', activity: 'drinking' },
      night: { locationId: 'home', activity: 'sleeping' },
    });

    expect(schedule.getActivityAt('morning')).toBe('opening shop');
    expect(schedule.getActivityAt('noon')).toBe('serving customers');
  });

  it('should support optional dialogue per period', () => {
    const schedule = createNpcSchedule({
      dawn: { locationId: 'home', activity: 'sleeping' },
      morning: { locationId: 'shop', activity: 'working', dialogue: 'Welcome to my shop!' },
      noon: { locationId: 'shop', activity: 'working', dialogue: 'What can I get you?' },
      afternoon: { locationId: 'shop', activity: 'working' },
      evening: { locationId: 'tavern', activity: 'drinking', dialogue: 'Join me for a drink!' },
      night: { locationId: 'home', activity: 'sleeping' },
    });

    expect(schedule.getDialogueAt('morning')).toBe('Welcome to my shop!');
    expect(schedule.getDialogueAt('afternoon')).toBeUndefined();
  });
});

describe('createNpcManager', () => {
  const shopkeeper: NpcDefinition = {
    id: 'npc-shopkeeper',
    name: 'Marcus the Shopkeeper',
    role: 'shopkeeper',
    schedule: createNpcSchedule({
      dawn: { locationId: 'home', activity: 'sleeping' },
      morning: { locationId: 'shop', activity: 'working', dialogue: 'Good morning!' },
      noon: { locationId: 'shop', activity: 'working' },
      afternoon: { locationId: 'shop', activity: 'working' },
      evening: { locationId: 'tavern', activity: 'relaxing' },
      night: { locationId: 'home', activity: 'sleeping' },
    }),
  };

  const guard: NpcDefinition = {
    id: 'npc-guard',
    name: 'Town Guard',
    role: 'guard',
    schedule: createNpcSchedule({
      dawn: { locationId: 'barracks', activity: 'preparing' },
      morning: { locationId: 'gate', activity: 'patrolling' },
      noon: { locationId: 'gate', activity: 'standing watch' },
      afternoon: { locationId: 'gate', activity: 'patrolling' },
      evening: { locationId: 'gate', activity: 'standing watch' },
      night: { locationId: 'barracks', activity: 'sleeping' },
    }),
  };

  it('should register NPCs', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);
    manager.registerNpc(guard);

    expect(manager.getNpc('npc-shopkeeper')).toBeDefined();
    expect(manager.getNpc('npc-guard')).toBeDefined();
  });

  it('should return NPCs at a location for a given time', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);
    manager.registerNpc(guard);

    const atShop = manager.getNpcsAtLocation('shop', 'morning');
    expect(atShop).toHaveLength(1);
    expect(atShop[0]!.name).toBe('Marcus the Shopkeeper');

    const atGate = manager.getNpcsAtLocation('gate', 'noon');
    expect(atGate).toHaveLength(1);
    expect(atGate[0]!.name).toBe('Town Guard');
  });

  it('should return empty array when no NPCs at location', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);

    const atGate = manager.getNpcsAtLocation('gate', 'morning');
    expect(atGate).toHaveLength(0);
  });

  it('should get NPC snapshot for room display', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);

    const snapshot = manager.getNpcSnapshot('npc-shopkeeper', 'morning');
    expect(snapshot).toEqual({
      id: 'npc-shopkeeper',
      name: 'Marcus the Shopkeeper',
      role: 'shopkeeper',
      dialogue: 'Good morning!',
    });
  });

  it('should track all registered NPCs', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);
    manager.registerNpc(guard);

    const all = manager.getAllNpcs();
    expect(all).toHaveLength(2);
  });

  it('should unregister NPCs', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);
    manager.unregisterNpc('npc-shopkeeper');

    expect(manager.getNpc('npc-shopkeeper')).toBeUndefined();
  });

  it('should get current location of an NPC', () => {
    const manager = createNpcManager();
    manager.registerNpc(shopkeeper);

    expect(manager.getNpcLocation('npc-shopkeeper', 'morning')).toBe('shop');
    expect(manager.getNpcLocation('npc-shopkeeper', 'night')).toBe('home');
  });
});

describe('getNpcDialogue', () => {
  it('should return time-appropriate greeting', () => {
    const morningDialogue = getNpcDialogue('shopkeeper', 'morning');
    const nightDialogue = getNpcDialogue('shopkeeper', 'night');

    expect(morningDialogue).not.toBe(nightDialogue);
  });

  it('should have role-specific dialogue', () => {
    const shopkeeperDialogue = getNpcDialogue('shopkeeper', 'noon');
    const guardDialogue = getNpcDialogue('guard', 'noon');

    expect(shopkeeperDialogue).not.toBe(guardDialogue);
    expect(shopkeeperDialogue.toLowerCase()).toMatch(/buy|sell|shop|wares/);
    expect(guardDialogue.toLowerCase()).toMatch(/watch|safe|patrol|citizen/);
  });

  it('should have dialogue for common roles', () => {
    const roles = ['shopkeeper', 'guard', 'innkeeper', 'trainer', 'blacksmith'];
    const times: TimeOfDay[] = ['morning', 'noon', 'night'];

    for (const role of roles) {
      for (const time of times) {
        const dialogue = getNpcDialogue(role, time);
        expect(dialogue.length).toBeGreaterThan(0);
      }
    }
  });
});
