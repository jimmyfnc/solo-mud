/**
 * Procedural item generation system.
 */

import type { Item, Rarity, Affix, Rng } from '@solo-mud/shared';

/** Item template definition */
export interface ItemTemplate {
  id: string;
  name: string;
  tags: string[];
  baseValue: number;
  levelRange: [number, number];
  allowedAffixes: string[];
}

/** Loot table entry */
export interface LootTableEntry {
  templateId: string;
  weight: number;
  minRarity: Rarity;
  maxRarity: Rarity;
}

/** Loot table definition */
export interface LootTable {
  id: string;
  dropChance: number; // 0-1
  minItems: number;
  maxItems: number;
  entries: LootTableEntry[];
}

/** Options for generating a single item */
export interface GenerateItemOptions {
  template: ItemTemplate;
  rarity: Rarity;
  level: number;
  rng: Rng;
  forceAffixes?: string[];
}

/** Options for generating loot drops */
export interface GenerateLootOptions {
  lootTable: LootTable;
  level: number;
  rng: Rng;
  luckModifier?: number;
  guaranteeDrop?: boolean;
  templates?: Record<string, ItemTemplate>;
}

/** Rarity order for comparison */
const RARITY_ORDER: Rarity[] = ['junk', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

/** Affix definitions */
const AFFIX_DEFINITIONS: Record<string, Omit<Affix, 'id'>> = {
  sharp: { name: 'Sharp', type: 'prefix', statMods: { attackPower: 3 } },
  heavy: { name: 'Heavy', type: 'prefix', statMods: { attackPower: 5, attackSpeed: -100 } },
  swift: { name: 'Swift', type: 'prefix', statMods: { attackSpeed: 200 } },
  sturdy: { name: 'Sturdy', type: 'prefix', statMods: { defense: 3 } },
  reinforced: { name: 'Reinforced', type: 'prefix', statMods: { defense: 5 } },
  'str-bonus': { name: 'of Strength', type: 'suffix', statMods: { str: 2 } },
  'dex-bonus': { name: 'of Dexterity', type: 'suffix', statMods: { dex: 2 } },
  'con-bonus': { name: 'of Vitality', type: 'suffix', statMods: { con: 2 } },
  'int-bonus': { name: 'of Intelligence', type: 'suffix', statMods: { int: 2 } },
  'wis-bonus': { name: 'of Wisdom', type: 'suffix', statMods: { wis: 2 } },
};

/** Number of affixes by rarity */
const AFFIX_COUNT_BY_RARITY: Record<Rarity, [number, number]> = {
  junk: [0, 0],
  common: [0, 1],
  uncommon: [1, 1],
  rare: [1, 2],
  epic: [2, 2],
  legendary: [2, 3],
};

/** Counter for unique IDs */
let itemIdCounter = 0;

/**
 * Generate a unique item ID.
 */
function generateItemId(baseId: string): string {
  itemIdCounter++;
  return `${baseId}-${Date.now()}-${itemIdCounter}`;
}

/**
 * Get rarity index for comparison.
 */
function getRarityIndex(rarity: Rarity): number {
  return RARITY_ORDER.indexOf(rarity);
}

/**
 * Select affixes for an item.
 */
function selectAffixes(
  allowedAffixes: string[],
  rarity: Rarity,
  rng: Rng,
  forceAffixes?: string[]
): Affix[] {
  if (allowedAffixes.length === 0) {
    return [];
  }

  const affixes: Affix[] = [];

  // Handle forced affixes
  if (forceAffixes && forceAffixes.length > 0) {
    for (const affixId of forceAffixes) {
      const def = AFFIX_DEFINITIONS[affixId];
      if (def) {
        affixes.push({
          id: affixId,
          ...def,
        });
      }
    }
    return affixes;
  }

  // Determine affix count based on rarity
  const [minAffixes, maxAffixes] = AFFIX_COUNT_BY_RARITY[rarity];
  const affixCount = minAffixes + Math.floor(rng.next() * (maxAffixes - minAffixes + 1));

  if (affixCount === 0) {
    return [];
  }

  // Select random affixes
  const available = [...allowedAffixes];
  const selectedPrefixes: string[] = [];
  const selectedSuffixes: string[] = [];

  for (let i = 0; i < affixCount && available.length > 0; i++) {
    const index = Math.floor(rng.next() * available.length);
    const affixId = available.splice(index, 1)[0]!;
    const def = AFFIX_DEFINITIONS[affixId];

    if (def) {
      // Ensure we don't have more than one prefix/suffix
      if (def.type === 'prefix' && selectedPrefixes.length === 0) {
        selectedPrefixes.push(affixId);
        affixes.push({ id: affixId, ...def });
      } else if (def.type === 'suffix' && selectedSuffixes.length === 0) {
        selectedSuffixes.push(affixId);
        affixes.push({ id: affixId, ...def });
      } else if (selectedPrefixes.length === 0 || selectedSuffixes.length === 0) {
        // Try to add if we still have room
        if (def.type === 'prefix' && selectedPrefixes.length === 0) {
          selectedPrefixes.push(affixId);
          affixes.push({ id: affixId, ...def });
        } else if (def.type === 'suffix' && selectedSuffixes.length === 0) {
          selectedSuffixes.push(affixId);
          affixes.push({ id: affixId, ...def });
        }
      }
    }
  }

  return affixes;
}

/**
 * Build item name from base name and affixes.
 */
function buildItemName(baseName: string, affixes: Affix[]): string {
  const prefix = affixes.find((a) => a.type === 'prefix');
  const suffix = affixes.find((a) => a.type === 'suffix');

  let name = baseName;
  if (prefix) {
    name = `${prefix.name} ${name}`;
  }
  if (suffix) {
    name = `${name} ${suffix.name}`;
  }

  return name;
}

/**
 * Generate a single item.
 */
export function generateItem(options: GenerateItemOptions): Item {
  const { template, rarity, rng, forceAffixes } = options;

  const affixes = selectAffixes(template.allowedAffixes, rarity, rng, forceAffixes);
  const name = buildItemName(template.name, affixes);

  return {
    id: generateItemId(template.id),
    baseId: template.id,
    name,
    tags: [...template.tags],
    rarity,
    affixes,
  };
}

/**
 * Roll for rarity based on base rarity range and luck.
 */
function rollRarity(
  minRarity: Rarity,
  maxRarity: Rarity,
  rng: Rng,
  luckModifier: number = 0
): Rarity {
  const minIndex = getRarityIndex(minRarity);
  const maxIndex = getRarityIndex(maxRarity);

  if (minIndex === maxIndex) {
    return minRarity;
  }

  // Roll with luck modifier
  let roll = rng.next() + luckModifier;
  roll = Math.max(0, Math.min(1, roll));

  // Higher roll = better rarity
  const range = maxIndex - minIndex;
  const rarityIndex = minIndex + Math.floor(roll * (range + 1));
  const clampedIndex = Math.min(rarityIndex, maxIndex);

  return RARITY_ORDER[clampedIndex]!;
}

/**
 * Select a template from loot table using weighted random selection.
 */
function selectTemplate(
  entries: LootTableEntry[],
  rng: RngFunction
): LootTableEntry | null {
  if (entries.length === 0) {
    return null;
  }

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng.next() * totalWeight;

  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry;
    }
  }

  return entries[entries.length - 1]!;
}

