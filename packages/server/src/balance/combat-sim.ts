/**
 * Combat simulation harness for balance checking.
 *
 * Models the auto-attack exchange from game-loop.ts using the same helper
 * functions and formulas, so zone/level balance can be checked in tests
 * before players hit it. Conservative baseline: no spells, no potions, no
 * procs — real players should do better than the sim.
 */

import {
  createRng,
  CREATURE_TEMPLATES,
  CLASSES,
  WEAPON_DAMAGE,
  applyResistance,
  getResistanceForDamageType,
  type ClassName,
  type CombatStats,
  type DamageType,
} from '@solo-mud/shared';
import { getLevelHitModifier, getLevelDamageModifier } from '../character';
import { calculateMaxHp } from '../character/player-factory';
import { calculateCombatStats } from '../character/stats';

export interface SimOptions {
  playerLevel: number;
  className: ClassName;
  /** Weapon baseId from WEAPON_DAMAGE (e.g. 'rusty_sword', 'iron_sword') */
  weaponBaseId: string;
  creatureTemplateId: string;
  creatureLevel: number;
  /** Flat defense from armor (starter leather ~6, mid-game ~12, late ~20) */
  bonusDefense?: number;
  /** Elemental resist from affix gear (e.g. venomproof pieces vs the Matriarch) */
  bonusResist?: number;
  /** Health potions carried (drunk below 35% HP, +50 HP, costs the attack) */
  potions?: number;
  /** Number of fights to simulate */
  runs?: number;
  seed?: string;
}

export interface SimResult {
  winRate: number;          // 0-1, player victories
  avgTicksToKill: number;   // combat ticks (5s each) in player victories
  avgPlayerHpLeft: number;  // fraction of max HP remaining after victories
}

/** Effective player stats at a level (base + per-level primary bonus) */
function simPlayerCombatStats(className: ClassName, level: number): CombatStats {
  const classDef = CLASSES[className];
  const stats = { ...classDef.baseStats };
  const primary = classDef.primaryStats[0] as keyof typeof stats;
  stats[primary] += Math.max(0, level - 1);
  return calculateCombatStats(stats);
}

/**
 * Simulate fights between a player and a creature; returns aggregate stats.
 */
export function simulateFight(options: SimOptions): SimResult {
  const {
    playerLevel, className, weaponBaseId,
    creatureTemplateId, creatureLevel,
    bonusDefense = 0,
    bonusResist = 0,
    potions = 0,
    runs = 200, seed = 'combat-sim',
  } = options;

  const template = CREATURE_TEMPLATES[creatureTemplateId];
  if (!template) throw new Error(`Unknown creature template: ${creatureTemplateId}`);

  const classDef = CLASSES[className];
  const combatStats = simPlayerCombatStats(className, playerLevel);
  combatStats.defense += bonusDefense;
  combatStats.fireResist += bonusResist;
  combatStats.iceResist += bonusResist;
  combatStats.lightningResist += bonusResist;
  combatStats.poisonResist += bonusResist;
  const weapon = WEAPON_DAMAGE[weaponBaseId] ?? WEAPON_DAMAGE['default']!;
  const playerMaxHp = calculateMaxHp(classDef, playerLevel);

  const creatureMaxHp = Math.floor(
    template.baseHp * (1 + (creatureLevel - template.baseLevel) * 0.2)
  );
  const creatureDamageType: DamageType = template.damageType ?? 'physical';
  const resistance = getResistanceForDamageType(combatStats, creatureDamageType);

  const levelHitMod = getLevelHitModifier(playerLevel, creatureLevel);
  const levelDmgMod = getLevelDamageModifier(playerLevel, creatureLevel);
  const baseHitChance = Math.min(0.99, 0.85 + combatStats.hitChance * 0.1) * levelHitMod;
  const dodge = Math.min(0.5, combatStats.dodgeChance);
  const creatureHitChance = 0.75 * (1 - dodge);

  let wins = 0;
  let totalTicks = 0;
  let totalHpLeft = 0;

  for (let run = 0; run < runs; run++) {
    const rng = createRng(`${seed}-${run}`);
    let playerHp = playerMaxHp;
    let creatureHp = creatureMaxHp;
    let potionsLeft = potions;
    let ticks = 0;

    // Safety cap: 200 ticks (~16 real minutes) = stalemate, counts as loss
    while (ticks < 200) {
      ticks++;

      // Drink a potion instead of attacking when hurt badly
      if (potionsLeft > 0 && playerHp < playerMaxHp * 0.35) {
        potionsLeft--;
        playerHp = Math.min(playerMaxHp, playerHp + 50);
      } else
      // Player swings (mirrors processPlayerCombat)
      if (rng.next() < baseHitChance) {
        const baseDamage = weapon.min + Math.floor(rng.next() * (weapon.max - weapon.min + 1));
        const attackBonus = Math.floor(combatStats.attackPower / 10);
        const isCrit = rng.next() < combatStats.critChance;
        const raw = (baseDamage + attackBonus) * (isCrit ? 2 : 1);
        creatureHp -= Math.max(1, Math.floor(raw * levelDmgMod));
      }
      if (creatureHp <= 0) {
        wins++;
        totalTicks += ticks;
        totalHpLeft += playerHp / playerMaxHp;
        break;
      }

      // Creature swings (mirrors the creature-attack block)
      if (template.behavior !== 'passive' && rng.next() < creatureHitChance) {
        const minDmg = Math.max(1, creatureLevel);
        const maxDmg = Math.max(2, Math.floor(creatureLevel * 1.6) + 2);
        const raw = minDmg + Math.floor(rng.next() * (maxDmg - minDmg + 1));
        playerHp -= applyResistance(raw, resistance);
      }
      if (playerHp <= 0) break;
    }
  }

  return {
    winRate: wins / runs,
    avgTicksToKill: wins > 0 ? totalTicks / wins : Infinity,
    avgPlayerHpLeft: wins > 0 ? totalHpLeft / wins : 0,
  };
}

/** Pretty one-line summary for reports */
export function describeSim(label: string, r: SimResult): string {
  return `${label}: win ${(r.winRate * 100).toFixed(0)}%, ` +
    `TTK ${r.avgTicksToKill === Infinity ? '—' : r.avgTicksToKill.toFixed(1)} ticks, ` +
    `HP left ${(r.avgPlayerHpLeft * 100).toFixed(0)}%`;
}
