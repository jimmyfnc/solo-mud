/**
 * Named bot definitions - hand-crafted characters that become server personalities.
 */

import type { NamedBotDefinition } from '@solo-mud/shared';

/** All named bot definitions */
export const NAMED_BOTS: Record<string, NamedBotDefinition> = {
  bot_aldric: {
    id: 'bot_aldric',
    name: 'Aldric the Brave',
    class: 'warrior',
    startingLevel: 5,
    personality: {
      bravery: 95,
      greed: 20,
      sociability: 75,
      patience: 45,
      aggression: 65,
      preferredActivities: ['combat', 'socializing'],
      preferredZones: ['sewer', 'wilderness'],
      dislikedCreatures: [],
      quirks: [{ id: 'protector', description: 'Rushes to help players in danger' }],
      speechStyle: 'formal',
      catchphrases: [
        'For Easthollow!',
        'Stand with me, friend!',
        'No beast shall harm the innocent!',
        'Victory awaits!',
        'To battle!',
      ],
    },
    aspirations: [
      { id: 'boss_slayer', type: 'kill_bosses', description: 'Defeat every boss in the realm' },
    ],
    faction: 'easthollow_defenders',
    factionRole: 'leader',
    backstory:
      'A former town guard who took up adventuring after the sewer rats grew bold. He dreams of clearing every dungeon to protect the townsfolk.',
    specialBehaviors: [{ trigger: 'player_low_health', action: 'rush_to_defend', priority: 95 }],
  },

  bot_mira: {
    id: 'bot_mira',
    name: 'Sister Mira',
    class: 'cleric',
    startingLevel: 4,
    personality: {
      bravery: 40,
      greed: 10,
      sociability: 70,
      patience: 90,
      aggression: 15,
      preferredActivities: ['socializing', 'exploration'],
      preferredZones: ['town'],
      dislikedCreatures: [],
      quirks: [{ id: 'healer', description: 'Heals anyone she sees injured' }],
      speechStyle: 'formal',
      catchphrases: [
        'May the light guide you.',
        'Let me tend to those wounds.',
        'Peace be with you.',
        'There is always hope.',
        'Stay safe, friend.',
      ],
    },
    aspirations: [
      {
        id: 'helper',
        type: 'help_newbies',
        description: 'Help 100 adventurers on their journey',
        target: 100,
      },
    ],
    faction: 'easthollow_defenders',
    factionRole: 'member',
    backstory:
      'A devoted healer from the temple who ventures out to aid struggling adventurers. She keeps count of every soul she has helped.',
  },

  bot_shadow: {
    id: 'bot_shadow',
    name: 'Shadow',
    class: 'rogue',
    startingLevel: 6,
    personality: {
      bravery: 50,
      greed: 95,
      sociability: 15,
      patience: 70,
      aggression: 40,
      preferredActivities: ['trading', 'exploration'],
      preferredZones: ['wilderness', 'sewer'],
      dislikedCreatures: [],
      quirks: [{ id: 'hoarder', description: 'Hoards keys and valuable items' }],
      speechStyle: 'mysterious',
      catchphrases: ['...', 'Coin talks.', 'I work alone.', "What's in it for me?", 'Hmph.'],
    },
    aspirations: [
      {
        id: 'wealthy',
        type: 'max_wealth',
        description: 'Become the richest adventurer in the realm',
      },
    ],
    backstory:
      'A mysterious figure who appeared in town one day. No one knows where Shadow came from, but everyone knows they love gold.',
  },

  bot_thornwick: {
    id: 'bot_thornwick',
    name: 'Thornwick the Sage',
    class: 'mage',
    startingLevel: 5,
    personality: {
      bravery: 35,
      greed: 30,
      sociability: 55,
      patience: 95,
      aggression: 20,
      preferredActivities: ['exploration', 'socializing'],
      preferredZones: ['wilderness', 'sewer'],
      dislikedCreatures: [],
      quirks: [{ id: 'scholar', description: 'Studies creatures before engaging' }],
      speechStyle: 'formal',
      catchphrases: [
        'Fascinating...',
        'Let me examine this more closely.',
        'Knowledge is power.',
        'Curious, most curious.',
        'The patterns here suggest...',
      ],
    },
    aspirations: [
      { id: 'explorer', type: 'explore_all', description: 'Map every location in the realm' },
    ],
    backstory:
      'An elderly mage who left his tower to study the creatures and dungeons of the realm firsthand. He takes meticulous notes on everything he encounters.',
  },

  bot_brutus: {
    id: 'bot_brutus',
    name: 'Brutus',
    class: 'warrior',
    startingLevel: 4,
    personality: {
      bravery: 85,
      greed: 45,
      sociability: 50,
      patience: 15,
      aggression: 95,
      preferredActivities: ['combat'],
      preferredZones: ['sewer', 'wilderness'],
      dislikedCreatures: [],
      quirks: [{ id: 'bloodthirsty', description: 'Attacks anything near his level' }],
      speechStyle: 'gruff',
      catchphrases: ['FIGHT!', 'Come at me!', 'Is that all you got?', 'MORE!', '*cracks knuckles*'],
    },
    aspirations: [
      { id: 'slayer', type: 'kill_bosses', description: 'Slay 1000 creatures', target: 1000 },
    ],
    backstory:
      'A former pit fighter who found adventure more exciting than arena combat. He lives for the thrill of battle.',
  },

  bot_elena: {
    id: 'bot_elena',
    name: 'Elena Swift',
    class: 'ranger',
    startingLevel: 5,
    personality: {
      bravery: 60,
      greed: 35,
      sociability: 45,
      patience: 75,
      aggression: 55,
      preferredActivities: ['exploration', 'combat'],
      preferredZones: ['wilderness'],
      dislikedCreatures: [],
      quirks: [{ id: 'scout', description: 'Marks dangerous areas for others' }],
      speechStyle: 'casual',
      catchphrases: [
        'The wilds call.',
        'Watch your step out there.',
        'I know these lands.',
        'Stay alert.',
        'Nature provides.',
      ],
    },
    aspirations: [
      {
        id: 'hunter',
        type: 'explore_all',
        description: 'Master every hunting ground in the realm',
      },
    ],
    backstory:
      'A skilled tracker who grew up in the wilderness. She knows every trail and danger in the wild lands surrounding Easthollow.',
  },

  bot_gareth: {
    id: 'bot_gareth',
    name: 'Old Gareth',
    class: 'cleric',
    startingLevel: 8,
    personality: {
      bravery: 45,
      greed: 15,
      sociability: 85,
      patience: 95,
      aggression: 10,
      preferredActivities: ['socializing', 'trading'],
      preferredZones: ['town'],
      dislikedCreatures: [],
      quirks: [
        { id: 'storyteller', description: 'Tells stories and gives advice to young adventurers' },
      ],
      speechStyle: 'formal',
      catchphrases: [
        'Ah, that reminds me of a story...',
        'In my day...',
        'Let me give you some advice.',
        'Patience, young one.',
        'I have seen much in my years.',
      ],
    },
    aspirations: [
      { id: 'legend', type: 'max_level', description: 'Reach the highest level, eventually' },
    ],
    backstory:
      'A veteran adventurer who has seen it all. Now he spends more time sharing wisdom than fighting, but he can still hold his own when needed.',
  },

  bot_rat_catcher: {
    id: 'bot_rat_catcher',
    name: 'The Rat Catcher',
    class: 'rogue',
    startingLevel: 3,
    personality: {
      bravery: 70,
      greed: 40,
      sociability: 30,
      patience: 60,
      aggression: 80,
      preferredActivities: ['combat', 'exploration'],
      preferredZones: ['sewer'],
      dislikedCreatures: ['rat', 'giant_rat', 'rat_king'],
      quirks: [{ id: 'rat_hunter', description: 'Obsessively hunts rats in the sewer' }],
      speechStyle: 'gruff',
      catchphrases: [
        'I smell rats.',
        'The sewer is MY domain.',
        'Die, vermin!',
        '*sniffs* More rats nearby.',
        'One less rat in the world.',
      ],
    },
    aspirations: [
      {
        id: 'exterminator',
        type: 'clear_dungeon',
        description: 'Clear the sewer 100 times',
        target: 'sewer',
      },
    ],
    backstory:
      'No one knows their real name. The Rat Catcher appeared one day and has been waging a one-person war against the sewer rats ever since. Some say they lost someone to the rats. Others say they simply hate them.',
  },
};

/** Get a named bot definition by ID */
export function getNamedBotDefinition(botId: string): NamedBotDefinition | undefined {
  return NAMED_BOTS[botId];
}

/** Get all named bot IDs */
export function getAllNamedBotIds(): string[] {
  return Object.keys(NAMED_BOTS);
}

/** Get a random named bot ID */
export function getRandomNamedBotId(): string {
  const ids = getAllNamedBotIds();
  const id = ids[Math.floor(Math.random() * ids.length)];
  if (!id) {
    throw new Error('No named bots defined');
  }
  return id;
}
