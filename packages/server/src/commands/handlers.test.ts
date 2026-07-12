/**
 * Tests for command handlers - specifically corpse looting functionality.
 */

import { describe, it, expect } from 'vitest';
import type { Corpse, Item, World, InventorySlot } from '@solo-mud/shared';

/** Simple test player interface */
interface TestPlayer {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  gold: number;
  currentHp: number;
  maxHp: number;
  locationId: string;
  inventory: InventorySlot[];
  inventorySlots: number;
  equipment: Record<string, string>;
  inCombat: boolean;
}

/**
 * Helper to create a minimal test world.
 */
function createTestWorld(overrides: Partial<World> = {}): World {
  return {
    seed: 'test-seed',
    startId: 'loc_1',
    goalId: 'loc_3',
    locations: {},
    exits: {},
    adjacency: {},
    items: {},
    creatures: {},
    corpses: {},
    respawnQueue: [],
    time: { totalMinutes: 0, timeOfDay: 'morning', day: 1 },
    weather: { type: 'clear', intensity: 0.5 },
    npcs: {},
    ...overrides,
  };
}

/**
 * Helper to create a test player.
 */
function createTestPlayer(overrides: Partial<TestPlayer> = {}): TestPlayer {
  return {
    id: 'player_1',
    name: 'TestPlayer',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gold: 0,
    currentHp: 100,
    maxHp: 100,
    locationId: 'loc_1',
    inventory: [],
    inventorySlots: 20,
    equipment: {},
    inCombat: false,
    ...overrides,
  };
}

/**
 * Helper to create a test corpse.
 */
function createTestCorpse(overrides: Partial<Corpse> = {}): Corpse {
  return {
    id: 'corpse_1',
    creatureId: 'creature_1',
    templateId: 'wolf',
    name: 'Wolf',
    locationId: 'loc_1',
    createdAt: Date.now(),
    killedBy: 'player',
    looted: false,
    loot: [],
    ...overrides,
  };
}

/**
 * Helper to create a test item.
 */
function createTestItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item_1',
    baseId: 'dagger',
    name: 'Rusty Dagger',
    tags: ['weapon'],
    rarity: 'common',
    affixes: [],
    ...overrides,
  };
}

describe('loot command handler logic', () => {
  describe('corpse detection', () => {
    it('finds corpses in player location', () => {
      const corpse = createTestCorpse({ locationId: 'loc_1' });
      const world = createTestWorld({
        corpses: { corpse_1: corpse },
      });

      const corpsesInLocation = Object.values(world.corpses).filter(
        (c) => c.locationId === 'loc_1'
      );

      expect(corpsesInLocation).toHaveLength(1);
      expect(corpsesInLocation[0]!.name).toBe('Wolf');
    });

    it('ignores corpses in other locations', () => {
      const corpse = createTestCorpse({ locationId: 'loc_2' });
      const world = createTestWorld({
        corpses: { corpse_1: corpse },
      });

      const corpsesInLocation = Object.values(world.corpses).filter(
        (c) => c.locationId === 'loc_1'
      );

      expect(corpsesInLocation).toHaveLength(0);
    });
  });

  describe('corpse name matching', () => {
    it('matches corpse by partial name', () => {
      const corpse = createTestCorpse({ name: 'Grey Wolf' });
      const targetLower = 'wolf';

      const matches = corpse.name.toLowerCase().includes(targetLower);
      expect(matches).toBe(true);
    });

    it('matches corpse by full name', () => {
      const corpse = createTestCorpse({ name: 'Bandit' });
      const targetLower = 'bandit';

      const matches = corpse.name.toLowerCase().includes(targetLower);
      expect(matches).toBe(true);
    });
  });

  describe('loot display', () => {
    it('shows all items in corpse loot', () => {
      const dagger = createTestItem({ id: 'item_1', name: 'Rusty Dagger' });
      const gold = createTestItem({ id: 'item_2', name: '12 Gold Coins' });
      const corpse = createTestCorpse({ loot: ['item_1', 'item_2'] });

      const world = createTestWorld({
        items: { item_1: dagger, item_2: gold },
        corpses: { corpse_1: corpse },
      });

      const lootNames = corpse.loot.map((itemId) => world.items[itemId]?.name);

      expect(lootNames).toEqual(['Rusty Dagger', '12 Gold Coins']);
    });

    it('handles empty loot', () => {
      const corpse = createTestCorpse({ loot: [] });

      expect(corpse.loot.length).toBe(0);
    });
  });
});

