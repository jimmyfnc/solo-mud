/**
 * Easthollow starter town - static location and NPC definitions.
 */

import type { Location, Exit, NPC, Creature } from '../types';

// ============ Town Location IDs ============
export const TOWN_INN = 'town_inn';
export const TOWN_SQUARE = 'town_square';
export const TOWN_TRAINING = 'town_training';
export const TOWN_MARKET = 'town_market';
export const TOWN_BLACKSMITH = 'town_blacksmith';
export const TOWN_ALCHEMIST = 'town_alchemist';
export const TOWN_GENERAL = 'town_general';
export const TOWN_GATE = 'town_gate';

// ============ Town Locations ============
export const EASTHOLLOW_LOCATIONS: Record<string, Location> = {
  [TOWN_INN]: {
    id: TOWN_INN,
    name: 'The Rusty Blade Inn',
    biome: { plains: 1 },
    props: ['fireplace', 'wooden tables', 'bar counter'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_mira'],
  },
  [TOWN_SQUARE]: {
    id: TOWN_SQUARE,
    name: 'Town Square',
    biome: { plains: 1 },
    props: ['stone well', 'notice board', 'cobblestones'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
  [TOWN_TRAINING]: {
    id: TOWN_TRAINING,
    name: 'Training Yard',
    biome: { plains: 1 },
    props: ['training dummies', 'weapon racks', 'archery targets'],
    items: [],
    enemies: [],
    creatures: ['creature_training_dummy'],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_holt', 'npc_sera', 'npc_shadow'],
  },
  [TOWN_MARKET]: {
    id: TOWN_MARKET,
    name: 'Market Street',
    biome: { plains: 1 },
    props: ['market stalls', 'hanging lanterns', 'cobblestone path'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
  [TOWN_BLACKSMITH]: {
    id: TOWN_BLACKSMITH,
    name: 'The Iron Anvil',
    biome: { plains: 1 },
    props: ['forge', 'anvil', 'weapon displays'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_kira'],
  },
  [TOWN_ALCHEMIST]: {
    id: TOWN_ALCHEMIST,
    name: "Elwin's Remedies",
    biome: { plains: 1 },
    props: ['bubbling cauldrons', 'herb shelves', 'glass vials'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_elwin'],
  },
  [TOWN_GENERAL]: {
    id: TOWN_GENERAL,
    name: "Thom's Supplies",
    biome: { plains: 1 },
    props: ['wooden shelves', 'barrels', 'supply crates'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_thom'],
  },
  [TOWN_GATE]: {
    id: TOWN_GATE,
    name: 'Town Gate',
    biome: { plains: 1 },
    props: ['stone archway', 'iron gates', 'guard post'],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
};

// ============ Town Exits ============
export const EASTHOLLOW_EXITS: Record<string, Exit> = {
  // Inn <-> Square
  exit_inn_square: {
    id: 'exit_inn_square',
    from: TOWN_INN,
    to: TOWN_SQUARE,
    label: 'west',
    type: 'open',
  },
  exit_square_inn: {
    id: 'exit_square_inn',
    from: TOWN_SQUARE,
    to: TOWN_INN,
    label: 'east',
    type: 'open',
  },
  // Square <-> Training
  exit_square_training: {
    id: 'exit_square_training',
    from: TOWN_SQUARE,
    to: TOWN_TRAINING,
    label: 'north',
    type: 'open',
  },
  exit_training_square: {
    id: 'exit_training_square',
    from: TOWN_TRAINING,
    to: TOWN_SQUARE,
    label: 'south',
    type: 'open',
  },
  // Square <-> Market
  exit_square_market: {
    id: 'exit_square_market',
    from: TOWN_SQUARE,
    to: TOWN_MARKET,
    label: 'south',
    type: 'open',
  },
  exit_market_square: {
    id: 'exit_market_square',
    from: TOWN_MARKET,
    to: TOWN_SQUARE,
    label: 'north',
    type: 'open',
  },
  // Square <-> Gate
  exit_square_gate: {
    id: 'exit_square_gate',
    from: TOWN_SQUARE,
    to: TOWN_GATE,
    label: 'west',
    type: 'open',
  },
  exit_gate_square: {
    id: 'exit_gate_square',
    from: TOWN_GATE,
    to: TOWN_SQUARE,
    label: 'east',
    type: 'open',
  },
  // Market <-> Blacksmith
  exit_market_blacksmith: {
    id: 'exit_market_blacksmith',
    from: TOWN_MARKET,
    to: TOWN_BLACKSMITH,
    label: 'west',
    type: 'open',
  },
  exit_blacksmith_market: {
    id: 'exit_blacksmith_market',
    from: TOWN_BLACKSMITH,
    to: TOWN_MARKET,
    label: 'east',
    type: 'open',
  },
  // Market <-> Alchemist
  exit_market_alchemist: {
    id: 'exit_market_alchemist',
    from: TOWN_MARKET,
    to: TOWN_ALCHEMIST,
    label: 'east',
    type: 'open',
  },
  exit_alchemist_market: {
    id: 'exit_alchemist_market',
    from: TOWN_ALCHEMIST,
    to: TOWN_MARKET,
    label: 'west',
    type: 'open',
  },
  // Blacksmith <-> General
  exit_blacksmith_general: {
    id: 'exit_blacksmith_general',
    from: TOWN_BLACKSMITH,
    to: TOWN_GENERAL,
    label: 'south',
    type: 'open',
  },
  exit_general_blacksmith: {
    id: 'exit_general_blacksmith',
    from: TOWN_GENERAL,
    to: TOWN_BLACKSMITH,
    label: 'north',
    type: 'open',
  },
  // Alchemist <-> General
  exit_alchemist_general: {
    id: 'exit_alchemist_general',
    from: TOWN_ALCHEMIST,
    to: TOWN_GENERAL,
    label: 'south',
    type: 'open',
  },
  exit_general_alchemist: {
    id: 'exit_general_alchemist',
    from: TOWN_GENERAL,
    to: TOWN_ALCHEMIST,
    label: 'north',
    type: 'open',
  },
};

// ============ Town Adjacency ============
export const EASTHOLLOW_ADJACENCY: Record<string, string[]> = {
  [TOWN_INN]: ['exit_inn_square'],
  [TOWN_SQUARE]: ['exit_square_inn', 'exit_square_training', 'exit_square_market', 'exit_square_gate'],
  [TOWN_TRAINING]: ['exit_training_square'],
  [TOWN_MARKET]: ['exit_market_square', 'exit_market_blacksmith', 'exit_market_alchemist'],
  [TOWN_BLACKSMITH]: ['exit_blacksmith_market', 'exit_blacksmith_general'],
  [TOWN_ALCHEMIST]: ['exit_alchemist_market', 'exit_alchemist_general'],
  [TOWN_GENERAL]: ['exit_general_blacksmith', 'exit_general_alchemist'],
  [TOWN_GATE]: ['exit_gate_square'],
};

// ============ NPCs ============
export const EASTHOLLOW_NPCS: Record<string, NPC> = {
  npc_mira: {
    id: 'npc_mira',
    name: 'Mira',
    title: 'Innkeeper',
    locationId: TOWN_INN,
    tutorialTopics: ['basics', 'movement', 'items'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Tell me about this place',
        response: "Welcome to The Rusty Blade! This is Easthollow, a quiet settlement at the edge of the wilderness. Many adventurers pass through here before heading into the wilds.",
      },
      {
        id: 'basics',
        prompt: 'How do I look around?',
        response: "Just type 'look' to see your surroundings. You can also 'look' at specific things, like 'look sword' or 'examine mira' to see them more closely.",
        teachesCommand: 'talk_mira',
      },
      {
        id: 'movement',
        prompt: 'How do I move around?',
        response: "Use compass directions like 'north', 'south', 'east', 'west' or shortcuts like 'n', 's', 'e', 'w'. You can also 'go' through named exits like 'go passage'.",
      },
      {
        id: 'items',
        prompt: 'How do I pick things up?',
        response: "Type 'take <item>' to pick something up, and 'drop <item>' to put it down. Check your 'inventory' to see what you're carrying.",
      },
      {
        id: 'farewell',
        prompt: 'Nothing right now, thanks',
        response: 'Safe travels, adventurer! Come back anytime.',
      },
    ],
  },
  npc_holt: {
    id: 'npc_holt',
    name: 'Captain Holt',
    title: 'Guard Captain',
    locationId: TOWN_TRAINING,
    tutorialTopics: ['combat'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Teach me to fight',
        response: "Ah, eager to learn! To attack, type 'attack <target>' or 'kill <target>'. Try it on the training dummy here - it won't fight back.",
        teachesCommand: 'class_training',
      },
      {
        id: 'flee',
        prompt: 'How do I escape combat?',
        response: "If things go badly, type 'flee' to try to escape. You have about a 50% chance to get away. Better to run than die!",
      },
      {
        id: 'dummy',
        prompt: 'Tell me about the training dummy',
        response: "The dummy is enchanted - it can take a beating but never breaks. Perfect for practice. Go ahead, give it a whack!",
      },
    ],
  },
  npc_sera: {
    id: 'npc_sera',
    name: 'Apprentice Sera',
    title: 'Mage Trainer',
    locationId: TOWN_TRAINING,
    tutorialTopics: ['magic'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Teach me about magic',
        response: "Magic flows through all things. As a mage, you can 'cast <spell>' to unleash your power. Watch your mana - it regenerates over time.",
        teachesCommand: 'class_training',
      },
      {
        id: 'spells',
        prompt: 'What spells can I use?',
        response: "You start with basic attack magic. As you grow stronger, you'll learn more powerful spells. Check your abilities with 'abilities'.",
      },
    ],
  },
  npc_shadow: {
    id: 'npc_shadow',
    name: 'Shadow',
    title: 'Rogue Trainer',
    locationId: TOWN_TRAINING,
    tutorialTopics: ['stealth'],
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Teach me your ways',
        response: "Stay quiet, strike fast, vanish before they know what hit them. Rogues deal extra damage from surprise attacks. Use 'sneak' to move unseen.",
        teachesCommand: 'class_training',
      },
      {
        id: 'backstab',
        prompt: 'How do I backstab?',
        response: "When hidden, your first attack deals bonus damage. Get behind your enemy, stay silent, then strike!",
      },
    ],
  },
  npc_thom: {
    id: 'npc_thom',
    name: 'Thom',
    title: 'Merchant',
    locationId: TOWN_GENERAL,
    tutorialTopics: ['shopping'],
    shop: {
      items: [
        { baseId: 'torch', basePrice: 5 },
        { baseId: 'rations', basePrice: 3 },
        { baseId: 'rope', basePrice: 10 },
        { baseId: 'empty_flask', basePrice: 5 },
        { baseId: 'bandage', basePrice: 8 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.5,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'What do you sell?',
        response: "General supplies for travelers! Type 'list' to see my wares, 'buy <item>' to purchase, or 'sell <item>' to sell me something.",
        teachesCommand: 'visit_shop',
      },
      {
        id: 'advice',
        prompt: 'Any advice for a new adventurer?',
        response: "Always carry torches - the wilderness gets dark. And rations! Nothing worse than starving in the middle of nowhere.",
      },
    ],
  },
  npc_kira: {
    id: 'npc_kira',
    name: 'Kira',
    title: 'Forge Master',
    locationId: TOWN_BLACKSMITH,
    shop: {
      items: [
        { baseId: 'iron_sword', basePrice: 50, stock: 3 },
        { baseId: 'iron_axe', basePrice: 55, stock: 2 },
        { baseId: 'wooden_shield', basePrice: 30, stock: 5 },
        { baseId: 'leather_armor', basePrice: 40, stock: 3 },
        { baseId: 'chain_mail', basePrice: 120, stock: 1 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.4,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Show me your weapons',
        response: "Fine steel, every piece! Type 'list' to browse. I buy and sell weapons and armor.",
        teachesCommand: 'visit_shop',
      },
      {
        id: 'equipment',
        prompt: 'How does equipment work?',
        response: "Type 'equip <item>' to wear gear from your inventory. 'unequip <slot>' to remove it. Check 'equipment' to see what you're wearing.",
      },
    ],
  },
  npc_elwin: {
    id: 'npc_elwin',
    name: 'Elwin',
    title: 'Sage',
    locationId: TOWN_ALCHEMIST,
    shop: {
      items: [
        { baseId: 'health_potion', basePrice: 25, stock: 10 },
        { baseId: 'mana_potion', basePrice: 25, stock: 10 },
        { baseId: 'antidote', basePrice: 15, stock: 5 },
        { baseId: 'stamina_tonic', basePrice: 20, stock: 5 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.3,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'What potions do you have?',
        response: "Remedies for all ailments! Health potions, mana restoratives, antidotes... Type 'list' to see everything.",
        teachesCommand: 'visit_shop',
      },
      {
        id: 'use',
        prompt: 'How do I use potions?',
        response: "Type 'use <potion>' to drink one. Health potions restore hit points, mana potions restore magical energy.",
      },
    ],
  },
};

// ============ Shop Items (templates for items NPCs sell) ============
export const SHOP_ITEM_TEMPLATES: Record<string, { name: string; tags: string[]; description: string }> = {
  torch: { name: 'Torch', tags: ['light', 'consumable'], description: 'A wooden torch that provides light.' },
  rations: { name: 'Rations', tags: ['food', 'consumable'], description: 'Dried meat and hardtack.' },
  rope: { name: 'Rope', tags: ['tool'], description: '50 feet of sturdy hemp rope.' },
  empty_flask: { name: 'Empty Flask', tags: ['container'], description: 'A glass flask for holding liquids.' },
  bandage: { name: 'Bandage', tags: ['healing', 'consumable'], description: 'Clean cloth bandages.' },
  iron_sword: { name: 'Iron Sword', tags: ['weapon', 'sword', 'melee'], description: 'A well-forged iron blade.' },
  iron_axe: { name: 'Iron Axe', tags: ['weapon', 'axe', 'melee'], description: 'A heavy iron axe.' },
  wooden_shield: { name: 'Wooden Shield', tags: ['armor', 'shield', 'offhand'], description: 'A sturdy wooden shield.' },
  leather_armor: { name: 'Leather Armor', tags: ['armor', 'chest', 'leather'], description: 'Supple leather armor.' },
  chain_mail: { name: 'Chain Mail', tags: ['armor', 'chest', 'metal'], description: 'Interlocking metal rings.' },
  health_potion: { name: 'Health Potion', tags: ['potion', 'consumable', 'healing'], description: 'Restores 50 HP.' },
  mana_potion: { name: 'Mana Potion', tags: ['potion', 'consumable', 'mana'], description: 'Restores 50 MP.' },
  antidote: { name: 'Antidote', tags: ['potion', 'consumable'], description: 'Cures poison.' },
  stamina_tonic: { name: 'Stamina Tonic', tags: ['potion', 'consumable'], description: 'Restores stamina.' },
};

// ============ Tutorial Rewards ============
export const TUTORIAL_COMPLETE_REWARD = {
  items: ['rations', 'rations', 'rations', 'rations', 'rations', 'torch', 'torch', 'torch', 'health_potion'],
  gold: 0,
};

export const TUTORIAL_SKIP_REWARD = {
  items: ['rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations',
          'torch', 'torch', 'torch', 'torch', 'torch', 'health_potion', 'health_potion', 'health_potion'],
  gold: 50,
  classBonus: {
    warrior: { baseId: 'whetstone', name: 'Steel Whetstone', tags: ['consumable', 'buff'], description: '+5% damage for 10 fights' },
    mage: { baseId: 'mana_crystal', name: 'Mana Crystal', tags: ['consumable', 'mana'], description: 'Restores 50 mana' },
    rogue: { baseId: 'smoke_bomb', name: 'Smoke Bomb', tags: ['consumable', 'escape'], description: 'Guaranteed flee' },
  },
};

// ============ Town Creatures ============
export const EASTHOLLOW_CREATURES: Record<string, Creature> = {
  creature_training_dummy: {
    id: 'creature_training_dummy',
    templateId: 'training_dummy',
    name: 'Training Dummy',
    level: 1,
    behavior: 'passive',
    mobility: 'static',
    currentHp: 9999,
    maxHp: 9999,
    locationId: TOWN_TRAINING,
    homeLocationId: TOWN_TRAINING,
    spawnLocationId: TOWN_TRAINING,
    inCombat: false,
    description: 'A straw-stuffed training dummy stands ready for practice.',
  },
};
