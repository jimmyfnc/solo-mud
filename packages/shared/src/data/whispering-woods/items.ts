/**
 * Whispering Woods item templates.
 */
import type { ItemTemplate } from '../../constants/items';

// ============ Class-Specific Unique Items ============

export const WOODS_UNIQUE_ITEMS: ItemTemplate[] = [
  {
    baseId: 'flickerblade',
    name: 'Flickerblade',
    tags: ['weapon', 'dagger', 'rogue'],
    rarity: 'epic',
    description:
      'A dagger that phases through armor. The blade seems to exist in two places at once.',
  },
  {
    baseId: 'bloodcap_cleaver',
    name: 'Bloodcap Cleaver',
    tags: ['weapon', 'axe', 'warrior'],
    rarity: 'epic',
    description:
      'A brutal axe stained with the blood of countless victims. Heals you when you slay an enemy.',
  },
  {
    baseId: 'totem_of_wild_spirit',
    name: 'Totem of the Wild Spirit',
    tags: ['offhand', 'totem', 'cleric'],
    rarity: 'epic',
    description:
      'A carved totem pulsing with nature spirits. Greatly enhances healing magic.',
  },
  {
    baseId: 'venomweave_wand',
    name: 'Venomweave Wand',
    tags: ['weapon', 'wand', 'magic', 'mage'],
    rarity: 'epic',
    description: 'A wand wrapped in spider silk. Spells leave lingering poison.',
  },
  {
    baseId: 'bramblewood_bow',
    name: 'Bramblewood Bow',
    tags: ['weapon', 'bow', 'ranged', 'ranger'],
    rarity: 'epic',
    description:
      'A living bow that grows thorns. Arrows may root enemies in place.',
  },
  {
    baseId: 'heartwood_amulet',
    name: 'Heartwood Amulet',
    tags: ['necklace', 'jewelry'],
    rarity: 'epic',
    description:
      "Carved from the Matriarch's heartwood. Pulses with ancient forest magic.",
  },
];

// ============ Key Fragments ============

export const WOODS_FRAGMENTS: ItemTemplate[] = [
  {
    baseId: 'fragment_innocence',
    name: 'Fragment of Innocence',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized memory that glows with childlike light.',
  },
  {
    baseId: 'fragment_fury',
    name: 'Fragment of Fury',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description: 'A shard of crystallized memory that pulses with violent red.',
  },
  {
    baseId: 'fragment_spirit',
    name: 'Fragment of Spirit',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description:
      'A shard of crystallized memory. Ghostly whispers emanate from within.',
  },
  {
    baseId: 'fragment_hunger',
    name: 'Fragment of Hunger',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description:
      'A shard of crystallized memory that seems to absorb the light.',
  },
  {
    baseId: 'fragment_growth',
    name: 'Fragment of Growth',
    tags: ['quest', 'fragment', 'key'],
    rarity: 'rare',
    description:
      'A shard of crystallized memory. Tiny vines grow from its surface.',
  },
];

// ============ Assembled Key ============

export const DRYADS_HEART_KEY: ItemTemplate = {
  baseId: 'dryads_heart_key',
  name: "Dryad's Heart Key",
  tags: ['quest', 'key'],
  rarity: 'epic',
  description:
    "A complete key formed from five fragments. It thrums with the forest's heartbeat.",
};

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
