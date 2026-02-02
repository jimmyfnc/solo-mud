/**
 * Character and combat types.
 */

import type { ItemId, NodeId } from './world';
import type { TutorialProgress } from './town';
import type { PlayerSpells } from './spells';

/** Base stat names */
export type StatName = 'str' | 'dex' | 'con' | 'int' | 'wis';

/** Character base stats */
export interface Stats {
  str: number; // Melee damage, carry capacity
  dex: number; // Hit chance, dodge, crit, attack speed
  con: number; // HP pool, physical resistance
  int: number; // Spell damage, mana pool
  wis: number; // Spell resistance, mana regen
}

/** Base class identifiers */
export type ClassName = 'warrior' | 'rogue' | 'mage' | 'cleric' | 'ranger';

/** Class definition */
export interface ClassDef {
  id: ClassName;
  name: string;
  description: string;
  primaryStats: [StatName, StatName];
  baseStats: Stats;
  hpPerLevel: number;
  mpPerLevel: number;
}

/** Subclass tier (unlocks at 10, 30, 50, 70, 90) */
export type SubclassTier = 1 | 2 | 3 | 4 | 5;

/** A talent in the subclass tree */
export interface Talent {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  requires?: string; // ID of prerequisite talent
  effects: Record<string, number>; // e.g., { "damage_bonus": 5 }
}

/** Subclass definition */
export interface SubclassDef {
  id: string;
  name: string;
  parentClass: ClassName;
  tier: SubclassTier;
  parentSubclass?: string; // For tier 2+, which tier 1 it branches from
  talents: Talent[];
}

/** Player's subclass progress */
export interface SubclassProgress {
  subclassId: string;
  talentRanks: Record<string, number>; // talent ID -> current rank
  totalPointsSpent: number;
}

/** Equipment slots */
export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'ring1'
  | 'ring2'
  | 'necklace'
  | 'cloak';

/** Player's equipment */
export type Equipment = Partial<Record<EquipSlot, ItemId>>;

/** Inventory item stack */
export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
}

/** Player currency (10c = 1s, 10s = 1g) */
export interface Currency {
  copper: number;
  silver: number;
  gold: number;
}

/** Quick slot assignment */
export interface QuickSlot {
  type: 'item' | 'ability';
  id: string;
}

/** Player character state */
export interface Player {
  id: string;
  name: string;
  class: ClassName;
  level: number;
  xp: number;
  xpToNextLevel: number;

  // Stats
  baseStats: Stats;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;

  // Subclass
  subclass?: SubclassProgress;
  talentPointsAvailable: number;

  // Inventory
  equipment: Equipment;
  inventory: InventorySlot[];
  inventorySlots: number;
  keyring: string[]; // Item IDs of keys (unlimited, no duplicates)
  carryWeight: number;
  maxCarryWeight: number;

  // Quick slots
  itemSlots: (QuickSlot | null)[]; // q1-q4
  abilitySlots: (QuickSlot | null)[]; // a1-a4

  // Position
  locationId: NodeId;
  boundTownId: NodeId; // For recall scrolls

  // Combat state
  inCombat: boolean;
  autoAttack: boolean;

  /** Tutorial progress tracking */
  tutorial: TutorialProgress;
  targetId?: string;
  globalCooldown: number; // ms remaining
  abilityCooldowns: Record<string, number>; // ability ID -> ms remaining

  // Currency (10c = 1s, 10s = 1g)
  currency: Currency;

  // Death state
  corpseLocationId?: NodeId;
  corpseItems?: InventorySlot[];

  // Status effects (buffs, debuffs, drunk, etc.)
  statusEffects: StatusEffect[];

  /** Active light source (torch, lantern, etc.) */
  lightSource?: {
    itemBaseId: string; // e.g., 'torch'
    name: string; // e.g., 'Torch'
    expiresAt: number; // Game time (totalMinutes) when it burns out
  };

  /** Quest/progress flags (e.g., "sewer_puzzle_solved", "tutorial_complete") */
  questFlags: string[];

  /** Known spells and spell slots */
  spells: PlayerSpells;

  /** Trap placed by ranger (only one at a time) */
  placedTrap?: PlacedTrap;

  /** Infamy from attacking/killing NPCs */
  infamy?: PlayerInfamy;

  /** Prop interaction cooldowns - prop ID → game time when usable again */
  propCooldowns: Record<string, number>;
}

/** Status effect on a player */
export interface StatusEffect {
  id: string;
  name: string;
  /** Duration in game ticks (0 = permanent until removed) */
  duration: number;
  /** Stacks of this effect (for things like drunk) */
  stacks: number;
  /** When the effect was applied (game time in minutes) */
  appliedAt: number;
}

/** Infamy level for players who attack NPCs */
export type InfamyLevel = 'none' | 'suspect' | 'criminal' | 'murderer';

/** Player infamy state (from attacking/killing NPCs) */
export interface PlayerInfamy {
  /** Current infamy level */
  level: InfamyLevel;
  /** Town where player is infamous */
  townId: string;
  /** When infamy decays to next lower tier (game time in minutes) */
  decayAt?: number;
  /** Bounty in copper (guards may attack on sight) */
  bounty: number;
}

/** A trap placed by a ranger in a location */
export interface PlacedTrap {
  /** Location where the trap is set */
  locationId: NodeId;
  /** Ranger's level when trap was placed (affects effectiveness) */
  rangerLevel: number;
  /** Initial damage when triggered */
  damage: number;
  /** Damage over time per tick while trapped */
  dotDamage: number;
  /** Base duration of root in seconds (modified by creature level) */
  rootDuration: number;
  /** When the trap was placed (real timestamp) */
  placedAt: number;
  /** When the trap expires if not triggered (real timestamp) */
  expiresAt: number;
}

/** Calculated combat stats (from base + gear + buffs) */
export interface CombatStats {
  attackPower: number;
  spellPower: number;
  defense: number; // Physical damage reduction (percentage-based)
  fireResist: number; // Fire damage reduction
  iceResist: number; // Ice damage reduction
  lightningResist: number; // Lightning damage reduction
  poisonResist: number; // Poison damage reduction
  hitChance: number;
  dodgeChance: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number; // ticks between attacks
}

/**
 * Get resistance value for a damage type.
 * Uses DamageType from spells.ts - holy/shadow/nature have no resistance (return 0).
 */
export function getResistanceForDamageType(
  stats: CombatStats,
  damageType: 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'nature' | 'poison' | 'arcane'
): number {
  switch (damageType) {
    case 'physical': return stats.defense;
    case 'fire': return stats.fireResist;
    case 'ice': return stats.iceResist;
    case 'lightning': return stats.lightningResist;
    case 'poison': return stats.poisonResist;
    case 'holy':
    case 'shadow':
    case 'nature':
    case 'arcane':
    default:
      return 0; // No resistance for these damage types (yet)
  }
}

/** Calculate damage after resistance (percentage-based, capped at 75%) */
export function applyResistance(baseDamage: number, resistance: number): number {
  const cappedResist = Math.min(75, resistance);
  const reduction = cappedResist / 100;
  return Math.max(1, Math.floor(baseDamage * (1 - reduction)));
}
