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
  kind: 'item' | 'level' | 'quest';
  value: string | number;
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
export interface Item {
  id: ItemId;
  baseId: string; // Template ID
  name: string;
  tags: string[]; // "weapon", "key", "consumable"
  rarity: Rarity;
  affixes: Affix[];
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
    /** DOT damage per tick */
    dotDamage: number;
    /** Next tick timestamp for DOT */
    nextDotTick: number;
    /** Next break attempt timestamp */
    nextBreakAttempt: number;
    /** Ranger level (for break calculations) */
    rangerLevel: number;
  };

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

/** Entry in the respawn queue */
export interface RespawnEntry {
  templateId: string;
  spawnLocationId: NodeId;
  respawnAt: number;
  level: number; // Remember the creature's level
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
