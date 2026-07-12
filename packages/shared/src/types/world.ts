/**
 * Core world data structures for procedural generation.
 */

import type { NPC } from './town';

export type NodeId = string;
export type EdgeId = string;
export type ItemId = string;
export type EnemyId = string;
export type CreatureId = string;

/** Exit types determine traversal requirements */
export type EdgeType = 'open' | 'locked' | 'hidden' | 'hazard';

/** Requirements to pass through an exit */
export interface Requirement {
  kind: 'item' | 'level' | 'quest' | 'puzzle';
  value: string | number;
}

/** One interactable element of a sequence puzzle (a valve, rune, lever...) */
export interface PuzzleElement {
  /** Id used in the solution sequence */
  id: string;
  /** Player-visible name, matched against "use <target>" */
  name: string;
}

/**
 * A data-driven sequence puzzle: activate elements in the right order to
 * open a gated exit. Puzzle progress is per-player (session state).
 */
export interface SequencePuzzle {
  id: string;
  /** Room where the puzzle elements are */
  locationId: NodeId;
  /** Word that identifies the puzzle in "use <target>" (e.g. 'valve', 'rune') */
  keyword: string;
  elements: PuzzleElement[];
  /** Correct order of element ids */
  solution: string[];
  /** Shown when the player uses the keyword without a specific element */
  prompt: string;
  /** Inscription/clue shown with the prompt */
  hint?: string;
  /** Shown when an element is activated ({name} is replaced) */
  activateText?: string;
  solvedText: string;
  failText: string;
  alreadySolvedText: string;
  /** Shown when trying the gated exit before solving */
  gateLockedText: string;
  /** If set, the puzzle resets when the player leaves rooms with this id prefix */
  resetOnLeavePrefix?: string;
}

/** An exit connecting two locations */
export interface Exit {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  label: string; // "north", "iron door", "dark passage"
  type: EdgeType;
  requirement?: Requirement;
  /** Item base ID required to use this exit (e.g., 'rope' for climbing) */
  requiresItem?: string;
  /** Message shown when player lacks required item */
  requiresItemMessage?: string;
}

/** Biome weights for tag-based blending */
export type BiomeWeights = {
  plains?: number;
  forest?: number;
  hills?: number;
  swamp?: number;
  mountains?: number;
  desert?: number;
};

/** Visit tracking for dynamic descriptions */
export interface VisitState {
  visitCount: number;
  firstVisitTime?: number;
  lastVisitTime?: number;
}

/** A location in the world graph */
export interface Location {
  id: NodeId;
  name: string;
  /** Prose description of the location */
  description?: string;
  biome: BiomeWeights;
  props: string[]; // "altar", "campfire", "broken statue"
  items: ItemId[];
  enemies: EnemyId[];
  creatures: CreatureId[]; // Creatures currently in this location
  visitState: VisitState;
  depth: number; // Distance from start (for difficulty scaling)
  /** If true, no combat allowed and no creature spawns */
  isSafeZone?: boolean;
  /** If true, players respawn here after death */
  isRespawnPoint?: boolean;
  /** NPCs present in this location */
  npcs?: string[];
  /** If true, location is dark and requires a light source to see properly */
  isDark?: boolean;
  /** If true, this is a boss room */
  isBossRoom?: boolean;
}

/** Item rarity tiers */
export type Rarity = 'junk' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** An affix that modifies an item */
export interface Affix {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  statMods: Record<string, number>;
}

/** A game item */
/** When an item effect fires */
export type ItemEffectTrigger = 'on_hit' | 'on_crit' | 'on_kill' | 'passive';

/** What an item effect does */
export type ItemEffectKind =
  | 'heal_self'      // restore HP (amount = % of max HP)
  | 'bonus_damage'   // extra damage on the hit (amount = % of hit damage)
  | 'poison_burst'   // extra poison damage on the hit (amount = flat damage)
  | 'root_target'    // roots the target in place (duration = seconds)
  | 'healing_boost'; // passive: healing spells are stronger (amount = %)

/** A special effect on an item (procs and passives) */
export interface ItemEffect {
  trigger: ItemEffectTrigger;
  kind: ItemEffectKind;
  /** Chance to fire, 0-1 (default 1) */
  chance?: number;
  /** Meaning depends on kind (percent or flat) */
  amount?: number;
  /** Seconds, for timed effects like roots */
  duration?: number;
  /** Shown to the player when the effect fires */
  text?: string;
}

export interface Item {
  id: ItemId;
  baseId: string; // Template ID
  name: string;
  tags: string[]; // "weapon", "key", "consumable"
  rarity: Rarity;
  affixes: Affix[];
  /** Base defense value for armor items (scaled by rarity) */
  baseDefense?: number;
  /** Special proc/passive effects (boss uniques etc.) */
  effects?: ItemEffect[];
}

// ============ Creature System ============

/** Creature behavior types */
export type CreatureBehavior = 'passive' | 'territorial' | 'aggressive';

/** Creature mobility types */
export type CreatureMobility = 'static' | 'roaming';

/** Creature ecological tier - determines respawn time and intimidation threshold */
export type CreatureTier = 'ambient' | 'common' | 'dangerous' | 'apex';

/** A creature in the world */
export interface Creature {
  id: CreatureId;
  templateId: string;
  name: string;
  level: number;

