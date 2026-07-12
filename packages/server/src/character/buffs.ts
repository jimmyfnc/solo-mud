/**
 * Combat buffs — makes statusEffects actually affect combat.
 *
 * Buff spells push a StatusEffect with a real expiry timestamp; this module
 * folds active buffs into combat stats, handles absorb shields, and prunes
 * expired effects each combat tick.
 */

import type { CombatStats, OutputLine, Player } from '@solo-mud/shared';
import { SPELLS } from '@solo-mud/shared';

type BuffMode = 'flat' | 'percent' | 'fraction';

/**
 * How each buff spell modifies combat stats. The value comes from the
 * spell's baseValue: flat adds it, percent multiplies the stat by
 * (1 + value/100), fraction adds value/100 (for 0–1 chance stats).
 *
 * Shields (ice_barrier, holy_shield) are handled via StatusEffect.magnitude
 * in absorbPlayerDamage, not here.
 */
const BUFF_MODS: Record<string, { stat: keyof CombatStats; mode: BuffMode }> = {
  battle_shout: { stat: 'attackPower', mode: 'flat' },       // +5 attack power
  blessing: { stat: 'defense', mode: 'flat' },               // +10 defense
  poison_blade: { stat: 'attackPower', mode: 'flat' },       // +5 (coated blades)
  evasion: { stat: 'dodgeChance', mode: 'fraction' },        // +30% dodge
  hunters_mark: { stat: 'attackPower', mode: 'percent' },    // +10% damage
  blade_flurry: { stat: 'attackPower', mode: 'percent' },    // +30% (speed proxy)
  berserker_rage: { stat: 'attackPower', mode: 'percent' },  // +25% damage
  time_warp: { stat: 'attackPower', mode: 'percent' },       // +30% (haste proxy)
  last_stand: { stat: 'defense', mode: 'percent' },          // +30% (survival proxy)
};

/** Is this effect still active? (Effects without expiresAt never time out here.) */
function isActive(effect: { expiresAt?: number }, now: number): boolean {
  return effect.expiresAt === undefined || now < effect.expiresAt;
}

/**
 * Fold the player's active buffs into a copy of their combat stats.
 */
export function applyBuffsToCombatStats(combat: CombatStats, player: Player): CombatStats {
  const now = Date.now();
  const result = { ...combat };

  for (const effect of player.statusEffects ?? []) {
    if (!isActive(effect, now)) continue;
    const mod = BUFF_MODS[effect.id];
    if (!mod) continue;

    const value = SPELLS[effect.id]?.baseValue ?? 0;
    if (mod.mode === 'flat') {
      (result[mod.stat] as number) += value;
    } else if (mod.mode === 'percent') {
      (result[mod.stat] as number) *= 1 + value / 100;
    } else {
      (result[mod.stat] as number) += value / 100;
    }
  }

  return result;
}

/**
 * Remove expired timed effects. Returns the names of what faded.
 */
export function pruneExpiredBuffs(player: Player): string[] {
  const now = Date.now();
  const faded: string[] = [];

  player.statusEffects = (player.statusEffects ?? []).filter((effect) => {
    if (effect.expiresAt !== undefined && now >= effect.expiresAt) {
      faded.push(effect.name);
      return false;
    }
    return true;
  });

  return faded;
}

/**
 * Route incoming damage through active absorb shields.
 * Returns the damage that actually lands plus any shield messages.
 */
export function absorbPlayerDamage(
  player: Player,
  incoming: number
): { taken: number; absorbed: number; messages: OutputLine[] } {
  const now = Date.now();
  let remaining = incoming;
  let absorbed = 0;
  const messages: OutputLine[] = [];

  for (const effect of player.statusEffects ?? []) {
    if (remaining <= 0) break;
    if (!effect.magnitude || effect.magnitude <= 0) continue;
    if (!isActive(effect, now)) continue;

    const used = Math.min(effect.magnitude, remaining);
    effect.magnitude -= used;
    remaining -= used;
    absorbed += used;

    if (effect.magnitude <= 0) {
      messages.push({ text: `Your ${effect.name} shatters!`, style: 'combat' });
    }
  }

  if (absorbed > 0) {
    messages.unshift({ text: `Your ward absorbs ${absorbed} damage.`, style: 'system' });
    // Drop spent shields
    player.statusEffects = player.statusEffects.filter(
      (e) => !(e.magnitude !== undefined && e.magnitude <= 0)
    );
  }

  return { taken: remaining, absorbed, messages };
}
