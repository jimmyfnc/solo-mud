/**
 * Item proc effects — on-hit / on-kill / passive effects carried by items
 * (boss uniques and, eventually, anything the editor exports with effects).
 */

import type { Creature, Item, OutputLine, Player, World } from '@solo-mud/shared';

/** All effects on the player's equipped items (weapon + offhand + armor) */
function equippedEffects(player: Player, world: World): { item: Item; effects: NonNullable<Item['effects']> }[] {
  const out: { item: Item; effects: NonNullable<Item['effects']> }[] = [];
  for (const itemId of Object.values(player.equipment)) {
    if (!itemId) continue;
    const item = world.items[itemId];
    if (item?.effects?.length) {
      out.push({ item, effects: item.effects });
    }
  }
  return out;
}

/**
 * Fire on-hit (and on-crit) weapon effects after a successful hit.
 * Returns extra damage dealt (already applied to the creature) and output.
 */
export function applyOnHitEffects(
  player: Player,
  world: World,
  creature: Creature,
  hitDamage: number,
  isCrit: boolean,
  roll: () => number
): { bonusDamage: number; output: OutputLine[] } {
  const output: OutputLine[] = [];
  let bonusDamage = 0;

  for (const { effects } of equippedEffects(player, world)) {
    for (const effect of effects) {
      const triggers = effect.trigger === 'on_hit' || (effect.trigger === 'on_crit' && isCrit);
      if (!triggers) continue;
      if (roll() > (effect.chance ?? 1)) continue;

      switch (effect.kind) {
        case 'bonus_damage': {
          const extra = Math.max(1, Math.floor(hitDamage * ((effect.amount ?? 50) / 100)));
          creature.currentHp -= extra;
          bonusDamage += extra;
          if (effect.text) output.push({ text: `${effect.text} (+${extra} damage)`, style: 'combat' });
          break;
        }
        case 'poison_burst': {
          const extra = effect.amount ?? 10;
          creature.currentHp -= extra;
          bonusDamage += extra;
          if (effect.text) output.push({ text: `${effect.text} (+${extra} poison damage)`, style: 'combat' });
          break;
        }
        case 'root_target': {
          if (!creature.trapped && creature.currentHp > 0) {
            const now = Date.now();
            const seconds = effect.duration ?? 4;
            creature.trapped = {
              expiresAt: now + seconds * 1000,
              trappedByPlayerId: player.id,
              dotDamage: 0,
              nextDotTick: Number.MAX_SAFE_INTEGER,
              nextBreakAttempt: now + seconds * 1000, // roots don't break early
              rangerLevel: player.level,
              kind: 'root',
            };
            if (effect.text) {
              output.push({ text: `${effect.text} The ${creature.name} is rooted in place!`, style: 'combat' });
            }
          }
          break;
        }
        default:
          break;
      }
    }
  }

  return { bonusDamage, output };
}

/**
 * Fire on-kill effects after the player lands a killing blow.
 */
export function applyOnKillEffects(
  player: Player,
  world: World,
  roll: () => number
): OutputLine[] {
  const output: OutputLine[] = [];

  for (const { effects } of equippedEffects(player, world)) {
    for (const effect of effects) {
      if (effect.trigger !== 'on_kill') continue;
      if (roll() > (effect.chance ?? 1)) continue;

      if (effect.kind === 'heal_self') {
        const heal = Math.max(1, Math.floor(player.maxHp * ((effect.amount ?? 10) / 100)));
        const before = player.currentHp;
        player.currentHp = Math.min(player.maxHp, player.currentHp + heal);
        const gained = player.currentHp - before;
        if (gained > 0 && effect.text) {
          output.push({ text: `${effect.text} (+${gained} HP)`, style: 'success' });
        }
      }
    }
  }

  return output;
}

/**
 * Total passive healing boost from equipped items, as a multiplier
 * (e.g. 1.25 for a +25% healing totem).
 */
export function getHealingBoost(player: Player, world: World): number {
  let boost = 0;
  for (const { effects } of equippedEffects(player, world)) {
    for (const effect of effects) {
      if (effect.trigger === 'passive' && effect.kind === 'healing_boost') {
        boost += effect.amount ?? 0;
      }
    }
  }
  return 1 + boost / 100;
}
