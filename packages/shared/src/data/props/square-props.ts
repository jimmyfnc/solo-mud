/**
 * Town Square Props - The heart of Easthollow
 *
 * The square bustles with activity: merchants hawking wares, children playing,
 * the old storyteller Giles spinning tales, and Pete the town drunk stumbling about.
 */

import type { PropDefinition } from './types';

export const SQUARE_PROPS: Record<string, PropDefinition> = {
  // ============================================================================
  // SIGNATURE PROPS (4)
  // ============================================================================

  square_wishing_well: {
    id: 'square_wishing_well',
    name: 'Weathered Stone Well',
    tier: 'signature',
    verbs: ['use', 'toss', 'examine'],
    tags: ['water_source'],
    itemInteractions: {
      coin: {
        text: [
          'The coin spirals down into darkness. For a moment, you feel inexplicably hopeful.',
          'Your coin disappears into the depths. Was that a glimmer of something down there?',
          'The coin plunks into the water far below. A warm feeling washes over you.',
          'You close your eyes and make a wish as the coin vanishes into the well.',
          'The well accepts your offering. Somehow, you feel luck turning your way.',
        ],
        cooldown: 60,
        rewards: {
          buff: { id: 'lucky', duration: 60 },
          consumeItem: 'coin',
        },
      },
    },
    defaultInteraction: {
      text: [
        'You peer into the well. Coins glint far below in the murky water.',
        'You draw up a bucket of cool, clear water. Refreshing on a warm day.',
        'The old stones are worn smooth by countless hands over the years.',
        'Someone has carved initials into the well rim. Young love, perhaps.',
        'You lean over and listen. The echo of dripping water rises from below.',
      ],
    },
    examineText: [
      'The well has stood here since Easthollow was founded. Its stones are worn smooth by generations of use.',
      'Copper coins glitter in the depths - wishes made by townsfolk hoping for better fortune.',
      'A frayed rope and wooden bucket hang from the crossbeam, still functional despite their age.',
    ],
  },

  square_notice_board: {
    id: 'square_notice_board',
    name: 'Wooden Notice Board',
    tier: 'signature',
    verbs: ['read', 'examine'],
    defaultInteraction: {
      text: [
        '"WANTED: Able-bodied adventurers to clear the sewers. See Guard Captain." The posting looks fresh.',
        '"LOST: Orange tabby cat, answers to Whiskers. Reward offered." A child\'s handwriting.',
        '"The Rusty Tankard - Best Ale in Town!" Someone has scrawled "LIES" underneath.',
        '"Town Meeting - Discussion of strange sounds from the sewers. All welcome."',
        '"Herbalist seeks rare mushrooms from the deep caverns. Good pay for intact specimens."',
        '"REWARD: Information on missing merchant caravan. Speak to Marcus at the gate."',
        'A faded proclamation from the Mayor warns against feeding the pigeons in the square.',
        '"Rumors of bandits on the eastern road. Travelers advised to hire escorts."',
      ],
    },
    examineText: [
      'The wooden board is weathered and covered in overlapping notices, some fresh, some yellowed with age.',
      'Official town proclamations share space with personal advertisements and reward posters.',
    ],
  },

  square_loose_cobblestone: {
    id: 'square_loose_cobblestone',
    name: 'Loose Cobblestone',
    tier: 'signature',
    verbs: ['lift', 'pry', 'examine'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You carefully lift the stone. A few forgotten coins glint in the hollow beneath!',
        'The cobblestone comes loose. Someone\'s hidden stash - a handful of coppers!',
        'Beneath the stone you find some coins, probably dropped and forgotten long ago.',
      ],
      cooldown: 60,
      rewards: {
        currency: 3,
      },
    },
    examineText: [
      'One cobblestone sits slightly higher than its neighbors, wobbling when stepped on.',
      'The gap around this stone is wider - it could probably be lifted.',
    ],
  },

  square_street_musician: {
    id: 'square_street_musician',
    name: 'Street Musician',
    tier: 'signature',
    verbs: ['tip', 'listen', 'request'],
    defaultInteraction: {
      text: [
        'The musician plays a lively jig. Your feet want to dance and your spirit lifts.',
        'A melancholy ballad about lost love drifts through the square. Several people pause to listen.',
        'The melody is one you half-remember from childhood. It fills you with warm nostalgia.',
        'She thanks you with a smile and plays your favorite tune with renewed vigor.',
        'The music swells with hope and courage. You feel ready to face any challenge.',
        'A rowdy drinking song has nearby merchants tapping their feet and grinning.',
      ],
      rewards: {
        buff: { id: 'inspired', duration: 30 },
      },
    },
    examineText: [
      'A weathered woman with kind eyes plays a well-worn lute, her case open for tips.',
      'Her fingers dance across the strings with practiced ease, drawing small crowds throughout the day.',
      'Despite her humble appearance, there\'s something magical about her music.',
    ],
  },

  // ============================================================================
  // INTERACTIVE PROPS (9)
  // ============================================================================

  square_old_bench: {
    id: 'square_old_bench',
    name: 'Old Wooden Bench',
    tier: 'interactive',
    verbs: ['sit', 'rest', 'examine'],
    defaultInteraction: {
      text: [
        'You settle onto the worn bench and watch the townsfolk go about their day.',
        'The bench creaks but holds. From here you can see the whole square.',
        'You rest for a moment. An old woman nods to you as she passes.',
        'Sitting here, you overhear snippets of gossip from passing merchants.',
        'The bench is warm from the sun. A moment of peace in a busy day.',
      ],
      rewards: {
        buff: { id: 'rested', duration: 5 },
      },
    },
    examineText: [
      'The old bench has seen better days, its slats worn smooth by countless sitters.',
      'Initials and dates are carved into the armrests - some going back decades.',
    ],
  },

  square_dry_fountain: {
    id: 'square_dry_fountain',
    name: 'Stone Fountain (dry)',
    tier: 'interactive',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The fountain basin is empty, collecting only fallen leaves. It hasn\'t flowed in years.',
        'You peer into the dry basin. Copper stains show where water once danced.',
        'Old Giles says the fountain stopped the year the old mayor died. Nobody knows why.',
        'A faded plaque reads: "May Easthollow\'s prosperity flow eternal." Ironic, now.',
        'Dead leaves rustle in the empty basin. The stone mermaid looks forlorn.',
      ],
    },
    examineText: [
      'The fountain centerpiece depicts a mermaid holding a conch shell, now silent.',
      'Once the pride of the square, it fell dry during the troubles and never recovered.',
      'Townsfolk say fixing it would require a master stonemason - and coin the town doesn\'t have.',
    ],
  },

  square_street_lamp: {
    id: 'square_street_lamp',
    name: 'Iron Street Lamp',
    tier: 'interactive',
    verbs: ['light', 'examine'],
    tags: ['lightable_target'],
    defaultInteraction: {
      text: [
        'The lamplighter makes his rounds at dusk. You could help if you had a flame.',
        'The lamp stands dark, waiting for evening when it will push back the shadows.',
        'Oil glistens in the reservoir. Come nightfall, this will be a beacon of safety.',
        'You examine the mechanism - a simple wick and oil design, but effective.',
      ],
    },
    examineText: [
      'A tall iron lamppost, one of several ringing the square to light it at night.',
      'The metalwork is surprisingly ornate - ivy patterns climb the post.',
    ],
  },

  square_pigeons: {
    id: 'square_pigeons',
    name: 'Flock of Pigeons',
    tier: 'interactive',
    verbs: ['feed', 'scatter', 'watch'],
    defaultInteraction: {
      text: [
        'The pigeons eye you hopefully, cooing and bobbing their heads.',
        'You scatter the flock! They wheel into the sky, then settle right back down.',
        'One bold pigeon lands near your feet, head tilted questioningly.',
        'The birds peck at the cobblestones, finding crumbs invisible to human eyes.',
        'A particularly fat pigeon struts about like it owns the place.',
        'You watch them squabble over a bread crust. Simple creatures, simple joys.',
      ],
    },
    examineText: [
      'A flock of grey pigeons has claimed the square as their territory.',
      'They\'re well-fed - townsfolk and visitors alike toss them scraps despite the Mayor\'s decree.',
    ],
  },

  square_stray_mutt: {
    id: 'square_stray_mutt',
    name: 'Stray Mutt',
    tier: 'interactive',
    verbs: ['pet', 'feed', 'examine'],
    defaultInteraction: {
      text: [
        'The scruffy dog wags its tail hopefully as you approach.',
        'You scratch behind its ears. The mutt\'s tail becomes a blur of happiness.',
        'The dog sniffs your hand, decides you\'re acceptable, and leans against your leg.',
        'Sad brown eyes look up at you. This one has had a hard life but keeps hoping.',
        'The mutt rolls over for belly rubs, tongue lolling happily.',
        'The dog follows you for a few steps, then settles back to wait for the next kind soul.',
      ],
    },
    examineText: [
      'A scruffy brown mutt of indeterminate breed, ribs showing beneath matted fur.',
      'Despite its hard life, the dog\'s tail wags at every passerby. Hope springs eternal.',
    ],
  },

  square_town_crier: {
    id: 'square_town_crier',
    name: 'Town Crier',
    tier: 'interactive',
    verbs: ['listen', 'examine'],
    defaultInteraction: {
      text: [
        '"Hear ye, hear ye! The sewers remain infested! Brave souls needed below!"',
        '"By order of the Mayor, the eastern road remains open despite bandit sightings!"',
        '"Market day approaches! Merchants from far lands expected!"',
        '"Guard recruitment continues! See Captain Marcus at the gate!"',
        '"The Temple of Light offers blessings to all who serve the town!"',
        '"Citizens reminded: do NOT feed the pigeons! Mayor\'s orders!"',
      ],
    },
    examineText: [
      'The town crier stands on a small wooden platform, bell in hand, voice carrying across the square.',
      'His uniform is official but worn - this is clearly a long-held position.',
    ],
  },

  square_children: {
    id: 'square_children',
    name: 'Children Playing',
    tier: 'interactive',
    verbs: ['watch', 'wave', 'examine'],
    defaultInteraction: {
      text: [
        'The children wave back at you, giggling, before returning to their game.',
        'They\'re playing adventurers, fighting imaginary monsters with stick swords.',
        'A ball bounces past you as the children chase it, laughing.',
        'One child declares herself the "Rat King" as others pretend to flee in terror.',
        'Their laughter is infectious. For a moment, your burdens feel lighter.',
        'The children pause their game to stare at your equipment with wide eyes.',
      ],
    },
    examineText: [
      'A group of children plays between the market stalls, watched by nearby adults.',
      'Their games seem to involve a lot of running, shouting, and imaginary monsters.',
    ],
  },

  square_fountain_coin: {
    id: 'square_fountain_coin',
    name: 'Coin in Fountain',
    tier: 'interactive',
    verbs: ['take', 'examine'],
    defaultInteraction: {
      text: [
        'You reach for the coin, then hesitate. Someone wished on this. Taking it feels wrong.',
        'Your fingers brush the copper. Do you really want to steal someone\'s wish?',
        'The coin glints up at you. Easy money... but what price, bad luck?',
        'You leave the coin where it lies. Some things are worth more than copper.',
        'An old woman watches you. Her gaze makes you reconsider taking it.',
      ],
    },
    examineText: [
      'A single copper coin lies in the dry fountain basin, a wish someone made long ago.',
      'It catches the light, somehow untouched despite the fountain being dry for years.',
    ],
  },

  square_bread_smell: {
    id: 'square_bread_smell',
    name: 'Smell of Fresh Bread',
    tier: 'interactive',
    verbs: ['smell', 'sniff', 'follow'],
    defaultInteraction: {
      text: [
        'The heavenly aroma drifts from the south, toward Market Street.',
        'Your stomach rumbles. The bakery must be working overtime today.',
        'Warm bread, perhaps with honey butter... the smell beckons you southward.',
        'Following your nose would lead you to the market. Your mouth waters.',
        'The scent mingles with other market smells, but the bread dominates.',
      ],
    },
    examineText: [
      'The irresistible smell of fresh-baked bread wafts up from Market Street to the south.',
      'It\'s strongest in the morning when the baker fires up the ovens.',
    ],
  },

  // ============================================================================
  // FLAVOR PROPS (8)
  // ============================================================================

  square_cobblestones: {
    id: 'square_cobblestones',
    name: 'Worn Cobblestones',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The stones are worn smooth by generations of feet, wheels, and weather.',
        'Each cobblestone has its own story - placed here when Easthollow was young.',
        'Gaps between stones sprout determined weeds that refuse to be conquered.',
        'The pattern swirls outward from the dry fountain - intentional or coincidence?',
        'Your boots echo on stones that have borne the weight of history.',
      ],
    },
    examineText: [
      'The cobblestones show their age - some cracked, some missing, all worn smooth.',
      'Centuries of traffic have polished them to a dull sheen.',
    ],
  },

  square_cart_wheel: {
    id: 'square_cart_wheel',
    name: 'Abandoned Cart Wheel',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'A broken wheel leans against a building, waiting for a wheelwright who never came.',
        'Spokes are snapped, the rim warped. Someone\'s bad day, left as a reminder.',
        'Children sometimes roll it around, pretending it\'s a giant coin.',
        'The wood has weathered grey, becoming part of the square\'s character.',
      ],
    },
    examineText: [
      'A wooden cart wheel, broken beyond easy repair, has become a fixture here.',
      'Nobody seems to know whose it was or why it was never claimed.',
    ],
  },

  square_town_banner: {
    id: 'square_town_banner',
    name: 'Town Banner',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The banner snaps in the breeze - a golden sun on deep blue, Easthollow\'s colors.',
        'Faded by sun and rain, the banner still flies proudly over the square.',
        'The golden sun represents hope, they say. The blue, the river that founded the town.',
        'Birds have nested in the banner pole. The town guard pretends not to notice.',
      ],
    },
    examineText: [
      'Easthollow\'s banner hangs from a tall pole near the fountain - sun gold on river blue.',
      'It\'s replaced each spring festival, though this year\'s looks more worn than usual.',
    ],
  },

  square_autumn_leaves: {
    id: 'square_autumn_leaves',
    name: 'Scattered Leaves',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'Autumn leaves skitter across the cobblestones, dancing in the breeze.',
        'Red and gold carpet the square, crunching underfoot.',
        'A small whirlwind of leaves spirals up, then settles again.',
        'The groundskeeper sweeps eternally, but the trees keep dropping more.',
        'Children leap into piles that the groundskeeper has just finished raking.',
      ],
    },
    examineText: [
      'Leaves from the old oak near the fountain cover the ground in seasonal blankets.',
      'In autumn they\'re gold and crimson; in spring, tender green buds replace them.',
    ],
  },

  square_flower_boxes: {
    id: 'square_flower_boxes',
    name: 'Flower Boxes',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'Bright flowers spill from boxes hung on building facades.',
        'Someone tends these with care - the blooms are vibrant and healthy.',
        'Bees drone lazily among the petals, doing their important work.',
        'The colors brighten the square - reds, yellows, purples in abundance.',
        'A sweet floral scent mingles with the smells of the market.',
      ],
    },
    examineText: [
      'Wooden flower boxes hang from the surrounding buildings, lovingly maintained.',
      'Different residents compete to have the most beautiful display.',
    ],
  },

  square_crowd_bustle: {
    id: 'square_crowd_bustle',
    name: 'Bustling Crowd',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The square pulses with life - merchants haggling, friends gossiping, strangers passing.',
        'You catch fragments of conversation: "...heard the sewers..." "...price of grain..."',
        'A merchant argues prices with a customer. Neither looks ready to back down.',
        'Someone bumps past you with a muttered apology, arms full of parcels.',
        'The crowd ebbs and flows like a living thing, never quite the same twice.',
      ],
    },
    examineText: [
      'Easthollow\'s heart beats strongest here - the square is never truly empty.',
      'Townsfolk, travelers, merchants, and beggars all share this common ground.',
    ],
  },

  square_town_bell: {
    id: 'square_town_bell',
    name: 'Town Bell Tower',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The bell tower rises above the square, marking hours and emergencies alike.',
        'You count the chimes - midday, or close to it.',
        'The bell has a distinctive tone, slightly flat. Locals say they\'d know it anywhere.',
        'Pigeons roost in the belfry, scattering when the bell rings.',
        'The tower clock reads the correct time, more or less. Close enough for Easthollow.',
      ],
    },
    examineText: [
      'A modest bell tower tops the town hall, its bronze bell green with age.',
      'It rings the hours and has warned of fires, raids, and celebrations for generations.',
    ],
  },

  square_chalk_drawing: {
    id: 'square_chalk_drawing',
    name: 'Chalk Drawing',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'A child\'s chalk drawing decorates the cobblestones - stick figures fighting a dragon.',
        'The drawing shows a house, a sun, and what might be a family. Simple joys.',
        'Rain has faded the chalk, but you can still make out flowers and butterflies.',
        'Someone drew a surprisingly good portrait of old Giles the storyteller.',
        'A hopscotch grid, well-worn, marks where generations of children have played.',
      ],
    },
    examineText: [
      'Colorful chalk drawings cover patches of cobblestone, the work of local children.',
      'They fade with rain but new ones always appear, a canvas that\'s never blank for long.',
    ],
  },
};
