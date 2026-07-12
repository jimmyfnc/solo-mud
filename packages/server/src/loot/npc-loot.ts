/**
 * NPC Loot Tables
 * Role-based loot for killed NPCs (guards, shopkeepers, trainers, etc.)
 */

import type { Item, NpcRole, Rng } from '@solo-mud/shared';
import type { LootTable, ItemTemplate } from './item-generator';
import { generateLootDrop } from './item-generator';

// ============ NPC Item Templates ============
export const NPC_ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  // Guard items
  'guard-sword': {
    id: 'guard-sword',
    name: 'Guard Sword',
    tags: ['weapon', 'sword', 'melee'],
    baseValue: 100,
    levelRange: [20, 40],
    allowedAffixes: ['sharp', 'defender'],
  },
  'guard-shield': {
    id: 'guard-shield',
    name: 'Guard Shield',
    tags: ['armor', 'shield', 'offhand'],
    baseValue: 80,
    levelRange: [20, 40],
    allowedAffixes: ['sturdy', 'defender'],
  },
  'guard-helm': {
    id: 'guard-helm',
    name: 'Guard Helm',
    tags: ['armor', 'head'],
    baseValue: 60,
    levelRange: [20, 40],
    allowedAffixes: ['sturdy'],
  },
  'town-tabard': {
    id: 'town-tabard',
    name: 'Town Tabard',
    tags: ['armor', 'chest', 'cloth'],
    baseValue: 30,
    levelRange: [10, 50],
    allowedAffixes: [],
  },

  // Shopkeeper items
  'gold-pouch': {
    id: 'gold-pouch',
    name: 'Gold Pouch',
    tags: ['currency', 'container'],
    baseValue: 200,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'merchant-ledger': {
    id: 'merchant-ledger',
    name: 'Merchant Ledger',
    tags: ['junk', 'document'],
    baseValue: 5,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'shop-key': {
    id: 'shop-key',
    name: 'Shop Key',
    tags: ['key', 'junk'],
    baseValue: 1,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'trade-goods': {
    id: 'trade-goods',
    name: 'Trade Goods',
    tags: ['trade', 'material'],
    baseValue: 50,
    levelRange: [1, 100],
    allowedAffixes: [],
  },

  // Innkeeper items
  'inn-key': {
    id: 'inn-key',
    name: 'Inn Key',
    tags: ['key', 'junk'],
    baseValue: 1,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'ale-barrel-tap': {
    id: 'ale-barrel-tap',
    name: 'Ale Barrel Tap',
    tags: ['junk', 'tool'],
    baseValue: 10,
    levelRange: [1, 100],
    allowedAffixes: [],
  },

  // Priest items
  'holy-symbol': {
    id: 'holy-symbol',
    name: 'Holy Symbol',
    tags: ['trinket', 'holy'],
    baseValue: 75,
    levelRange: [20, 50],
    allowedAffixes: ['blessed'],
  },
  'prayer-beads': {
    id: 'prayer-beads',
    name: 'Prayer Beads',
    tags: ['trinket', 'holy'],
    baseValue: 40,
    levelRange: [10, 50],
    allowedAffixes: ['blessed'],
  },
  'healing-herbs': {
    id: 'healing-herbs',
    name: 'Healing Herbs',
    tags: ['consumable', 'alchemy'],
    baseValue: 15,
    levelRange: [1, 50],
    allowedAffixes: [],
  },

  // Trainer items
  'training-manual': {
    id: 'training-manual',
    name: 'Training Manual',
    tags: ['book', 'document'],
    baseValue: 100,
    levelRange: [15, 50],
    allowedAffixes: [],
  },
  'practice-weapon': {
    id: 'practice-weapon',
    name: 'Practice Weapon',
    tags: ['weapon', 'melee', 'training'],
    baseValue: 25,
    levelRange: [1, 30],
    allowedAffixes: [],
  },

  // Citizen items
  'coin-purse': {
    id: 'coin-purse',
    name: 'Coin Purse',
    tags: ['currency', 'container'],
    baseValue: 25,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'personal-effects': {
    id: 'personal-effects',
    name: 'Personal Effects',
    tags: ['junk'],
    baseValue: 5,
    levelRange: [1, 100],
    allowedAffixes: [],
  },

  // Generic drops
  'silver-coin': {
    id: 'silver-coin',
    name: 'Silver Coin',
    tags: ['currency'],
    baseValue: 10,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'gold-coin': {
    id: 'gold-coin',
    name: 'Gold Coin',
    tags: ['currency'],
    baseValue: 100,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
};

// ============ Role-Based Loot Tables ============

/** Guard loot (level 30+, heavy combat drops) */
export const GUARD_LOOT_TABLE: LootTable = {
  id: 'guard',
  dropChance: 1.0,
  minItems: 2,
  maxItems: 4,
  entries: [
    { templateId: 'guard-sword', weight: 25, minRarity: 'uncommon', maxRarity: 'rare' },
    { templateId: 'guard-shield', weight: 20, minRarity: 'uncommon', maxRarity: 'rare' },
    { templateId: 'guard-helm', weight: 15, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'town-tabard', weight: 20, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'gold-coin', weight: 15, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'silver-coin', weight: 5, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Shopkeeper loot (merchants, general store, etc.) */
export const SHOPKEEPER_LOOT_TABLE: LootTable = {
  id: 'shopkeeper',
  dropChance: 1.0,
  minItems: 2,
  maxItems: 4,
  entries: [
    { templateId: 'gold-pouch', weight: 30, minRarity: 'common', maxRarity: 'rare' },
    { templateId: 'trade-goods', weight: 25, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'shop-key', weight: 15, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'merchant-ledger', weight: 10, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'gold-coin', weight: 15, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'silver-coin', weight: 5, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Innkeeper loot */
export const INNKEEPER_LOOT_TABLE: LootTable = {
  id: 'innkeeper',
  dropChance: 1.0,
  minItems: 2,
  maxItems: 3,
  entries: [
    { templateId: 'gold-pouch', weight: 35, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'inn-key', weight: 20, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'ale-barrel-tap', weight: 15, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'gold-coin', weight: 20, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'silver-coin', weight: 10, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Priest loot */
export const PRIEST_LOOT_TABLE: LootTable = {
  id: 'priest',
  dropChance: 1.0,
  minItems: 2,
  maxItems: 3,
  entries: [
    { templateId: 'holy-symbol', weight: 30, minRarity: 'uncommon', maxRarity: 'rare' },
    { templateId: 'prayer-beads', weight: 25, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'healing-herbs', weight: 25, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'gold-coin', weight: 15, minRarity: 'common', maxRarity: 'common' },
    { templateId: 'silver-coin', weight: 5, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Trainer loot */
export const TRAINER_LOOT_TABLE: LootTable = {
  id: 'trainer',
  dropChance: 1.0,
  minItems: 2,
  maxItems: 3,
  entries: [
    { templateId: 'training-manual', weight: 30, minRarity: 'uncommon', maxRarity: 'rare' },
    { templateId: 'practice-weapon', weight: 25, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'gold-coin', weight: 30, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'silver-coin', weight: 15, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Citizen loot (minimal drops) */
export const CITIZEN_LOOT_TABLE: LootTable = {
  id: 'citizen',
  dropChance: 0.8,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'coin-purse', weight: 40, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'personal-effects', weight: 35, minRarity: 'junk', maxRarity: 'junk' },
    { templateId: 'silver-coin', weight: 20, minRarity: 'junk', maxRarity: 'common' },
    { templateId: 'gold-coin', weight: 5, minRarity: 'common', maxRarity: 'common' },
  ],
};

/** Map NPC role to loot table */
export const NPC_LOOT_TABLES: Record<NpcRole, LootTable> = {
  guard: GUARD_LOOT_TABLE,
  shopkeeper: SHOPKEEPER_LOOT_TABLE,
  innkeeper: INNKEEPER_LOOT_TABLE,
  priest: PRIEST_LOOT_TABLE,
  trainer: TRAINER_LOOT_TABLE,
  citizen: CITIZEN_LOOT_TABLE,
};

/**
 * Generate loot for a killed NPC.
 * Returns array of generated Item objects.
 */
export function generateNpcLoot(
  role: NpcRole,
  level: number,
  rng: Rng
): Item[] {
  const lootTable = NPC_LOOT_TABLES[role];
  if (!lootTable) {
    // Fallback to citizen loot for unknown roles
    return generateLootDrop({
      lootTable: CITIZEN_LOOT_TABLE,
      level,
      rng,
      guaranteeDrop: false,
      templates: NPC_ITEM_TEMPLATES,
    });
  }

  return generateLootDrop({
    lootTable,
    level,
    rng,
    guaranteeDrop: true, // NPCs always drop something
    templates: NPC_ITEM_TEMPLATES,
  });
}

/**
 * Calculate gold drop for an NPC based on level and role.
 * Returns copper amount.
 */
export function calculateNpcGoldDrop(
  role: NpcRole,
  level: number,
  rng: Rng
): number {
  // Base gold varies by role
  const roleMultipliers: Record<NpcRole, number> = {
    shopkeeper: 3.0,  // Merchants carry more gold
    innkeeper: 2.0,
    guard: 1.5,
    trainer: 1.5,
    priest: 1.0,
    citizen: 0.5,
  };

  const multiplier = roleMultipliers[role] ?? 1.0;
  const baseGold = level * 10 * multiplier; // Base: 10 copper per level
  const variance = 0.7 + rng.next() * 0.6; // 70%-130% variance

  return Math.floor(baseGold * variance);
}
