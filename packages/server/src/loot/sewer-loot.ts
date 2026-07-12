/**
 * Sewer dungeon loot tables.
 * Tutorial dungeon drops: supplies, rusty key, and King Rat's unique weapon.
 */

import type { Item, Rng } from '@solo-mud/shared';
import type { LootTable, ItemTemplate } from './item-generator';
import { generateLootDrop, generateItem } from './item-generator';

// ============ Item Templates ============
export const SEWER_ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  // Common drops
  'rat-tail': {
    id: 'rat-tail',
    name: 'Rat Tail',
    tags: ['junk', 'trophy'],
    baseValue: 1,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  'rat-fur': {
    id: 'rat-fur',
    name: 'Rat Fur',
    tags: ['material', 'crafting'],
    baseValue: 2,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  'moldy-bread': {
    id: 'moldy-bread',
    name: 'Moldy Bread',
    tags: ['food', 'consumable'],
    baseValue: 1,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  'dirty-bandage': {
    id: 'dirty-bandage',
    name: 'Dirty Bandage',
    tags: ['healing', 'consumable'],
    baseValue: 3,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  'copper-coin': {
    id: 'copper-coin',
    name: 'Copper Coin',
    tags: ['currency', 'junk'],
    baseValue: 1,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'cracked-vial': {
    id: 'cracked-vial',
    name: 'Cracked Vial',
    tags: ['container', 'junk'],
    baseValue: 2,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  // Uncommon drops
  'sewer_rusty_key': {
    id: 'sewer_rusty_key',
    name: 'Rusty Key',
    tags: ['key', 'sewer', 'quest'],
    baseValue: 0,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  'minor-health-potion': {
    id: 'minor-health-potion',
    name: 'Minor Health Potion',
    tags: ['potion', 'consumable', 'healing'],
    baseValue: 10,
    levelRange: [1, 5],
    allowedAffixes: [],
  },
  // Rare drops (from Large Rats)
  'rat-fang': {
    id: 'rat-fang',
    name: 'Rat Fang',
    tags: ['material', 'crafting'],
    baseValue: 5,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  'tattered-leather': {
    id: 'tattered-leather',
    name: 'Tattered Leather Scrap',
    tags: ['material', 'armor', 'crafting'],
    baseValue: 8,
    levelRange: [1, 10],
    allowedAffixes: [],
  },
  // Boss drop (King Rat)
  'rat-kings-fang': {
    id: 'rat-kings-fang',
    name: "Rat King's Fang",
    tags: ['weapon', 'dagger', 'melee', 'unique'],
    baseValue: 100,
    levelRange: [5, 10],
    allowedAffixes: ['sharp', 'swift'],
  },
  'rat-kings-crown': {
    id: 'rat-kings-crown',
    name: "Rat King's Crown",
    tags: ['armor', 'head', 'unique', 'junk'],
    baseValue: 25,
    levelRange: [5, 10],
    allowedAffixes: [],
  },
  'rat-kings-mantle': {
    id: 'rat-kings-mantle',
    name: "Rat King's Mantle",
    tags: ['armor', 'chest', 'cloth', 'unique'],
    baseValue: 80,
    levelRange: [5, 10],
    allowedAffixes: ['int-bonus', 'wis-bonus'],
  },
  'rat-kings-treads': {
    id: 'rat-kings-treads',
    name: "Rat King's Treads",
    tags: ['armor', 'feet', 'leather', 'unique'],
    baseValue: 60,
    levelRange: [5, 10],
    allowedAffixes: ['swift', 'dex-bonus'],
  },
};

// ============ Loot Tables ============

/** Basic rat loot (level 1-2 rats) */
export const RAT_LOOT_TABLE: LootTable = {
  id: 'sewer_rat',
  dropChance: 0.6, // 60% chance to drop something
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'rat-tail', weight: 40, minRarity: 'junk', maxRarity: 'junk' },
    { templateId: 'rat-fur', weight: 25, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'moldy-bread', weight: 15, minRarity: 'junk', maxRarity: 'junk' },
    { templateId: 'copper-coin', weight: 15, minRarity: 'junk', maxRarity: 'junk' },
    { templateId: 'dirty-bandage', weight: 5, minRarity: 'junk', maxRarity: 'common' },
  ],
};

/** Large rat loot (level 3-4 large rats) - can drop the key */
export const LARGE_RAT_LOOT_TABLE: LootTable = {
  id: 'large_rat',
  dropChance: 0.8, // 80% chance to drop something
  minItems: 1,
  maxItems: 3,
  entries: [
    { templateId: 'rat-tail', weight: 25, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'rat-fur', weight: 20, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'rat-fang', weight: 15, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'tattered-leather', weight: 10, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'minor-health-potion', weight: 10, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'copper-coin', weight: 15, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'sewer_rusty_key', weight: 5, minRarity: 'uncommon', maxRarity: 'uncommon' },
  ],
};

/** King Rat loot (guaranteed unique drops) */
export const KING_RAT_LOOT_TABLE: LootTable = {
  id: 'king_rat',
  dropChance: 1.0, // Always drops
  minItems: 3,
  maxItems: 5,
  entries: [
    { templateId: 'rat-kings-fang', weight: 100, minRarity: 'rare', maxRarity: 'rare' },
    { templateId: 'rat-kings-mantle', weight: 80, minRarity: 'rare', maxRarity: 'rare' },
    { templateId: 'rat-kings-treads', weight: 80, minRarity: 'rare', maxRarity: 'rare' },
    { templateId: 'rat-kings-crown', weight: 50, minRarity: 'uncommon', maxRarity: 'uncommon' },
    { templateId: 'rat-fang', weight: 30, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'minor-health-potion', weight: 20, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'copper-coin', weight: 40, minRarity: 'common', maxRarity: 'uncommon' },
  ],
};

/** Map of creature templateId to loot table */
export const SEWER_LOOT_TABLES: Record<string, LootTable> = {
  sewer_rat: RAT_LOOT_TABLE,
  large_rat: LARGE_RAT_LOOT_TABLE,
  king_rat: KING_RAT_LOOT_TABLE,
};

/**
 * Generate loot for a sewer creature.
 * Returns array of generated Item objects.
 */
export function generateSewerLoot(
  templateId: string,
  level: number,
  rng: Rng
): Item[] {
  const lootTable = SEWER_LOOT_TABLES[templateId];
  if (!lootTable) {
    return [];
  }

  // For King Rat, guarantee the unique weapon drops
  const guaranteeDrop = templateId === 'king_rat';

  return generateLootDrop({
    lootTable,
    level,
    rng,
    guaranteeDrop,
    templates: SEWER_ITEM_TEMPLATES,
  });
}

/**
 * Create the Rat King's Fang unique weapon (guaranteed boss drop).
 */
export function createRatKingsFang(rng: Rng): Item {
  return generateItem({
    template: SEWER_ITEM_TEMPLATES['rat-kings-fang']!,
    rarity: 'rare',
    level: 6,
    rng,
    forceAffixes: ['sharp'], // Always has +attack power
  });
}
