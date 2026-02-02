import type { PropDefinition } from './types';

export const TEMPLE_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  temple_offering_bowl: {
    id: 'temple_offering_bowl',
    name: 'offering bowl',
    tier: 'signature',
    verbs: ['donate', 'offer', 'give', 'place'],
    defaultInteraction: {
      text: [
        'You place a coin in the offering bowl. A warm light briefly suffuses you, and you feel... blessed.',
        'Your offering clinks softly against others. Priestess Anna\'s blessing washes over you like gentle warmth.',
        'As the coin leaves your hand, you feel a weight lift from your spirit. The divine acknowledges your gift.',
        'The bowl glows faintly as your offering joins the others. Peace settles into your heart.',
        'You feel the goddess\'s favor settle upon you like a protective mantle.',
      ],
      cooldown: 60,
      rewards: {
        buff: {
          id: 'divine_blessing',
          duration: 30,
        },
        currency: -10, // costs 10 copper
      },
    },
    examineText: [
      'A silver bowl resting on a marble pedestal, filled with coins left by the faithful.',
      'The bowl is etched with prayers in an ancient script. Offerings inside gleam despite the dim light.',
      'A small placard reads: "Give freely, receive grace."',
    ],
  },

  temple_holy_fountain: {
    id: 'temple_holy_fountain',
    name: 'holy fountain',
    tier: 'signature',
    verbs: ['drink', 'wash', 'cleanse', 'touch'],
    tags: ['water_source', 'holy_water_source'],
    defaultInteraction: {
      text: [
        'You cup the blessed water and drink. It tingles on your tongue, washing away fatigue and doubt.',
        'The holy water is cool and pure. You feel cleansed of minor ailments.',
        'As the water touches your lips, you feel impurities leave your body.',
        'The fountain\'s waters glow faintly as they heal your minor wounds and ease your weariness.',
        'Blessed water flows over your hands. Any lingering curses or poisons seem to fade.',
      ],
      cooldown: 30,
      rewards: {
        buff: {
          id: 'purified',
          duration: 15,
        },
      },
    },
    examineText: [
      'A marble fountain depicting an angel pouring water from an urn. The water glows with inner light.',
      'Crystal-clear water bubbles up from within, blessed by daily prayers.',
      'The fountain has cured ailments for generations. Its waters are said to be touched by the divine.',
    ],
  },

  temple_loose_tile: {
    id: 'temple_loose_tile',
    name: 'loose floor tile',
    tier: 'signature',
    verbs: ['lift', 'pry', 'move', 'search'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You carefully lift the loose tile. Beneath it lies a small holy symbol on a silver chain, forgotten by some pilgrim long ago.',
        'The tile shifts aside to reveal a hidden compartment. Inside rests a blessed pendant.',
        'Beneath the tile, wrapped in faded cloth, you find a holy symbol radiating faint warmth.',
      ],
      cooldown: 1440, // 24 hours
      rewards: {
        item: 'holy_symbol',
        lore: 'This symbol belonged to a pilgrim who found peace here centuries ago. They left it for another who might need it.',
      },
    },
    examineText: [
      'One tile near the altar sits slightly higher than the others, worn smooth by countless feet.',
      'The tile wobbles almost imperceptibly when stepped upon.',
    ],
  },

  // === INTERACTIVE PROPS ===
  temple_prayer_benches: {
    id: 'temple_prayer_benches',
    name: 'prayer benches',
    tier: 'interactive',
    verbs: ['sit', 'kneel', 'pray', 'rest'],
    defaultInteraction: {
      text: [
        'You kneel at the bench, head bowed. The hard wood is worn smooth by generations of the faithful.',
        'You sit in quiet contemplation. The bench creaks softly beneath you.',
        'Closing your eyes, you offer a silent prayer. Peace settles over you.',
        'You rest on the bench, letting the temple\'s serenity wash over you.',
        'The wood is warm from the candles. You feel safe here.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Simple wooden benches arranged in rows before the altar, worn smooth by generations of prayer.',
      'Cushions soften some benches for elderly worshippers. Others prefer the traditional hard wood.',
    ],
  },

  temple_stained_glass: {
    id: 'temple_stained_glass',
    name: 'stained glass windows',
    tier: 'interactive',
    verbs: ['admire', 'study', 'look', 'examine'],
    defaultInteraction: {
      text: [
        'Colored light streams through the glass, painting the floor in reds, blues, and golds.',
        'The windows depict scenes of divine mercy - healing the sick, protecting the innocent, guiding the lost.',
        'You study a panel showing a warrior laying down his sword to take up a healer\'s staff.',
        'The craftsmanship is exquisite. Each piece of glass was placed with devotion.',
        'As clouds pass outside, the colored light shifts and dances across the stones.',
      ],
      cooldown: 10,
    },
    examineText: [
      'Tall windows of colored glass depicting scenes from holy scripture line the walls.',
      'The windows are ancient, their lead frames darkened with age, but the glass remains vibrant.',
    ],
  },

  temple_altar_candles: {
    id: 'temple_altar_candles',
    name: 'altar candles',
    tier: 'interactive',
    verbs: ['light', 'tend', 'watch'],
    tags: ['fire'],
    defaultInteraction: {
      text: [
        'You light a fresh candle from one already burning. Your small flame joins the constellation of prayers.',
        'The candles flicker but never seem to go out. Some have been burning for days.',
        'You watch the flames dance. Each one represents someone\'s hope, someone\'s prayer.',
        'The warmth of a hundred candles fills the altar space with gentle heat.',
      ],
      cooldown: 10,
    },
    examineText: [
      'Dozens of candles cluster on the altar, each one lit by a worshipper with a prayer in their heart.',
      'Wax has pooled and frozen in beautiful formations over years of devotion.',
    ],
  },

  temple_white_dove: {
    id: 'temple_white_dove',
    name: 'white dove',
    tier: 'interactive',
    verbs: ['watch', 'approach', 'observe'],
    defaultInteraction: {
      text: [
        'The dove coos softly from its perch near the rafters. A symbol of peace made flesh.',
        'You hold out your hand. The dove regards you, then returns to preening its feathers.',
        'The bird\'s white plumage seems to glow in the candlelight. Priestess Anna calls her Hope.',
        'The dove takes flight, circling the nave once before returning to its perch.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A snow-white dove roosts among the rafters, seemingly at home in the sacred space.',
      'The temple\'s resident dove, said to have arrived the day Priestess Anna took her vows.',
    ],
  },

  temple_worn_prayer_book: {
    id: 'temple_worn_prayer_book',
    name: 'worn prayer book',
    tier: 'interactive',
    verbs: ['read', 'open', 'study'],
    defaultInteraction: {
      text: [
        'You open the book to a random page. "In darkness, be the light. In despair, be the hope."',
        'The pages are soft with age, the words faded but legible. Generations have read these prayers.',
        'You find a pressed flower marking someone\'s favorite passage about forgiveness.',
        'The binding is cracked, the pages loose, but the words within still carry power.',
        'A prayer for travelers catches your eye: "Guide their steps and guard their hearts."',
      ],
      cooldown: 10,
    },
    examineText: [
      'An ancient prayer book lies open on a reading stand, available for any who seek guidance.',
      'The leather cover is cracked with age, the pages yellowed but carefully preserved.',
    ],
  },

  temple_memorial_wall: {
    id: 'temple_memorial_wall',
    name: 'memorial wall',
    tier: 'interactive',
    verbs: ['read', 'study', 'touch', 'examine'],
    defaultInteraction: {
      text: [
        'Names are carved into the stone, each one a life remembered. Some entries are centuries old.',
        'You trace a name with your finger. Someone loved them once. Someone still does.',
        'Fresh flowers rest beneath recent names. The grief is still raw for some families.',
        '"All return to the light," reads the inscription at the top of the wall.',
        'You find names of adventurers, merchants, farmers - death makes equals of us all.',
      ],
      cooldown: 15,
    },
    examineText: [
      'A wall of polished stone bearing the names of Easthollow\'s departed, going back generations.',
      'Fresh flowers and small offerings cluster at the base, left by grieving families.',
    ],
  },

  temple_flickering_candle: {
    id: 'temple_flickering_candle',
    name: 'flickering candle',
    tier: 'interactive',
    verbs: ['watch', 'shield', 'observe'],
    defaultInteraction: {
      text: [
        'You cup your hand around the struggling flame. It steadies, then burns bright again.',
        'The candle gutters in an unfelt breeze, fighting to stay lit.',
        'You watch the flame dance, nearly dying, then rallying. A metaphor for something.',
        'Against all odds, the little flame persists.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A single candle burning lower than the others, its flame wavering but persistent.',
      'Someone\'s prayer candle, fighting to stay lit until the prayer is answered.',
    ],
  },

  temple_alms_box: {
    id: 'temple_alms_box',
    name: 'alms box',
    tier: 'interactive',
    verbs: ['donate', 'give', 'examine'],
    defaultInteraction: {
      text: [
        'You drop a coin through the slot. It clinks against others inside.',
        'The box is simple but sturdy. "For those in need," reads a small plaque.',
        'Your donation joins others, destined to feed the hungry and clothe the poor.',
        'Priestess Anna nods gratefully as you make your contribution.',
      ],
      cooldown: 30,
      rewards: {
        currency: -5,
      },
    },
    examineText: [
      'A locked wooden box with a coin slot, collecting donations for the less fortunate.',
      'The box is bolted to the floor, marked with the temple\'s seal.',
    ],
  },

  // === FLAVOR PROPS ===
  temple_incense: {
    id: 'temple_incense',
    name: 'incense smoke',
    tier: 'flavor',
    verbs: ['smell', 'breathe', 'inhale'],
    defaultInteraction: {
      text: [
        'Sweet incense fills your lungs. Sandalwood and myrrh, the scents of devotion.',
        'The fragrant smoke curls upward, carrying prayers to the heavens.',
        'You breathe deeply. The incense calms your racing thoughts.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Thin trails of incense smoke rise from bronze censers, filling the temple with sacred fragrance.',
    ],
  },

  temple_choir_echo: {
    id: 'temple_choir_echo',
    name: 'echoing hymns',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'Distant voices raise in hymn, the sound echoing beautifully in the vaulted space.',
        'The choir practices somewhere deeper in the temple. Their harmony is hauntingly beautiful.',
        'You catch fragments of an ancient hymn, words you don\'t know but somehow understand.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The distant sound of the temple choir practicing their sacred songs.',
    ],
  },

  temple_candleglow: {
    id: 'temple_candleglow',
    name: 'candlelight glow',
    tier: 'flavor',
    verbs: ['bask', 'enjoy'],
    defaultInteraction: {
      text: [
        'Warm candlelight bathes everything in gold. Shadows dance but never threaten.',
        'The glow is soft, forgiving. Everyone looks kinder in candlelight.',
        'You let the gentle light soothe you.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The warm, golden glow of countless candles illuminating the sacred space.',
    ],
  },

  temple_silence: {
    id: 'temple_silence',
    name: 'sacred silence',
    tier: 'flavor',
    verbs: ['listen', 'appreciate'],
    defaultInteraction: {
      text: [
        'The silence here is profound - not empty, but full of peace.',
        'You close your eyes. In the silence, you can almost hear your own heartbeat.',
        'The world outside seems very far away.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The reverent quiet that fills the temple, broken only by whispered prayers.',
    ],
  },

  temple_mice: {
    id: 'temple_mice',
    name: 'temple mice',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'A tiny mouse scurries along the wall. Even vermin are tolerated in this place of peace.',
        'You spot a mouse nibbling crumbs near a bench. It shows no fear.',
        'The mice here are well-fed on dropped offerings. Temple mice, some call them blessed.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Small mice that have made their home in the temple, tolerated by the clergy.',
    ],
  },

  temple_kneeling_pilgrim: {
    id: 'temple_kneeling_pilgrim',
    name: 'kneeling pilgrim',
    tier: 'flavor',
    verbs: ['observe', 'watch'],
    defaultInteraction: {
      text: [
        'A pilgrim kneels in silent prayer, oblivious to your presence.',
        'The pilgrim\'s lips move in silent supplication. You feel you shouldn\'t disturb them.',
        'Tears streak the pilgrim\'s face. Whatever burden they carry, they\'ve brought it here.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A travel-worn pilgrim lost in fervent prayer, seeking solace or answers.',
    ],
  },
};
