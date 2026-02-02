import type { PropDefinition } from './types';

export const TRAINING_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  training_dummy: {
    id: 'training_dummy',
    name: 'training dummy',
    tier: 'signature',
    verbs: ['attack', 'hit', 'strike', 'practice'],
    defaultInteraction: {
      text: [
        'You unleash a flurry of strikes against the training dummy. The straw stuffing absorbs each blow with a satisfying thud.',
        'Your blade bites into the worn leather covering. Holt nods approvingly from across the yard.',
        'You practice your footwork, circling the dummy and landing several solid hits. Sweat drips down your brow.',
        'The dummy sways from your assault. You notice Sera watching your form with a critical eye.',
        'Strike after strike lands true. The repetition burns the muscle memory deeper.',
      ],
      cooldown: 10,
      rewards: {
        xp: 2,
      },
    },
    examineText: [
      'A battered training dummy made of burlap and straw, mounted on a wooden post. Countless sword cuts have shredded its outer covering.',
      'The dummy bears the scars of ten thousand practice sessions. A faded X marks its "heart" area.',
      'Straw pokes out from numerous gashes. Someone has drawn a crude angry face on its head.',
    ],
  },

  training_buried_coin: {
    id: 'training_buried_coin',
    name: 'disturbed dirt patch',
    tier: 'signature',
    verbs: ['dig', 'search', 'excavate'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You dig through the loose soil and unearth an old copper coin, worn smooth by age. Holt might find this interesting.',
        'Your fingers close around something hard in the dirt - an ancient coin bearing an unfamiliar crest.',
        'Beneath the disturbed earth, you find a tarnished copper coin. The markings suggest it predates Easthollow itself.',
      ],
      cooldown: 1440, // 24 hours
      rewards: {
        item: 'old_coin',
        lore: 'The coin bears the crest of a forgotten kingdom. Holt, the veteran trainer, collects such artifacts.',
      },
    },
    examineText: [
      'A patch of dirt that looks recently disturbed, near the edge of the training yard.',
      'The soil here is looser than elsewhere, as if something was buried and forgotten.',
    ],
  },

  // === INTERACTIVE PROPS ===
  training_weapon_racks: {
    id: 'training_weapon_racks',
    name: 'weapon racks',
    tier: 'interactive',
    verbs: ['examine', 'look', 'inspect', 'browse'],
    defaultInteraction: {
      text: [
        'You run your hand along the practice weapons. Wooden swords, blunted daggers, and padded quarterstaves hang in neat rows.',
        'The weapons are well-maintained despite their worn appearance. Each has been carefully balanced for training.',
        'A sign reads: "Take what you need, return what you borrow. -Holt"',
        'You test the weight of a wooden longsword. It feels heavier than you expected.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Wooden racks hold an assortment of training weapons. Nothing lethal, but enough to learn proper technique.',
      'The racks are organized by weapon type: swords, axes, maces, and polearms on separate stands.',
    ],
  },

  training_archery_targets: {
    id: 'training_archery_targets',
    name: 'archery targets',
    tier: 'interactive',
    verbs: ['examine', 'look', 'shoot', 'practice'],
    defaultInteraction: {
      text: [
        'The straw targets are riddled with arrow holes. Most cluster around the center rings - the recruits are improving.',
        'You study the arrow groupings. Someone with exceptional skill has placed three arrows in the exact center of the far target.',
        'A few broken arrow shafts litter the ground. Training is hard on equipment.',
        'The targets bear painted rings, the innermost barely bigger than a copper coin.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Circular straw targets mounted on wooden frames, set at varying distances across the yard.',
      'The closest target is maybe thirty paces away. The farthest would challenge even a skilled archer.',
    ],
  },

  training_sand_pit: {
    id: 'training_sand_pit',
    name: 'sand pit',
    tier: 'interactive',
    verbs: ['examine', 'look', 'enter', 'step'],
    defaultInteraction: {
      text: [
        'You step into the sand pit. The loose footing would make sparring here more challenging.',
        'Footprints crisscross the sand in chaotic patterns - evidence of recent training bouts.',
        'The sand is warm from the sun. A good place to practice without risking broken bones on hard ground.',
        'You notice drag marks where someone was likely thrown. Training with Holt is no joke.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A large rectangular pit filled with sand, bordered by wooden beams. Used for sparring practice.',
      'The sand is deep enough to cushion falls but shallow enough to maintain footing.',
    ],
  },

  training_water_bucket: {
    id: 'training_water_bucket',
    name: 'water bucket',
    tier: 'interactive',
    verbs: ['drink', 'splash', 'use'],
    tags: ['water_source'],
    defaultInteraction: {
      text: [
        'You take a long drink of cool water. It tastes faintly of the wooden bucket.',
        'You splash water on your face, washing away the grime of training.',
        'The water is surprisingly refreshing after the exertion of the yard.',
        'You cup your hands and drink deeply. A ladle hangs from the bucket\'s rim.',
      ],
      cooldown: 3,
    },
    examineText: [
      'A wooden bucket filled with well water, a ladle hanging from its rim. For thirsty trainees.',
      'The bucket is topped up regularly. A small luxury in the harsh training environment.',
    ],
  },

  training_sparring_recruits: {
    id: 'training_sparring_recruits',
    name: 'sparring recruits',
    tier: 'interactive',
    verbs: ['watch', 'observe', 'study'],
    defaultInteraction: {
      text: [
        'You watch two recruits circle each other, wooden swords raised. One feints high, the other falls for it and takes a solid hit to the ribs.',
        'The recruits grunt with effort, their forms sloppy but enthusiastic. They have much to learn.',
        'Holt barks corrections from the sideline. The recruits scramble to adjust their stances.',
        'One recruit trips over their own feet and lands in the sand. Their partner helps them up, grinning.',
        'You observe their footwork. Amateur, but they show promise.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Young men and women in simple training garb, paired off and practicing with wooden weapons.',
      'The recruits range from fresh-faced youths to grizzled adults seeking a second career.',
    ],
  },

  training_yard_raven: {
    id: 'training_yard_raven',
    name: 'perched raven',
    tier: 'interactive',
    verbs: ['observe', 'watch', 'approach'],
    defaultInteraction: {
      text: [
        'The raven cocks its head and regards you with intelligent eyes. It seems to be judging your worth.',
        'You approach slowly. The raven ruffles its feathers but doesn\'t fly away.',
        'The bird croaks once, a sound almost like laughter, then returns to watching the recruits.',
        '"That\'s Shadow," Holt calls out. "Been here longer than me. Knows a warrior when he sees one."',
      ],
      cooldown: 10,
    },
    examineText: [
      'A large black raven perches on the fence post, watching the training with unsettling intelligence.',
      'The bird\'s feathers gleam with an almost purple sheen. Its eyes seem to miss nothing.',
    ],
  },

  training_notch_marks: {
    id: 'training_notch_marks',
    name: 'notched fence post',
    tier: 'interactive',
    verbs: ['examine', 'count', 'study'],
    defaultInteraction: {
      text: [
        'You count the notches carved into the wood. Dozens of marks, grouped in fives. Records of something.',
        'Each notch is carved with precision. Some are old and weathered, others fresh.',
        'You trace your finger along the marks. They tell a story you don\'t yet understand.',
        'Sera notices you looking. "Victory counts," she says quietly. "Holt\'s from his adventuring days."',
      ],
      cooldown: 15,
    },
    examineText: [
      'A weathered fence post covered in carved notch marks, grouped in sets of five.',
      'The notches are too numerous and deliberate to be random damage. Someone has been keeping count.',
    ],
  },

  // === FLAVOR PROPS ===
  training_sword_clash: {
    id: 'training_sword_clash',
    name: 'clashing swords',
    tier: 'flavor',
    verbs: ['listen'],
    defaultInteraction: {
      text: [
        'The rhythmic clash of wooden swords fills the air. A martial heartbeat.',
        'CLACK. CLACK. THUD. The sounds of training echo off the nearby walls.',
        'Steel would sing sweeter, but wooden swords have their own honest music.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The percussive rhythm of practice weapons meeting in combat drills.',
    ],
  },

  training_sweat_smell: {
    id: 'training_sweat_smell',
    name: 'smell of exertion',
    tier: 'flavor',
    verbs: ['smell', 'sniff'],
    defaultInteraction: {
      text: [
        'The air is thick with honest sweat and leather. The smell of hard work.',
        'Exertion hangs in the air - not unpleasant, just the natural musk of warriors in training.',
        'You catch the scent of oiled leather, sawdust, and perspiration.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The unmistakable aroma of physical training - sweat, leather, and determination.',
    ],
  },

  training_arrow_thud: {
    id: 'training_arrow_thud',
    name: 'arrow impacts',
    tier: 'flavor',
    verbs: ['listen'],
    defaultInteraction: {
      text: [
        'THWOCK. An arrow buries itself in a distant target.',
        'You hear the whistle of an arrow, then the satisfying thud of impact.',
        'Somewhere behind you, arrows strike straw with steady rhythm.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The sound of arrows finding their marks in the archery range.',
    ],
  },
};
