import type { PropDefinition } from './types';

export const ALCHEMIST_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  alchemist_journal: {
    id: 'alchemist_journal',
    name: 'alchemist\'s journal',
    tier: 'signature',
    verbs: ['read', 'study', 'examine', 'browse'],
    defaultInteraction: {
      text: [
        'You flip through Elwin\'s notes. Most is indecipherable, but you spot a recipe: "Moonpetal + Ironroot = Minor Healing."',
        'The journal is filled with cramped handwriting. A margin note reads: "Glowcap mushrooms amplify any mixture."',
        'Diagrams of plant structures fill one page. Another describes failed experiments in alarming detail.',
        'You find a page titled "Ingredients I Need" - a potential shopping list for adventurers.',
        '"Do NOT mix Shadowmoss with anything flammable." The warning is underlined three times.',
      ],
      cooldown: 30,
      rewards: {
        lore: 'Elwin\'s notes contain hints about alchemical recipes and rare ingredient locations.',
      },
    },
    examineText: [
      'A leather-bound journal filled with cramped notes, formulas, and occasionally singed pages.',
      'The book falls open to well-worn pages, favorites consulted countless times.',
    ],
  },

  alchemist_ingredient_board: {
    id: 'alchemist_ingredient_board',
    name: 'ingredient wanted board',
    tier: 'signature',
    verbs: ['read', 'examine', 'check'],
    defaultInteraction: {
      text: [
        '"WANTED: Sewer Moss. 5 copper per bundle. -Elwin" The sign is well-worn.',
        'A notice reads: "Seeking Rat King Glands. Will pay handsomely. Inquire within."',
        '"Fresh Moonpetals needed. Must be picked at night. Premium paid for quality."',
        'The board lists dozens of ingredients. Many you\'ve never heard of.',
        '"Warning: Do NOT bring me Corpseflower. I don\'t care how much it\'s worth."',
      ],
      cooldown: 30,
      rewards: {
        lore: 'The board hints at valuable ingredients that can be found or harvested in various locations.',
      },
    },
    examineText: [
      'A cork board covered in pinned notes, listing ingredients Elwin is willing to buy.',
      'Some notes are yellowed with age. Others are fresh, the ink still dark.',
    ],
  },

  // === INTERACTIVE PROPS ===
  alchemist_cauldron: {
    id: 'alchemist_cauldron',
    name: 'bubbling cauldron',
    tier: 'interactive',
    verbs: ['examine', 'stir', 'peer', 'smell'],
    defaultInteraction: {
      text: [
        'You peer into the cauldron. Something purple bubbles within, occasionally emitting sparks.',
        'You stir the mixture cautiously. The color shifts from purple to green. Elwin yelps in alarm.',
        'The contents smell like lavender and sulfur. An unusual combination.',
        'Bubbles rise and pop, releasing puffs of vapor that make your eyes water.',
        '"Don\'t touch that," Elwin warns. "It\'s almost ready and very unstable."',
      ],
      cooldown: 10,
    },
    examineText: [
      'A large iron cauldron suspended over a low flame, its contents bubbling mysteriously.',
      'Alchemical symbols are etched around the rim, their meaning known only to practitioners.',
    ],
  },

  alchemist_herbs: {
    id: 'alchemist_herbs',
    name: 'hanging herbs',
    tier: 'interactive',
    verbs: ['examine', 'smell', 'identify', 'touch'],
    defaultInteraction: {
      text: [
        'Bundles of dried herbs hang from every rafter. You recognize chamomile, but little else.',
        'You sniff a purple flower. Your sinuses clear instantly and your eyes water.',
        'Some herbs are labeled, others aren\'t. You suspect Elwin knows them by smell alone.',
        'You touch a silvery leaf. It crumbles to dust at your touch. "That was expensive," Elwin sighs.',
        'The herbs range from mundane kitchen spices to things that glow faintly in shadow.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Bundles of herbs hang from the rafters in various stages of drying.',
      'Some are common cooking herbs. Others are decidedly more exotic - and valuable.',
    ],
  },

  alchemist_vials: {
    id: 'alchemist_vials',
    name: 'vial collection',
    tier: 'interactive',
    verbs: ['examine', 'browse', 'inspect'],
    defaultInteraction: {
      text: [
        'Vials of every size crowd the shelves. Their contents range from clear water to glowing green ooze.',
        'You pick up a vial of red liquid. "Ah, that\'s my lunch," Elwin says. "Tomato juice."',
        'One vial seems to contain captured starlight. It pulses gently in your hand.',
        'The labels are in Elwin\'s cramped script. You can\'t read most of them.',
        'You find a vial labeled simply "DO NOT OPEN." You put it back very carefully.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Countless glass vials line the shelves, each containing a different substance.',
      'The collection represents years of brewing, collecting, and experimenting.',
    ],
  },

  alchemist_workbench: {
    id: 'alchemist_workbench',
    name: 'workbench',
    tier: 'interactive',
    verbs: ['examine', 'study', 'inspect'],
    defaultInteraction: {
      text: [
        'The workbench is covered in mortar and pestle, measuring scales, and glass tubes.',
        'Burn marks and stains cover the surface. This bench has seen some explosive failures.',
        'You study the equipment. A half-finished potion sits in a retort, slowly dripping.',
        'Notes are pinned to every surface, overlapping in chaotic layers.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A well-worn workbench covered in alchemical equipment and organized chaos.',
      'The wood is scarred by acid, fire, and mysterious substances.',
    ],
  },

  alchemist_glowing_moths: {
    id: 'alchemist_glowing_moths',
    name: 'glowing moths',
    tier: 'interactive',
    verbs: ['watch', 'observe', 'catch'],
    defaultInteraction: {
      text: [
        'The moths flutter between herb bundles, their wings leaving trails of faint light.',
        'You try to catch one. It phases through your fingers like smoke.',
        '"Moonmoths," Elwin explains. "They\'re not quite real. Byproduct of an old experiment."',
        'The moths seem attracted to certain vials, hovering near them curiously.',
        'One lands on your shoulder briefly, leaving a faint tingling sensation.',
      ],
      cooldown: 10,
    },
    examineText: [
      'Ethereal moths with softly glowing wings flutter about the shop.',
      'They seem partially transparent, more spirit than insect.',
    ],
  },

  alchemist_toad: {
    id: 'alchemist_toad',
    name: 'enormous toad',
    tier: 'interactive',
    verbs: ['pet', 'poke', 'examine', 'talk'],
    defaultInteraction: {
      text: [
        'The toad regards you with ancient, knowing eyes. It croaks once, slowly.',
        'You poke the toad gently. It doesn\'t move, but somehow conveys immense disapproval.',
        '"That\'s Bartholomew," Elwin says fondly. "He\'s older than this building."',
        'The toad\'s skin shimmers with iridescent colors. You suspect it\'s not entirely natural.',
        'Bartholomew catches a glowing moth with his tongue. The moth reforms moments later.',
      ],
      cooldown: 10,
    },
    examineText: [
      'An enormously fat toad sits on a velvet cushion, watching the shop with unsettling intelligence.',
      'The toad is the size of a melon, its skin slick and faintly iridescent.',
    ],
  },

  alchemist_colorful_smoke: {
    id: 'alchemist_colorful_smoke',
    name: 'colorful smoke',
    tier: 'interactive',
    verbs: ['watch', 'breathe', 'wave'],
    defaultInteraction: {
      text: [
        'You wave your hand through the smoke. It swirls into patterns, then reforms.',
        'The smoke changes color as it drifts - purple to blue to green to gold.',
        'You accidentally breathe some in. Everything tastes like strawberries for a moment.',
        'The smoke seems almost alive, curious about you.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Wisps of multicolored smoke drift through the air, a byproduct of constant brewing.',
      'The smoke moves with apparent purpose, avoiding obstacles.',
    ],
  },

  alchemist_mislabeled_bottle: {
    id: 'alchemist_mislabeled_bottle',
    name: 'mislabeled bottle',
    tier: 'interactive',
    verbs: ['examine', 'read', 'question'],
    defaultInteraction: {
      text: [
        'The label reads "Definitely Not Poison" in cheerful script.',
        'You point out the suspicious label. Elwin laughs nervously and hides the bottle.',
        '"That\'s... a joke. It\'s actually antidote. Reverse psychology."',
        'The bottle\'s contents are an unsettling shade of green.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A bottle with a label that raises more questions than it answers.',
      'You\'re not sure if Elwin is eccentric or just has a dark sense of humor.',
    ],
  },

  alchemist_experiment: {
    id: 'alchemist_experiment',
    name: 'ongoing experiment',
    tier: 'interactive',
    verbs: ['observe', 'examine', 'watch'],
    defaultInteraction: {
      text: [
        'Glass tubes connect various beakers in an elaborate arrangement. Something drips, very slowly.',
        'You watch the experiment. A blue liquid slowly turns pink as it passes through a filter.',
        'The setup looks incredibly delicate. You\'re afraid to breathe near it.',
        '"Three more days," Elwin mutters. "If nothing explodes."',
      ],
      cooldown: 10,
    },
    examineText: [
      'A complex arrangement of glassware, slowly processing some mysterious substance.',
      'The experiment is labeled with dates going back weeks. Patience is key in alchemy.',
    ],
  },

  // === FLAVOR PROPS ===
  alchemist_chemical_smell: {
    id: 'alchemist_chemical_smell',
    name: 'chemical smell',
    tier: 'flavor',
    verbs: ['smell', 'breathe', 'sniff'],
    defaultInteraction: {
      text: [
        'Sharp chemical odors mingle with herbal scents. Your nose doesn\'t know what to make of it.',
        'You smell sulfur, lavender, something burning, and inexplicably, fresh bread.',
        'The air here would probably kill a canary. You hope it\'s safe for humans.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The complex aroma of an alchemist\'s workshop - part chemistry lab, part herb garden.',
    ],
  },

  alchemist_bubbling: {
    id: 'alchemist_bubbling',
    name: 'bubbling sounds',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'Bubbling, hissing, and the occasional pop create a constant symphony.',
        'Something goes "blorp." Then again. It\'s oddly soothing.',
        'The background noise of a hundred small experiments in progress.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The constant bubbling and hissing of various alchemical processes.',
    ],
  },

  alchemist_pungent_herbs: {
    id: 'alchemist_pungent_herbs',
    name: 'pungent herb scent',
    tier: 'flavor',
    verbs: ['smell', 'sniff'],
    defaultInteraction: {
      text: [
        'Strong herbal scents cut through the chemical haze. Some pleasant, some decidedly not.',
        'You catch a whiff of something that clears your sinuses instantly.',
        'The herbs contribute a natural counterpoint to the more exotic smells.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The strong scent of dozens of different herbs drying in the rafters.',
    ],
  },

  alchemist_mortar: {
    id: 'alchemist_mortar',
    name: 'mortar and pestle',
    tier: 'flavor',
    verbs: ['examine', 'use'],
    defaultInteraction: {
      text: [
        'A heavy stone mortar sits on the bench, its interior stained by countless ingredients.',
        'The pestle is worn smooth from years of grinding herbs and minerals.',
        'Faint residue in the mortar still smells potent.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A well-used mortar and pestle, essential tools for any alchemist.',
    ],
  },

  alchemist_burn_marks: {
    id: 'alchemist_burn_marks',
    name: 'burn marks',
    tier: 'flavor',
    verbs: ['examine', 'study'],
    defaultInteraction: {
      text: [
        'Scorch marks on the ceiling tell stories of experiments gone wrong.',
        'You notice one burn mark is suspiciously person-shaped.',
        'The walls bear testament to Elwin\'s more... enthusiastic failures.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Scorch marks and acid stains covering various surfaces - occupational hazards.',
    ],
  },

  alchemist_spider: {
    id: 'alchemist_spider',
    name: 'alchemical spider',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'A spider with a faintly glowing abdomen builds a web in the corner. Elwin calls it a pet.',
        'The spider\'s web seems to sparkle with more than just dew.',
        'It catches moths but doesn\'t eat them. Strange creature.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A spider that has been affected by the alchemical atmosphere. Its web glows faintly.',
    ],
  },
};