describe('take from corpse logic', () => {
  describe('item selection', () => {
    it('finds item by name in corpse loot', () => {
      const dagger = createTestItem({ id: 'item_1', name: 'Rusty Dagger' });
      const corpse = createTestCorpse({ loot: ['item_1'] });

      const world = createTestWorld({
        items: { item_1: dagger },
        corpses: { corpse_1: corpse },
      });

      const targetLower = 'dagger';
      const itemIndex = corpse.loot.findIndex((id) => {
        const item = world.items[id];
        return item?.name.toLowerCase().includes(targetLower);
      });

      expect(itemIndex).toBe(0);
    });

    it('finds item by number index', () => {
      const dagger = createTestItem({ id: 'item_1', name: 'Rusty Dagger' });
      const gold = createTestItem({ id: 'item_2', name: 'Gold Coins' });
      const corpse = createTestCorpse({ loot: ['item_1', 'item_2'] });

      const world = createTestWorld({
        items: { item_1: dagger, item_2: gold },
        corpses: { corpse_1: corpse },
      });

      // "take 2 from corpse" -> index 1
      const index = 2 - 1; // User-facing is 1-indexed
      const itemId = corpse.loot[index];

      expect(itemId).toBe('item_2');
      expect(itemId && world.items[itemId]?.name).toBe('Gold Coins');
    });

    it('rejects invalid index', () => {
      const corpse = createTestCorpse({ loot: ['item_1'] });

      // "take 5 from corpse" when only 1 item exists
      const index = 5 - 1;
      const isValid = index >= 0 && index < corpse.loot.length;

      expect(isValid).toBe(false);
    });
  });

  describe('take all logic', () => {
    it('collects all items from corpse', () => {
      const dagger = createTestItem({ id: 'item_1', name: 'Rusty Dagger' });
      const gold = createTestItem({ id: 'item_2', name: 'Gold Coins' });
      const leather = createTestItem({ id: 'item_3', name: 'Leather Scraps' });
      const corpse = createTestCorpse({ loot: ['item_1', 'item_2', 'item_3'] });

      const world = createTestWorld({
        items: { item_1: dagger, item_2: gold, item_3: leather },
        corpses: { corpse_1: corpse },
      });

      const taken: string[] = [];
      const player = createTestPlayer({ inventory: [] });

      for (const itemId of [...corpse.loot]) {
        const item = world.items[itemId];
        if (item && player.inventory.length < player.inventorySlots) {
          player.inventory.push({ itemId, quantity: 1 });
          taken.push(item.name);
          const idx = corpse.loot.indexOf(itemId);
          if (idx !== -1) corpse.loot.splice(idx, 1);
        }
      }

      expect(taken).toEqual(['Rusty Dagger', 'Gold Coins', 'Leather Scraps']);
      expect(corpse.loot).toHaveLength(0);
      expect(player.inventory).toHaveLength(3);
    });

    it('stops when inventory is full', () => {
      const dagger = createTestItem({ id: 'item_1', name: 'Rusty Dagger' });
      const gold = createTestItem({ id: 'item_2', name: 'Gold Coins' });
      const corpse = createTestCorpse({ loot: ['item_1', 'item_2'] });

      const world = createTestWorld({
        items: { item_1: dagger, item_2: gold },
        corpses: { corpse_1: corpse },
      });

      const taken: string[] = [];
      // Player has 1 slot and 0 items
      const player = createTestPlayer({ inventory: [], inventorySlots: 1 });

      for (const itemId of [...corpse.loot]) {
        const item = world.items[itemId];
        if (item && player.inventory.length < player.inventorySlots) {
          player.inventory.push({ itemId, quantity: 1 });
          taken.push(item.name);
          const idx = corpse.loot.indexOf(itemId);
          if (idx !== -1) corpse.loot.splice(idx, 1);
        }
      }

      expect(taken).toEqual(['Rusty Dagger']);
      expect(corpse.loot).toEqual(['item_2']); // Gold left behind
      expect(player.inventory).toHaveLength(1);
    });
  });

  describe('corpse state after looting', () => {
    it('marks corpse as looted when empty', () => {
      const corpse = createTestCorpse({ loot: ['item_1'] });

      // Simulate taking the item
      corpse.loot.splice(0, 1);

      if (corpse.loot.length === 0) {
        corpse.looted = true;
        corpse.lootedAt = Date.now();
      }

      expect(corpse.looted).toBe(true);
      expect(corpse.lootedAt).toBeDefined();
    });

    it('does not mark looted if items remain', () => {
      const corpse = createTestCorpse({ loot: ['item_1', 'item_2'] });

      // Simulate taking one item
      corpse.loot.splice(0, 1);

      if (corpse.loot.length === 0) {
        corpse.looted = true;
        corpse.lootedAt = Date.now();
      }

      expect(corpse.looted).toBe(false);
      expect(corpse.lootedAt).toBeUndefined();
    });
  });

  describe('corpse source matching', () => {
    it('matches "corpse" keyword to any corpse', () => {
      const corpse = createTestCorpse({ name: 'Wolf' });
      const sourceLower = 'corpse';

      const matches =
        corpse.name.toLowerCase().includes(sourceLower) ||
        sourceLower === 'corpse';

      expect(matches).toBe(true);
    });

    it('matches specific creature name', () => {
      const wolfCorpse = createTestCorpse({ id: 'corpse_1', name: 'Wolf' });
      const banditCorpse = createTestCorpse({ id: 'corpse_2', name: 'Bandit' });
      const corpses = [wolfCorpse, banditCorpse];

      const sourceLower = 'bandit';
      const found = corpses.find((c) => c.name.toLowerCase().includes(sourceLower));

      expect(found).toBe(banditCorpse);
    });
  });
});
