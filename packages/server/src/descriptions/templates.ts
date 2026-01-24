/**
 * Dynamic description template system.
 * Generates contextual descriptions based on biome, time, weather, and state.
 */

import type { TimeOfDay, Rng } from '@solo-mud/shared';

export type Biome = 'plains' | 'forest' | 'hills' | 'swamp' | 'mountains' | 'desert';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';

/** Context for generating descriptions */
export interface DescriptionContext {
  biome: Biome;
  timeOfDay: TimeOfDay;
  weather: Weather;
  visitCount: number;
  props: string[];
  rng: Rng;
}

/** Conditions for when a template variant applies */
export interface TemplateConditions {
  minVisitCount?: number;
  maxVisitCount?: number;
  timeOfDay?: TimeOfDay[];
  weather?: Weather[];
}

/** A single description variant */
export interface TemplateVariant {
  text: string;
  conditions?: TemplateConditions;
  weight?: number;
}

/** A description template for a biome */
export interface DescriptionTemplate {
  biome: Biome;
  variants: TemplateVariant[];
}

/** Base descriptions by biome */
const BIOME_DESCRIPTIONS: Record<Biome, string[]> = {
  plains: [
    'Open grasslands stretch in every direction.',
    'The wind sweeps across the golden plains.',
    'Tall grass sways gently around you.',
    'A vast expanse of rolling meadows surrounds you.',
  ],
  forest: [
    'Trees tower around you, their leaves rustling softly.',
    'Dappled sunlight filters through the dense canopy.',
    'The forest is thick with undergrowth and shadow.',
    'Ancient trees stand silent, their branches intertwined.',
  ],
  hills: [
    'Rocky terrain rises and falls in gentle waves.',
    'The hillside offers a commanding view of the land.',
    'Boulders and scrub dot the undulating landscape.',
    'You stand among rolling hills of stone and earth.',
  ],
  swamp: [
    'Murky water pools between twisted, gnarled trees.',
    'The air is thick with moisture and the smell of decay.',
    'Fog clings to the marshy ground, obscuring your feet.',
    'Rotting logs and stagnant pools surround you.',
  ],
  mountains: [
    'Jagged peaks rise into the clouds above.',
    'The rocky path winds treacherously through the mountains.',
    'Cold wind howls through the narrow mountain pass.',
    'Sheer cliffs and deep chasms mark this rugged terrain.',
  ],
  desert: [
    'Endless dunes stretch to the shimmering horizon.',
    'The sun beats down mercilessly on the barren sand.',
    'Sand crunches beneath your feet in the vast wasteland.',
    'Heat radiates from the sun-baked earth around you.',
  ],
};

/** Time-of-day modifiers */
const TIME_MODIFIERS: Record<TimeOfDay, string[]> = {
  dawn: [
    'The first light of dawn paints the sky in soft hues.',
    'Morning mist begins to lift as the sun rises.',
    'The world awakens in the pale light of dawn.',
  ],
  morning: [
    'Morning light illuminates the landscape.',
    'The air is fresh and crisp in the early hours.',
    'Birdsong fills the morning air.',
  ],
  noon: [
    'The sun stands high overhead.',
    'Shadows shrink as noon approaches.',
    'The day is at its brightest.',
  ],
  afternoon: [
    'The afternoon sun casts long shadows.',
    'The day begins to wind down.',
    'Warm afternoon light bathes everything in gold.',
  ],
  evening: [
    'The sky blazes with sunset colors.',
    'Shadows lengthen as evening approaches.',
    'The day gives way to twilight.',
  ],
  night: [
    'Darkness envelops the land.',
    'Stars glitter in the night sky above.',
    'The world is shrouded in shadow.',
    'Moonlight casts pale silver across the terrain.',
  ],
};

/** Weather effects */
const WEATHER_EFFECTS: Record<Weather, string[]> = {
  clear: [],
  cloudy: [
    'Gray clouds drift overhead.',
    'An overcast sky mutes the colors of the world.',
  ],
  rain: [
    'Rain patters steadily on everything around you.',
    'Water drips from every surface as the rain continues.',
    'The ground is slick with rain.',
  ],
  storm: [
    'Thunder rumbles in the distance.',
    'Lightning flashes across the angry sky.',
    'The storm howls around you with fierce intensity.',
    'Wind and rain batter you relentlessly.',
  ],
  fog: [
    'Thick fog limits visibility to just a few feet.',
    'Ghostly shapes emerge and fade in the mist.',
    'The fog muffles all sound.',
  ],
};

/** Familiarity phrases for repeat visits */
const FAMILIARITY_PHRASES: string[] = [
  'This place feels familiar.',
  'You recognize your surroundings.',
  'You have been here before.',
  'The area looks much as you remember.',
];

