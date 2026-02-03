/**
 * Combat stats calculations.
 */

import type { Stats, CombatStats, Player, Item, EquipSlot } from '@solo-mud/shared';
import { CLASSES } from '@solo-mud/shared';
import { calculateMaxHp, calculateMaxMp, calculateMaxCarryWeight } from './player-factory';

/** Hit chance penalty per level the enemy is above you */
const HIT_PENALTY_PER_LEVEL = 0.05; // 5%

/** Damage penalty per level the enemy is above you */
const DAMAGE_PENALTY_PER_LEVEL = 0.08; // 8%

/**
 * Calculate hit chance modifier based on level difference.
 * Returns a multiplier (0.0 - 1.0) to apply to base hit chance.
 * Penalty only applies when enemy is higher level.
 */
export function getLevelHitModifier(playerLevel: number, enemyLevel: number): number {
  const levelDiff = enemyLevel - playerLevel;
  if (levelDiff <= 0) return 1.0; // No penalty for same level or lower
  const penalty = levelDiff * HIT_PENALTY_PER_LEVEL;
  return Math.max(0.5, 1.0 - penalty); // Cap at 50% hit chance minimum
}

/**
 * Calculate damage modifier based on level difference.
 * Returns a multiplier (0.0 - 1.0+) to apply to final damage.
 * Penalty when enemy is higher level, bonus when lower.
 */
export function getLevelDamageModifier(playerLevel: number, enemyLevel: number): number {
  const levelDiff = enemyLevel - playerLevel;
  if (levelDiff > 0) {
    // Enemy is higher level: deal less damage
    const penalty = levelDiff * DAMAGE_PENALTY_PER_LEVEL;
    return Math.max(0.4, 1.0 - penalty); // Cap at 60% damage reduction
  } else if (levelDiff < 0) {
    // Enemy is lower level: deal bonus damage (smaller bonus)
    const bonus = Math.abs(levelDiff) * 0.05; // 5% bonus per level below
    return Math.min(1.5, 1.0 + bonus); // Cap at 50% bonus damage
  }
  return 1.0; // Same level
}

/**
 * Calculate base combat stats from effective stats (without equipment bonuses).
 */
export function calculateBaseCombatStats(stats: Stats): CombatStats {
  // Base elemental resist from WIS (floor(WIS / 3))
  const baseElementalResist = Math.floor(stats.wis / 3);

  return {
    attackPower: stats.str * 2,
    spellPower: stats.int * 2,
    defense: stats.con + 5, // Base physical defense from CON
    fireResist: baseElementalResist,
    iceResist: baseElementalResist,
    lightningResist: baseElementalResist,
    poisonResist: baseElementalResist,
    hitChance: 0.9 + stats.dex * 0.005,
    dodgeChance: 0.05 + stats.dex * 0.003,
    critChance: 0.05 + stats.dex * 0.002,
    critDamage: 1.5,
    attackSpeed: 2000, // Base attack speed in ms
  };
}

/**
 * Calculate combat stats from effective stats.
 * @deprecated Use calculateCombatStatsWithEquipment for full resistance calculation
 */
export function calculateCombatStats(stats: Stats): CombatStats {
  return calculateBaseCombatStats(stats);
}

/**
 * Calculate combat stats including equipment bonuses (defense and resistances).
 */
export function calculateCombatStatsWithEquipment(
  stats: Stats,
  player: Player,
  items: Record<string, Item>
): CombatStats {
  const combat = calculateBaseCombatStats(stats);

  // Add defense and resistances from equipped items
  const slots = Object.keys(player.equipment) as EquipSlot[];
  for (const slot of slots) {
    const itemId = player.equipment[slot];
    if (!itemId) continue;

    const item = items[itemId];
    if (!item) continue;

    // Add base defense from armor items
    if (item.baseDefense) {
      combat.defense += item.baseDefense;
    }

    // Add resistance bonuses from affixes
    for (const affix of item.affixes) {
      for (const [stat, value] of Object.entries(affix.statMods)) {
        switch (stat) {
          case 'defense':
            combat.defense += value;
            break;
          case 'fireResist':
            combat.fireResist += value;
            break;
          case 'iceResist':
            combat.iceResist += value;
            break;
          case 'lightningResist':
            combat.lightningResist += value;
            break;
          case 'poisonResist':
            combat.poisonResist += value;
            break;
          case 'attackPower':
            combat.attackPower += value;
            break;
          case 'spellPower':
            combat.spellPower += value;
            break;
          case 'attackSpeed':
            combat.attackSpeed += value;
            break;
        }
      }
    }
  }

  return combat;
}

/**
 * Get effective stats by combining base stats with level bonuses and equipment.
 * Level scaling: +1 to class primary stat per level above 1.
 */
export function getEffectiveStats(
  player: Player,
  items: Record<string, Item>
): Stats {
  // Start with base stats
  const effective: Stats = { ...player.baseStats };

  // Add level-based bonus to primary stat (+1 per level above 1)
  const classDef = CLASSES[player.class];
  const primaryStat = classDef.primaryStats[0] as keyof Stats;
  const levelBonus = Math.max(0, player.level - 1);
  effective[primaryStat] += levelBonus;

  // Add bonuses from equipped items
  const slots = Object.keys(player.equipment) as EquipSlot[];
  for (const slot of slots) {
    const itemId = player.equipment[slot];
    if (!itemId) continue;

    const item = items[itemId];
    if (!item) continue;

    // Sum up all affix stat mods
    for (const affix of item.affixes) {
      for (const [stat, value] of Object.entries(affix.statMods)) {
        if (stat in effective) {
          effective[stat as keyof Stats] += value;
        }
      }
    }
  }

  return effective;
}

/**
 * Recalculate player's derived stats (max HP, max MP, combat stats, etc.)
 * based on their level and equipment. Mutates the player object.
 */
export function recalculatePlayerStats(
  player: Player,
  items: Record<string, Item>
): void {
  const effectiveStats = getEffectiveStats(player, items);
  const classDef = CLASSES[player.class];

  // Calculate max HP/MP using effective CON/INT/WIS
  const baseMaxHp = calculateMaxHp(classDef, player.level);
  const baseMaxMp = calculateMaxMp(classDef, player.level);

  // Add bonus HP from equipment CON difference
  const bonusCon = effectiveStats.con - player.baseStats.con;
  const bonusInt = effectiveStats.int - player.baseStats.int;
  const bonusWis = effectiveStats.wis - player.baseStats.wis;

  // Bonus HP = bonus CON * 3 (same multiplier as base formula)
  player.maxHp = baseMaxHp + bonusCon * 3;

  // Bonus MP = max(bonus INT, bonus WIS) * 2
  const bonusMental = Math.max(bonusInt, bonusWis);
  player.maxMp = baseMaxMp + bonusMental * 2;

  // Cap current values at max
  player.currentHp = Math.min(player.currentHp, player.maxHp);
  player.currentMp = Math.min(player.currentMp, player.maxMp);

  // Update carry weight
  player.maxCarryWeight = calculateMaxCarryWeight(effectiveStats.str);
}
