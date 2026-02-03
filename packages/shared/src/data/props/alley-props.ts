import type { PropDefinition } from './types';

export const ALLEY_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  alley_loose_brick: {
    id: 'alley_loose_brick',
    name: 'loose brick',
    tier: 'signature',
    verbs: ['pull', 'remove', 'pry', 'wiggle'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'The brick slides out to reveal a small hollow. Inside: a few coins and a scrap of paper with a strange symbol.',
        'You find a hidden cache behind the brick. Some copper and a note reading "The shadow knows."',
        'The hollow behind the brick contains coins and a crude map showing meeting spots around town.',
      ],
      cooldown: 10080, // 7 days
      rewards: {
        currency: 10,
        lore: 'This dead drop is used by Easthollow\'s less reputable citizens. The symbol might mean something to the right people.',
        unlock: 'thieves_guild_hint',
      },
    },
    examineText: [
      'One brick in the wall sits slightly askew, as if frequently moved.',
      'The mortar around this brick has crumbled, making it easy to remove.',
    ],
  },

  alley_scratched_map: {
    id: 'alley_scratched_map',
    name: 'scratched map',
    tier: 'signature',
    verbs: ['study', 'examine', 'trace', 'read'],
    defaultInteraction: {
      text: [
        'You study the crude map scratched into the stone. It shows the sewer layout - tunnels, junctions, and... a chamber marked with a crown.',
        'The map reveals the sewer\'s secrets. Someone went to great trouble to document this.',
        'You trace the scratched lines. This could guide you through the darkness below.',
        'The map shows a path through the sewers. X marks... something interesting.',
        'Whoever made this knew the sewers well. Perhaps too well.',
      ],
      cooldown: 30,
      rewards: {
        lore: 'The map shows the sewer layout, including the location of the Rat King\'s lair.',
      },
    },
    examineText: [
      'A crude map scratched into the alley wall, showing what looks like tunnels.',
      'The scratches are old but still visible, depicting an underground network.',
    ],
  },

  // === INTERACTIVE PROPS ===
  alley_crates: {
    id: 'alley_crates',
    name: 'discarded crates',
    tier: 'interactive',
    verbs: ['search', 'examine', 'move', 'check'],
    defaultInteraction: {
      text: [
        'You rummage through the crates. Empty bottles, rotten vegetables, and disappointment.',
        'The crates are mostly empty. Someone picked them clean before you.',
        'You find nothing valuable, but the crates would make good firewood.',
        'A rat scurries out as you disturb its home. You find nothing else.',
        'One crate still has a false bottom, but it\'s already been emptied.',
      ],
      cooldown: 30,
    },
    examineText: [
      'A jumbled pile of old wooden crates, discarded by the shops.',
      'The crates look thoroughly picked over, but might still hide something.',
    ],
  },

  alley_sewer_grate: {
    id: 'alley_sewer_grate',
    name: 'sewer grate',
    tier: 'interactive',
    verbs: ['examine', 'listen', 'open', 'lift'],
    defaultInteraction: {
      text: [
        'The grate is heavy but moveable. Darkness and foul air rise from below.',
        'You peer through the bars. Water flows below, and something squeaks in the darkness.',
        'The entrance to the sewers. Adventurers have passed this way before.',
        'You lift the grate slightly. The smell alone warns you of what lies below.',
        'Scratch marks around the grate show it\'s been opened recently.',
      ],
      cooldown: 5,
    },
    examineText: [
      'An iron grate covering the entrance to Easthollow\'s sewer system.',
      'The bars are rusted but solid, the darkness below absolute.',
    ],
  },

  alley_thieves_mark: {
    id: 'alley_thieves_mark',
    name: 'strange symbol',
    tier: 'interactive',
    verbs: ['examine', 'study', 'trace'],
    defaultInteraction: {
      text: [
        'You study the symbol - a crude eye within a triangle. You\'ve seen it elsewhere.',
        'The mark seems like random graffiti to most. But you suspect it means something.',
        'Is this a warning? An invitation? The symbol gives nothing away.',
        'You trace the symbol. It\'s been redrawn many times, always in the same spot.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A symbol scratched into the wall, seemingly meaningless graffiti.',
      'But the symbol is too precise, too deliberately placed, to be random.',
    ],
  },

  alley_rats: {
    id: 'alley_rats',
    name: 'alley rats',
    tier: 'interactive',
    verbs: ['watch', 'chase', 'observe'],
    defaultInteraction: {
      text: [
        'Rats scurry along the walls, disappearing into cracks and holes.',
        'You try to count them. There are always more than you think.',
        'The rats watch you with beady eyes, unafraid. This is their territory.',
        'One bold rat crosses your path, carrying something unidentifiable.',
        'The rats know every hidden path in this alley. And into the sewers below.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Fat alley rats that have grown bold on the town\'s refuse.',
      'They seem larger than normal rats. Perhaps the sewer influence.',
    ],
  },

  alley_mangy_cat: {
    id: 'alley_mangy_cat',
    name: 'mangy cat',
    tier: 'interactive',
    verbs: ['pet', 'approach', 'feed'],
    defaultInteraction: {
      text: [
        'The cat hisses at your approach, then relents and allows a brief pet.',
        'This stray has seen better days, but its eyes are sharp.',
        'You offer your hand. The cat sniffs, considers, and walks away.',
        'The cat is missing an ear - battle scars from a hard life.',
        'Despite its rough appearance, the cat purrs when you scratch its chin.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A scruffy alley cat that hunts the rats and scrounges for scraps.',
      'It\'s seen hard times but survives through cunning and speed.',
    ],
  },

  alley_dropped_goods: {
    id: 'alley_dropped_goods',
    name: 'dropped goods',
    tier: 'interactive',
    verbs: ['examine', 'search', 'check'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You find a small pouch caught behind a crate - someone lost it fleeing the alley.',
        'The goods were clearly dropped in haste. A few coins and a bent fork.',
        'Someone left these behind. Probably not voluntarily.',
      ],
      cooldown: 1440, // 24 hours
      rewards: {
        currency: 3,
      },
    },
    examineText: [
      'Items scattered as if dropped by someone in a hurry.',
      'The goods are hidden in shadow, easy to miss.',
    ],
  },

  // === FLAVOR PROPS ===
  alley_cobblestones: {
    id: 'alley_cobblestones',
    name: 'grimy cobblestones',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The cobblestones are slick with unidentifiable substances.',
        'You watch your step. The footing here is treacherous.',
        'The stones haven\'t been cleaned in years, if ever.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Grimy cobblestones coated in filth and shadow.',
    ],
  },

  alley_sewer_stench: {
    id: 'alley_sewer_stench',
    name: 'sewer stench',
    tier: 'flavor',
    verbs: ['smell', 'endure'],
    defaultInteraction: {
      text: [
        'The smell hits you like a wall. Sewage, rot, and worse.',
        'You breathe through your mouth. It barely helps.',
        'The stench rises from the grate, a preview of what lies below.',
      ],
      cooldown: 2,
    },
    examineText: [
      'An overwhelming stench rising from the sewer entrance.',
    ],
  },

  alley_dripping_water: {
    id: 'alley_dripping_water',
    name: 'dripping water',
    tier: 'flavor',
    verbs: ['listen', 'watch'],
    defaultInteraction: {
      text: [
        'Water drips from somewhere above, creating small puddles.',
        'Drip. Drip. Drip. The sound echoes in the narrow space.',
        'You can\'t tell if it\'s rainwater or something worse.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Water dripping from eaves and pipes, pooling on the ground.',
    ],
  },

  alley_hushed_whispers: {
    id: 'alley_hushed_whispers',
    name: 'hushed whispers',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'You hear whispered voices from somewhere nearby. They stop when you look.',
        'Was that conversation? The acoustics here play tricks.',
        'Whispers carry strangely in the alley. You can\'t tell where they come from.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Faint whispers that seem to come from the shadows themselves.',
    ],
  },

  alley_cockroaches: {
    id: 'alley_cockroaches',
    name: 'scuttling roaches',
    tier: 'flavor',
    verbs: ['watch', 'stomp'],
    defaultInteraction: {
      text: [
        'Roaches scatter at your approach, disappearing into cracks.',
        'You stomp, but they\'re faster. They always are.',
        'The roaches here are the size of your thumb. Impressive survivors.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Large cockroaches that thrive in the alley\'s filth.',
    ],
  },

  alley_shadowy_figure: {
    id: 'alley_shadowy_figure',
    name: 'shadowy figure',
    tier: 'flavor',
    verbs: ['watch', 'approach'],
    defaultInteraction: {
      text: [
        'You glimpse a figure in the shadows. When you look directly, no one is there.',
        'Was someone watching you? The shadows play tricks.',
        'A shape moves at the edge of your vision. Probably nothing.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Shadows that seem to move with purpose. Probably just your imagination.',
    ],
  },
};
