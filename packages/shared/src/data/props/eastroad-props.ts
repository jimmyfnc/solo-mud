import type { PropDefinition } from './types';

export const EASTROAD_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  eastroad_treasure_map: {
    id: 'eastroad_treasure_map',
    name: 'buried scrap',
    tier: 'signature',
    verbs: ['dig', 'unearth', 'excavate'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You dig up a weathered scrap of parchment - part of a treasure map! An X marks a spot in the wilderness.',
        'The paper is old and torn, but you can make out landmarks. Someone buried treasure nearby.',
        'A fragment of a map emerges from the dirt. Half of it is missing, but the X is clear.',
      ],
      cooldown: 10080, // 7 days
      rewards: {
        item: 'treasure_map_fragment',
        lore: 'This map fragment shows part of the wilderness outside Easthollow. The full map might reveal something valuable.',
      },
    },
    examineText: [
      'Disturbed earth near the road\'s edge, as if something was hastily buried.',
      'The dirt here is looser than elsewhere, recently turned.',
    ],
  },

  eastroad_love_letter: {
    id: 'eastroad_love_letter',
    name: 'fallen letter',
    tier: 'signature',
    verbs: ['read', 'pick', 'examine'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'A love letter, dropped and forgotten. "My dearest M, I cannot bear another day..." The rest is too personal to read.',
        'You find a sealed letter. The wax bears an unfamiliar crest. Someone might want this back.',
        'A letter lies in the gutter, rain-spotted but readable. A mystery of the heart.',
      ],
      cooldown: 1440, // 24 hours
      rewards: {
        item: 'mysterious_letter',
        lore: 'Someone lost this letter. They might reward its return... or prefer it stayed lost.',
      },
    },
    examineText: [
      'A folded piece of paper caught against the base of a planter.',
      'It looks like a letter, dropped by some distracted passerby.',
    ],
  },

  // === INTERACTIVE PROPS ===
  eastroad_signpost: {
    id: 'eastroad_signpost',
    name: 'signpost',
    tier: 'interactive',
    verbs: ['read', 'examine', 'check'],
    defaultInteraction: {
      text: [
        'Arrows point the way: "Inn" north, "Temple" south, "Town Square" west.',
        'The signpost is weathered but readable. Helpful for newcomers.',
        'You check your bearings. The signs confirm you know where you are.',
        'Someone has carved "Kilroy was here" into the post.',
        'The paint is faded but legible. This post has guided travelers for decades.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A wooden signpost at the intersection, pointing toward major destinations.',
      'The post has been here long enough to collect graffiti and carved initials.',
    ],
  },

  eastroad_street_lamp: {
    id: 'eastroad_street_lamp',
    name: 'street lamp',
    tier: 'interactive',
    verbs: ['examine', 'light', 'check'],
    defaultInteraction: {
      text: [
        'The lamp post stands ready for evening, its oil reservoir full.',
        'You examine the lamp. Well-maintained by the town, ensuring safe streets.',
        'The glass is clean, the wick trimmed. The lamplighter takes pride in their work.',
        'A moth circles the dark lamp, waiting for nightfall.',
      ],
      cooldown: 5,
    },
    examineText: [
      'An iron lamp post, one of several lining the Eastern Road.',
      'The lamps are lit each evening, making this one of the safer streets at night.',
    ],
  },

  eastroad_milestone: {
    id: 'eastroad_milestone',
    name: 'milestone',
    tier: 'interactive',
    verbs: ['read', 'examine', 'study'],
    defaultInteraction: {
      text: [
        '"Easthollow - Center" the stone reads. All distances measured from here.',
        'The milestone has stood here since the town\'s founding.',
        'You trace the carved numbers. History beneath your fingertips.',
        'The stone is worn smooth on top where people sit and rest.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A weathered stone marker denoting the center of Easthollow.',
      'Travelers measure their journeys from this point.',
    ],
  },

  eastroad_sparrows: {
    id: 'eastroad_sparrows',
    name: 'sparrows',
    tier: 'interactive',
    verbs: ['watch', 'feed', 'observe'],
    defaultInteraction: {
      text: [
        'The sparrows hop along the road, pecking at crumbs and seeds.',
        'You toss a crumb. The sparrows descend in a flutter of wings.',
        'The little birds chirp and squabble over the best perches.',
        'A bold sparrow lands near your foot, looking up expectantly.',
        'The sparrows take flight at a passing cart, then return immediately.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Small brown sparrows that have made the Eastern Road their territory.',
      'They survive on crumbs dropped by pedestrians and outdoor diners.',
    ],
  },

  eastroad_wandering_goose: {
    id: 'eastroad_wandering_goose',
    name: 'wandering goose',
    tier: 'interactive',
    verbs: ['pet', 'avoid', 'approach', 'shoo'],
    defaultInteraction: {
      text: [
        'The goose hisses at you. This bird has chosen violence.',
        'You try to pet the goose. Bad idea. It nips at your fingers.',
        'The goose waddles toward you menacingly. You step aside.',
        '"That\'s Gerald," a local explains. "He owns this street. We just live here."',
        'You attempt to shoo the goose. It advances. You retreat.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A large, aggressive goose that has claimed the Eastern Road as its domain.',
      'Locals give it a wide berth. The goose rules here.',
    ],
  },

  // === FLAVOR PROPS ===
  eastroad_cobblestones: {
    id: 'eastroad_cobblestones',
    name: 'road cobblestones',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The cobblestones are smooth from years of foot traffic.',
        'Well-laid stones make for easy walking, even in rain.',
        'Some stones are newer than others - repairs after harsh winters.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Neatly laid cobblestones forming a well-maintained road.',
    ],
  },

  eastroad_flower_planters: {
    id: 'eastroad_flower_planters',
    name: 'flower planters',
    tier: 'flavor',
    verbs: ['smell', 'admire', 'look'],
    defaultInteraction: {
      text: [
        'Bright flowers bloom in wooden planters, adding color to the street.',
        'You smell the flowers. Sweet and fresh, lovingly tended.',
        'Someone takes pride in these planters. They\'re beautiful.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Wooden planters filled with seasonal flowers, beautifying the street.',
    ],
  },

  eastroad_temple_bells: {
    id: 'eastroad_temple_bells',
    name: 'temple bells',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'The temple bells ring faintly from the south, marking the hour.',
        'You hear the bells and check the sun. Right on time.',
        'The melodic chiming carries clearly on the breeze.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The sound of the temple bells, audible from here.',
    ],
  },

  eastroad_inn_laughter: {
    id: 'eastroad_inn_laughter',
    name: 'inn laughter',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'Laughter spills from the inn to the north. Someone\'s having a good time.',
        'You hear muffled merriment. The inn sounds lively tonight.',
        'A burst of laughter echoes down the street. The inn is popular.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The sound of laughter and cheer drifting from the nearby inn.',
    ],
  },

  eastroad_cooking_smells: {
    id: 'eastroad_cooking_smells',
    name: 'cooking smells',
    tier: 'flavor',
    verbs: ['smell', 'sniff'],
    defaultInteraction: {
      text: [
        'The aroma of cooking food drifts from somewhere nearby. Your stomach growls.',
        'You smell fresh bread, roasting meat, and something sweet.',
        'The Eastern Road smells like home - cooking, flowers, and honest work.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Enticing cooking smells wafting from the inn and nearby homes.',
    ],
  },

  eastroad_scratched_post: {
    id: 'eastroad_scratched_post',
    name: 'scratched post',
    tier: 'flavor',
    verbs: ['examine', 'read'],
    defaultInteraction: {
      text: [
        'Initials and dates are scratched into the wood. A record of visitors past.',
        'You find marks from decades ago. This post has seen much.',
        '"J + S, 1203" - someone\'s ancient romance immortalized.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A wooden post covered in scratched initials and dates.',
    ],
  },

  eastroad_sweeping_shopkeeper: {
    id: 'eastroad_sweeping_shopkeeper',
    name: 'sweeping shopkeeper',
    tier: 'flavor',
    verbs: ['watch', 'greet'],
    defaultInteraction: {
      text: [
        'A shopkeeper sweeps their stoop, nodding pleasantly as you pass.',
        '"Morning," they call, never pausing their sweeping.',
        'The eternal task of keeping a clean storefront. They don\'t seem to mind.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A diligent shopkeeper sweeping the cobblestones clean.',
    ],
  },

  eastroad_delivery_cart: {
    id: 'eastroad_delivery_cart',
    name: 'delivery cart',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'A cart rumbles past, loaded with goods for the shops.',
        'You step aside for a delivery cart. The driver tips his hat.',
        'Commerce in motion - the lifeblood of the town.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Carts making deliveries to the shops along the Eastern Road.',
    ],
  },
};
