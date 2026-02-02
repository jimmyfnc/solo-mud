import type { PropDefinition } from './types';

export const GENERAL_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  general_false_barrel: {
    id: 'general_false_barrel',
    name: 'old grain barrel',
    tier: 'signature',
    verbs: ['search', 'examine', 'open', 'check'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'The barrel\'s false bottom lifts away, revealing a small stash of coins - someone\'s emergency fund, now yours.',
        'You find a hidden compartment beneath the grain. A small pouch of coppers lies within.',
        'The barrel conceals more than grain. You pocket the coins hidden at the bottom.',
      ],
      cooldown: 43200, // 30 days (in minutes)
      rewards: {
        currency: 20,
        lore: 'Someone has been hiding coins here for emergencies. The barrel slowly accumulates savings.',
      },
    },
    examineText: [
      'An old barrel in the corner, supposedly full of grain. The lid seems loose.',
      'This barrel sits apart from the others, dusty and seemingly forgotten.',
    ],
  },

  // === INTERACTIVE PROPS ===
  general_shelves: {
    id: 'general_shelves',
    name: 'store shelves',
    tier: 'interactive',
    verbs: ['browse', 'examine', 'search', 'look'],
    defaultInteraction: {
      text: [
        'You scan the cluttered shelves. Rope, candles, tinderboxes, rations - all the basics an adventurer needs.',
        'The shelves are organized in a system only Thom understands. You find lamp oil next to dried fish.',
        'You spot some interesting items on the higher shelves - adventuring gear for more experienced delvers.',
        'Everything has a price tag in Thom\'s careful handwriting. Fair prices, nothing fancy.',
        '"Looking for something specific?" Thom calls. "If I don\'t have it, I can get it."',
      ],
      cooldown: 5,
    },
    examineText: [
      'Floor-to-ceiling wooden shelves packed with general goods and supplies.',
      'The organization seems chaotic, but Thom knows where everything is.',
    ],
  },

  general_grain_barrels: {
    id: 'general_grain_barrels',
    name: 'grain barrels',
    tier: 'interactive',
    verbs: ['examine', 'open', 'check'],
    defaultInteraction: {
      text: [
        'You peek into a barrel. Wheat grain fills it nearly to the brim.',
        'The grain smells fresh. Thom keeps his stock well-preserved.',
        'Mice would love to get in here, but the lids are tight.',
        'Various grains for various needs - wheat, oats, barley.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Large wooden barrels containing various grains, a staple of the general store.',
      'The barrels are sealed tight against vermin and moisture.',
    ],
  },

  general_crates: {
    id: 'general_crates',
    name: 'stacked crates',
    tier: 'interactive',
    verbs: ['examine', 'inspect', 'check'],
    defaultInteraction: {
      text: [
        'The crates are stamped with merchant marks from a dozen different sources.',
        'You peek into an open crate - salted meat, well-preserved for travel.',
        'Some crates are nailed shut, awaiting specific buyers.',
        '"Recent shipment," Thom notes. "Quality goods from the capital."',
      ],
      cooldown: 5,
    },
    examineText: [
      'Wooden crates stacked high, containing goods from across the region.',
      'The variety suggests Thom trades with many different suppliers.',
    ],
  },

  general_scales: {
    id: 'general_scales',
    name: 'merchant scales',
    tier: 'interactive',
    verbs: ['use', 'examine', 'weigh'],
    defaultInteraction: {
      text: [
        'You place something on the scale. The brass pans wobble, then settle to balance.',
        'The scales are precisely calibrated. Thom prides himself on honest measure.',
        'You test the scales with a coin. They\'re accurate to a fraction.',
        '"Weigh anything you like," Thom says. "Honest scales, honest prices."',
      ],
      cooldown: 5,
    },
    examineText: [
      'A set of brass merchant scales, well-maintained and precisely calibrated.',
      'The scales see constant use for measuring goods sold by weight.',
    ],
  },

  general_shop_bell: {
    id: 'general_shop_bell',
    name: 'shop bell',
    tier: 'interactive',
    verbs: ['ring', 'examine', 'touch'],
    defaultInteraction: {
      text: [
        'You ring the bell. Its clear tone echoes through the shop.',
        'The bell jingles cheerfully. "I heard you come in," Thom calls from the back.',
        'The brass bell is polished to a shine from years of use.',
        'DING. The sound is surprisingly loud in the quiet shop.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A small brass bell on the counter, rung to summon the shopkeeper.',
      'The bell has a pleasant, clear tone that carries throughout the store.',
    ],
  },

  general_penny_dish: {
    id: 'general_penny_dish',
    name: 'penny dish',
    tier: 'interactive',
    verbs: ['examine', 'take', 'give'],
    defaultInteraction: {
      text: [
        '"Take a penny, leave a penny," the sign reads. The dish holds a few coppers.',
        'The community penny dish. You consider taking one, but leave yours instead.',
        'Thom believes in small kindnesses. The penny dish is his way.',
        'A few coppers sit in the dish, available to anyone a coin short.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A small dish of loose coppers with a hand-painted sign about community spirit.',
      'The tradition helps customers who are a penny or two short on a purchase.',
    ],
  },

  general_sample_basket: {
    id: 'general_sample_basket',
    name: 'sample basket',
    tier: 'interactive',
    verbs: ['take', 'sample', 'examine'],
    defaultInteraction: {
      text: [
        'You take a small sample of dried fruit. Sweet and chewy.',
        'The sample basket holds small tastes of various goods. Good marketing.',
        'You try a bit of jerky. It\'s good - you might buy some.',
        '"Help yourself," Thom encourages. "Try before you buy."',
      ],
      cooldown: 15,
    },
    examineText: [
      'A wicker basket of small samples - dried fruits, nuts, and jerky.',
      'Thom offers free samples to help customers decide what to purchase.',
    ],
  },

  general_complaint_box: {
    id: 'general_complaint_box',
    name: 'complaint box',
    tier: 'interactive',
    verbs: ['examine', 'read', 'use', 'open'],
    defaultInteraction: {
      text: [
        'You peek inside. "More variety!" says one slip. "Lower prices!" says another.',
        'The box is mostly full of jokes. "Complaint: Not enough complaints."',
        '"I read every one," Thom assures you. "Mostly good for a laugh."',
        'A note reads: "Your candles are too waxy." Thom seems puzzled by that one.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A wooden box with a slot, accepting anonymous customer feedback.',
      'Scraps of paper poke out the top. Business is good, or complaints are many.',
    ],
  },

  general_canary: {
    id: 'general_canary',
    name: 'caged canary',
    tier: 'interactive',
    verbs: ['watch', 'listen', 'whistle'],
    defaultInteraction: {
      text: [
        'The canary trills a cheerful melody. It seems happy in its little domain.',
        'You whistle at the bird. It cocks its head and whistles back.',
        '"That\'s Goldie," Thom says. "Been with me twelve years. Good company."',
        'The canary fluffs its feathers and hops to a new perch.',
        'Goldie sings, filling the shop with unexpected beauty.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A bright yellow canary in a small brass cage, the shop\'s cheerful mascot.',
      'The cage is clean, with fresh water and seed. Thom takes good care of it.',
    ],
  },

  general_shopping_list: {
    id: 'general_shopping_list',
    name: 'posted shopping list',
    tier: 'interactive',
    verbs: ['read', 'examine', 'check'],
    defaultInteraction: {
      text: [
        'A customer\'s forgotten shopping list. "Rope, rations, torch. DON\'T FORGET ANTIDOTES."',
        'The list includes items for a dungeon delve. Someone\'s planning an adventure.',
        '"Ah, that\'s Marcus\'s list," Thom notes. "He\'ll be back for it."',
        'The list has items crossed off and new items added. Preparations take time.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A shopping list pinned to the notice board, left by a customer.',
      'It provides a glimpse into someone else\'s adventure preparations.',
    ],
  },

  // === FLAVOR PROPS ===
  general_musty_smell: {
    id: 'general_musty_smell',
    name: 'musty smell',
    tier: 'flavor',
    verbs: ['smell', 'sniff'],
    defaultInteraction: {
      text: [
        'The shop smells of old wood, grain, and dried goods. Comforting, in a way.',
        'A slight mustiness hangs in the air - the scent of a well-stocked storeroom.',
        'You breathe in the complex aroma of a general store.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The distinctive smell of a general store - wood, grain, and preserved goods.',
    ],
  },

  general_floorboards: {
    id: 'general_floorboards',
    name: 'creaking floorboards',
    tier: 'flavor',
    verbs: ['walk', 'step'],
    defaultInteraction: {
      text: [
        'The old boards creak underfoot. This building has stories to tell.',
        'Every step announces your presence. No sneaking here.',
        'The floor has been worn smooth by generations of customers.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Ancient wooden floorboards, worn smooth and creaky with age.',
    ],
  },

  general_dust_motes: {
    id: 'general_dust_motes',
    name: 'dust motes',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'Dust motes drift lazily in the sunbeams. Time moves slowly here.',
        'The floating particles catch the light like tiny stars.',
        'You watch the dust dance. Peaceful.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Tiny dust particles floating in the shafts of light from the windows.',
    ],
  },

  general_carved_heart: {
    id: 'general_carved_heart',
    name: 'carved heart',
    tier: 'flavor',
    verbs: ['examine', 'trace'],
    defaultInteraction: {
      text: [
        'Someone carved a heart into the counter long ago. Initials inside: "T + M"',
        'You trace the worn carving. A love story from decades past.',
        'The heart is old but still visible. Romance in unexpected places.',
      ],
      cooldown: 2,
    },
    examineText: [
      'An old heart with initials carved into the wooden counter.',
    ],
  },

  general_shop_mouse: {
    id: 'general_shop_mouse',
    name: 'shop mouse',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'A mouse scurries along the baseboard. Thom doesn\'t seem to mind.',
        'You spot a tiny mouse darting between shelves. It knows this place well.',
        '"That\'s Nibbles," Thom admits. "She keeps the spiders down."',
      ],
      cooldown: 2,
    },
    examineText: [
      'A small brown mouse that has made the shop its home.',
    ],
  },
};
