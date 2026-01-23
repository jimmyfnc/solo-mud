/**
 * Combat stats calculations.
 */

import type { Stats, CombatStats, Player, Item, EquipSlot } from '@solo-mud/shared';
import { CLASSES } from '@solo-mud/shared';
import { calculateMaxHp, calculateMaxMp, calculateMaxCarryWeight } from './player-factory';

/**
 * Calculate combat stats from effective stats.
 */
export function calculateCombatStats(stats: Stats): CombatStats {
  return {
    attackPower: stats.str * 2,
    spellPower: stats.int * 2,
    defense: stats.con + 5,
    magicResist: stats.wis + 5,
    hitChance: 0.9 + stats.dex * 0.005,
    dodgeChance: 0.05 + stats.dex * 0.003,
    critChance: 0.05 + stats.dex * 0.002,
    critDamage: 1.5,
    attackSpeed: 2000, // Base attack speed in ms
  };
}

/**
 * Get effective stats by combining base stats with equipment bonuses.
 */
export function getEffectiveStats(
  player: Player,
  items: Record<string, Item>
): Stats {
  // Start with base stats
  const effective: Stats = { ...player.baseStats };

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
