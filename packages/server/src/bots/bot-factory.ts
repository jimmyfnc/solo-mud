/**
 * Bot factory - creates bot players and sessions.
 */

import type { ClassName, BotPersonality, BotMemory, BotProfile, World, NamedBotDefinition, BotRelationship } from '@solo-mud/shared';
import { CLASSES, xpForLevel, getStarterSpellId, generateStarterGear } from '@solo-mud/shared';
import { calculateMaxHp, calculateMaxMp, calculateMaxCarryWeight } from '../character/player-factory';
import { calculateCombatStats } from '../character/stats';
import { generateWorld } from '../world/generate';
import type { BotPlayer } from './bot-player';
import type { BotSession } from './bot-session';

/** Options for creating a bot player */
export interface CreateBotPlayerOptions {
  id: string;
  name: string;
  className: ClassName;
  startLocationId: string;
  isNamed: boolean;
  level?: number;
  personality?: BotPersonality;
  backstory?: string;
  aspirations?: string[];
}

/** Default speech styles for random selection */
const SPEECH_STYLES: BotPersonality['speechStyle'][] = [
  'formal',
  'casual',
  'gruff',
  'cheerful',
  'mysterious',
];

/** Default catchphrases for generic bots */
const DEFAULT_CATCHPHRASES = [
  'Interesting...',
  'I see.',
  "Let's go!",
  'Watch yourself.',
  'Good hunting.',
];

/** Default preferred activities */
const DEFAULT_ACTIVITIES: BotPersonality['preferredActivities'] = [
  'combat',
  'exploration',
];

/** Default preferred zones */
const DEFAULT_ZONES = ['town_square', 'sewer_entrance', 'town_inn'];

/**
 * Generate a random number between min and max (inclusive).
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create a default personality with randomized traits.
 * Traits are in the 20-80 range for variety without extremes.
 */
export function createDefaultPersonality(): BotPersonality {
  return {
    // Core traits (20-80 range for moderate values)
    bravery: randomInRange(20, 80),
    greed: randomInRange(20, 80),
    sociability: randomInRange(20, 80),
    patience: randomInRange(20, 80),
    aggression: randomInRange(20, 80),

    // Activities and zones
    preferredActivities: [...DEFAULT_ACTIVITIES],
    preferredZones: [...DEFAULT_ZONES],
    dislikedCreatures: [],

    // Quirks and speech
    quirks: [],
    speechStyle: SPEECH_STYLES[Math.floor(Math.random() * SPEECH_STYLES.length)]!,
    catchphrases: [...DEFAULT_CATCHPHRASES],
  };
}

/**
 * Create an empty bot memory state.
 */
export function createDefaultMemory(): BotMemory {
  return {
    // World knowledge
    knownLocations: [],
    knownPaths: {},
    knownCreatures: {},
    knownShops: {},

    // Quest tracking
    activeQuests: [],
    completedQuests: [],
    aspirationProgress: {},

    // Personal history
    deaths: [],
    victories: [],
    friendsMade: [],
    placesExplored: 0,

    // Short-term memory
    recentEvents: [],
    lastCombat: 0,
    lastSocialInteraction: 0,
    lastShopVisit: undefined,
  };
}

/**
 * Create a bot player with the specified options.
 */
export function createBotPlayer(options: CreateBotPlayerOptions): BotPlayer {
  const {
    id,
    name,
    className,
    startLocationId,
    isNamed,
    level = 1,
    personality,
    backstory,
    aspirations = [],
  } = options;

  const classDef = CLASSES[className];

  // Calculate XP for the given level (sum of XP from level 1 to level-1)
  let xp = 0;
  for (let lvl = 1; lvl < level; lvl++) {
    xp += xpForLevel(lvl + 1);
  }

  const maxHp = calculateMaxHp(classDef, level);
  const maxMp = calculateMaxMp(classDef, level);
  const maxCarryWeight = calculateMaxCarryWeight(classDef.baseStats.str);

  // Create bot profile
  const botProfile: BotProfile = {
    isNamed,
    personality: personality ?? createDefaultPersonality(),
    relationships: {
      opinions: {},
      blocked: [],
    },
    memory: createDefaultMemory(),
    backstory,
    aspirations,
  };

  return {
    id,
    name,
    class: className,
    level,
    xp,
    xpToNextLevel: xpForLevel(level + 1),

    baseStats: { ...classDef.baseStats },
    currentHp: maxHp,
    maxHp,
    currentMp: maxMp,
    maxMp,

    subclass: undefined,
    talentPointsAvailable: 0,

    equipment: {},
    inventory: [],
    inventorySlots: 40,
    keyring: [],
    carryWeight: 0,
    maxCarryWeight,

    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],

    locationId: startLocationId,
    boundTownId: startLocationId,

    inCombat: false,
    autoAttack: false,
    targetId: undefined,
    globalCooldown: 0,
    abilityCooldowns: {},

    currency: { copper: 0, silver: 0, gold: 0 },

    // Tutorial - bots skip it
    tutorial: {
      skipped: true,
      complete: true,
      completedSteps: [],
    },

    corpseLocationId: undefined,
    corpseItems: undefined,

    // Status effects
    statusEffects: [],

    // Quest/progress flags
    questFlags: [],

    // Spells - start with class-specific starter spell
    spells: {
      known: getStarterSpellId(className) ? [getStarterSpellId(className)!] : [],
      slots: [getStarterSpellId(className) ?? null, null, null, null],
    },

    // Prop interaction cooldowns
    propCooldowns: {},

    // Bot-specific fields
    isBot: true,
    botProfile,
    lastAiTick: 0,
    namedBotId: isNamed ? id : undefined,
  };
}

