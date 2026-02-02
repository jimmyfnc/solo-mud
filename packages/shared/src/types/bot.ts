/**
 * Bot player types - AI-controlled characters that act like real players.
 */

import type { ClassName } from './character';

// ============================================================================
// Personality System
// ============================================================================

/** Core personality traits (0-100 scale) */
export interface BotPersonalityTraits {
  /** 0=flees early, 100=fights to death */
  bravery: number;
  /** 0=generous, 100=hoards everything */
  greed: number;
  /** 0=loner, 100=always seeks company */
  sociability: number;
  /** 0=impulsive, 100=methodical planner */
  patience: number;
  /** 0=peaceful, 100=attacks on sight */
  aggression: number;
}

/** Bot quirk - unique behavioral modifier */
export interface BotQuirk {
  id: string;
  description: string;
}

/** Speech style for conversation system */
export type BotSpeechStyle = 'formal' | 'casual' | 'gruff' | 'cheerful' | 'mysterious';

/** Full personality profile */
export interface BotPersonality extends BotPersonalityTraits {
  preferredActivities: ('combat' | 'exploration' | 'trading' | 'socializing')[];
  preferredZones: string[];
  dislikedCreatures: string[];
  quirks: BotQuirk[];
  speechStyle: BotSpeechStyle;
  catchphrases: string[];
}

// ============================================================================
// Relationship System
// ============================================================================

/** Types of relationship events */
export type RelationshipEventType =
  | 'helped_in_combat'
  | 'healed_me'
  | 'grouped_together'
  | 'abandoned_me'
  | 'stole_kill'
  | 'refused_trade'
  | 'saved_my_life'
  | 'completed_quest_together';

/** A single event that affected a relationship */
export interface RelationshipEvent {
  type: RelationshipEventType;
  timestamp: number;
  opinionChange: number;
}

/** Relationship status derived from opinion score */
export type RelationshipStatus =
  | 'enemy' // -100 to -50
  | 'disliked' // -49 to -10
  | 'neutral' // -9 to +9
  | 'friendly' // +10 to +49
  | 'ally' // +50 to +89
  | 'best_friend'; // +90 to +100

/** Relationship with a single entity */
export interface BotRelationship {
  entityId: string;
  entityName: string;
  isPlayer: boolean;
  opinion: number; // -100 to +100
  history: RelationshipEvent[];
}

/** All relationships a bot has */
export interface BotRelationships {
  opinions: Record<string, BotRelationship>;
  faction?: string;
  factionRole?: 'leader' | 'member' | 'recruit';
  blocked: string[];
}

// ============================================================================
// Memory System
// ============================================================================

/** Knowledge about a creature type */
export interface CreatureKnowledge {
  creatureType: string;
  timesDefeated: number;
  timesDiedTo: number;
  estimatedDifficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  lastEncounter: number;
}

/** Knowledge about a shop */
export interface ShopKnowledge {
  locationId: string;
  npcId: string;
  lastVisit: number;
  itemsSeen: string[];
}

/** Record of a death */
export interface DeathRecord {
  timestamp: number;
  location: string;
  killedBy: string;
  hadHelp: boolean;
  lostItems: string[];
}

/** Record of a notable victory */
export interface VictoryRecord {
  timestamp: number;
  location: string;
  creatureType: string;
  wasBoss: boolean;
}

/** Quest the bot is pursuing */
export interface BotQuest {
  id: string;
  name: string;
  objective: string;
  targetLocation?: string;
  progress: number; // 0-100
  priority: number;
}

/** Memory event for short-term tracking */
export interface MemoryEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

/** Bot's complete memory state */
export interface BotMemory {
  // World knowledge
  knownLocations: string[];
  knownPaths: Record<string, string[]>; // destination -> path of location IDs
  knownCreatures: Record<string, CreatureKnowledge>;
  knownShops: Record<string, ShopKnowledge>;