  // Type
  behavior: CreatureBehavior;
  mobility: CreatureMobility;

  // Stats
  currentHp: number;
  maxHp: number;

  // Position
  locationId: NodeId;
  homeLocationId: NodeId; // For roaming creatures
  spawnLocationId: NodeId; // Original spawn point for respawn

  // Combat state
  inCombat: boolean;
  targetId?: string;

  // Trapped state (from ranger trap)
  trapped?: {
    /** When the trap effect expires (real timestamp) */
    expiresAt: number;
    /** Player ID who set the trap */
    trappedByPlayerId: string;
    /** DOT damage per tick (0 = no DOT, e.g. weapon roots) */
    dotDamage: number;
    /** Next tick timestamp for DOT */
    nextDotTick: number;
    /** Next break attempt timestamp */
    nextBreakAttempt: number;
    /** Ranger level (for break calculations) */
    rangerLevel: number;
    /** What holds the creature: a ranger trap or an entangling root */
    kind?: 'trap' | 'root';
  };
  /** Hand-placed boss/lair guard — respawns slower, keeps its name and post */
  isBossAnchor?: boolean;
  /** Active damage-over-time effects (Rend, Serpent Sting...) */
  dots?: CreatureDot[];

  // Prose description
  description: string; // e.g., "A grazing sheep pays you no mind."
}

/** Creature template for spawning */
export interface CreatureTemplate {
  id: string;
  name: string;
  behavior: CreatureBehavior;
  mobility: CreatureMobility;
  tier: CreatureTier;
  biomes: (keyof BiomeWeights)[]; // Which biomes this creature spawns in
  minDepth: number; // Minimum location depth to spawn
  maxDepth: number; // Maximum location depth (-1 for no limit)
  baseHp: number;
  baseLevel: number;
  spawnWeight: number; // Higher = more common
  /** Damage type dealt by this creature's attacks */
  damageType?: 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'nature' | 'poison' | 'arcane';
  descriptions: {
    idle: string[]; // Random idle descriptions
    alert?: string[]; // When player enters (aggressive/territorial)
  };
}

/** A corpse left behind when a creature dies */
export interface Corpse {
  id: string;
  creatureId: CreatureId;
  templateId: string;
  name: string;
  locationId: NodeId;
  createdAt: number;
  killedBy: 'creature' | 'player';
  looted: boolean;
  lootedAt?: number;
  loot: ItemId[]; // Items that can be taken from corpse
  /** When the corpse decays (game time in minutes) */
  decayAt?: number;
  /** Whether this corpse is from an NPC (not a creature) */
  isNpc?: boolean;
}

/** A container that can hold items (chests, boxes, etc.) */
export interface Container {
  id: string;
  name: string;
  description: string;
  locationId: NodeId;
  contents: ItemId[]; // Items inside the container
  originalContents?: ItemId[]; // Original contents for respawning
  locked: boolean;
  keyId?: string; // Item ID of key that unlocks it
  opened: boolean; // Has it been opened this session?
  respawns: boolean; // Does it refill its contents over time?
  respawnTime?: number; // Minutes until contents respawn
  lastOpened?: number; // Game time when last opened
}

/** A damage-over-time effect ticking on a creature */
export interface CreatureDot {
  spellId: string;
  name: string;
  /** Damage applied every combat tick */
  damage: number;
  /** Real timestamp (ms) when the effect ends */
  expiresAt: number;
  /** Player who applied it (gets kill credit and XP) */
  sourcePlayerId: string;
}

/** Entry in the respawn queue */
export interface RespawnEntry {
  templateId: string;
  spawnLocationId: NodeId;
  respawnAt: number;
  level: number; // Remember the creature's level
  /** Display-name override (named bosses like 'Packleader') */
  name?: string;
  /** Mobility override (boss anchors stay put) */
  mobility?: CreatureMobility;
  /** Boss anchors respawn slowly and keep their flag */
  isBossAnchor?: boolean;
}

/** Time of day for descriptions and NPC schedules */
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

/** Weather state */
export interface WeatherState {
  type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  intensity: number; // 0-1
  movingDirection?: string; // "north", "east", etc.
}

/** Game time tracking */
export interface GameTime {
  /** Total game minutes elapsed */
  totalMinutes: number;
  /** Current time of day */
  timeOfDay: TimeOfDay;
  /** Current day number */
  day: number;
}

/** The complete world state */
export interface World {
  seed: string;
  startId: NodeId;
  goalId: NodeId;
  locations: Record<NodeId, Location>;
  exits: Record<EdgeId, Exit>;
  /** Maps location ID to array of exit IDs originating from it */
  adjacency: Record<NodeId, EdgeId[]>;
  items: Record<ItemId, Item>;
  creatures: Record<CreatureId, Creature>;
  corpses: Record<string, Corpse>;
  containers?: Record<string, Container>;
  respawnQueue: RespawnEntry[];
  npcs: Record<string, NPC>;
  /** Data-driven sequence puzzles, keyed by puzzle id */
  puzzles?: Record<string, SequencePuzzle>;
  /** Shared merchant, work-order, and gathering state. */
  economy?: import('./economy').EconomyState;
  time: GameTime;
  weather: WeatherState;
}

/** Generation parameters */
export interface WorldGenParams {
  seed: string;
  nodeCount: number;
  extraEdges: number;
  lockedEdges: number;
}
