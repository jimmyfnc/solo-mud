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
export const TOWN_TEMPLE = 'town_temple';
export const TOWN_EAST_ROAD = 'town_east_road'; // Street connecting Inn and Temple

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
    npcs: ['npc_giles', 'npc_pete'],
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
    npcs: ['npc_marcus'],
  },
  [TOWN_TEMPLE]: {
    id: TOWN_TEMPLE,
    name: 'Temple of the Light',
    biome: { plains: 1 },
    props: [
      'stone altar with candles',
      'stained glass windows',
      'wooden prayer benches',
      'holy water font',
      'peaceful candlelight',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    isRespawnPoint: true,
    npcs: ['npc_priestess_anna'],
  },
  [TOWN_EAST_ROAD]: {
    id: TOWN_EAST_ROAD,
    name: 'Eastern Road',
    biome: { plains: 1 },
    props: [
      'worn cobblestone path',
      'wooden signpost',
      'iron street lamp',
      'overhanging inn sign',
    ],
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
  // Square <-> East Road
  exit_square_eastroad: {
    id: 'exit_square_eastroad',
    from: TOWN_SQUARE,
    to: TOWN_EAST_ROAD,
    label: 'east',
    type: 'open',
  },
  exit_eastroad_square: {
    id: 'exit_eastroad_square',
    from: TOWN_EAST_ROAD,
    to: TOWN_SQUARE,
    label: 'west',
    type: 'open',
  },
  // East Road <-> Inn (Inn is north of East Road)
  exit_eastroad_inn: {
    id: 'exit_eastroad_inn',
    from: TOWN_EAST_ROAD,
    to: TOWN_INN,
    label: 'north',
    type: 'open',
  },
  exit_eastroad_inn_named: {
    id: 'exit_eastroad_inn_named',
    from: TOWN_EAST_ROAD,
    to: TOWN_INN,
    label: 'inn',
    type: 'open',
  },
  exit_inn_out: {
    id: 'exit_inn_out',
    from: TOWN_INN,
    to: TOWN_EAST_ROAD,
    label: 'out',
    type: 'open',
  },
  // East Road <-> Temple (Temple is south of East Road)
  exit_eastroad_temple: {
    id: 'exit_eastroad_temple',
    from: TOWN_EAST_ROAD,
    to: TOWN_TEMPLE,
    label: 'south',
    type: 'open',
  },
  exit_eastroad_temple_named: {
    id: 'exit_eastroad_temple_named',
    from: TOWN_EAST_ROAD,
    to: TOWN_TEMPLE,
    label: 'temple',
    type: 'open',
  },
  exit_temple_out: {
    id: 'exit_temple_out',
    from: TOWN_TEMPLE,
    to: TOWN_EAST_ROAD,
    label: 'out',
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
  [TOWN_SQUARE]: ['exit_square_eastroad', 'exit_square_training', 'exit_square_market', 'exit_square_gate'],
  [TOWN_EAST_ROAD]: [
    'exit_eastroad_square',
    'exit_eastroad_inn', 'exit_eastroad_inn_named',
    'exit_eastroad_temple', 'exit_eastroad_temple_named',
  ],
  [TOWN_INN]: ['exit_inn_out'],
  [TOWN_TEMPLE]: ['exit_temple_out'],
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
    shop: {
      items: [
        { baseId: 'ale', basePrice: 2 },
        { baseId: 'wine', basePrice: 8 },
        { baseId: 'bread', basePrice: 1 },
        { baseId: 'cheese_wedge', basePrice: 3 },
        { baseId: 'rations', basePrice: 4 },
        { baseId: 'waterskin', basePrice: 5 },
        { baseId: 'torch', basePrice: 3 },
        { baseId: 'travelers_map', basePrice: 50, stock: 1 },
      ],
      buyMultiplier: 1.0,
      sellMultiplier: 0.4,
    },
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Tell me about this place',
        response: "Welcome to The Rusty Blade! This is Easthollow, a quiet settlement at the edge of the wilderness. Many adventurers pass through here before heading into the wilds.",
      },
      {
        id: 'shop',
        prompt: 'What do you have for sale?',
        response: "I've got ale, wine, fresh bread, cheese, and trail rations for the road. Torches and waterskins too. Type 'list' to see my wares, or 'buy <item>' to purchase something.",
        teachesCommand: 'visit_shop',
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
    simulation: {
      personality: 'cheerful',
      topics: ['weather', 'adventurers', 'gossip', 'trade'],
      topicInterest: { weather: 5, adventurers: 8, gossip: 9, trade: 6 },
      ambientActions: [
        { text: 'wipes down the bar with a worn cloth', weight: 5 },
        { text: 'pours a drink for a patron', weight: 4 },
        { text: 'laughs at something someone said', weight: 3 },
        { text: 'stacks clean mugs behind the counter', weight: 2 },
        { text: 'hums a cheerful tune', weight: 2 },
        { text: "shakes her head at Pete lurking outside the window", weight: 1 },
        { text: 'swats a fly away from the cheese', weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Welcome, traveler! Sit anywhere you like.' },
          { weight: 3, says: 'Back again? The usual?', condition: 'player.visits > 3' },
          { weight: 1, says: "You look like you've seen some things out there. First drink's on me." },
        ],
        time_change: [
          { weight: 5, action: 'lights the lanterns', says: "Evening crowd'll be here soon." },
        ],
        player_levelup: [
          { weight: 4, says: 'Look at you! Moving up in the world!' },
          { weight: 1, action: 'raises a mug', says: 'A toast! To the hero in our midst!' },
        ],
      },
    },
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
    simulation: {
      personality: 'stern',
      topics: ['combat', 'discipline', 'training', 'threats'],
      topicInterest: { combat: 10, discipline: 9, training: 8, threats: 7 },
      ambientActions: [
        { text: 'barks orders at an invisible recruit', weight: 5 },
        { text: 'demonstrates a sword form with practiced precision', weight: 4 },
        { text: 'inspects a training dummy with a critical eye', weight: 3 },
        { text: 'mutters about the sorry state of new recruits', weight: 3 },
        { text: 'does push-ups to stay sharp', weight: 2 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'New blood! Show me what you can do.' },
          { weight: 3, says: 'Back for more training? Good. Discipline wins battles.' },
          { weight: 1, says: "You remind me of myself at your age. Except I had better posture." },
        ],
        player_combat: [
          { weight: 5, says: 'Watch your footwork! Sloppy stance gets you killed.' },
          { weight: 2, says: "Not bad. Not great. But not bad." },
        ],
        player_levelup: [
          { weight: 5, says: 'Stronger, eh? Good. Now train harder.' },
          { weight: 1, action: 'nods with rare approval', says: "You might just survive out there after all." },
        ],
      },
    },
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
    simulation: {
      personality: 'nervous',
      topics: ['magic', 'spells', 'elements', 'study'],
      topicInterest: { magic: 10, spells: 9, elements: 8, study: 7 },
      ambientActions: [
        { text: 'traces arcane symbols in the air, leaving faint glowing trails', weight: 5 },
        { text: 'mutters an incantation under her breath', weight: 4 },
        { text: 'flips through a worn spellbook', weight: 4 },
        { text: 'accidentally singes her sleeve and quickly pats it out', weight: 2 },
        { text: 'creates tiny sparks between her fingertips, looking pleased', weight: 3 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Oh! A student? I mean... welcome to magic training.' },
          { weight: 3, says: "Careful where you step! I'm working on a... actually, it's fine. It's fine." },
          { weight: 1, says: "Don't mind the scorch marks. Those are from... someone else. Definitely." },
        ],
        player_combat: [
          { weight: 5, says: 'Remember: aim AWAY from friendlies!' },
          { weight: 2, action: 'winces', says: 'That looked like it hurt. The magic, I mean. Not your form.' },
        ],
        player_levelup: [
          { weight: 5, says: "Your magical potential grows! I can sense it. Or that might be the potions..." },
        ],
        time_change: [
          { weight: 3, action: 'yawns', says: 'Magic practice is exhausting. But also invigorating! Mostly exhausting.' },
        ],
      },
    },
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
    simulation: {
      personality: 'wise',
      topics: ['stealth', 'shadows', 'secrets', 'survival'],
      topicInterest: { stealth: 10, shadows: 9, secrets: 8, survival: 7 },
      ambientActions: [
        { text: 'seems to flicker in and out of the shadows', weight: 5 },
        { text: 'flips a dagger between her fingers absently', weight: 4 },
        { text: 'appears suddenly from somewhere you could swear was empty', weight: 3 },
        { text: 'examines a lock pick with professional interest', weight: 3 },
        { text: 'is definitely NOT behind you right now', weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: '...How long have you been standing there?' },
          { weight: 3, says: "Good. You're learning to move quietly. I almost didn't hear you." },
          { weight: 1, says: "I saw you coming from three rooms away. We'll work on that." },
        ],
        player_combat: [
          { weight: 5, says: "Strike from the shadows. They can't hit what they can't see." },
          { weight: 2, action: 'watches silently', says: "...Adequate." },
        ],
        player_levelup: [
          { weight: 5, says: 'Your instincts sharpen. The shadows welcome you.' },
          { weight: 1, action: 'almost smiles', says: "You might make a decent rogue yet. Don't let it go to your head." },
        ],
      },
    },
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
    simulation: {
      personality: 'friendly',
      topics: ['trade', 'weather', 'supplies', 'travelers'],
      topicInterest: { trade: 9, weather: 6, supplies: 8, travelers: 7 },
      ambientActions: [
        { text: 'rearranges items on the shelves', weight: 5 },
        { text: 'counts coins from a recent sale', weight: 4 },
        { text: 'checks inventory on a worn ledger', weight: 3 },
        { text: 'dusts off a display of goods', weight: 3 },
        { text: 'whistles while working', weight: 2 },
        { text: "glances toward the blacksmith and sighs competitively", weight: 2 },
        { text: "adjusts a sign reading 'BETTER PRICES THAN THE FORGE'", weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Welcome! Looking for supplies?' },
          { weight: 3, says: 'Ah, a familiar face! What can I get you today?', condition: 'player.visits > 3' },
          { weight: 1, says: "Don't believe what Kira says about my merchandise. It's all quality goods here." },
        ],
        player_levelup: [
          { weight: 5, says: 'Congratulations! Growing stronger every day.' },
          { weight: 1, says: 'Moving up in the world! Might need some premium supplies now, eh?' },
        ],
        time_change: [
          { weight: 3, action: 'stretches', says: 'Time flies when business is good!' },
        ],
      },
    },
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
    simulation: {
      personality: 'gruff',
      topics: ['weapons', 'armor', 'craftsmanship', 'monsters'],
      topicInterest: { weapons: 9, armor: 8, craftsmanship: 10, monsters: 5 },
      ambientActions: [
        { text: 'hammers a glowing piece of metal on the anvil', weight: 5 },
        { text: 'wipes sweat from her brow', weight: 4 },
        { text: 'inspects a blade for imperfections', weight: 3 },
        { text: 'stokes the forge fire', weight: 3 },
        { text: 'grunts as she lifts a heavy piece of armor', weight: 2 },
        { text: "mutters about Thom's 'quality' merchandise", weight: 2 },
        { text: "shakes her head at a sword that clearly wasn't made here", weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Need something forged?' },
          { weight: 3, says: "You again. Here for repairs or something new?" },
          { weight: 1, says: "Let me guess - you bought gear from Thom and now it's broken. I'm not surprised." },
        ],
        player_combat: [
          { weight: 5, says: 'Take the fight outside! This is a forge, not a battlefield.' },
        ],
        player_levelup: [
          { weight: 5, says: 'Getting stronger? Good. You can handle heavier armor now.' },
          { weight: 1, action: 'nods approvingly', says: "Now THAT'S what proper training looks like." },
        ],
      },
    },
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
    simulation: {
      personality: 'wise',
      topics: ['alchemy', 'herbs', 'healing', 'knowledge'],
      topicInterest: { alchemy: 10, herbs: 9, healing: 8, knowledge: 9 },
      ambientActions: [
        { text: 'stirs a bubbling cauldron with practiced care', weight: 5 },
        { text: 'examines a vial of suspicious liquid, then nods approvingly', weight: 4 },
        { text: 'crushes dried herbs with a mortar and pestle', weight: 4 },
        { text: 'mutters formulas and measurements to himself', weight: 3 },
        { text: 'tastes something and makes an indescribable face', weight: 2 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Ah, seeking remedies? Or perhaps... enhancements?' },
          { weight: 3, says: "Mind the purple cauldron. It's... temperamental today." },
          { weight: 1, says: "Perfect timing! I need someone to test - I mean, to PURCHASE a new formula." },
        ],
        player_combat: [
          { weight: 5, says: 'Not near the volatile compounds! Take it outside!' },
        ],
        player_levelup: [
          { weight: 5, says: 'Your constitution grows stronger. Excellent for surviving my experiments - I mean, potions.' },
        ],
        time_change: [
          { weight: 4, action: 'lights more candles', says: 'Delicate work continues into the night...' },
        ],
      },
    },
  },
  npc_marcus: {
    id: 'npc_marcus',
    name: 'Marcus',
    title: 'Town Guard',
    locationId: TOWN_GATE,
    dialogue: [
      {
        id: 'greeting',
        prompt: 'What lies beyond the gate?',
        response: 'The wilderness stretches far beyond these walls. Dangerous creatures roam out there. Stay sharp if you venture out.',
        teachesCommand: 'leave_town',
      },
      {
        id: 'safety',
        prompt: 'Is the town safe?',
        response: "Aye, within these walls you're protected. The guard patrol keeps troublemakers at bay.",
      },
    ],
    simulation: {
      personality: 'stern',
      topics: ['safety', 'threats', 'duty', 'wilderness'],
      topicInterest: { safety: 9, threats: 8, duty: 7, wilderness: 6 },
      ambientActions: [
        { text: 'stands at attention, watching the gate', weight: 5 },
        { text: 'adjusts his sword belt', weight: 4 },
        { text: 'scans the horizon for threats', weight: 4 },
        { text: 'nods curtly to a passing citizen', weight: 3 },
        { text: 'polishes a scuff mark from his armor', weight: 2 },
        { text: 'mutters about being stuck on gate duty again', weight: 2 },
        { text: 'suppresses a yawn and stands up straighter', weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Halt. State your business.' },
          { weight: 3, says: 'Back from the wilds? Any trouble out there?' },
          { weight: 1, says: "You know, I used to be an adventurer too. Then I got promoted. ...I miss the adventure." },
        ],
        creature_enter: [
          { weight: 5, action: 'draws his sword', says: 'Stand back, citizen!' },
        ],
        time_change: [
          { weight: 4, says: 'Another shift, another day. At least nothing attacked the gate today.' },
          { weight: 2, action: 'stretches stiffly', says: "Relief should be here soon. I hope." },
        ],
        player_levelup: [
          { weight: 3, says: 'Growing stronger? Good. The wilds need more capable fighters.' },
        ],
      },
    },
  },
  npc_giles: {
    id: 'npc_giles',
    name: 'Giles',
    title: 'Farmer',
    locationId: TOWN_SQUARE,
    dialogue: [
      {
        id: 'greeting',
        prompt: 'How are the crops?',
        response: "Fair enough this season, though we could use more rain. The fields east of town keep us fed, they do.",
      },
      {
        id: 'town',
        prompt: 'Tell me about Easthollow',
        response: "Been here all my life. Quiet place, mostly. Good folk. The adventurers passing through bring coin, so we don't complain.",
      },
    ],
    simulation: {
      personality: 'friendly',
      topics: ['weather', 'crops', 'town_life', 'gossip'],
      topicInterest: { weather: 10, crops: 9, town_life: 7, gossip: 6 },
      ambientActions: [
        { text: 'wipes dirt from his hands on his apron', weight: 5 },
        { text: 'squints up at the sky, checking the weather', weight: 4 },
        { text: 'chats amiably with a passerby', weight: 3 },
        { text: 'adjusts his worn straw hat', weight: 3 },
        { text: 'stretches his back with a groan', weight: 2 },
        { text: 'watches a chicken wander through the square', weight: 2 },
        { text: 'gives Pete a suspicious look', weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: "Mornin'! Fine day, isn't it?" },
          { weight: 3, says: "Ah, the adventurer! How goes the monster hunting?" },
          { weight: 1, says: "You ever think about settling down, growing turnips? No? Just me then." },
        ],
        time_change: [
          { weight: 5, action: 'stretches', says: "Sun's settin'. Best get home to the missus." },
        ],
        player_levelup: [
          { weight: 4, says: "Getting stronger! My nephew wanted to be an adventurer too. He's a baker now." },
          { weight: 1, action: 'chuckles', says: "Back in my day, we just hit things with farm tools. You kids have it easy." },
        ],
      },
    },
  },
  npc_pete: {
    id: 'npc_pete',
    name: 'Pete',
    title: 'Layabout',
    locationId: TOWN_SQUARE,
    dialogue: [
      {
        id: 'greeting',
        prompt: "What's your story?",
        response: "Me? Oh, I'm just... between opportunities, you might say. Keep my ear to the ground, learn things. Information's valuable, friend.",
      },
      {
        id: 'rumors',
        prompt: 'Heard any rumors?',
        response: "Always whispers floatin' around. Some say there's treasure in the old sewers, if you can stomach the rats. But you didn't hear that from me.",
      },
    ],
    simulation: {
      personality: 'nervous',
      topics: ['rumors', 'schemes', 'money', 'secrets'],
      topicInterest: { rumors: 9, schemes: 8, money: 10, secrets: 9 },
      ambientActions: [
        { text: 'glances around furtively', weight: 5 },
        { text: 'fidgets with a coin, rolling it across his knuckles', weight: 4 },
        { text: 'leans against the well, trying to look casual', weight: 4 },
        { text: 'scratches behind his ear nervously', weight: 3 },
        { text: 'whistles tunelessly, avoiding eye contact', weight: 2 },
        { text: "counts something on his fingers, mutters 'that can't be right', starts over", weight: 2 },
        { text: "scribbles on a scrap of paper labeled 'DEFINITELY LEGITIMATE BUSINESS PLAN'", weight: 1 },
        { text: "practices looking innocent in a puddle's reflection", weight: 1 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: "Oh! Didn't see you there. Just... enjoying the square." },
          { weight: 3, says: 'Psst. Hey. You look like someone who appreciates a good deal.' },
          { weight: 1, says: "You ever think about how much gold the rats in the sewer must have accumulated? No? Just me? Okay." },
        ],
        player_levelup: [
          { weight: 5, says: "Gettin' stronger, eh? Might have some work for someone with your... talents." },
          { weight: 1, says: "You know, with your skills and my ideas, we could... no, no, forget I said anything." },
        ],
        time_change: [
          { weight: 3, action: 'yawns dramatically', says: "Well, time to check on my 'investments'. Don't follow me." },
        ],
      },
    },
  },
  npc_priestess_anna: {
    id: 'npc_priestess_anna',
    name: 'Anna',
    title: 'Priestess',
    locationId: TOWN_TEMPLE,
    dialogue: [
      {
        id: 'greeting',
        prompt: 'Tell me about the temple',
        response: "This is the Temple of the Light, a sanctuary for weary travelers and those seeking solace. The Light guides all who enter with an open heart.",
      },
      {
        id: 'healing',
        prompt: 'Can you heal me?',
        response: "The Light's blessing flows through this sacred place. Rest here and you shall be restored. Those who fall in battle are returned here to begin anew.",
      },
      {
        id: 'blessing',
        prompt: 'May I receive a blessing?',
        response: "May the Light guide your path and shield you from darkness. Go forth with courage, adventurer.",
      },
    ],
    simulation: {
      personality: 'wise',
      topics: ['faith', 'healing', 'guidance', 'hope'],
      topicInterest: { faith: 10, healing: 9, guidance: 8, hope: 9 },
      ambientActions: [
        { text: 'lights a candle on the altar with quiet reverence', weight: 5 },
        { text: 'kneels in silent prayer before the altar', weight: 4 },
        { text: 'tends to the holy water font', weight: 3 },
        { text: 'reads from a worn prayer book', weight: 3 },
        { text: 'adjusts the stained glass window to catch the light', weight: 2 },
        { text: 'hums a gentle hymn', weight: 2 },
      ],
      reactions: {
        player_enter: [
          { weight: 5, says: 'Welcome, traveler. The Light embraces all who seek peace.' },
          { weight: 3, says: 'You carry a heavy burden. Rest here awhile.' },
          { weight: 2, says: 'The temple is always open to those in need.', condition: 'player.hp < player.maxHp * 0.5' },
        ],
        player_death: [
          { weight: 5, action: 'places a gentle hand on your shoulder', says: 'Rest now. The Light has returned you to us.' },
        ],
        player_levelup: [
          { weight: 5, says: 'Your spirit grows stronger. The Light shines within you.' },
          { weight: 2, action: 'smiles warmly', says: 'May your newfound strength serve the greater good.' },
        ],
        time_change: [
          { weight: 4, action: 'lights the evening candles', says: 'Another day ends. May the night bring peace.' },
        ],
      },
    },
  },
};

