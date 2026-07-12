/**
 * Whispering Woods loot tables.
 *
 * Boss drops: each sub-dungeon boss ALWAYS drops its key fragment (for the
 * Sanctum altar) and has a strong chance at its class-themed epic unique.
 * Common fey creatures drop thematic materials.
 */

import type { LootTable, ItemTemplate } from './item-generator';

// ============ Item Templates ============
export const WOODS_ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  // --- Key fragments (quest chain: assembled at the Sanctum altar) ---
  fragment_innocence: {
    id: 'fragment_innocence',
    name: 'Fragment of Innocence',
    tags: ['quest', 'fragment', 'unique'],
    baseValue: 0,
    levelRange: [10, 20],
    allowedAffixes: [],
  },
  fragment_fury: {
    id: 'fragment_fury',
    name: 'Fragment of Fury',
    tags: ['quest', 'fragment', 'unique'],
    baseValue: 0,
    levelRange: [10, 20],
    allowedAffixes: [],
  },
  fragment_spirit: {
    id: 'fragment_spirit',
    name: 'Fragment of Spirit',
    tags: ['quest', 'fragment', 'unique'],
    baseValue: 0,
    levelRange: [10, 20],
    allowedAffixes: [],
  },
  fragment_hunger: {
    id: 'fragment_hunger',
    name: 'Fragment of Hunger',
    tags: ['quest', 'fragment', 'unique'],
    baseValue: 0,
    levelRange: [10, 20],
    allowedAffixes: [],
  },
  fragment_growth: {
    id: 'fragment_growth',
    name: 'Fragment of Growth',
    tags: ['quest', 'fragment', 'unique'],
    baseValue: 0,
    levelRange: [10, 20],
    allowedAffixes: [],
  },

  // --- Class-themed epic uniques (one per boss) ---
  flickerblade: {
    id: 'flickerblade',
    name: 'Flickerblade',
    tags: ['weapon', 'dagger', 'melee', 'rogue', 'unique'],
    baseValue: 800,
    levelRange: [10, 20],
    allowedAffixes: ['keen', 'swift', 'dex-bonus'],
    effects: [{
      trigger: 'on_hit', kind: 'bonus_damage', chance: 0.25, amount: 50,
      text: 'The Flickerblade blurs — for a heartbeat it strikes from two places at once!',
    }],
  },
  bloodcap_cleaver: {
    id: 'bloodcap_cleaver',
    name: 'Bloodcap Cleaver',
    tags: ['weapon', 'axe', 'melee', 'warrior', 'unique'],
    baseValue: 800,
    levelRange: [12, 20],
    allowedAffixes: ['keen', 'heavy', 'str-bonus'],
    effects: [{
      trigger: 'on_kill', kind: 'heal_self', amount: 15,
      text: 'The Bloodcap Cleaver drinks deep, and warmth floods back into you.',
    }],
  },
  totem_of_wild_spirit: {
    id: 'totem_of_wild_spirit',
    name: 'Totem of the Wild Spirit',
    tags: ['offhand', 'totem', 'cleric', 'unique'],
    baseValue: 800,
    levelRange: [14, 20],
    allowedAffixes: ['wis-bonus', 'mystical', 'arcane'],
    effects: [{
      trigger: 'passive', kind: 'healing_boost', amount: 25,
      text: 'Nature spirits swirl from the totem, strengthening your healing.',
    }],
  },
  venomweave_wand: {
    id: 'venomweave_wand',
    name: 'Venomweave Wand',
    tags: ['weapon', 'wand', 'magic', 'mage', 'unique'],
    baseValue: 800,
    levelRange: [16, 20],
    allowedAffixes: ['int-bonus', 'mystical', 'arcane'],
    effects: [{
      trigger: 'on_hit', kind: 'poison_burst', chance: 0.35, amount: 12,
      text: 'Venom seeps from the wand\'s silken weave!',
    }],
  },
  bramblewood_bow: {
    id: 'bramblewood_bow',
    name: 'Bramblewood Bow',
    tags: ['weapon', 'bow', 'ranged', 'ranger', 'unique'],
    baseValue: 800,
    levelRange: [18, 20],
    allowedAffixes: ['keen', 'swift', 'dex-bonus'],
    effects: [{
      trigger: 'on_hit', kind: 'root_target', chance: 0.2, duration: 4,
      text: 'Thorned roots burst from the arrow and grip your foe!',
    }],
  },
  heartwood_amulet: {
    id: 'heartwood_amulet',
    name: 'Heartwood Amulet',
    tags: ['jewelry', 'necklace', 'unique'],
    baseValue: 1200,
    levelRange: [20, 30],
    allowedAffixes: ['vigorous', 'arcane', 'wis-bonus', 'con-bonus'],
  },

  // --- Common fey materials ---
  fey_essence: {
    id: 'fey_essence',
    name: 'Fey Essence',
    tags: ['material', 'alchemy', 'fey'],
    baseValue: 12,
    levelRange: [7, 20],
    allowedAffixes: [],
  },
  bloodstained_cap: {
    id: 'bloodstained_cap',
    name: 'Bloodstained Cap',
    tags: ['trophy', 'fey'],
    baseValue: 15,
    levelRange: [10, 20],
    allowedAffixes: [],
  },
  woods_spider_silk: {
    id: 'woods_spider_silk',
    name: 'Gossamer Silk',
    tags: ['material', 'crafting'],
    baseValue: 18,
    levelRange: [13, 20],
    allowedAffixes: [],
  },
  living_thorn: {
    id: 'living_thorn',
    name: 'Living Thorn',
    tags: ['material', 'crafting'],
    baseValue: 20,
    levelRange: [16, 20],
    allowedAffixes: [],
  },
  corrupted_sap: {
    id: 'corrupted_sap',
    name: 'Corrupted Sap',
    tags: ['material', 'alchemy'],
    baseValue: 25,
    levelRange: [15, 20],
    allowedAffixes: [],
  },
};