  // Quest tracking
  activeQuests: BotQuest[];
  completedQuests: string[];
  aspirationProgress: Record<string, number>; // aspiration ID -> progress (0-100)

  // Personal history
  deaths: DeathRecord[];
  victories: VictoryRecord[];
  friendsMade: string[];
  placesExplored: number;

  // Short-term memory
  recentEvents: MemoryEvent[];
  lastCombat: number;
  lastSocialInteraction: number;
  lastShopVisit?: string;
}

// ============================================================================
// GOAP System
// ============================================================================

/** Goal categories */
export type GoalCategory = 'survival' | 'progression' | 'social' | 'economic' | 'aspiration';

/** Goal definition (static) */
export interface BotGoalDef {
  id: string;
  category: GoalCategory;
  description: string;
  isAspiration?: boolean;
}

/** Action categories */
export type ActionCategory = 'combat' | 'movement' | 'economy' | 'social' | 'survival' | 'utility';

/** Precondition types for actions */
export type ActionPreconditionType =
  | 'has_item'
  | 'has_currency'
  | 'in_location'
  | 'in_combat'
  | 'hp_above'
  | 'hp_below'
  | 'mp_above'
  | 'has_target'
  | 'knows_location'
  | 'has_spell'
  | 'not_in_combat';

/** Action precondition */
export interface ActionPrecondition {
  type: ActionPreconditionType;
  value?: string | number | boolean;
}

/** Action definition (static) */
export interface BotActionDef {
  id: string;
  category: ActionCategory;
  description: string;
  preconditions: ActionPrecondition[];
  effects: string[];
}

// ============================================================================
// Bot Profile (Combined State)
// ============================================================================

/** Complete bot profile attached to BotPlayer */
export interface BotProfile {
  /** Whether this is a named (persistent) or generic (ephemeral) bot */
  isNamed: boolean;
  /** Bot personality */
  personality: BotPersonality;
  /** Relationships with other entities */
  relationships: BotRelationships;
  /** Bot's memory and knowledge */
  memory: BotMemory;
  /** Backstory for LLM conversations */
  backstory?: string;
  /** Long-term aspirations */
  aspirations: string[];
}

// ============================================================================
// Named Bot Definition (Data File)
// ============================================================================

/** Aspiration type */
export type AspirationType =
  | 'kill_bosses'
  | 'max_wealth'
  | 'max_level'
  | 'explore_all'
  | 'collect_items'
  | 'help_newbies'
  | 'become_famous'
  | 'clear_dungeon';

/** Aspiration definition */
export interface BotAspiration {
  id: string;
  type: AspirationType;
  description: string;
  target?: string | number;
}

/** Special behavior trigger */
export type SpecialBehaviorTrigger =
  | 'player_low_health'
  | 'boss_nearby'
  | 'faction_member_attacked'
  | 'specific_location'
  | 'time_of_day';

/** Special behavior definition */
export interface SpecialBehavior {
  trigger: SpecialBehaviorTrigger;
  action: string;
  priority: number;
}

/** Named bot definition (loaded from data files) */
export interface NamedBotDefinition {
  id: string;
  name: string;
  class: ClassName;
  startingLevel: number;
  personality: BotPersonality;
  aspirations: BotAspiration[];
  initialRelationships?: Record<string, number>;
  faction?: string;
  factionRole?: 'leader' | 'member' | 'recruit';
  backstory: string;
  specialBehaviors?: SpecialBehavior[];
}

// ============================================================================
// Bot Spawn Configuration
// ============================================================================

/** Configuration for bot population management */
export interface BotSpawnConfig {
  minPopulation: number;
  maxPopulation: number;
  namedBotCount: number;
  spawnLocations: string[];
  levelRange: [number, number];
  namedBotRespawnDelay: number; // in game-minutes
}

/** Death penalty configuration */
export interface BotDeathPenalty {
  xpLossPercent: number;
  goldLossPercent: number;
  reputationLoss: number;
  memoryEffect: 'gains_caution' | 'seeks_revenge' | 'fears_killer';
}
