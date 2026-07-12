import type { PropDefinition } from './types';

export const INN_PROPS: Record<string, PropDefinition> = {
  // ============ SIGNATURE PROPS ============

  inn_ginger_cat: {
    id: 'inn_ginger_cat',
    name: 'Ginger Tabby Cat',
    tier: 'signature',
    verbs: ['pet', 'feed'],
    defaultInteraction: {
      text: [
        'The ginger tabby arches into your hand, purring loudly. Its eyes close in contentment.',
        'The cat bumps its head against your palm, rumbling with satisfaction.',
        'A deep, resonant purr vibrates through the tabby as you scratch behind its ears.',
        'The cat rolls onto its back, exposing its belly - a rare sign of trust.',
        'The ginger tabby kneads the air happily as you stroke its soft fur.',
      ],
      cooldown: 30,
      rewards: {
        buff: { id: 'content', duration: 15 },
      },
    },
    examineText: [
      'A plump ginger tabby cat lounges on a sunny windowsill, one eye perpetually half-open to monitor the room.',
      'The inn\'s resident mouser, this ginger tabby has clearly never missed a meal. Mira spoils it rotten.',
      'Orange fur marked with darker stripes, this well-fed cat seems to rule the Weary Wanderer with quiet authority.',
    ],
  },

  inn_loose_floorboard: {
    id: 'inn_loose_floorboard',
    name: 'Loose Floorboard',
    tier: 'signature',
    verbs: ['lift', 'pry', 'examine'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You pry up the loose board, revealing a small cache of forgotten coins wedged between the joists.',
        'The floorboard creaks as you lift it. Someone\'s hidden stash glints in the shadows below.',
        'Beneath the warped plank, a few copper coins have collected over the years, likely dropped and forgotten.',
      ],
      cooldown: 10080, // Weekly
      rewards: {
        currency: 10,
      },
    },
    examineText: [
      'One of the floorboards near the wall sits slightly higher than the others, its nails loose from years of foot traffic.',
      'A warped section of flooring catches your eye - it doesn\'t quite sit flush with its neighbors.',
    ],
  },

  // ============ INTERACTIVE PROPS ============

  inn_fireplace: {
    id: 'inn_fireplace',
    name: 'Crackling Fireplace',
    tier: 'interactive',
    verbs: ['use', 'warm', 'sit'],
    tags: ['fire', 'heat_source'],
    defaultInteraction: {
      text: [
        'You settle near the fire, letting its warmth seep into your bones. The chill of adventure melts away.',
        'The crackling flames dance hypnotically as heat radiates through you.',
        'You extend your hands toward the fire, feeling the pleasant warmth chase away the cold.',
        'The fireplace\'s warmth envelops you like a comforting blanket.',
      ],
      cooldown: 5,
      rewards: {
        buff: { id: 'warmed', duration: 30 },
      },
    },
    examineText: [
      'A large stone fireplace dominates one wall, its hearth blackened by countless fires. Flames dance merrily within.',
      'The fireplace crackles and pops, sending occasional sparks up the chimney. Several chairs have been arranged nearby.',
      'Warm light flickers from the well-maintained hearth. The stonework shows generations of use.',
    ],
  },

  inn_bar_counter: {
    id: 'inn_bar_counter',
    name: 'Polished Bar Counter',
    tier: 'interactive',
    verbs: ['lean', 'sit', 'examine'],
    defaultInteraction: {
      text: [
        'You lean against the bar. Mira glances up from polishing a mug and gives you a knowing nod.',
        'The worn wood feels smooth beneath your elbows. Mira raises an eyebrow. "What\'ll it be?"',
        'You settle at the bar. Mira slides a coaster in front of you without missing a beat.',
        'The counter\'s polished surface reflects the firelight. Mira hums quietly as she works nearby.',
      ],
    },
    examineText: [
      'The bar counter gleams from years of careful polishing. Countless mugs have slid across its surface.',
      'A long wooden counter, worn smooth by elbows and spilled ale. Mira keeps it meticulously clean.',
      'Deep grooves in the wood tell stories of rowdy nights and weary travelers seeking comfort.',
    ],
  },

  inn_wooden_stools: {
    id: 'inn_wooden_stools',
    name: 'Row of Wooden Stools',
    tier: 'interactive',
    verbs: ['sit', 'use'],
    defaultInteraction: {
      text: [
        'You take a seat on one of the stools, feeling your tired legs thank you.',
        'The stool creaks comfortably as you settle in. A moment\'s rest is exactly what you needed.',
        'You perch on a stool, watching the inn\'s quiet bustle around you.',
        'Sitting down, you feel some of the road\'s weariness lift from your shoulders.',
      ],
      cooldown: 5,
      rewards: {
        buff: { id: 'rested', duration: 5 },
      },
    },
    examineText: [
      'A line of sturdy wooden stools runs along the bar, each one worn to a comfortable shape by years of use.',
      'Simple but solid stools, their legs slightly uneven from the settling of countless patrons.',
    ],
  },

  inn_tip_jar: {
    id: 'inn_tip_jar',
    name: "Mira's Tip Jar",
    tier: 'interactive',
    verbs: ['tip', 'use'],
    defaultInteraction: {
      text: [
        'Mira notices your generosity and flashes a grateful smile. "Much appreciated, friend."',
        '"You\'re too kind," Mira says warmly as coins clink into the jar.',
        'The jar jingles as you add to it. Mira gives you a respectful nod.',
        '"Bless you," Mira says, briefly pausing her work to acknowledge your kindness.',
      ],
      requiresItem: 'coin',
    },
    examineText: [
      'A clay jar sits on the corner of the bar, a few copper coins visible at the bottom. "For Mira" is scratched into its surface.',
      'The tip jar has seen better days, but Mira keeps it prominently displayed.',
    ],
  },

  inn_dusty_mugs: {
    id: 'inn_dusty_mugs',
    name: 'Collection of Dusty Mugs',
    tier: 'interactive',
    verbs: ['examine', 'search'],
    defaultInteraction: {
      text: [
        'You peer into the dusty mugs on the high shelf. Nothing but cobwebs and memories.',
        'Rifling through the old mugs, your fingers find nothing but dust.',
        'The mugs haven\'t been used in years. Wait - is that a glint of copper at the bottom of one?',
        'Most mugs are empty, but you spot an old coin stuck to the bottom of one.',
        'Just dust and the faint smell of long-evaporated ale.',
      ],
    },
    examineText: [
      'A collection of mismatched mugs lines a high shelf, too dusty for regular use. Souvenirs from another era.',
      'Old drinking vessels of every shape crowd the upper shelf - tankards, steins, even a cracked chalice.',
      'These mugs seem more decorative than functional. Some bear faded crests or names carved into their sides.',
    ],
  },

  inn_lazy_hound: {
    id: 'inn_lazy_hound',
    name: 'Lazy Hound by Fire',
    tier: 'interactive',
    verbs: ['pet', 'wake', 'examine'],
    defaultInteraction: {
      text: [
        'The old hound\'s tail thumps lazily against the floor, but he doesn\'t bother opening his eyes.',
        'You scratch behind the hound\'s ears. He sighs contentedly, too comfortable to move.',
        'The dog\'s tail wags once, twice, then stills. He\'s not getting up for anyone.',
        'A low, happy grumble escapes the hound as you pet him. His hunting days are behind him now.',
        'The hound yawns enormously, showing worn teeth, then settles back into sleep.',
      ],
    },
    examineText: [
      'A graying hound sprawls before the fireplace, twitching occasionally as he dreams of younger days.',
      'Mira\'s old hunting dog has claimed the spot nearest the fire. His muzzle is white with age.',
      'This ancient hound was once the finest tracker in Easthollow, or so the regulars say.',
    ],
  },

  inn_dart_board: {
    id: 'inn_dart_board',
    name: 'Dart Board',
    tier: 'interactive',
    verbs: ['throw', 'play', 'use'],
    defaultInteraction: {
      text: [
        'You throw a dart. Thunk! Not bad - it lands in the outer ring.',
        'Your dart sails wide and sticks in the wall. A regular snickers into his ale.',
        'Bullseye! A few patrons glance over and nod approvingly.',
        'The dart wobbles through the air and catches the edge of the board. Close enough.',
        'You let fly and... hit the wall. Mira shoots you a warning look.',
      ],
    },
    examineText: [
      'A well-worn dart board hangs on the far wall, its surface pockmarked from countless throws.',
      'The dart board is surrounded by a constellation of holes in the wall from less accurate throws.',
      'Three bent darts rest on a nearby table, waiting for the next challenger.',
    ],
  },

  inn_stew_smell: {
    id: 'inn_stew_smell',
    name: 'Smell of Stew',
    tier: 'interactive',
    verbs: ['smell', 'sniff'],
    defaultInteraction: {
      text: [
        'The rich aroma of slow-cooked stew fills your nostrils. Your stomach growls demandingly.',
        'Hints of rosemary, root vegetables, and tender meat waft through the air. Mira\'s cooking is legendary.',
        'The smell is maddening - savory, hearty, and entirely too appetizing.',
        'Your mouth waters as the scent of today\'s stew reaches you. Perhaps you should order some.',
        'Onions, herbs, and something wonderfully meaty. Mira\'s outdone herself today.',
      ],
    },
    examineText: [
      'An iron pot bubbles over the fire, the source of the inn\'s perpetually delicious aroma.',
      'Steam rises from the stewpot, carrying promises of a hearty meal.',
    ],
  },

  inn_drunk_patron: {
    id: 'inn_drunk_patron',
    name: 'Drunk Patron',
    tier: 'interactive',
    verbs: ['talk', 'listen', 'examine'],
    defaultInteraction: {
      text: [
        '"The sshewers..." he slurs, "they\'re fulla rats big as dogs! Sheen \'em myself!"',
        '"Back in my day... *hic* ...we didn\'t need no adventurers. Did it all ourshelves..."',
        '"You look like someone who can keep a shecret... but I forgot what it was."',
        'He leans in conspiratorially. "The mayor... *hic* ...has a third nipple. Trust me."',
        '"Mira\'sh the besht innkeeper in all the landsh. Don\'t let anyone tell you different!"',
        'He gestures vaguely toward the door. "There\'s treasure out there... somewhere... probably."',
      ],
    },
    examineText: [
      'A red-faced man sways on his stool, clutching a half-empty mug like a lifeline.',
      'This fellow has clearly been here since noon. His stories grow wilder with each drink.',
      'The drunk patron mumbles to himself between swigs, occasionally laughing at his own jokes.',
    ],
  },

  // ============ FLAVOR PROPS ============

  inn_tapestry: {
    id: 'inn_tapestry',
    name: 'Faded Tapestry',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The tapestry depicts a battle from long ago, its colors muted by time.',
        'You trace the woven threads, trying to make out the scene through centuries of fading.',
        'Warriors and monsters clash in frozen combat across the ancient fabric.',
        'Moths have claimed corners of the tapestry, but its grandeur still shows through.',
      ],
    },
    examineText: [
      'A large tapestry hangs on the wall, depicting what might be the founding of Easthollow.',
      'Faded threads form the image of armored knights facing a great beast. The details have blurred with age.',
      'This tapestry has hung here longer than anyone can remember. Mira refuses to take it down.',
    ],
  },

  inn_chandelier: {
    id: 'inn_chandelier',
    name: 'Iron Chandelier',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The chandelier sways gently, its candles casting dancing shadows across the ceiling.',
        'You count the candles - a dozen, though a few have burned down to stubs.',
        'Wax drippings have formed interesting stalactites on the iron frame over the years.',
      ],
    },
    examineText: [
      'A heavy iron chandelier hangs from the center beam, its candles providing most of the inn\'s light.',
      'The chandelier looks like it was forged for a castle. How it ended up here is anyone\'s guess.',
    ],
  },

  inn_hunting_trophy: {
    id: 'inn_hunting_trophy',
    name: 'Mounted Hunting Trophy',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The stag\'s glass eyes seem to follow you as you move. Unsettling.',
        'A magnificent rack of antlers crowns the trophy. Whatever hunter brought this down was skilled.',
        'Dust has gathered in the crevices of the antlers. The stag has watched over this inn for decades.',
      ],
    },
    examineText: [
      'A massive stag\'s head is mounted above the fireplace, its antlers reaching toward the ceiling.',
      'The hunting trophy has a brass plate beneath it, too tarnished to read.',
      'Mira\'s grandfather supposedly bagged this stag. Or so the story goes.',
    ],
  },

  inn_empty_plates: {
    id: 'inn_empty_plates',
    name: 'Stack of Empty Plates',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The plates are scraped clean - evidence of satisfied customers.',
        'A few crumbs remain, but Mira runs a tight ship.',
        'These plates will be washed and ready for the dinner rush soon.',
        'Someone was hungry. Not a morsel remains.',
      ],
    },
    examineText: [
      'A stack of earthenware plates awaits clearing, remnants of the lunch crowd.',
      'Simple but sturdy plates, some chipped at the edges from years of service.',
    ],
  },

  inn_ale_keg: {
    id: 'inn_ale_keg',
    name: 'Ale Keg',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The keg is stamped with the mark of a local brewery. Good stuff.',
        'You can hear liquid sloshing inside. Still plenty left for thirsty patrons.',
        'The wood is dark with age and ale stains. This keg has seen some use.',
        'A small tap juts from the front, a few drops of amber ale clinging to it.',
      ],
    },
    examineText: [
      'A large wooden keg rests behind the bar, connected to the tap by a brass fitting.',
      'The keg bears the seal of Easthollow Brewery - "Est. 847".',
      'Mira keeps her ale fresh. This keg was probably tapped just this morning.',
    ],
  },

  inn_carved_initials: {
    id: 'inn_carved_initials',
    name: 'Carved Initials',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'Dozens of initials overlap each other, some fresh, others worn smooth by time.',
        '"E.H. + M.W." is carved inside a heart. Young love, forever preserved in wood.',
        'You spot what might be a date - 823? This table has stories to tell.',
        'Someone carved a crude skull and crossbones. Adventurers, probably.',
      ],
    },
    examineText: [
      'The corner of one table is covered in carved initials and crude symbols.',
      'Generations of patrons have left their mark here, despite Mira\'s protests.',
      'The carvings are a chaotic history of the Weary Wanderer\'s visitors.',
    ],
  },

  inn_ceiling_stain: {
    id: 'inn_ceiling_stain',
    name: 'Mysterious Ceiling Stain',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The stain vaguely resembles a map of somewhere. Or maybe a dog.',
        'You stare at it too long and start seeing faces. Best to look away.',
        'How did that even get there? The rooms above are supposedly empty.',
        'The stain has been there since before Mira took over. She\'s learned to ignore it.',
      ],
    },
    examineText: [
      'A brownish stain spreads across one section of the ceiling. No one knows its origin.',
      'The ceiling stain has become something of a local landmark. Regulars make up stories about it.',
    ],
  },

  inn_fire_sounds: {
    id: 'inn_fire_sounds',
    name: 'Crackling of the Fire',
    tier: 'flavor',
    verbs: ['listen', 'examine', 'look'],
    defaultInteraction: {
      text: [
        'Pop. Crackle. Hiss. The fire speaks its own quiet language.',
        'The flames whisper and snap, a comforting backdrop to the inn\'s murmur.',
        'You listen to the fire\'s rhythm - steady, warm, peaceful.',
        'Sparks occasionally leap up the chimney like tiny orange spirits.',
      ],
    },
    examineText: [
      'The fire crackles steadily, its sound woven into the fabric of the inn\'s atmosphere.',
      'The familiar pop and hiss of burning logs provides a constant, soothing backdrop.',
    ],
  },

  inn_clinking_mugs: {
    id: 'inn_clinking_mugs',
    name: 'Sound of Clinking Mugs',
    tier: 'flavor',
    verbs: ['listen', 'examine', 'look'],
    defaultInteraction: {
      text: [
        'Somewhere across the room, mugs meet in a toast. Someone\'s celebrating.',
        'The cheerful clink of mugs punctuates the steady hum of conversation.',
        'Glass meets ceramic meets metal - the symphony of a well-loved inn.',
        '"To your health!" someone shouts, followed by the clash of raised drinks.',
      ],
    },
    examineText: [
      'The ambient sound of drinking vessels meeting fills the air - the heartbeat of any good inn.',
      'Toasts and cheers rise and fall like tides throughout the evening.',
    ],
  },
};
