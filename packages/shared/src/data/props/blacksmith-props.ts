import type { PropDefinition } from './types';

export const BLACKSMITH_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  blacksmith_hammer_ring: {
    id: 'blacksmith_hammer_ring',
    name: 'ringing hammer',
    tier: 'signature',
    verbs: ['listen', 'hear', 'meditate', 'focus'],
    defaultInteraction: {
      text: [
        'You close your eyes and let the rhythmic hammering wash over you. Ring. Ring. Ring. Your mind clears.',
        'The steady beat of metal on metal becomes a meditation. You find unexpected peace in the chaos.',
        'Kira\'s hammer falls in perfect rhythm. You match your breathing to its tempo and feel centered.',
        'The ring of the hammer drives out stray thoughts. For a moment, there is only the sound.',
        'Something about the ancient rhythm speaks to your soul. Warriors have heard this sound for millennia.',
      ],
      cooldown: 15,
      rewards: {
        xp: 1,
        buff: {
          id: 'focused',
          duration: 10,
        },
      },
    },
    examineText: [
      'The rhythmic ring of hammer on hot metal, steady as a heartbeat.',
      'Kira works with practiced precision, each strike purposeful.',
    ],
  },

  // === INTERACTIVE PROPS ===
  blacksmith_forge: {
    id: 'blacksmith_forge',
    name: 'forge',
    tier: 'interactive',
    verbs: ['examine', 'feel', 'approach', 'warm'],
    tags: ['fire', 'heat_source'],
    defaultInteraction: {
      text: [
        'The forge radiates intense heat. Flames dance within, hungry for metal to transform.',
        'You edge closer, feeling the heat prickle your skin. The coals glow white-hot.',
        'The forge breathes like a living thing, bellows pumping air into its fiery heart.',
        'Sparks spiral upward as Kira works. The forge has burned here for three generations.',
        'You warm your hands. Even in summer, the forge\'s heat is welcome after a cold dungeon.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A massive stone forge, its fire burning day and night. The heart of the smithy.',
      'Coal and kindling are stacked nearby. The forge is large enough to heat a greatsword.',
    ],
  },

  blacksmith_anvil: {
    id: 'blacksmith_anvil',
    name: 'anvil',
    tier: 'interactive',
    verbs: ['examine', 'touch', 'feel'],
    defaultInteraction: {
      text: [
        'You run your hand across the anvil\'s surface. Countless hammer blows have worn it smooth.',
        'The iron is warm from recent work. You can feel the ghosts of a thousand blades.',
        'Kira\'s anvil has a name, though she won\'t tell you what it is.',
        'The anvil weighs more than you do. It has sat in this exact spot for decades.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A massive iron anvil, its surface worn smooth by generations of use.',
      'The anvil is mounted on a thick oak stump, black with age and oil.',
    ],
  },

  blacksmith_water_barrel: {
    id: 'blacksmith_water_barrel',
    name: 'quenching barrel',
    tier: 'interactive',
    verbs: ['examine', 'touch', 'dip', 'cool'],
    tags: ['water_source'],
    defaultInteraction: {
      text: [
        'You dip your fingers in. The water is surprisingly cool despite the forge\'s heat.',
        'The water is dark with scale and impurities from quenched metal.',
        'You splash water on your face. It smells of iron and fire.',
        'Steam hisses when hot metal meets this water. The barrel has heard that sound ten thousand times.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A large barrel of water for quenching hot metal. The water is dark with mineral deposits.',
      'The wooden staves are warped from heat and moisture, but the barrel holds true.',
    ],
  },

  blacksmith_blades: {
    id: 'blacksmith_blades',
    name: 'displayed blades',
    tier: 'interactive',
    verbs: ['examine', 'admire', 'study', 'inspect'],
    defaultInteraction: {
      text: [
        'You study Kira\'s work. Each blade is unique, crafted for a specific purpose.',
        'A longsword catches your eye - the balance would be perfect for a tall warrior.',
        'You spot a dagger with an unusual curve. "Serpent-fang design," Kira notes. "Good for armor gaps."',
        'The blades gleam in the firelight. Each one represents hours of patient labor.',
        'You see your distorted reflection in a polished blade. It seems to judge you.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Finished weapons hang on display - swords, axes, and daggers of fine craftsmanship.',
      'Each piece bears Kira\'s maker\'s mark, a small anvil stamped into the tang.',
    ],
  },

  blacksmith_bellows: {
    id: 'blacksmith_bellows',
    name: 'bellows',
    tier: 'interactive',
    verbs: ['pump', 'use', 'operate'],
    defaultInteraction: {
      text: [
        'You pump the bellows. Air rushes into the forge, and the coals flare brighter.',
        'The leather creaks as you work. The forge responds hungrily to the fresh air.',
        'Kira nods approvingly. "Good rhythm. Most people pump too fast."',
        'Your arms burn after a minute. Kira does this for hours. Her strength makes sense now.',
      ],
      cooldown: 10,
    },
    examineText: [
      'Large leather bellows connected to the forge, used to increase the fire\'s intensity.',
      'The bellows are patched in several places but still function perfectly.',
    ],
  },

  blacksmith_grinding_wheel: {
    id: 'blacksmith_grinding_wheel',
    name: 'grinding wheel',
    tier: 'interactive',
    verbs: ['examine', 'spin', 'use'],
    defaultInteraction: {
      text: [
        'You spin the wheel experimentally. It turns smoothly, well-maintained.',
        'The stone is grooved from countless blades pressed against it.',
        'You imagine the shower of sparks when steel meets spinning stone.',
        'A half-sharpened blade rests nearby, waiting for Kira\'s attention.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A large circular grinding stone mounted on a foot pedal, used for sharpening and finishing.',
      'Water drips onto the stone to keep it cool and prevent metal from overheating.',
    ],
  },

  blacksmith_mastiff: {
    id: 'blacksmith_mastiff',
    name: 'sleeping mastiff',
    tier: 'interactive',
    verbs: ['pet', 'approach', 'wake'],
    defaultInteraction: {
      text: [
        'You scratch behind the massive dog\'s ears. It thumps its tail without opening its eyes.',
        'The mastiff cracks one eye, determines you\'re not a threat, and resumes snoring.',
        'Kira\'s dog is the size of a small bear. It ignores the forge\'s heat completely.',
        '"That\'s Slag," Kira says. "Best guard dog in Easthollow. When he\'s awake."',
        'The mastiff rolls onto its back, inviting belly rubs. So much for the fearsome guard dog.',
      ],
      cooldown: 10,
    },
    examineText: [
      'An enormous mastiff dozing near the forge, completely unfazed by the heat and noise.',
      'The dog\'s muzzle is grey with age, but its sheer size is still intimidating.',
    ],
  },

  blacksmith_failed_blade: {
    id: 'blacksmith_failed_blade',
    name: 'cracked blade',
    tier: 'interactive',
    verbs: ['examine', 'study', 'inspect'],
    defaultInteraction: {
      text: [
        'A crack runs through the blade\'s spine - fatal flaw. It would shatter under stress.',
        'You study the failure point. Quenched too fast, maybe, or impurities in the steel.',
        'Kira keeps it as a reminder. "Every smith makes mistakes. The good ones learn."',
        'The blade is otherwise beautiful. A waste of hours of work, ruined in a moment.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A beautifully crafted sword with a fatal crack running through the blade.',
      'Kept on display as a lesson in humility and the importance of proper technique.',
    ],
  },

  // === FLAVOR PROPS ===
  blacksmith_forge_heat: {
    id: 'blacksmith_forge_heat',
    name: 'forge heat',
    tier: 'flavor',
    verbs: ['feel', 'endure'],
    defaultInteraction: {
      text: [
        'Waves of heat roll off the forge. Sweat beads on your forehead.',
        'The air shimmers above the coals. How does Kira work here all day?',
        'You step back from the intense warmth. The smithy is an oven.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The intense, oppressive heat radiating from the active forge.',
    ],
  },

  blacksmith_hot_metal_smell: {
    id: 'blacksmith_hot_metal_smell',
    name: 'hot metal smell',
    tier: 'flavor',
    verbs: ['smell', 'sniff', 'breathe'],
    defaultInteraction: {
      text: [
        'The air tastes of hot iron and coal smoke. A smith\'s perfume.',
        'You breathe the complex scent - metal, fire, oil, and honest sweat.',
        'The smell is harsh but somehow satisfying. The smell of creation.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The distinctive aroma of a working forge - hot metal, coal, and quenching oil.',
    ],
  },

  blacksmith_quench_hiss: {
    id: 'blacksmith_quench_hiss',
    name: 'quenching hiss',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'HISSSS. Steam erupts as hot metal meets water. The blade is born.',
        'The violent hiss makes you flinch. Kira doesn\'t even blink.',
        'Steam billows up, momentarily obscuring Kira. When it clears, she\'s examining the blade.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The dramatic hiss and steam when red-hot metal is plunged into the quenching barrel.',
    ],
  },

  blacksmith_tongs: {
    id: 'blacksmith_tongs',
    name: 'smith\'s tongs',
    tier: 'flavor',
    verbs: ['examine'],
    defaultInteraction: {
      text: [
        'Heavy iron tongs, the smith\'s primary tool for handling hot metal.',
        'The tongs are blackened with age, worn to fit Kira\'s grip perfectly.',
        'Several pairs hang nearby, each sized for different work.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Long-handled iron tongs used for gripping hot metal safely.',
    ],
  },

  blacksmith_coal_pile: {
    id: 'blacksmith_coal_pile',
    name: 'coal pile',
    tier: 'flavor',
    verbs: ['examine'],
    defaultInteraction: {
      text: [
        'A heap of black coal waits to feed the forge\'s hunger.',
        'The coal is high quality - burns hot and clean.',
        'Coal dust covers everything nearby in a fine black film.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A pile of coal for the forge, kept dry under a small awning.',
    ],
  },

  blacksmith_red_iron: {
    id: 'blacksmith_red_iron',
    name: 'glowing iron',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'The metal glows cherry red, soft enough to shape.',
        'You watch the iron slowly fade from red to black as it cools.',
        'The glowing metal is mesmerizing, like a captive sunset.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A piece of iron heated to glowing red, ready to be worked.',
    ],
  },

  blacksmith_wrapped_package: {
    id: 'blacksmith_wrapped_package',
    name: 'wrapped package',
    tier: 'flavor',
    verbs: ['examine'],
    defaultInteraction: {
      text: [
        'A blade wrapped in oiled cloth, awaiting pickup. Someone\'s commission.',
        'You wonder who ordered it and what they\'ll use it for.',
        'The package bears a wax seal - a noble\'s crest, perhaps.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A completed weapon wrapped in oiled cloth, ready for its new owner.',
    ],
  },

  blacksmith_tally: {
    id: 'blacksmith_tally',
    name: 'order tally',
    tier: 'flavor',
    verbs: ['read', 'examine'],
    defaultInteraction: {
      text: [
        'Chalk marks on a slate board track pending orders. Kira is busy.',
        'You count the orders. She\'s booked for weeks.',
        'One entry reads: "Captain\'s blade - RUSH." Even guards need smiths.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A slate board tracking pending orders and material supplies.',
    ],
  },
};