/** Default item templates */
const DEFAULT_TEMPLATES: Record<string, ItemTemplate> = {
  'iron-sword': {
    id: 'iron-sword',
    name: 'Iron Sword',
    tags: ['weapon', 'sword', 'melee'],
    baseValue: 50,
    levelRange: [1, 10],
    allowedAffixes: ['sharp', 'heavy', 'swift', 'str-bonus', 'dex-bonus'],
  },
  'leather-armor': {
    id: 'leather-armor',
    name: 'Leather Armor',
    tags: ['armor', 'chest', 'light'],
    baseValue: 40,
    levelRange: [1, 10],
    allowedAffixes: ['sturdy', 'reinforced', 'con-bonus', 'dex-bonus'],
  },
  'health-potion': {
    id: 'health-potion',
    name: 'Health Potion',
    tags: ['consumable', 'potion'],
    baseValue: 10,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
};

/**
 * Generate loot drops from a loot table.
 */
export function generateLootDrop(options: GenerateLootOptions): Item[] {
  const { lootTable, level, rng, luckModifier = 0, guaranteeDrop = false, templates = DEFAULT_TEMPLATES } = options;

  // Check drop chance
  if (!guaranteeDrop && rng.next() > lootTable.dropChance) {
    return [];
  }

  // Determine number of items
  const range = lootTable.maxItems - lootTable.minItems;
  const itemCount = lootTable.minItems + Math.floor(rng.next() * (range + 1));

  const items: Item[] = [];

  for (let i = 0; i < itemCount; i++) {
    // Select template
    const entry = selectTemplate(lootTable.entries, rng);
    if (!entry) continue;

    const template = templates[entry.templateId];
    if (!template) continue;

    // Roll rarity
    const rarity = rollRarity(entry.minRarity, entry.maxRarity, rng, luckModifier);

    // Generate item
    const item = generateItem({
      template,
      rarity,
      level,
      rng,
    });

    items.push(item);
  }

  return items;
}
