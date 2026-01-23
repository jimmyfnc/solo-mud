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

/** XP required for each level (index = level - 1) */
export const XP_TABLE: number[] = [
  0, // Level 1
  100, // Level 2
  300, // Level 3
  600, // Level 4
  1000, // Level 5
  1500, // Level 6
  2100, // Level 7
  2800, // Level 8
  3600, // Level 9
  4500, // Level 10 (subclass unlock)
  5500,
  6600,
  7800,
  9100,
  10500,
  12000,
  13600,
  15300,
  17100,
  19000, // Level 20
  21000,
  23100,
  25300,
  27600,
  30000,
  32500,
  35100,
  37800,
  40600,
  43500, // Level 30 (tier 2 subclass)
];

/** Get XP needed for a level */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > XP_TABLE.length) {
    // Extrapolate for levels beyond table
    const lastXp = XP_TABLE[XP_TABLE.length - 1]!;
    const growth = 3000; // XP increase per level after table
    return lastXp + (level - XP_TABLE.length) * growth;
  }
  return XP_TABLE[level - 1]!;
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
