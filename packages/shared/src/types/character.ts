/**
 * Character and combat types.
 */

import type { ItemId, NodeId } from './world';

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
  targetId?: string;
  globalCooldown: number; // ms remaining
  abilityCooldowns: Record<string, number>; // ability ID -> ms remaining

  // Currency
  gold: number;

  // Death state
  corpseLocationId?: NodeId;
  corpseItems?: InventorySlot[];
}

/** Calculated combat stats (from base + gear + buffs) */
export interface CombatStats {
  attackPower: number;
  spellPower: number;
  defense: number;
  magicResist: number;
  hitChance: number;
  dodgeChance: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number; // ticks between attacks
}