/**
 * Generate a description based on context.
 */
export function generateDescription(ctx: DescriptionContext): string {
  const parts: string[] = [];

  // Base biome description
  const biomeDescs = BIOME_DESCRIPTIONS[ctx.biome];
  const biomeIndex = Math.floor(ctx.rng.next() * biomeDescs.length);
  parts.push(biomeDescs[biomeIndex]!);

  // Time modifier (not always added)
  if (ctx.rng.next() > 0.3) {
    const timeDescs = TIME_MODIFIERS[ctx.timeOfDay];
    const timeIndex = Math.floor(ctx.rng.next() * timeDescs.length);
    parts.push(timeDescs[timeIndex]!);
  }

  // Weather effect (only for non-clear weather)
  if (ctx.weather !== 'clear') {
    const weatherDescs = WEATHER_EFFECTS[ctx.weather];
    if (weatherDescs.length > 0) {
      const weatherIndex = Math.floor(ctx.rng.next() * weatherDescs.length);
      parts.push(weatherDescs[weatherIndex]!);
    }
  }

  // Props integration
  if (ctx.props.length > 0 && ctx.rng.next() > 0.5) {
    const prop = ctx.props[Math.floor(ctx.rng.next() * ctx.props.length)]!;
    parts.push(`A ${prop} catches your attention.`);
  }

  // Familiarity on repeat visits (after 2+ visits)
  if (ctx.visitCount > 2 && ctx.rng.next() > 0.7) {
    const famIndex = Math.floor(ctx.rng.next() * FAMILIARITY_PHRASES.length);
    parts.push(FAMILIARITY_PHRASES[famIndex]!);
  }

  return parts.join(' ');
}

/**
 * Get a short description for the location (for status/minimap).
 */
export function getShortDescription(ctx: DescriptionContext): string {
  const biomeNames: Record<Biome, string> = {
    plains: 'Open Plains',
    forest: 'Dense Forest',
    hills: 'Rolling Hills',
    swamp: 'Murky Swamp',
    mountains: 'Mountain Pass',
    desert: 'Barren Desert',
  };

  return biomeNames[ctx.biome];
}

/** Exit info for prose generation */
export interface ExitInfo {
  label: string;
  destination: string;
  isLocked: boolean;
}

/**
 * Generate natural prose for exits.
 * Returns a sentence like: "From here you can see a camp to the south and ruins to the east. A dark tunnel opens nearby."
 */
export function generateExitProse(exits: ExitInfo[]): string {
  if (exits.length === 0) {
    return 'There are no obvious ways out.';
  }

  // Cardinal directions
  const cardinals = ['north', 'south', 'east', 'west'];
  // Vertical directions
  const verticals = ['up', 'down'];
  // Named passages
  const passages = ['passage', 'door', 'tunnel', 'path', 'gate', 'stairs'];

  const cardinalExits: string[] = [];
  const verticalExits: string[] = [];
  const passageExits: string[] = [];

  for (const exit of exits) {
    const label = exit.label.toLowerCase();
    const dest = exit.destination.toLowerCase();
    const locked = exit.isLocked ? ' (locked)' : '';

    if (cardinals.includes(label)) {
      // "a camp to the south"
      cardinalExits.push(`${dest}${locked} to the ${label}`);
    } else if (verticals.includes(label)) {
      // "a cliff down below" or "a ledge above"
      if (label === 'up') {
        verticalExits.push(`${dest}${locked} above`);
      } else {
        verticalExits.push(`${dest}${locked} below`);
      }
    } else if (passages.some(p => label.includes(p))) {
      // "a valley through the old door"
      passageExits.push(`${dest}${locked} through the ${label}`);
    } else {
      // Generic named exit: "the grove via a tunnel"
      passageExits.push(`${dest}${locked} via the ${label}`);
    }
  }

  const parts: string[] = [];

  // Build "From here you can see..." for cardinal/vertical
  const visibleExits = [...cardinalExits, ...verticalExits];
  if (visibleExits.length > 0) {
    const exitList = formatList(visibleExits);
    parts.push(`From here you can see ${exitList}.`);
  }

  // Build passage descriptions
  if (passageExits.length > 0) {
    if (passageExits.length === 1) {
      parts.push(`A way leads to ${passageExits[0]}.`);
    } else {
      const passageList = formatList(passageExits);
      parts.push(`Passages lead to ${passageList}.`);
    }
  }

  return parts.join(' ');
}

/**
 * Format a list with commas and "and".
 * ["a", "b", "c"] -> "a, b, and c"
 */
function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')}, and ${last}`;
}