/**
 * Create a bot session with world and starter gear.
 */
export function createBotSession(bot: BotPlayer, existingWorld?: World): BotSession {
  const now = Date.now();

  // Generate world if not provided
  const world = existingWorld ?? generateWorld({
    seed: `bot-${bot.id}-${now}`,
    nodeCount: 20,
    extraEdges: 5,
    lockedEdges: 2,
  });

  // If world was generated (not provided), ensure bot's location is valid
  if (!existingWorld) {
    // Use the world's start location if bot's location doesn't exist
    if (!world.locations[bot.locationId]) {
      bot.locationId = world.startId;
      bot.boundTownId = world.startId;
    }
  }

  // Generate starter gear and add to world/player
  const { items, equipmentIds, inventoryIds } = generateStarterGear(bot.class);
  for (const item of items) {
    world.items[item.id] = item;
  }

  // Equip items
  if (equipmentIds.chest) bot.equipment.chest = equipmentIds.chest;
  if (equipmentIds.legs) bot.equipment.legs = equipmentIds.legs;
  if (equipmentIds.feet) bot.equipment.feet = equipmentIds.feet;
  if (equipmentIds.weapon) bot.equipment.weapon = equipmentIds.weapon;

  // Add inventory items (convert to InventorySlot format)
  for (const itemId of inventoryIds) {
    bot.inventory.push({ itemId, quantity: 1 });
  }

  // Calculate combat stats
  const combatStats = calculateCombatStats(bot.baseStats);

  return {
    id: bot.id,
    playerId: bot.id,
    player: bot,
    combatStats,
    world,
    createdAt: now,
    lastActivity: now,
    isBot: true,
  };
}

/**
 * Create a named bot from a NamedBotDefinition.
 * Named bots are hand-crafted characters with unique personalities and backstories.
 */
export function createNamedBot(definition: NamedBotDefinition, startLocationId: string): BotPlayer {
  const classDef = CLASSES[definition.class];
  const level = definition.startingLevel;

  // Calculate XP for the given level (sum of XP from level 1 to level-1)
  let xp = 0;
  for (let lvl = 1; lvl < level; lvl++) {
    xp += xpForLevel(lvl + 1);
  }

  const maxHp = calculateMaxHp(classDef, level);
  const maxMp = calculateMaxMp(classDef, level);
  const maxCarryWeight = calculateMaxCarryWeight(classDef.baseStats.str);

  // Build initial relationships from definition
  const opinions: Record<string, BotRelationship> = {};
  if (definition.initialRelationships) {
    for (const [entityId, opinionValue] of Object.entries(definition.initialRelationships)) {
      opinions[entityId] = {
        entityId,
        entityName: entityId, // Name can be resolved later
        isPlayer: false,
        opinion: opinionValue,
        history: [],
      };
    }
  }

  // Convert aspirations to IDs
  const aspirationIds = definition.aspirations.map((a) => a.id);

  // Create bot profile with definition's personality directly
  const botProfile: BotProfile = {
    isNamed: true,
    personality: definition.personality,
    relationships: {
      opinions,
      faction: definition.faction,
      factionRole: definition.factionRole,
      blocked: [],
    },
    memory: createDefaultMemory(),
    backstory: definition.backstory,
    aspirations: aspirationIds,
  };

  return {
    id: definition.id,
    name: definition.name,
    class: definition.class,
    level,
    xp,
    xpToNextLevel: xpForLevel(level + 1),

    baseStats: { ...classDef.baseStats },
    currentHp: maxHp,
    maxHp,
    currentMp: maxMp,
    maxMp,

    subclass: undefined,
    talentPointsAvailable: 0,

    equipment: {},
    inventory: [],
    inventorySlots: 40,
    keyring: [],
    carryWeight: 0,
    maxCarryWeight,

    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],

    locationId: startLocationId,
    boundTownId: startLocationId,

    inCombat: false,
    autoAttack: false,
    targetId: undefined,
    globalCooldown: 0,
    abilityCooldowns: {},

    currency: { copper: 0, silver: 0, gold: 0 },

    // Tutorial - bots skip it
    tutorial: {
      skipped: true,
      complete: true,
      completedSteps: [],
    },

    corpseLocationId: undefined,
    corpseItems: undefined,

    // Status effects
    statusEffects: [],

    // Quest/progress flags
    questFlags: [],

    // Spells - start with class-specific starter spell
    spells: {
      known: getStarterSpellId(definition.class) ? [getStarterSpellId(definition.class)!] : [],
      slots: [getStarterSpellId(definition.class) ?? null, null, null, null],
    },

    // Prop interaction cooldowns
    propCooldowns: {},

    // Bot-specific fields
    isBot: true,
    botProfile,
    lastAiTick: 0,
    namedBotId: definition.id,
  };
}
