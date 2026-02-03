/**
 * Wilderness loot tables.
 * Drops for outdoor creatures (wolves, bears, bandits, etc.)
 */

import type { Item, Rng } from '@solo-mud/shared';
import type { LootTable, ItemTemplate } from './item-generator';
import { generateLootDrop } from './item-generator';

// ============ Item Templates ============
export const WILDERNESS_ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  // Animal parts
  'wolf-pelt': {
    id: 'wolf-pelt',
    name: 'Wolf Pelt',
    tags: ['material', 'crafting', 'leather'],
    baseValue: 15,
    levelRange: [3, 10],
    allowedAffixes: [],
  },
  'wolf-fang': {
    id: 'wolf-fang',
    name: 'Wolf Fang',
    tags: ['material', 'crafting', 'trophy'],
    baseValue: 8,
    levelRange: [3, 10],
    allowedAffixes: [],
  },
  'bear-pelt': {
    id: 'bear-pelt',
    name: 'Bear Pelt',
    tags: ['material', 'crafting', 'leather'],
    baseValue: 30,
    levelRange: [5, 15],
    allowedAffixes: [],
  },
  'bear-claw': {
    id: 'bear-claw',
    name: 'Bear Claw',
    tags: ['material', 'crafting', 'trophy'],
    baseValue: 12,
    levelRange: [5, 15],
    allowedAffixes: [],
  },
  'rabbit-fur': {
    id: 'rabbit-fur',
    name: 'Rabbit Fur',
    tags: ['material', 'crafting'],
    baseValue: 3,
    levelRange: [1, 5],
    allowedAffixes: [],
  },
  'deer-hide': {
    id: 'deer-hide',
    name: 'Deer Hide',
    tags: ['material', 'crafting', 'leather'],
    baseValue: 10,
    levelRange: [2, 8],
    allowedAffixes: [],
  },
  'venison': {
    id: 'venison',
    name: 'Venison',
    tags: ['food', 'consumable'],
    baseValue: 5,
    levelRange: [2, 8],
    allowedAffixes: [],
  },
  'raw-meat': {
    id: 'raw-meat',
    name: 'Raw Meat',
    tags: ['food', 'material'],
    baseValue: 2,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  // Spider drops
  'spider-silk': {
    id: 'spider-silk',
    name: 'Spider Silk',
    tags: ['material', 'crafting'],
    baseValue: 8,
    levelRange: [3, 10],
    allowedAffixes: [],
  },
  'spider-venom': {
    id: 'spider-venom',
    name: 'Spider Venom Sac',
    tags: ['material', 'alchemy', 'poison'],
    baseValue: 15,
    levelRange: [3, 10],
    allowedAffixes: [],
  },
  // Humanoid drops
  'copper-coin': {
    id: 'copper-coin',
    name: 'Copper Coin',
    tags: ['currency', 'junk'],
    baseValue: 1,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'bandit-dagger': {
    id: 'bandit-dagger',
    name: 'Bandit Dagger',
    tags: ['weapon', 'dagger', 'melee'],
    baseValue: 20,
    levelRange: [4, 12],
    allowedAffixes: ['sharp', 'swift'],
  },
  'goblin-ear': {
    id: 'goblin-ear',
    name: 'Goblin Ear',
    tags: ['trophy', 'junk'],
    baseValue: 3,
    levelRange: [2, 8],
    allowedAffixes: [],
  },
  'troll-blood': {
    id: 'troll-blood',
    name: 'Troll Blood',
    tags: ['material', 'alchemy'],
    baseValue: 25,
    levelRange: [6, 15],
    allowedAffixes: [],
  },
  // Snake drops
  'snake-skin': {
    id: 'snake-skin',
    name: 'Snake Skin',
    tags: ['material', 'crafting'],
    baseValue: 5,
    levelRange: [2, 8],
    allowedAffixes: [],
  },
  'snake-venom': {
    id: 'snake-venom',
    name: 'Snake Venom',
    tags: ['material', 'alchemy', 'poison'],
    baseValue: 10,
    levelRange: [2, 8],
    allowedAffixes: [],
  },
};

// ============ Loot Tables ============

/** Wolf loot (level 4-6, dangerous) */
export const WOLF_LOOT_TABLE: LootTable = {
  id: 'wolf',
  dropChance: 0.8,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'wolf-pelt', weight: 40, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'wolf-fang', weight: 30, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'raw-meat', weight: 25, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'copper-coin', weight: 5, minRarity: 'junk', maxRarity: 'junk' },
  ],
};

