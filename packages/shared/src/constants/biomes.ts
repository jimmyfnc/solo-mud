/**
 * Biome definitions and content tables.
 */

export type BiomeId = 'plains' | 'forest' | 'hills' | 'swamp' | 'mountains' | 'desert';

export interface BiomeDef {
  id: BiomeId;
  name: string;
  description: string;
  levelRange: [number, number];
  props: string[];
  ambience: string[];
}

export const BIOMES: Record<BiomeId, BiomeDef> = {
  plains: {
    id: 'plains',
    name: 'Plains',
    description: 'Open grasslands with scattered farms and roads.',
    levelRange: [1, 15],
    props: [
      'tall grass',
      'wildflowers',
      'dirt road',
      'wooden fence',
      'old well',
      'hay bale',
      'grazing sheep',
      'stone marker',
    ],
    ambience: [
      'Wind rustles through the grass.',
      'A hawk circles overhead.',
      'Distant farm bells chime.',
    ],
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Dense woodland with clearings and streams.',
    levelRange: [3, 20],
    props: [
      'ancient oak',
      'fallen log',
      'mushroom ring',
      'mossy stones',
      'bubbling stream',
      'hollow tree',
      'deer trail',
      'bird nest',
    ],
    ambience: [
      'Leaves rustle in the canopy.',
      'A woodpecker drums nearby.',
      'Shafts of light pierce the foliage.',
    ],
  },
  hills: {
    id: 'hills',
    name: 'Hills',
    description: 'Rocky terrain with caves and windswept outcrops.',
    levelRange: [8, 25],
    props: [
      'rocky outcrop',
      'cave entrance',
      'windswept ridge',
      'ancient cairn',
      'abandoned mine',
      'steep cliff',
      'mountain goat',
      'eagle nest',
    ],
    ambience: [
      'Wind howls across the ridge.',
      'Loose stones clatter down the slope.',
      'An eagle screams in the distance.',
    ],
  },
  swamp: {
    id: 'swamp',
    name: 'Swamp',
    description: 'Murky bogs with dead trees and ancient ruins.',
    levelRange: [10, 25],
    props: [
      'stagnant pool',
      'dead tree',
      'thick fog',
      'crumbling ruin',
      'will-o-wisp',
      'rotting log',
      'mosquito swarm',
      'sunken statue',
    ],
    ambience: [
      'Bubbles rise from the murk.',
      'Something splashes in the distance.',
      'The air is thick and fetid.',
    ],
  },
  mountains: {
    id: 'mountains',
    name: 'Mountains',
    description: 'Treacherous peaks with mines and ancient strongholds.',
    levelRange: [15, 30],
    props: [
      'sheer cliff',
      'deep chasm',
      'frozen waterfall',
      'abandoned fortress',
      'dragon bones',
      'crystal formation',
      'rope bridge',
      'snow drift',
    ],
    ambience: [
      'Thunder echoes through the peaks.',
      'Snow swirls in the bitter wind.',
      'The air grows thin and cold.',
    ],
  },
  desert: {
    id: 'desert',
    name: 'Desert',
    description: 'Endless dunes with hidden oases and buried tombs.',
    levelRange: [12, 28],
    props: [
      'sand dune',
      'sun-bleached bones',
      'oasis palm',
      'buried temple',
      'sandstone pillar',
      'scorpion burrow',
      'ancient obelisk',
      'caravan wreckage',
    ],
    ambience: [
      'Heat shimmers on the horizon.',
      'Sand hisses in the wind.',
      'The sun beats down mercilessly.',
    ],
  },
};

export const BIOME_IDS = Object.keys(BIOMES) as BiomeId[];
