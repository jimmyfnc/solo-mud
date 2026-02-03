import type { PropDefinition } from './types';

export const OUTSIDE_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  outside_buried_gear: {
    id: 'outside_buried_gear',
    name: 'disturbed ground',
    tier: 'signature',
    verbs: ['dig', 'excavate', 'unearth'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You dig up a small oilskin bundle. Inside: a serviceable dagger and a few coins. An adventurer\'s emergency stash.',
        'The earth yields a hidden cache - gear buried by someone who never came back to claim it.',
        'Beneath the dirt, you find supplies wrapped against the elements. Finders keepers.',
      ],
      cooldown: 10080, // 7 days
      rewards: {
        currency: 15,
        item: 'worn_dagger',
        lore: 'Adventurers sometimes bury emergency supplies outside town. This one was never retrieved.',
      },
    },
    examineText: [
      'A patch of ground that looks different from the surrounding earth.',
      'The soil here was disturbed at some point and never quite settled right.',
    ],
  },

  // === INTERACTIVE PROPS ===
  outside_palisade: {
    id: 'outside_palisade',
    name: 'wooden palisade',
    tier: 'interactive',
    verbs: ['examine', 'touch', 'inspect'],
    defaultInteraction: {
      text: [
        'You run your hand along the rough wooden stakes. Solid defense against casual threats.',
        'The palisade extends as far as you can see, encircling the town.',
        'Some stakes show claw marks. Something tested the walls recently.',
        'The wood is treated against rot. This barrier will last generations.',
        'You peer between the stakes at the wilderness beyond.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Tall wooden stakes form a defensive wall around Easthollow.',
      'The palisade wouldn\'t stop a determined army, but it keeps wildlife and bandits at bay.',
    ],
  },

  outside_hitching_post: {
    id: 'outside_hitching_post',
    name: 'hitching post',
    tier: 'interactive',
    verbs: ['examine', 'use', 'tie'],
    defaultInteraction: {
      text: [
        'A sturdy post for tying horses while their riders conduct business.',
        'Rope marks show heavy use. Many travelers stop here.',
        'You pat an imaginary horse and feel slightly foolish.',
        'The post is gnawed in places. Bored horses leave their mark.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A wooden post for securing horses and pack animals outside the walls.',
      'Water troughs and feed bags sit nearby for waiting animals.',
    ],
  },

  outside_milestone: {
    id: 'outside_milestone',
    name: 'road milestone',
    tier: 'interactive',
    verbs: ['read', 'examine', 'study'],
    defaultInteraction: {
      text: [
        '"Capital City - 47 leagues. Thornwood - 12 leagues." The distances seem vast.',
        'You trace the carved numbers. Every journey starts with a single step.',
        'The milestone reminds you how small Easthollow is in the greater world.',
        'Travelers have rubbed the stone smooth, touching it for luck before departing.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A stone marker showing distances to other settlements.',
      'The milestone is a common meeting point for travelers.',
    ],
  },

  outside_campfire_ring: {
    id: 'outside_campfire_ring',
    name: 'campfire ring',
    tier: 'interactive',
    verbs: ['examine', 'warm', 'sit'],
    tags: ['fire'],
    defaultInteraction: {
      text: [
        'A circle of stones marks where travelers camp before entering town.',
        'Ash and charred wood show recent use. Someone spent the night here.',
        'You sit on one of the larger stones, imagining the stories told here.',
        'The fire pit is cold now, but you could easily start a blaze.',
        'You find a few copper coins in the ashes - probably dropped while cooking.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A ring of fire-blackened stones where travelers make camp.',
      'It\'s just outside the walls, close enough for safety, far enough for freedom.',
    ],
  },

  outside_trail_marker: {
    id: 'outside_trail_marker',
    name: 'trail marker',
    tier: 'interactive',
    verbs: ['examine', 'read', 'study'],
    defaultInteraction: {
      text: [
        'A carved stone marks the beginning of trails into the wilderness.',
        'Symbols indicate difficulty and danger. The westward path shows skulls.',
        'You study the markers. Someone with experience carved these warnings.',
        'A fresh scratch mark adds "WOLVES" to the southern trail\'s warnings.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Stone markers indicating trails into the surrounding wilderness.',
      'The carvings warn of dangers and mark distances to notable landmarks.',
    ],
  },

  outside_sheep: {
    id: 'outside_sheep',
    name: 'grazing sheep',
    tier: 'interactive',
    verbs: ['count', 'watch', 'pet', 'approach'],
    defaultInteraction: {
      text: [
        'You start counting sheep. One, two, three... you start to feel drowsy.',
        'The sheep ignore you completely, focused on their grass.',
        'You approach a sheep. It baas once and moves away.',
        '"Baaaa," says the sheep, conveying nothing of importance.',
        'Fourteen sheep... fifteen... your eyelids grow heavy. You shake yourself awake.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A small flock of sheep grazing in a field near the road.',
      'The shepherd is probably nearby, but you don\'t see them.',
    ],
  },

  outside_distant_wilderness: {
    id: 'outside_distant_wilderness',
    name: 'distant wilderness',
    tier: 'interactive',
    verbs: ['gaze', 'look', 'observe', 'scan'],
    defaultInteraction: {
      text: [
        'You gaze toward the western wilderness. Forest, hills, and mystery await.',
        'The wild lands call to something in you. Adventure lies that way.',
        'Mountains rise in the far distance. What treasures do they hide?',
        'You see smoke from a distant campfire. Other travelers, or something else?',
        'The wilderness is beautiful and deadly. Both truths coexist.',
      ],
      cooldown: 5,
    },
    examineText: [
      'The untamed lands beyond Easthollow, stretching to the horizon.',
      'Somewhere out there, adventure and danger wait in equal measure.',
    ],
  },

  // === FLAVOR PROPS ===
  outside_dirt_road: {
    id: 'outside_dirt_road',
    name: 'dirt road',
    tier: 'flavor',
    verbs: ['examine', 'walk'],
    defaultInteraction: {
      text: [
        'The road changes from cobblestone to packed dirt outside the walls.',
        'Wagon ruts and hoofprints mark the well-traveled path.',
        'Dust rises with each step. The road remembers everyone who passes.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A packed-dirt road leading away from town into the wider world.',
    ],
  },

  outside_town_gates: {
    id: 'outside_town_gates',
    name: 'town gates view',
    tier: 'flavor',
    verbs: ['look', 'observe'],
    defaultInteraction: {
      text: [
        'The town gates rise behind you, Easthollow\'s welcome and protection.',
        'From here, the town looks small but sturdy. A good place to call home.',
        'You can hear faint sounds of the market through the open gates.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The view of Easthollow\'s gates from the outside.',
    ],
  },

  outside_open_sky: {
    id: 'outside_open_sky',
    name: 'open sky',
    tier: 'flavor',
    verbs: ['look', 'gaze', 'watch'],
    defaultInteraction: {
      text: [
        'The sky stretches endlessly above, unmarred by rooftops and walls.',
        'Clouds drift lazily overhead. The world feels bigger out here.',
        'You breathe deep. The air tastes fresher outside the walls.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The vast open sky, unobstructed by town buildings.',
    ],
  },

  outside_grass_rustling: {
    id: 'outside_grass_rustling',
    name: 'rustling grass',
    tier: 'flavor',
    verbs: ['listen', 'watch'],
    defaultInteraction: {
      text: [
        'Grass sways in the breeze, whispering secrets you can\'t quite hear.',
        'The rustle might be wind. It might be something else.',
        'You watch the grass ripple like green waves.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Tall grass swaying in the wind beside the road.',
    ],
  },

  outside_hawk: {
    id: 'outside_hawk',
    name: 'circling hawk',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'A hawk circles high overhead, riding the thermals.',
        'The predator\'s shadow passes over you. Hunting for mice, probably.',
        'You watch the hawk dive suddenly, then rise with prey in its talons.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A hawk riding the air currents, scanning the ground for prey.',
    ],
  },

  outside_field_mice: {
    id: 'outside_field_mice',
    name: 'field mice',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'Small shapes dart through the grass. Field mice going about their business.',
        'A mouse pauses to regard you, then vanishes into the vegetation.',
        'The grass rustles with unseen movement. Mice, hopefully.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Small mice living in the fields around the road.',
    ],
  },

  outside_departing_adventurer: {
    id: 'outside_departing_adventurer',
    name: 'departing adventurer',
    tier: 'flavor',
    verbs: ['watch', 'wave'],
    defaultInteraction: {
      text: [
        'An adventurer heads west, pack heavy with supplies. They wave as they pass.',
        'You watch someone stride confidently toward the wilderness. May they return.',
        '"Good hunting," you call. They nod and continue on.',
      ],
      cooldown: 2,
    },
    examineText: [
      'An adventurer setting out from town toward the unknown.',
    ],
  },

  outside_returning_wounded: {
    id: 'outside_returning_wounded',
    name: 'returning wounded',
    tier: 'flavor',
    verbs: ['watch', 'help', 'observe'],
    defaultInteraction: {
      text: [
        'A battered adventurer limps toward town, alive but clearly humbled.',
        'You see someone returning from the wild, wounds bandaged roughly.',
        'The wilderness extracts its toll. This one was lucky to return at all.',
      ],
      cooldown: 2,
    },
    examineText: [
      'An adventurer returning to town, bearing the marks of a hard journey.',
    ],
  },
};
