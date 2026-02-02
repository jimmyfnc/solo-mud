/**
 * Whispering Woods item templates.
 */
import type { ItemTemplate } from '../../constants/items';

export const WOODS_UNIQUE_ITEMS: ItemTemplate[] = [];
export const WOODS_FRAGMENTS: ItemTemplate[] = [];

// ============ Set Piece Items (5 classes x 6 pieces) ============

function createClassSetItems(
  setId: string,
  setName: string,
  className: string
): ItemTemplate[] {
  return [
    {
      baseId: `${setId}_gloves`,
      name: `${setName} Gloves`,
      tags: ['armor', 'hands', 'set', className],
      rarity: 'rare',
      description: `Gloves from the ${setName}. Part of a powerful set.`,
    },
    {
      baseId: `${setId}_boots`,
      name: `${setName} Boots`,
      tags: ['armor', 'feet', 'set', className],
      rarity: 'rare',
      description: `Boots from the ${setName}. Part of a powerful set.`,
    },
    {
      baseId: `${setId}_belt`,
      name: `${setName} Belt`,
      tags: ['armor', 'belt', 'set', className],
      rarity: 'rare',
      description: `Belt from the ${setName}. Part of a powerful set.`,
    },
    {
      baseId: `${setId}_shoulders`,
      name: `${setName} Shoulders`,
      tags: ['armor', 'shoulders', 'set', className],
      rarity: 'rare',
      description: `Shoulders from the ${setName}. Part of a powerful set.`,
    },
    {
      baseId: `${setId}_helm`,
      name: `${setName} Helm`,
      tags: ['armor', 'head', 'set', className],
      rarity: 'rare',
      description: `Helm from the ${setName}. Part of a powerful set.`,
    },
    {
      baseId: `${setId}_chest`,
      name: `${setName} Chestpiece`,
      tags: ['armor', 'chest', 'set', className],
      rarity: 'epic',
      description: `Chestpiece from the ${setName}. The crown jewel of the set.`,
    },
  ];
}

export const WOODS_SET_ITEMS: ItemTemplate[] = [
  ...createClassSetItems('thornguard', 'Thornguard', 'warrior'),
  ...createClassSetItems('veilweave', 'Veilweave', 'mage'),
  ...createClassSetItems('shadowthorn', 'Shadowthorn', 'rogue'),
  ...createClassSetItems('spiritwood', 'Spiritwood', 'cleric'),
  ...createClassSetItems('wildwood', 'Wildwood', 'ranger'),
];
