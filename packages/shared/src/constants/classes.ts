/**
 * Class and subclass definitions.
 */

import type { ClassName, ClassDef, Stats } from '../types/character';

const defaultStats: Stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10 };

export const CLASSES: Record<ClassName, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: 'A master of martial combat, excelling in melee damage and durability.',
    primaryStats: ['str', 'con'],
    baseStats: { ...defaultStats, str: 14, con: 12, dex: 10, int: 8, wis: 8 },
    hpPerLevel: 12,
    mpPerLevel: 2,
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'A swift striker who relies on precision, stealth, and critical hits.',
    primaryStats: ['dex', 'str'],
    baseStats: { ...defaultStats, dex: 14, str: 12, con: 10, wis: 8, int: 8 },
    hpPerLevel: 8,
    mpPerLevel: 4,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    description: 'A wielder of arcane power, devastating enemies with powerful spells.',
    primaryStats: ['int', 'wis'],
    baseStats: { ...defaultStats, int: 14, wis: 12, dex: 10, str: 8, con: 8 },
    hpPerLevel: 6,
    mpPerLevel: 12,
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    description: 'A divine caster who heals allies and smites the unholy.',
    primaryStats: ['wis', 'con'],
    baseStats: { ...defaultStats, wis: 14, con: 12, str: 10, int: 8, dex: 8 },
    hpPerLevel: 8,
    mpPerLevel: 10,
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    description: 'A wilderness expert skilled in ranged combat and tracking.',
    primaryStats: ['dex', 'wis'],
    baseStats: { ...defaultStats, dex: 14, wis: 12, con: 10, str: 8, int: 8 },
    hpPerLevel: 8,
    mpPerLevel: 6,
  },
};

export const CLASS_IDS = Object.keys(CLASSES) as ClassName[];

/**
 * XP required for each level (index = level - 1).
 *
 * Progression targets:
 * - Level 10: ~3-3.5 hours of gameplay
 * - Level 20: ~8-10 hours total
 * - Scaling steeper at higher levels to encourage group content
 */
export const XP_TABLE: number[] = [
  0, // Level 1
  250, // Level 2 (+250)
  750, // Level 3 (+500)
  1500, // Level 4 (+750)
  2500, // Level 5 (+1000)
  3750, // Level 6 (+1250)
  5250, // Level 7 (+1500)
  7000, // Level 8 (+1750)
  9000, // Level 9 (+2000)
  11250, // Level 10 (subclass unlock) (+2250)
  14000, // Level 11 (+2750)
  17000, // Level 12 (+3000)
  20500, // Level 13 (+3500)
  24500, // Level 14 (+4000)
  29000, // Level 15 (+4500)
  34000, // Level 16 (+5000)
  39500, // Level 17 (+5500)
  45500, // Level 18 (+6000)
  52000, // Level 19 (+6500)
  59000, // Level 20 (+7000)
  66500, // Level 21 (+7500)
  74500, // Level 22 (+8000)
  83000, // Level 23 (+8500)
  92000, // Level 24 (+9000)
  101500, // Level 25 (+9500)
  111500, // Level 26 (+10000)
  122000, // Level 27 (+10500)
  133000, // Level 28 (+11000)
  144500, // Level 29 (+11500)
  156500, // Level 30 (tier 2 subclass) (+12000)
];

/** Get XP needed for a level */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > XP_TABLE.length) {
    // Extrapolate for levels beyond table (12500 + 500 per level)
    const lastXp = XP_TABLE[XP_TABLE.length - 1]!;
    const baseGrowth = 12500;
    const extraLevels = level - XP_TABLE.length;
    return lastXp + extraLevels * baseGrowth + (extraLevels * (extraLevels - 1) * 250);
  }
  return XP_TABLE[level - 1]!;
}

/**
 * Calculate XP gained from killing a creature.
 * Base: creature.level × 10
 * Penalty: -15% per level when creature is 5+ levels below player (capped at -75%)
 */
export function calculateXpGain(playerLevel: number, creatureLevel: number): number {
  const baseXp = creatureLevel * 10;

  // Level difference penalty (only applies when creature is significantly lower)
  const levelDiff = playerLevel - creatureLevel;
  if (levelDiff >= 5) {
    const penaltyLevels = levelDiff - 4; // 5 levels below = 1 penalty level
    const penalty = Math.min(0.75, penaltyLevels * 0.15); // 15% per level, max 75%
    return Math.max(1, Math.floor(baseXp * (1 - penalty)));
  }

  return baseXp;
}

/** Levels where subclass tiers unlock */
export const SUBCLASS_UNLOCK_LEVELS = [10, 30, 50, 70, 90];

/** Talent points gained at each level */
export function talentPointsAtLevel(level: number): number {
  let points = 0;
  if (level >= 10) {
    // 1 point per level starting at 10
    points = level - 9;
    // Bonus points at subclass tier unlocks
    for (const unlock of SUBCLASS_UNLOCK_LEVELS) {
      if (level >= unlock) points += 2;
    }
  }
  return points;
}
