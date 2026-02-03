/**
 * Item templates and starter gear definitions.
 */

import type { Item, Rarity } from '../types/world';
import type { ClassName } from '../types/character';

/** Base item template for generating items */
export interface ItemTemplate {
  baseId: string;
  name: string;
  tags: string[];
  rarity: Rarity;
  description?: string;
}

// ============ Starter Clothing ============

export const STARTER_CLOTHING: ItemTemplate[] = [
  {
    baseId: 'simple_tunic',
    name: 'Simple Tunic',
    tags: ['armor', 'chest', 'cloth'],
    rarity: 'common',
    description: 'A plain but serviceable tunic.',
  },
  {
    baseId: 'worn_pants',
    name: 'Worn Pants',
    tags: ['armor', 'legs', 'cloth'],
    rarity: 'common',
    description: 'Well-worn traveling pants.',
  },
  {
    baseId: 'leather_boots',
    name: 'Leather Boots',
    tags: ['armor', 'boots', 'leather'],
    rarity: 'common',
    description: 'Sturdy boots for the road.',
  },
];

// ============ Class-Specific Starter Weapons ============

export const CLASS_STARTER_WEAPONS: Record<ClassName, ItemTemplate> = {
  warrior: {
    baseId: 'rusty_sword',
    name: 'Rusty Sword',
    tags: ['weapon', 'sword', 'melee'],
    rarity: 'common',
    description: 'A worn but functional blade.',
  },
  rogue: {
    baseId: 'chipped_dagger',
    name: 'Chipped Dagger',
    tags: ['weapon', 'dagger', 'melee'],
    rarity: 'common',
    description: 'A small blade, perfect for quick strikes.',
  },
  mage: {
    baseId: 'gnarled_staff',
    name: 'Gnarled Staff',
    tags: ['weapon', 'staff', 'magic'],
    rarity: 'common',
    description: 'A wooden staff that hums with faint energy.',
  },
  cleric: {
    baseId: 'wooden_mace',
    name: 'Wooden Mace',
    tags: ['weapon', 'mace', 'melee'],
    rarity: 'common',
    description: 'A simple but effective bludgeon.',
  },
  ranger: {
    baseId: 'shortbow',
    name: 'Shortbow',
    tags: ['weapon', 'bow', 'ranged'],
    rarity: 'common',
    description: 'A compact bow for hunting.',
  },
};

// ============ Item Generation ============

let itemIdCounter = 0;

/**
 * Create an item instance from a template.
 */
export function createItemFromTemplate(template: ItemTemplate, idPrefix: string = 'item'): Item {
  const id = `${idPrefix}_${template.baseId}_${itemIdCounter++}`;
  return {
    id,
    baseId: template.baseId,
    name: template.name,
    tags: [...template.tags],
    rarity: template.rarity,
    affixes: [],
  };
}

/**
 * Generate starter gear for a new character.
 * Returns items to add to world.items and inventory slots.
 */
export function generateStarterGear(className: ClassName): {
  items: Item[];
  equipmentIds: { chest?: string; legs?: string; feet?: string; weapon?: string };
  inventoryIds: string[];
} {
  const items: Item[] = [];
  const equipmentIds: { chest?: string; legs?: string; feet?: string; weapon?: string } = {};
  const inventoryIds: string[] = [];

  // Create clothing
  for (const template of STARTER_CLOTHING) {
    const item = createItemFromTemplate(template, 'starter');
    items.push(item);

    // Equip based on slot
    if (template.tags.includes('chest')) {
      equipmentIds.chest = item.id;
    } else if (template.tags.includes('legs')) {
      equipmentIds.legs = item.id;
    } else if (template.tags.includes('boots')) {
      equipmentIds.feet = item.id;
    }
  }

  // Create class weapon
  const weaponTemplate = CLASS_STARTER_WEAPONS[className];
  const weapon = createItemFromTemplate(weaponTemplate, 'starter');
  items.push(weapon);
  equipmentIds.weapon = weapon.id;

  return { items, equipmentIds, inventoryIds };
}

// ============ Weapon Damage Values ============

/** Base damage for weapons by baseId */
export const WEAPON_DAMAGE: Record<string, { min: number; max: number }> = {
  // Starter weapons (level 1)
  rusty_sword: { min: 3, max: 6 },
  chipped_dagger: { min: 2, max: 5 },
  gnarled_staff: { min: 2, max: 4 },
  wooden_mace: { min: 3, max: 5 },
  shortbow: { min: 2, max: 6 },
  // Shop weapons (level 5+)
  iron_sword: { min: 5, max: 10 },
  iron_axe: { min: 6, max: 11 },
  // Sewer dungeon drops
  'rat-kings-fang': { min: 6, max: 12 }, // Level 6 boss unique dagger
  // Default for unknown
  default: { min: 1, max: 3 },
};

/**
 * Get weapon damage range for an item.
 */
export function getWeaponDamage(item: Item): { min: number; max: number } {
  return WEAPON_DAMAGE[item.baseId] ?? WEAPON_DAMAGE['default']!;
}
