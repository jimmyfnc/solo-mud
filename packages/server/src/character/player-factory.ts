/**
 * Player factory - creates new player characters with proper stats.
 */

import type { Player, ClassName, ClassDef } from '@solo-mud/shared';
import { CLASSES, xpForLevel } from '@solo-mud/shared';

export interface CreatePlayerOptions {
  id: string;
  name: string;
  className: ClassName;
  startLocationId: string;
}

/**
 * Calculate max HP based on class definition and level.
 * Formula: CON * 3 + hpPerLevel * level
 */
export function calculateMaxHp(classDef: ClassDef, level: number): number {
  return classDef.baseStats.con * 3 + classDef.hpPerLevel * level;
}

/**
 * Calculate max MP based on class definition and level.
 * Formula: max(INT, WIS) * 2 + mpPerLevel * level
 */
export function calculateMaxMp(classDef: ClassDef, level: number): number {
  const mentalStat = Math.max(classDef.baseStats.int, classDef.baseStats.wis);
  return mentalStat * 2 + classDef.mpPerLevel * level;
}

/**
 * Calculate max carry weight based on STR.
 * Formula: 50 + STR * 5
 */
export function calculateMaxCarryWeight(str: number): number {
  return 50 + str * 5;
}

/**
 * Create a new player character with the specified class.
 */
export function createPlayer(options: CreatePlayerOptions): Player {
  const { id, name, className, startLocationId } = options;

  const classDef = CLASSES[className];
  const level = 1;

  const maxHp = calculateMaxHp(classDef, level);
  const maxMp = calculateMaxMp(classDef, level);
  const maxCarryWeight = calculateMaxCarryWeight(classDef.baseStats.str);

  return {
    id,
    name,
    class: className,
    level,
    xp: 0,
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
    inventorySlots: 20,
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

    gold: 0,

    corpseLocationId: undefined,
    corpseItems: undefined,
  };
}