// ============ Boss Loot Tables ============

function bossTable(
  id: string,
  fragment: string | null,
  unique: string,
  filler: string
): LootTable {
  return {
    id,
    dropChance: 1.0,
    minItems: 1,
    maxItems: 2,
    alwaysDrop: fragment ? [{ templateId: fragment, rarity: 'rare' }] : [],
    entries: [
      { templateId: unique, weight: 45, minRarity: 'epic', maxRarity: 'epic' },
      { templateId: filler, weight: 40, minRarity: 'common', maxRarity: 'rare' },
      { templateId: 'fey_essence', weight: 15, minRarity: 'common', maxRarity: 'uncommon' },
    ],
  };
}

/** Common-creature table shared by the lesser fey */
const COMMON_FEY_TABLE: LootTable = {
  id: 'woods_common_fey',
  dropChance: 0.6,
  minItems: 1,
  maxItems: 1,
  entries: [
    { templateId: 'fey_essence', weight: 70, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'corrupted_sap', weight: 30, minRarity: 'common', maxRarity: 'uncommon' },
  ],
};

const SPIDERKIN_TABLE: LootTable = {
  id: 'woods_spiderkin',
  dropChance: 0.7,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'woods_spider_silk', weight: 70, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'fey_essence', weight: 30, minRarity: 'common', maxRarity: 'common' },
  ],
};

const THORNKIN_TABLE: LootTable = {
  id: 'woods_thornkin',
  dropChance: 0.7,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'living_thorn', weight: 60, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'corrupted_sap', weight: 40, minRarity: 'common', maxRarity: 'uncommon' },
  ],
};

export const WOODS_LOOT_TABLES: Record<string, LootTable> = {
  // Bosses — fragment always drops; the unique is worth farming for
  sprite_trickster: bossTable('sprite_trickster', 'fragment_innocence', 'flickerblade', 'fey_essence'),
  redcap_chieftain: bossTable('redcap_chieftain', 'fragment_fury', 'bloodcap_cleaver', 'bloodstained_cap'),
  satyr_shaman: bossTable('satyr_shaman', 'fragment_spirit', 'totem_of_wild_spirit', 'fey_essence'),
  spider_queen: bossTable('spider_queen', 'fragment_hunger', 'venomweave_wand', 'woods_spider_silk'),
  thornlord: bossTable('thornlord', 'fragment_growth', 'bramblewood_bow', 'living_thorn'),
  // Final boss: no fragment — she's what the fragments unlock
  corrupted_dryad_matriarch: bossTable('corrupted_dryad_matriarch', null, 'heartwood_amulet', 'corrupted_sap'),

  // Common creatures
  mischievous_sprite: COMMON_FEY_TABLE,
  quickling: COMMON_FEY_TABLE,
  hostile_pixie: COMMON_FEY_TABLE,
  shadow_hound: COMMON_FEY_TABLE,
  will_o_wisp: COMMON_FEY_TABLE,
  dark_satyr: COMMON_FEY_TABLE,
  corrupted_druid: COMMON_FEY_TABLE,
  redcap: {
    id: 'redcap',
    dropChance: 0.7,
    minItems: 1,
    maxItems: 2,
    entries: [
      { templateId: 'bloodstained_cap', weight: 60, minRarity: 'common', maxRarity: 'uncommon' },
      { templateId: 'fey_essence', weight: 40, minRarity: 'common', maxRarity: 'common' },
    ],
  },
  bog_lurker: COMMON_FEY_TABLE,
  woods_giant_spider: SPIDERKIN_TABLE,
  ettercap: SPIDERKIN_TABLE,
  broodmother_spider: SPIDERKIN_TABLE,
  thorn_crawler: THORNKIN_TABLE,
  bramble_beast: THORNKIN_TABLE,
  twisted_treant: THORNKIN_TABLE,
  corrupted_dryad: THORNKIN_TABLE,
  matriarchs_handmaiden: THORNKIN_TABLE,
};