// ============ Shop Items (templates for items NPCs sell) ============
export const SHOP_ITEM_TEMPLATES: Record<string, { name: string; tags: string[]; description: string }> = {
  // General supplies
  torch: { name: 'Torch', tags: ['light', 'consumable'], description: 'A wooden torch that provides light.' },
  rations: { name: 'Rations', tags: ['food', 'consumable'], description: 'Dried meat and hardtack.' },
  rope: { name: 'Rope', tags: ['tool'], description: '50 feet of sturdy hemp rope.' },
  empty_flask: { name: 'Empty Flask', tags: ['container'], description: 'A glass flask for holding liquids.' },
  bandage: { name: 'Bandage', tags: ['healing', 'consumable'], description: 'Clean cloth bandages.' },
  // Inn supplies
  ale: { name: 'Mug of Ale', tags: ['drink', 'consumable'], description: 'A frothy mug of the house ale.' },
  wine: { name: 'Bottle of Wine', tags: ['drink', 'consumable'], description: 'A decent vintage from the southern vineyards.' },
  bread: { name: 'Fresh Bread', tags: ['food', 'consumable'], description: 'A warm loaf, still steaming.' },
  cheese_wedge: { name: 'Cheese Wedge', tags: ['food', 'consumable'], description: 'Sharp yellow cheese from local farms.' },
  waterskin: { name: 'Waterskin', tags: ['drink', 'container'], description: 'A leather waterskin, filled with fresh water.' },
  travelers_map: { name: "Traveler's Map", tags: ['tool', 'rare'], description: 'A hand-drawn map of the local wilderness.' },
  // Weapons
  iron_sword: { name: 'Iron Sword', tags: ['weapon', 'sword', 'melee'], description: 'A well-forged iron blade.' },
  iron_axe: { name: 'Iron Axe', tags: ['weapon', 'axe', 'melee'], description: 'A heavy iron axe.' },
  wooden_shield: { name: 'Wooden Shield', tags: ['armor', 'shield', 'offhand'], description: 'A sturdy wooden shield.' },
  leather_armor: { name: 'Leather Armor', tags: ['armor', 'chest', 'leather'], description: 'Supple leather armor.' },
  chain_mail: { name: 'Chain Mail', tags: ['armor', 'chest', 'metal'], description: 'Interlocking metal rings.' },
  // Potions
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
