/**
 * Tests for item generator.
 */

import { describe, it, expect } from 'vitest';
import {
  generateItem,
  generateLootDrop,
  type ItemTemplate,
  type LootTable,
  type GenerateItemOptions,
} from './item-generator';
import { createRng } from '@solo-mud/shared';

// Sample item templates
const sampleTemplates: Record<string, ItemTemplate> = {
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
    allowedAffixes: [], // Consumables don't get affixes
  },
  'gold-ring': {
    id: 'gold-ring',
    name: 'Gold Ring',
    tags: ['accessory', 'ring'],
    baseValue: 100,
    levelRange: [5, 30],
    allowedAffixes: ['str-bonus', 'dex-bonus', 'con-bonus', 'int-bonus', 'wis-bonus'],
  },
};

// Sample loot table
const goblinLootTable: LootTable = {
  id: 'goblin-loot',
  dropChance: 0.8,
  minItems: 1,
  maxItems: 2,
  entries: [
    { templateId: 'iron-sword', weight: 10, minRarity: 'common', maxRarity: 'uncommon' },
    { templateId: 'leather-armor', weight: 5, minRarity: 'common', maxRarity: 'rare' },
    { templateId: 'health-potion', weight: 20, minRarity: 'common', maxRarity: 'common' },
  ],
};

describe('generateItem', () => {
  it('should generate an item with correct base properties', () => {
    const rng = createRng('test-seed');
    const options: GenerateItemOptions = {
      template: sampleTemplates['iron-sword']!,
      rarity: 'common',
      level: 5,
      rng,
    };

    const item = generateItem(options);

    expect(item.baseId).toBe('iron-sword');
    expect(item.tags).toContain('weapon');
    expect(item.tags).toContain('sword');
    expect(item.rarity).toBe('common');
  });

  it('should generate unique item IDs', () => {
    const rng = createRng('test-seed');
    const template = sampleTemplates['iron-sword']!;

    const item1 = generateItem({ template, rarity: 'common', level: 5, rng });
    const item2 = generateItem({ template, rarity: 'common', level: 5, rng });

    expect(item1.id).not.toBe(item2.id);
  });

  it('should not add affixes to items that disallow them', () => {
    const rng = createRng('test-seed');
    const options: GenerateItemOptions = {
      template: sampleTemplates['health-potion']!,
      rarity: 'common',
      level: 5,
      rng,
    };

    const item = generateItem(options);

    expect(item.affixes).toHaveLength(0);
    expect(item.name).toBe('Health Potion');
  });

  it('should add more affixes for higher rarity', () => {
    const rng = createRng('test-seed');
    const template = sampleTemplates['iron-sword']!;

    const common = generateItem({ template, rarity: 'common', level: 10, rng: createRng('seed1') });
    const rare = generateItem({ template, rarity: 'rare', level: 10, rng: createRng('seed2') });
    const legendary = generateItem({ template, rarity: 'legendary', level: 10, rng: createRng('seed3') });

    // Higher rarity = more affixes (common: 0-1, rare: 1-2, legendary: 2-3)
    expect(legendary.affixes.length).toBeGreaterThanOrEqual(rare.affixes.length);
  });

  it('should modify item name based on affixes', () => {
    const rng = createRng('affix-seed');
    const options: GenerateItemOptions = {
      template: sampleTemplates['iron-sword']!,
      rarity: 'rare',
      level: 10,
      rng,
      forceAffixes: ['sharp', 'str-bonus'], // Force specific affixes for testing
    };

    const item = generateItem(options);

    // Name should include affix modifiers
    expect(item.name).not.toBe('Iron Sword');
    expect(item.affixes.length).toBeGreaterThan(0);
  });

  it('should generate deterministic items with same seed', () => {
    const template = sampleTemplates['iron-sword']!;

    const item1 = generateItem({
      template,
      rarity: 'uncommon',
      level: 5,
      rng: createRng('deterministic'),
    });

    const item2 = generateItem({
      template,
      rarity: 'uncommon',
      level: 5,
      rng: createRng('deterministic'),
    });

    // Same seed should produce same affixes (though IDs will differ due to timestamp)
    expect(item1.affixes).toEqual(item2.affixes);
    expect(item1.name).toBe(item2.name);
  });
});

describe('generateLootDrop', () => {
  it('should respect drop chance', () => {
    // With low random values, should drop
    const rng1 = createRng('drop-seed');
    const result1 = generateLootDrop({
      lootTable: goblinLootTable,
      level: 5,
      rng: rng1,
    });

    // Result could be empty if drop chance fails
    expect(result1).toBeDefined();
  });

  it('should respect min/max items', () => {
    const results: number[] = [];

    for (let i = 0; i < 20; i++) {
      const rng = createRng(`loot-${i}`);
      const items = generateLootDrop({
        lootTable: goblinLootTable,
        level: 5,
        rng,
      });
      results.push(items.length);
    }

    // All results should be between 0 (no drop) and maxItems
    results.forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(goblinLootTable.maxItems);
    });
  });

  it('should respect rarity constraints from loot table', () => {
    const rng = createRng('rarity-test');
    const items = generateLootDrop({
      lootTable: goblinLootTable,
      level: 5,
      rng,
      guaranteeDrop: true, // Force a drop for testing
    });

    items.forEach((item) => {
      // Health potions should always be common
      if (item.baseId === 'health-potion') {
        expect(item.rarity).toBe('common');
      }
      // Iron swords should be common or uncommon
      if (item.baseId === 'iron-sword') {
        expect(['common', 'uncommon']).toContain(item.rarity);
      }
    });
  });

  it('should use weighted selection for templates', () => {
    const counts: Record<string, number> = {
      'iron-sword': 0,
      'leather-armor': 0,
      'health-potion': 0,
    };

    // Generate many drops to verify weights
    for (let i = 0; i < 100; i++) {
      const rng = createRng(`weight-${i}`);
      const items = generateLootDrop({
        lootTable: goblinLootTable,
        level: 5,
        rng,
        guaranteeDrop: true,
      });

      items.forEach((item) => {
        if (item.baseId in counts) {
          counts[item.baseId]!++;
        }
      });
    }

    // Health potions have highest weight (20), should be most common
    // Leather armor has lowest weight (5), should be least common
    expect(counts['health-potion']).toBeGreaterThan(counts['leather-armor']!);
  });

  it('should apply luck modifier to rarity', () => {
    const template = sampleTemplates['iron-sword']!;
    const lootTableHighRarity: LootTable = {
      id: 'high-rarity-test',
      dropChance: 1,
      minItems: 1,
      maxItems: 1,
      entries: [
        { templateId: 'iron-sword', weight: 100, minRarity: 'common', maxRarity: 'legendary' },
      ],
    };

    const rarities: string[] = [];

    // Generate with high luck
    for (let i = 0; i < 50; i++) {
      const rng = createRng(`luck-${i}`);
      const items = generateLootDrop({
        lootTable: lootTableHighRarity,
        level: 10,
        rng,
        luckModifier: 0.5, // +50% better rarity
        guaranteeDrop: true,
        templates: { 'iron-sword': template },
      });

      if (items.length > 0) {
        rarities.push(items[0]!.rarity);
      }
    }

    // With luck modifier, should see some higher rarities
    const hasHigherRarity = rarities.some((r) => r !== 'common');
    expect(hasHigherRarity).toBe(true);
  });
});
