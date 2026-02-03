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
  /** Base defense for armor items [min, max] - scaled by rarity */
  baseDefense?: [number, number];
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
const AFFIX_DEFINITIONS: Record<string, Omit<Affix, 'id'> & { minRarity?: Rarity }> = {
  // Weapon affixes
  sharp: { name: 'Sharp', type: 'prefix', statMods: { attackPower: 3 } },
  keen: { name: 'Keen', type: 'prefix', statMods: { attackPower: 5 }, minRarity: 'rare' },
  heavy: { name: 'Heavy', type: 'prefix', statMods: { attackPower: 5, attackSpeed: -100 } },
  swift: { name: 'Swift', type: 'prefix', statMods: { attackSpeed: 200 } },

  // Defense affixes
  sturdy: { name: 'Sturdy', type: 'prefix', statMods: { defense: 3 } },
  reinforced: { name: 'Reinforced', type: 'prefix', statMods: { defense: 5 } },
  fortified: { name: 'Fortified', type: 'prefix', statMods: { defense: 8 }, minRarity: 'rare' },

  // Elemental resistance affixes (suffixes)
  fireproof: { name: 'of Flame Ward', type: 'suffix', statMods: { fireResist: 10 } },
  flameward: { name: 'of the Inferno', type: 'suffix', statMods: { fireResist: 20 }, minRarity: 'rare' },
  frostproof: { name: 'of Frost Ward', type: 'suffix', statMods: { iceResist: 10 } },
  frostward: { name: 'of the Glacier', type: 'suffix', statMods: { iceResist: 20 }, minRarity: 'rare' },
  insulated: { name: 'of Grounding', type: 'suffix', statMods: { lightningResist: 10 } },
  stormward: { name: 'of the Storm', type: 'suffix', statMods: { lightningResist: 20 }, minRarity: 'rare' },
  venomproof: { name: 'of Antivenom', type: 'suffix', statMods: { poisonResist: 10 } },
  venomward: { name: 'of Immunity', type: 'suffix', statMods: { poisonResist: 20 }, minRarity: 'rare' },

  // Stat bonus suffixes
  'str-bonus': { name: 'of Strength', type: 'suffix', statMods: { str: 2 } },
  'dex-bonus': { name: 'of Dexterity', type: 'suffix', statMods: { dex: 2 } },
  'con-bonus': { name: 'of Vitality', type: 'suffix', statMods: { con: 2 } },
  'int-bonus': { name: 'of Intelligence', type: 'suffix', statMods: { int: 2 } },
  'wis-bonus': { name: 'of Wisdom', type: 'suffix', statMods: { wis: 2 } },

  // Jewelry-specific prefixes (HP/MP)
  healthy: { name: 'Healthy', type: 'prefix', statMods: { maxHp: 15 } },
  vigorous: { name: 'Vigorous', type: 'prefix', statMods: { maxHp: 30 }, minRarity: 'rare' },
  mystical: { name: 'Mystical', type: 'prefix', statMods: { maxMp: 10 } },
  arcane: { name: 'Arcane', type: 'prefix', statMods: { maxMp: 20 }, minRarity: 'rare' },

  // Jewelry stat prefixes
  warriors: { name: "Warrior's", type: 'prefix', statMods: { str: 2 } },
  scholars: { name: "Scholar's", type: 'prefix', statMods: { int: 2 } },
  sages: { name: "Sage's", type: 'prefix', statMods: { wis: 2 } },
  nimble: { name: 'Nimble', type: 'prefix', statMods: { dex: 2 } },
  hardy: { name: 'Hardy', type: 'prefix', statMods: { con: 2 } },
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
 * Check if an affix can be used at a given rarity.
 */
function canUseAffix(affixId: string, rarity: Rarity): boolean {
  const def = AFFIX_DEFINITIONS[affixId];
  if (!def || !def.minRarity) return true;

  const itemRarityIndex = getRarityIndex(rarity);
  const minRarityIndex = getRarityIndex(def.minRarity);
  return itemRarityIndex >= minRarityIndex;
}

/**
 * Select affixes for an item.
 * Epic+ items can have multiple prefixes or suffixes.
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
          name: def.name,
          type: def.type,
          statMods: def.statMods,
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

  // Filter affixes by rarity requirement
  const available = allowedAffixes.filter(id => canUseAffix(id, rarity));
  if (available.length === 0) {
    return [];
  }

  // Epic+ items can have multiple of the same type
  const isEpicOrHigher = getRarityIndex(rarity) >= getRarityIndex('epic');
  const maxPrefixes = isEpicOrHigher ? 2 : 1;
  const maxSuffixes = isEpicOrHigher ? 2 : 1;

  let prefixCount = 0;
  let suffixCount = 0;
  const usedAffixIds = new Set<string>();

  for (let i = 0; i < affixCount && available.length > 0; i++) {
    // Filter to valid affixes we haven't used
    const validAffixes = available.filter(id => {
      if (usedAffixIds.has(id)) return false;
      const def = AFFIX_DEFINITIONS[id];
      if (!def) return false;
      if (def.type === 'prefix' && prefixCount >= maxPrefixes) return false;
      if (def.type === 'suffix' && suffixCount >= maxSuffixes) return false;
      return true;
    });

    if (validAffixes.length === 0) break;

    const index = Math.floor(rng.next() * validAffixes.length);
    const affixId = validAffixes[index]!;
    const def = AFFIX_DEFINITIONS[affixId]!;

    usedAffixIds.add(affixId);
    if (def.type === 'prefix') prefixCount++;
    if (def.type === 'suffix') suffixCount++;

    affixes.push({
      id: affixId,
      name: def.name,
      type: def.type,
      statMods: def.statMods,
    });
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

/** Rarity multipliers for base defense */
const DEFENSE_RARITY_MULTIPLIER: Record<Rarity, number> = {
  junk: 0.5,
  common: 1.0,
  uncommon: 1.25,
  rare: 1.5,
  epic: 2.0,
  legendary: 2.5,
};

/**
 * Generate a single item.
 */
export function generateItem(options: GenerateItemOptions): Item {
  const { template, rarity, rng, forceAffixes } = options;

  const affixes = selectAffixes(template.allowedAffixes, rarity, rng, forceAffixes);
  const name = buildItemName(template.name, affixes);

  // Calculate base defense for armor items
  let baseDefense: number | undefined;
  if (template.baseDefense) {
    const [minDef, maxDef] = template.baseDefense;
    const baseDef = minDef + Math.floor(rng.next() * (maxDef - minDef + 1));
    const multiplier = DEFENSE_RARITY_MULTIPLIER[rarity];
    baseDefense = Math.floor(baseDef * multiplier);
  }

  return {
    id: generateItemId(template.id),
    baseId: template.id,
    name,
    tags: [...template.tags],
    rarity,
    affixes,
    baseDefense,
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
  rng: Rng
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
    allowedAffixes: ['sharp', 'keen', 'heavy', 'swift', 'str-bonus', 'dex-bonus'],
  },
  'leather-armor': {
    id: 'leather-armor',
    name: 'Leather Armor',
    tags: ['armor', 'chest', 'leather'],
    baseValue: 40,
    levelRange: [1, 10],
    allowedAffixes: ['sturdy', 'reinforced', 'fortified', 'con-bonus', 'dex-bonus', 'fireproof', 'frostproof', 'insulated', 'venomproof'],
    baseDefense: [5, 10],
  },
  'iron-helm': {
    id: 'iron-helm',
    name: 'Iron Helm',
    tags: ['armor', 'head', 'mail'],
    baseValue: 30,
    levelRange: [1, 10],
    allowedAffixes: ['sturdy', 'reinforced', 'con-bonus', 'fireproof', 'frostproof', 'insulated', 'venomproof'],
    baseDefense: [2, 5],
  },
  'leather-boots': {
    id: 'leather-boots',
    name: 'Leather Boots',
    tags: ['armor', 'feet', 'leather'],
    baseValue: 25,
    levelRange: [1, 10],
    allowedAffixes: ['sturdy', 'swift', 'dex-bonus', 'fireproof', 'frostproof', 'insulated', 'venomproof'],
    baseDefense: [2, 4],
  },
  'health-potion': {
    id: 'health-potion',
    name: 'Health Potion',
    tags: ['consumable', 'potion'],
    baseValue: 10,
    levelRange: [1, 100],
    allowedAffixes: [],
  },
  'copper-ring': {
    id: 'copper-ring',
    name: 'Copper Ring',
    tags: ['jewelry', 'ring'],
    baseValue: 15,
    levelRange: [1, 10],
    allowedAffixes: ['healthy', 'mystical', 'warriors', 'scholars', 'sages', 'nimble', 'hardy', 'fireproof', 'frostproof', 'insulated', 'venomproof'],
  },
  'silver-amulet': {
    id: 'silver-amulet',
    name: 'Silver Amulet',
    tags: ['jewelry', 'necklace'],
    baseValue: 30,
    levelRange: [1, 15],
    allowedAffixes: ['healthy', 'vigorous', 'mystical', 'arcane', 'warriors', 'scholars', 'sages', 'nimble', 'hardy', 'fireproof', 'frostproof', 'insulated', 'venomproof', 'flameward', 'frostward', 'stormward', 'venomward'],
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
  const droppedUniqueIds = new Set<string>(); // Track unique items already dropped

  for (let i = 0; i < itemCount; i++) {
    // Try to select a valid template (re-roll if we get a duplicate unique)
    let entry: LootTableEntry | null = null;
    let template: ItemTemplate | undefined;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      entry = selectTemplate(lootTable.entries, rng);
      if (!entry) break;

      template = templates[entry.templateId];
      if (!template) break;

      // Check if this is a unique item we've already dropped
      const isUnique = template.tags.includes('unique');
      if (isUnique && droppedUniqueIds.has(entry.templateId)) {
        // Re-roll for a different item
        continue;
      }

      // Valid selection
      if (isUnique) {
        droppedUniqueIds.add(entry.templateId);
      }
      break;
    }

    if (!entry || !template) continue;

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
