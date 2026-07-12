/**
 * Personality generator for bot characters.
 * Creates coherent personalities based on archetypes with variation.
 */

import type { BotPersonality, BotSpeechStyle } from '@solo-mud/shared';

/** Trait range for an archetype */
interface TraitRange {
  min: number;
  max: number;
}

/** Archetype definition */
interface Archetype {
  name: string;
  traits: {
    bravery: TraitRange;
    greed: TraitRange;
    sociability: TraitRange;
    patience: TraitRange;
    aggression: TraitRange;
  };
  preferredActivities: ('combat' | 'exploration' | 'trading' | 'socializing')[];
  preferredZones: string[];
  speechStyle: BotSpeechStyle;
  weight: number; // Spawn weight
}

/** Archetype definitions */
export const ARCHETYPES: Record<string, Archetype> = {
  brave_fighter: {
    name: 'Brave Fighter',
    traits: {
      bravery: { min: 70, max: 100 },
      greed: { min: 20, max: 50 },
      sociability: { min: 40, max: 70 },
      patience: { min: 20, max: 50 },
      aggression: { min: 60, max: 90 },
    },
    preferredActivities: ['combat', 'socializing'],
    preferredZones: ['sewer', 'wilderness'],
    speechStyle: 'formal',
    weight: 20,
  },

  cautious_explorer: {
    name: 'Cautious Explorer',
    traits: {
      bravery: { min: 30, max: 60 },
      greed: { min: 30, max: 60 },
      sociability: { min: 30, max: 60 },
      patience: { min: 60, max: 90 },
      aggression: { min: 20, max: 50 },
    },
    preferredActivities: ['exploration', 'trading'],
    preferredZones: ['wilderness', 'town'],
    speechStyle: 'casual',
    weight: 20,
  },

  social_butterfly: {
    name: 'Social Butterfly',
    traits: {
      bravery: { min: 30, max: 60 },
      greed: { min: 20, max: 50 },
      sociability: { min: 70, max: 100 },
      patience: { min: 50, max: 80 },
      aggression: { min: 10, max: 40 },
    },
    preferredActivities: ['socializing', 'trading'],
    preferredZones: ['town'],
    speechStyle: 'cheerful',
    weight: 15,
  },

  greedy_merchant: {
    name: 'Greedy Merchant',
    traits: {
      bravery: { min: 20, max: 50 },
      greed: { min: 70, max: 100 },
      sociability: { min: 40, max: 70 },
      patience: { min: 60, max: 90 },
      aggression: { min: 20, max: 50 },
    },
    preferredActivities: ['trading', 'exploration'],
    preferredZones: ['town', 'wilderness'],
    speechStyle: 'casual',
    weight: 15,
  },

  lone_wolf: {
    name: 'Lone Wolf',
    traits: {
      bravery: { min: 60, max: 90 },
      greed: { min: 40, max: 70 },
      sociability: { min: 10, max: 40 },
      patience: { min: 40, max: 70 },
      aggression: { min: 50, max: 80 },
    },
    preferredActivities: ['combat', 'exploration'],
    preferredZones: ['wilderness', 'sewer'],
    speechStyle: 'gruff',
    weight: 15,
  },

  wise_mentor: {
    name: 'Wise Mentor',
    traits: {
      bravery: { min: 40, max: 70 },
      greed: { min: 10, max: 40 },
      sociability: { min: 50, max: 80 },
      patience: { min: 70, max: 100 },
      aggression: { min: 10, max: 40 },
    },
    preferredActivities: ['socializing', 'exploration'],
    preferredZones: ['town'],
    speechStyle: 'formal',
    weight: 10,
  },

  reckless_adventurer: {
    name: 'Reckless Adventurer',
    traits: {
      bravery: { min: 80, max: 100 },
      greed: { min: 40, max: 70 },
      sociability: { min: 50, max: 80 },
      patience: { min: 10, max: 40 },
      aggression: { min: 60, max: 90 },
    },
    preferredActivities: ['combat', 'exploration'],
    preferredZones: ['sewer', 'wilderness'],
    speechStyle: 'casual',
    weight: 5,
  },
};

