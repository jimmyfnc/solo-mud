/**
 * Creature templates for world generation.
 */

import type { CreatureTemplate, BiomeWeights } from '../types/world';

// ============ Static (Ambient) Creatures ============

const SHEEP: CreatureTemplate = {
  id: 'sheep',
  name: 'Sheep',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['plains', 'hills'],
  minDepth: 0,
  maxDepth: 4,
  baseHp: 10,
  baseLevel: 1,
  spawnWeight: 10,
  descriptions: {
    idle: [
      'A grazing sheep pays you no mind.',
      'A woolly sheep bleats softly nearby.',
      'Several sheep graze peacefully.',
    ],
  },
};

const RABBIT: CreatureTemplate = {
  id: 'rabbit',
  name: 'Rabbit',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['plains', 'forest'],
  minDepth: 0,
  maxDepth: 5,
  baseHp: 5,
  baseLevel: 1,
  spawnWeight: 12,
  descriptions: {
    idle: [
      'A rabbit nibbles on some grass.',
      'Rabbits scatter at your approach.',
      'A brown rabbit watches you cautiously.',
    ],
  },
};

const DEER: CreatureTemplate = {
  id: 'deer',
  name: 'Deer',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['forest', 'plains'],
  minDepth: 1,
  maxDepth: 6,
  baseHp: 20,
  baseLevel: 2,
  spawnWeight: 6,
  descriptions: {
    idle: [
      'A deer watches cautiously from the treeline.',
      'A graceful doe grazes nearby.',
      'A stag stands alert, ears twitching.',
    ],
  },
};

const SQUIRREL: CreatureTemplate = {
  id: 'squirrel',
  name: 'Squirrel',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['forest'],
  minDepth: 0,
  maxDepth: -1,
  baseHp: 3,
  baseLevel: 1,
  spawnWeight: 15,
  descriptions: {
    idle: [
      'A squirrel chatters from a nearby branch.',
      'Squirrels chase each other through the trees.',
      'A bushy-tailed squirrel watches you curiously.',
    ],
  },
};

const GOAT: CreatureTemplate = {
  id: 'goat',
  name: 'Mountain Goat',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['hills', 'mountains'],
  minDepth: 2,
  maxDepth: -1,
  baseHp: 25,
  baseLevel: 3,
  spawnWeight: 6,
  descriptions: {
    idle: [
      'A mountain goat stands on a rocky outcrop.',
      'A sure-footed goat picks its way across the rocks.',
      'A goat regards you with indifferent yellow eyes.',
    ],
  },
};

const FROG: CreatureTemplate = {
  id: 'frog',
  name: 'Frog',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['swamp'],
  minDepth: 0,
  maxDepth: -1,
  baseHp: 2,
  baseLevel: 1,
  spawnWeight: 15,
  descriptions: {
    idle: [
      'Frogs croak in the murky water.',
      'A bullfrog sits on a lily pad.',
      'Small frogs hop away as you approach.',
    ],
  },
};

const RAVEN: CreatureTemplate = {
  id: 'raven',
  name: 'Raven',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['mountains', 'hills', 'forest'],
  minDepth: 3,
  maxDepth: -1,
  baseHp: 5,
  baseLevel: 1,
  spawnWeight: 8,
  descriptions: {
    idle: [
      'A raven watches you with intelligent eyes.',
      'Ravens circle overhead, cawing ominously.',
      'A black raven perches on a dead branch.',
    ],
  },
};

// ============ Roaming (Threat) Creatures ============

const WOLF: CreatureTemplate = {
  id: 'wolf',
  name: 'Wolf',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['forest', 'plains', 'hills'],
  minDepth: 2,
  maxDepth: -1,
  baseHp: 35,
  baseLevel: 3,
  spawnWeight: 5,
  descriptions: {
    idle: [
      'A wolf watches you from the shadows.',
      'You hear wolves howling in the distance.',
      'A grey wolf prowls nearby, hackles raised.',
    ],
    alert: [
      'A wolf snarls, baring its fangs!',
      'The wolf circles you, looking for an opening.',
    ],
  },
};

const BEAR: CreatureTemplate = {
  id: 'bear',
  name: 'Bear',
  behavior: 'territorial',
  mobility: 'roaming',
  tier: 'dangerous',
  biomes: ['forest', 'mountains'],
  minDepth: 4,
  maxDepth: -1,
  baseHp: 80,
  baseLevel: 6,
  spawnWeight: 2,
  descriptions: {
    idle: [
      'A massive bear forages nearby.',
      'You spot a bear through the trees.',
      'A brown bear sniffs the air, sensing your presence.',
    ],
    alert: [
      'The bear rises on its hind legs and roars!',
      'The bear turns toward you with a threatening growl.',
    ],
  },
};

