import type { PropDefinition } from './types';

export const GATE_PROPS: Record<string, PropDefinition> = {
  // === SIGNATURE PROPS ===
  gate_guard_bell: {
    id: 'gate_guard_bell',
    name: 'guard bell',
    tier: 'signature',
    verbs: ['ring', 'pull', 'use'],
    defaultInteraction: {
      text: [
        'You pull the bell rope. A clear tone rings out, and Guard Marcus looks up from his post.',
        'CLANG! The bell echoes across the gate area. "What\'s the trouble?" Marcus calls out.',
        'The alarm bell rings loudly. Guards snap to attention throughout the area.',
        'You ring the bell. Marcus approaches, hand on sword hilt. "Report."',
        '"That bell\'s for emergencies," Marcus warns. "Don\'t abuse it."',
      ],
      cooldown: 30,
      rewards: {
        lore: 'The guard bell summons the watch for emergencies. Use it wisely.',
      },
    },
    examineText: [
      'A brass bell mounted on the guard post, used to summon the watch in emergencies.',
      'The rope is frayed from use. The bell itself gleams, well-maintained.',
    ],
  },

  gate_wanted_posters: {
    id: 'gate_wanted_posters',
    name: 'wanted posters',
    tier: 'signature',
    verbs: ['read', 'examine', 'study', 'check'],
    defaultInteraction: {
      text: [
        'You scan the posters. A bandit leader: "WANTED: Dead or Alive. 50 silver." Tempting.',
        '"WANTED: The Sewer King." Someone\'s put a bounty on that rat monster.',
        'Several faces stare back at you. Murderers, thieves, and one man wanted for "excessive punning."',
        'You study the descriptions. Knowing your enemies by sight could save your life.',
        'One poster is for a missing person, not a criminal. "PLEASE HELP FIND MY DAUGHTER."',
      ],
      cooldown: 30,
      rewards: {
        lore: 'The wanted posters provide hints about bounties and potential quests.',
      },
    },
    examineText: [
      'A board covered with wanted posters, bounty notices, and missing person flyers.',
      'Some posters are yellowed with age. Others are freshly pinned.',
    ],
  },

  // === INTERACTIVE PROPS ===
  gate_guard_post: {
    id: 'gate_guard_post',
    name: 'guard post',
    tier: 'interactive',
    verbs: ['examine', 'approach', 'inspect'],
    defaultInteraction: {
      text: [
        'The guard post is manned around the clock. Currently, Marcus stands watch.',
        'You examine the post. Weapons rack, lantern hook, and a well-worn stool.',
        'A duty roster is pinned inside. Guard shifts run four hours each.',
        'The post provides a clear view of approaching traffic.',
        'Marcus nods as you approach. "All\'s well. Move along."',
      ],
      cooldown: 5,
    },
    examineText: [
      'A small covered structure where guards monitor all who pass through the gate.',
      'It provides shelter from rain and a good vantage point over the road.',
    ],
  },

  gate_iron_gates: {
    id: 'gate_iron_gates',
    name: 'iron gates',
    tier: 'interactive',
    verbs: ['examine', 'touch', 'push'],
    defaultInteraction: {
      text: [
        'You push against the massive gates. They don\'t budge - as intended.',
        'The iron is cold under your hand, the metalwork strong despite its age.',
        'These gates have defended Easthollow for generations.',
        'You notice marks on the iron - sword strikes from some past attack.',
        'The hinges are well-oiled despite the gates\' weight.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Massive iron gates, reinforced and maintained by the town guard.',
      'The gates could withstand a siege. Easthollow takes its security seriously.',
    ],
  },

  gate_archway: {
    id: 'gate_archway',
    name: 'stone archway',
    tier: 'interactive',
    verbs: ['examine', 'study', 'look'],
    defaultInteraction: {
      text: [
        'The archway is carved with protective symbols and the town motto: "Stand Together."',
        'You study the stonework. Master craftsmanship from a century past.',
        'Names are carved into the base - founders of Easthollow, long departed.',
        'The arch is tall enough for loaded wagons to pass through.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A grand stone arch marking the entrance to Easthollow, carved with symbols of protection.',
      'The stones have weathered countless storms but stand strong.',
    ],
  },

  gate_guard_dog: {
    id: 'gate_guard_dog',
    name: 'guard dog',
    tier: 'interactive',
    verbs: ['pet', 'approach', 'greet'],
    defaultInteraction: {
      text: [
        'The dog sniffs your hand, then allows you to pet it. Its tail wags cautiously.',
        'Sharp eyes assess you. This is a working dog, trained for threat detection.',
        '"Rex knows friend from foe," Marcus says. "You passed his test."',
        'The dog\'s ears perk up at distant sounds you can\'t hear.',
        'You scratch behind Rex\'s ears. He leans into your hand, briefly forgetting duty.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A large, alert dog stationed near the guard post, trained to detect threats.',
      'The dog watches everyone who passes with intelligent, assessing eyes.',
    ],
  },

  gate_falcon: {
    id: 'gate_falcon',
    name: 'perched falcon',
    tier: 'interactive',
    verbs: ['observe', 'watch', 'admire'],
    defaultInteraction: {
      text: [
        'The falcon preens its feathers, seemingly unconcerned by your attention.',
        'Its hooded head turns toward you, sensing your presence.',
        '"The Captain\'s bird," Marcus explains. "Used for urgent messages."',
        'The falcon shifts on its perch, talons gripping the leather.',
        'Even hooded, the bird exudes a predator\'s intensity.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A hunting falcon perched near the guard post, used by the town watch for messages.',
      'The bird wears a leather hood but remains alert, head turning at sounds.',
    ],
  },

  gate_traveler_tally: {
    id: 'gate_traveler_tally',
    name: 'traveler tally',
    tier: 'interactive',
    verbs: ['examine', 'read', 'check'],
    defaultInteraction: {
      text: [
        'You check the tally. Twelve merchants entered today, five adventurers, forty-odd locals.',
        'The guards keep careful count of all who pass. Security measure.',
        'You notice your own entry marked. They don\'t miss much.',
        'Unusual entries are flagged. "Hooded figure, refused identification - WATCH."',
      ],
      cooldown: 10,
    },
    examineText: [
      'A slate board where guards tally all travelers entering and leaving Easthollow.',
      'The count is erased and restarted each day at dawn.',
    ],
  },

  gate_loose_stone: {
    id: 'gate_loose_stone',
    name: 'loose cobblestone',
    tier: 'interactive',
    verbs: ['examine', 'pry', 'lift'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You wiggle the stone free. Underneath is just dirt - but it\'s a good hiding spot.',
        'The stone lifts easily. Someone has used this hiding spot before.',
        'Nothing under it now, but someone might leave something here eventually.',
      ],
      cooldown: 60,
    },
    examineText: [
      'One cobblestone sits slightly higher than the others, loose in its setting.',
      'It would make a good dead drop for messages or small items.',
    ],
  },

  gate_carved_warning: {
    id: 'gate_carved_warning',
    name: 'carved warning',
    tier: 'interactive',
    verbs: ['read', 'examine', 'trace'],
    defaultInteraction: {
      text: [
        '"Enemies of Easthollow enter at their peril." The words are old but clear.',
        'You trace the carved letters. They\'ve been here since the town\'s founding.',
        'The warning is in three languages. The town takes threats seriously.',
        'Below the warning, someone has scratched: "This means you, bandits."',
      ],
      cooldown: 10,
    },
    examineText: [
      'An old warning carved into the stone, directed at those who would harm the town.',
      'The letters are deep, meant to last centuries.',
    ],
  },

  // === FLAVOR PROPS ===
  gate_wind: {
    id: 'gate_wind',
    name: 'gate wind',
    tier: 'flavor',
    verbs: ['feel'],
    defaultInteraction: {
      text: [
        'Wind funnels through the gate, carrying scents of the wilderness.',
        'A cool breeze from outside brings hints of adventure.',
        'The wind whispers of distant places and unknown dangers.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A constant breeze flowing through the gate from the lands beyond.',
    ],
  },

  gate_distant_howl: {
    id: 'gate_distant_howl',
    name: 'distant howl',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        'Was that a wolf? The sound came from far beyond the walls.',
        'A howl echoes from the wilderness. The guards exchange glances.',
        'Something out there is calling to its pack. Best stay in town tonight.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The occasional howl carried on the wind from the wilderness beyond.',
    ],
  },

  gate_road_dust: {
    id: 'gate_road_dust',
    name: 'road dust',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'Dust rises from the road as travelers pass. The eternal mark of a trade route.',
        'You taste dust in the air. Dry season makes it worse.',
        'The guards\' boots are perpetually dusty from their post.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The ever-present dust of the trade road, stirred by countless feet and hooves.',
    ],
  },

  gate_notice_board: {
    id: 'gate_notice_board',
    name: 'notice board',
    tier: 'flavor',
    verbs: ['read', 'scan'],
    defaultInteraction: {
      text: [
        'Notices flutter in the breeze. Town announcements, job postings, lost and found.',
        'You scan the board. Nothing urgent, just the daily life of Easthollow.',
        'A faded notice advertises last month\'s festival. Someone should take it down.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A public notice board covered with various announcements and postings.',
    ],
  },

  gate_arriving_merchant: {
    id: 'gate_arriving_merchant',
    name: 'arriving merchant',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'A merchant\'s wagon rumbles through the gate, guards checking the cargo.',
        'You watch a trader argue briefly with the guards before being waved through.',
        'Another merchant arrives, bringing goods from distant lands.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Merchants arriving through the gate, goods piled high on their carts.',
    ],
  },

  gate_guard_inspection: {
    id: 'gate_guard_inspection',
    name: 'guard inspection',
    tier: 'flavor',
    verbs: ['watch', 'observe'],
    defaultInteraction: {
      text: [
        'Guards check a traveler\'s papers. Routine, but necessary.',
        'The inspection is thorough but fair. The guards know their job.',
        'Someone protests the search. Marcus remains firm but polite.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The routine inspection of travelers entering and leaving the town.',
    ],
  },

  gate_signal_horn: {
    id: 'gate_signal_horn',
    name: 'signal horn',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'A large horn hangs ready for emergencies. One blast means caution. Three means attack.',
        'The horn is polished and ready. May it never need to sound.',
        'Marcus catches you looking. "Pray you never hear it," he says.',
      ],
      cooldown: 2,
    },
    examineText: [
      'A large signal horn for raising alarms, kept near the guard post.',
    ],
  },
};