/** Catchphrase templates by dominant trait */
const CATCHPHRASE_TEMPLATES: Record<string, string[]> = {
  brave: [
    'For glory!',
    'Stand with me!',
    'No retreat!',
    'Victory or death!',
    'Into the fray!',
    'I fear nothing!',
  ],
  cautious: [
    "Let's be careful...",
    'I have a bad feeling...',
    'Perhaps we should wait...',
    'Watch your step.',
    'Something seems off...',
  ],
  social: [
    'Hello, friend!',
    'Nice to meet you!',
    "How's everyone doing?",
    'Good to see you!',
    "Let's stick together!",
  ],
  greedy: [
    'Got any gold?',
    "What's in it for me?",
    "That's mine!",
    'A profit is a profit.',
    'Money talks.',
  ],
  aggressive: [
    "Let's fight!",
    'Bring it on!',
    "I'll crush them!",
    'No mercy!',
    'Attack!',
  ],
  patient: [
    'All in good time.',
    'Patience pays off.',
    "There's no rush.",
    'Wait for the right moment.',
  ],
  loner: ['I work alone.', "Don't follow me.", '...', 'Hmph.'],
  generic: ['Hmm.', 'Indeed.', 'I see.', 'Very well.', 'Understood.'],
};

/** Random number in range (inclusive) */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick random items from array */
function pickRandom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Select an archetype based on weights */
export function selectArchetype(): string {
  const totalWeight = Object.values(ARCHETYPES).reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const [id, archetype] of Object.entries(ARCHETYPES)) {
    roll -= archetype.weight;
    if (roll <= 0) {
      return id;
    }
  }

  // Fallback
  return Object.keys(ARCHETYPES)[0]!;
}

/** Generate catchphrases based on personality traits */
export function generateCatchphrases(traits: Partial<Record<string, number>>): string[] {
  const phrases: string[] = [];

  // Add phrases based on dominant traits
  if ((traits.bravery ?? 0) > 70) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.brave ?? [], 2));
  }
  if ((traits.bravery ?? 50) < 40) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.cautious ?? [], 2));
  }
  if ((traits.sociability ?? 0) > 70) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.social ?? [], 2));
  }
  if ((traits.sociability ?? 50) < 30) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.loner ?? [], 1));
  }
  if ((traits.greed ?? 0) > 70) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.greedy ?? [], 2));
  }
  if ((traits.aggression ?? 0) > 70) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.aggressive ?? [], 1));
  }
  if ((traits.patience ?? 0) > 70) {
    phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.patient ?? [], 1));
  }

  // Always add some generic phrases
  phrases.push(...pickRandom(CATCHPHRASE_TEMPLATES.generic ?? [], 2));

  // Remove duplicates
  return [...new Set(phrases)];
}

/** Generate a complete personality */
export function generatePersonality(): BotPersonality {
  const archetypeId = selectArchetype();
  const archetype = ARCHETYPES[archetypeId];
  if (!archetype) {
    throw new Error(`Unknown bot archetype: ${archetypeId}`);
  }

  // Generate traits within archetype ranges
  const bravery = randomInRange(archetype.traits.bravery.min, archetype.traits.bravery.max);
  const greed = randomInRange(archetype.traits.greed.min, archetype.traits.greed.max);
  const sociability = randomInRange(
    archetype.traits.sociability.min,
    archetype.traits.sociability.max
  );
  const patience = randomInRange(archetype.traits.patience.min, archetype.traits.patience.max);
  const aggression = randomInRange(
    archetype.traits.aggression.min,
    archetype.traits.aggression.max
  );

  // Generate catchphrases based on actual traits
  const catchphrases = generateCatchphrases({ bravery, greed, sociability, patience, aggression });

  return {
    bravery,
    greed,
    sociability,
    patience,
    aggression,
    preferredActivities: [...archetype.preferredActivities],
    preferredZones: [...archetype.preferredZones],
    dislikedCreatures: [],
    quirks: [],
    speechStyle: archetype.speechStyle,
    catchphrases,
  };
}