const SPIDER: CreatureTemplate = {
  id: 'giant_spider',
  name: 'Giant Spider',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest', 'swamp'],
  minDepth: 3,
  maxDepth: -1,
  baseHp: 25,
  baseLevel: 4,
  spawnWeight: 4,
  descriptions: {
    idle: [
      'Thick webs hang between the trees.',
      'A giant spider lurks in a web above.',
      'You notice movement in the shadows - many legs.',
    ],
    alert: [
      'The spider drops from its web, fangs dripping!',
      'Multiple eyes gleam as the spider advances.',
    ],
  },
};

const GOBLIN: CreatureTemplate = {
  id: 'goblin',
  name: 'Goblin',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['swamp', 'hills', 'forest'],
  minDepth: 2,
  maxDepth: 7,
  baseHp: 20,
  baseLevel: 2,
  spawnWeight: 6,
  descriptions: {
    idle: [
      'A goblin skulks in the shadows.',
      'You hear guttural chattering nearby.',
      'Beady eyes watch you from the undergrowth.',
    ],
    alert: [
      'The goblin shrieks and raises its crude weapon!',
      '"Mine! All mine!" the goblin screeches.',
    ],
  },
};

const BANDIT: CreatureTemplate = {
  id: 'bandit',
  name: 'Bandit',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'dangerous',
  biomes: ['plains', 'hills', 'forest'],
  minDepth: 3,
  maxDepth: 8,
  baseHp: 40,
  baseLevel: 4,
  spawnWeight: 3,
  descriptions: {
    idle: [
      'A hooded figure watches from nearby.',
      'You notice signs of a camp - bandits may be near.',
      'A rough-looking character eyes you suspiciously.',
    ],
    alert: [
      '"Your gold or your life!" the bandit demands.',
      'The bandit draws a blade with a menacing grin.',
    ],
  },
};

const TROLL: CreatureTemplate = {
  id: 'troll',
  name: 'Troll',
  behavior: 'territorial',
  mobility: 'roaming',
  tier: 'apex',
  biomes: ['hills', 'mountains', 'swamp'],
  minDepth: 5,
  maxDepth: -1,
  baseHp: 100,
  baseLevel: 7,
  spawnWeight: 1,
  descriptions: {
    idle: [
      'The ground trembles with heavy footsteps.',
      'A hulking shape moves in the distance.',
      'You smell something foul - a troll is near.',
    ],
    alert: [
      'The troll bellows and charges toward you!',
      'A massive club swings through the air!',
    ],
  },
};

const SNAKE: CreatureTemplate = {
  id: 'snake',
  name: 'Venomous Snake',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['swamp', 'desert'],
  minDepth: 1,
  maxDepth: -1,
  baseHp: 15,
  baseLevel: 2,
  spawnWeight: 7,
  descriptions: {
    idle: [
      'A snake slithers through the grass.',
      'You hear a soft hissing nearby.',
      'A coiled serpent basks in the sun.',
    ],
    alert: [
      'The snake rises up, hood flaring!',
      'Fangs flash as the snake strikes!',
    ],
  },
};

const TRAINING_DUMMY: CreatureTemplate = {
  id: 'training_dummy',
  name: 'Training Dummy',
  behavior: 'passive',
  mobility: 'static',
  tier: 'ambient',
  biomes: ['plains'],
  minDepth: 0,
  maxDepth: 0,
  baseHp: 9999,
  baseLevel: 1,
  spawnWeight: 0, // Never spawns naturally
  descriptions: {
    idle: ['A straw-stuffed training dummy stands ready for practice.'],
  },
};

// ============ Export All Templates ============

export const CREATURE_TEMPLATES: Record<string, CreatureTemplate> = {
  // Static/Ambient
  sheep: SHEEP,
  rabbit: RABBIT,
  deer: DEER,
  squirrel: SQUIRREL,
  goat: GOAT,
  frog: FROG,
  raven: RAVEN,
  training_dummy: TRAINING_DUMMY,
  // Roaming/Threats
  wolf: WOLF,
  bear: BEAR,
  giant_spider: SPIDER,
  goblin: GOBLIN,
  bandit: BANDIT,
  troll: TROLL,
  snake: SNAKE,
};

/**
 * Get creature templates that can spawn in a given biome.
 */
export function getTemplatesForBiome(biome: keyof BiomeWeights): CreatureTemplate[] {
  return Object.values(CREATURE_TEMPLATES).filter((t) => t.biomes.includes(biome));
}

/**
 * Get creature templates filtered by depth.
 */
export function getTemplatesForDepth(
  templates: CreatureTemplate[],
  depth: number
): CreatureTemplate[] {
  return templates.filter(
    (t) => depth >= t.minDepth && (t.maxDepth === -1 || depth <= t.maxDepth)
  );
}
