import type { PropDefinition } from './types';

export const BANK_PROPS: Record<string, PropDefinition> = {
  // === INTERACTIVE PROPS ===
  bank_lockboxes: {
    id: 'bank_lockboxes',
    name: 'wall of lockboxes',
    tier: 'interactive',
    verbs: ['examine', 'inspect', 'study'],
    defaultInteraction: {
      text: [
        'Row upon row of iron lockboxes line the wall, each with a unique number.',
        'You count dozens of boxes. Each one holds someone\'s secrets or savings.',
        'The lockboxes are set into the stone wall itself. No one is prying these out.',
        'Some boxes show more wear than others - frequent visitors.',
        'You wonder what treasures are hidden behind those iron doors.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A wall of numbered iron lockboxes, secured with complex locks.',
      'Only the box owner and the bank manager have keys.',
    ],
  },

  bank_coin_scales: {
    id: 'bank_coin_scales',
    name: 'coin scales',
    tier: 'interactive',
    verbs: ['examine', 'use', 'weigh'],
    defaultInteraction: {
      text: [
        'You place a coin on the scale. The clerk notes the weight approvingly.',
        'The scales are extraordinarily precise. They can detect shaved coins instantly.',
        'The brass pans gleam from constant polishing. The bank takes accuracy seriously.',
        'Standard weights sit in a velvet-lined box, certified by the crown.',
        'You watch a clerk weigh a bag of silver with practiced efficiency.',
      ],
      cooldown: 10,
    },
    examineText: [
      'Precision scales for weighing coins and precious metals.',
      'The bank uses these to verify currency and detect counterfeits.',
    ],
  },

  bank_wanted_poster: {
    id: 'bank_wanted_poster',
    name: 'bank wanted poster',
    tier: 'interactive',
    verbs: ['read', 'examine', 'study'],
    defaultInteraction: {
      text: [
        'A rogues\' gallery of bank robbers and confidence tricksters. Some look almost respectable.',
        '"WANTED: The Velvet Hand - 100 gold reward." Must be good to warrant that bounty.',
        'You study the faces. None look familiar, which is probably good.',
        'One poster shows a sketch of someone wearing a mask. Helpful.',
        'The rewards listed make robbery seem almost tempting. Almost.',
      ],
      cooldown: 10,
    },
    examineText: [
      'Wanted posters for criminals who have targeted banks.',
      'The bounties listed are substantial - banks protect their own.',
    ],
  },

  bank_deposit_record: {
    id: 'bank_deposit_record',
    name: 'deposit record book',
    tier: 'interactive',
    verbs: ['examine', 'peek', 'read'],
    defaultInteraction: {
      text: [
        'The ledger is chained to the desk. You can only see your own records.',
        'Neat columns of figures record deposits and withdrawals. Impressive bookkeeping.',
        'The clerk notices your interest. "Privacy is paramount here," she states firmly.',
        'You catch a glimpse of large figures before the book is turned away.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A large leather-bound ledger tracking all bank transactions.',
      'The book is chained to prevent theft - the records are invaluable.',
    ],
  },

  // === FLAVOR PROPS ===
  bank_stone_walls: {
    id: 'bank_stone_walls',
    name: 'stone walls',
    tier: 'flavor',
    verbs: ['examine', 'touch', 'feel'],
    defaultInteraction: {
      text: [
        'The walls are solid granite, several feet thick. No tunneling through these.',
        'You tap the stone. It sounds as solid as a mountain.',
        'The bank was built to last. And to resist assault.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Thick stone walls that would resist any siege.',
    ],
  },

  bank_iron_door: {
    id: 'bank_iron_door',
    name: 'vault door',
    tier: 'flavor',
    verbs: ['examine', 'admire', 'study'],
    defaultInteraction: {
      text: [
        'The vault door is a masterwork of iron and engineering.',
        'Multiple locks, each requiring a different key. Security incarnate.',
        'You could probably fit a horse through that doorway. If it were open.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A massive iron door protecting the main vault.',
    ],
  },

  bank_clinking_coins: {
    id: 'bank_clinking_coins',
    name: 'clinking coins',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'The musical sound of coins being counted fills the air.',
        'Clink, clink, clink. The rhythm of commerce.',
        'Somewhere, someone is counting a lot of money. You can hear it.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The constant sound of coins being counted and sorted.',
    ],
  },

  bank_old_paper_smell: {
    id: 'bank_old_paper_smell',
    name: 'paper smell',
    tier: 'flavor',
    verbs: ['smell', 'breathe'],
    defaultInteraction: {
      text: [
        'The air smells of old paper, ink, and polished wood.',
        'Years of records create a distinctive mustiness.',
        'You breathe the scent of careful bureaucracy.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The distinctive smell of old ledgers and important documents.',
    ],
  },

  bank_heavy_silence: {
    id: 'bank_heavy_silence',
    name: 'heavy silence',
    tier: 'flavor',
    verbs: ['notice', 'listen'],
    defaultInteraction: {
      text: [
        'The bank is quiet in a way that discourages loud voices.',
        'Your footsteps seem too loud on the marble floor.',
        'People speak in hushed tones here, as if in a temple to coin.',
      ],
      cooldown: 2,
    },
    examineText: [
      'An oppressive quiet that makes every sound seem amplified.',
    ],
  },

  bank_scuff_marks: {
    id: 'bank_scuff_marks',
    name: 'floor scuff marks',
    tier: 'flavor',
    verbs: ['examine', 'notice'],
    defaultInteraction: {
      text: [
        'Scuff marks on the floor show where heavy strongboxes are regularly moved.',
        'The marble is worn in paths between the counter and the vault.',
        'You trace the marks. Generations of treasure have passed this way.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Wear marks on the floor from years of heavy foot traffic.',
    ],
  },

  bank_guard_dog: {
    id: 'bank_guard_dog',
    name: 'bank guard dog',
    tier: 'flavor',
    verbs: ['observe', 'watch'],
    defaultInteraction: {
      text: [
        'The guard dog watches you with intelligent, assessing eyes.',
        'You keep your hands visible. The dog seems satisfied.',
        'This beast is trained to identify threats. You\'re glad you\'re not one.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A large, alert dog trained to guard the bank\'s assets.',
    ],
  },

  bank_nervous_depositor: {
    id: 'bank_nervous_depositor',
    name: 'nervous depositor',
    tier: 'flavor',
    verbs: ['observe', 'watch'],
    defaultInteraction: {
      text: [
        'A merchant clutches a heavy pouch, eyes darting nervously.',
        'You watch someone count their deposit three times before handing it over.',
        'The depositor seems relieved when the transaction is complete.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A customer looking anxious about their valuable deposit.',
    ],
  },

  bank_stern_clerk: {
    id: 'bank_stern_clerk',
    name: 'stern clerk',
    tier: 'flavor',
    verbs: ['observe', 'watch'],
    defaultInteraction: {
      text: [
        'The clerk\'s expression could curdle milk. Pure professional detachment.',
        'You catch the clerk\'s eye. They look away, uninterested in conversation.',
        'The clerk processes transactions with mechanical efficiency.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A bank clerk with a perpetually stern expression.',
    ],
  },
};