/** Bear loot (level 6-8, dangerous) */
export const BEAR_LOOT_TABLE: LootTable = {
  id: 'bear',
  dropChance: 0.9,
  minItems: 1,
  maxItems: 3,
  entries: [
    { templateId: 'bear-pelt', weight: 35, minRarity: 'common', maxRarity: 'rare' },
    { templateId: 'bear-claw', weight: 30, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'raw-meat', weight: 30, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'copper-coin', weight: 5, minRarity: 'junk', maxRarity: 'common' },
  ],
};

/** Rabbit loot (level 1, ambient) */
export const RABBIT_LOOT_TABLE: LootTable = {
  id: 'rabbit',
  dropChance: 0.6,
  minItems: 1,
  maxItems: 1,
  entries: [
    { templateId: 'rabbit-fur', weight: 70, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'raw-meat', weight: 30, minRarity: 'junk', maxRarity: 'junk' },
  ],
};

/** Deer loot (level 2, ambient) */
export const DEER_LOOT_TABLE: LootTable = {
  id: 'deer',
  dropChance: 0.7,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'deer-hide', weight: 45, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'venison', weight: 40, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'raw-meat', weight: 15, minRarity: 'junk', maxRarity: 'junk' },
  ],
};

/** Giant Spider loot (level 5, dangerous) */
export const SPIDER_LOOT_TABLE: LootTable = {
  id: 'giant_spider',
  dropChance: 0.75,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'spider-silk', weight: 45, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'spider-venom', weight: 35, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'copper-coin', weight: 20, minRarity: 'junk', maxRarity: 'common' },
  ],
};

/** Goblin loot (level 3-5, common) */
export const GOBLIN_LOOT_TABLE: LootTable = {
  id: 'goblin',
  dropChance: 0.8,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'goblin-ear', weight: 40, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'copper-coin', weight: 45, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'bandit-dagger', weight: 15, minRarity: 'common', maxRarity: 'uncommon' },
  ],
};

/** Bandit loot (level 4-7, dangerous) */
export const BANDIT_LOOT_TABLE: LootTable = {
  id: 'bandit',
  dropChance: 0.9,
  minItems: 1,
  maxItems: 3,
  entries: [
    { templateId: 'copper-coin', weight: 50, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'bandit-dagger', weight: 25, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'raw-meat', weight: 25, minRarity: 'junk', maxRarity: 'common' },
  ],
};

/** Troll loot (level 7-10, apex) */
export const TROLL_LOOT_TABLE: LootTable = {
  id: 'troll',
  dropChance: 1.0,
  minItems: 2,
  maxItems: 4,
  entries: [
    { templateId: 'troll-blood', weight: 40, minRarity: 'uncommon', maxRarity: 'rare' },
    { templateId: 'copper-coin', weight: 40, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'raw-meat', weight: 20, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Snake loot (level 2-4, common) */
export const SNAKE_LOOT_TABLE: LootTable = {
  id: 'snake',
  dropChance: 0.6,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'snake-skin', weight: 50, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'snake-venom', weight: 30, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'raw-meat', weight: 20, minRarity: 'junk', maxRarity: 'junk' },
  ],
};

/** Map of creature templateId to loot table */
export const WILDERNESS_LOOT_TABLES: Record<string, LootTable> = {
  wolf: WOLF_LOOT_TABLE,
  bear: BEAR_LOOT_TABLE,
  rabbit: RABBIT_LOOT_TABLE,
  deer: DEER_LOOT_TABLE,
  giant_spider: SPIDER_LOOT_TABLE,
  goblin: GOBLIN_LOOT_TABLE,
  bandit: BANDIT_LOOT_TABLE,
  troll: TROLL_LOOT_TABLE,
  snake: SNAKE_LOOT_TABLE,
};

/**
 * Generate loot for a wilderness creature.
 * Returns array of generated Item objects.
 */
export function generateWildernessLoot(
  templateId: string,
  level: number,
  rng: Rng
): Item[] {
  const lootTable = WILDERNESS_LOOT_TABLES[templateId];
  if (!lootTable) {
    return [];
  }

  return generateLootDrop({
    lootTable,
    level,
    rng,
    guaranteeDrop: false,
    templates: WILDERNESS_ITEM_TEMPLATES,
  });
}
