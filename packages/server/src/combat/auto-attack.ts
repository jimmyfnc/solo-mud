/**
 * Auto-attack mechanics for combat.
 */

import type { CombatStats, CombatEvent, DamageType } from '@solo-mud/shared';
import { applyResistance, getResistanceForDamageType } from '@solo-mud/shared';
import type { TickContext, TickHandlerResult } from './tick';

/** A combat entity (player or enemy) */
export interface CombatEntity {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  combatStats: CombatStats;
}

/** Auto-attack state for an entity */
export interface AutoAttackState {
  attacker: CombatEntity;
  target: CombatEntity | null;
  autoAttackEnabled: boolean;
  attackCooldown: number; // ms remaining until next attack
}

/** Result of an attack roll */
export interface AttackRollResult {
  type: 'hit' | 'miss' | 'dodge' | 'crit';
}

/** Target resolver function - returns current target or null if invalid */
export type TargetResolver = (targetId: string | null) => CombatEntity | null;

/**
 * Roll to determine attack outcome.
 */
export function rollAttack(attacker: CombatEntity, defender: CombatEntity): AttackRollResult {
  const { hitChance } = attacker.combatStats;
  const { dodgeChance } = defender.combatStats;
  const { critChance } = attacker.combatStats;

  // Roll for hit
  if (Math.random() > hitChance) {
    return { type: 'miss' };
  }

  // Roll for dodge
  if (Math.random() < dodgeChance) {
    return { type: 'dodge' };
  }

  // Roll for crit
  if (Math.random() < critChance) {
    return { type: 'crit' };
  }

  return { type: 'hit' };
}

/**
 * Calculate damage for an attack with a specific damage type.
 * Uses percentage-based resistance reduction (capped at 75%).
 */
export function calculateDamage(
  attacker: CombatEntity,
  defender: CombatEntity,
  isCrit: boolean,
  damageType: DamageType = 'physical'
): number {
  const { attackPower, critDamage } = attacker.combatStats;

  // Base damage with some variance (±20%)
  const variance = 0.8 + Math.random() * 0.4;
  let baseDamage = attackPower * variance;

  // Apply crit multiplier before resistance
  if (isCrit) {
    baseDamage *= critDamage;
  }

  // Get appropriate resistance and apply percentage-based reduction
  const resistance = getResistanceForDamageType(defender.combatStats, damageType);
  return applyResistance(Math.round(baseDamage), resistance);
}

/**
 * Create an auto-attack tick handler for an entity.
 */
export function createAutoAttackHandler(
  state: AutoAttackState,
  resolveTarget: TargetResolver
): (context: TickContext) => TickHandlerResult {
  return (context: TickContext): TickHandlerResult => {
    const events: CombatEvent[] = [];

    // Reduce cooldown by elapsed time
    if (state.attackCooldown > 0) {
      state.attackCooldown = Math.max(0, state.attackCooldown - context.deltaMs);
    }

    // Check if we can attack
    if (!state.autoAttackEnabled) {
      return { events };
    }

    // Resolve target (might be dead or gone)
    const target = resolveTarget(state.target?.id ?? null);
    if (!target || target.currentHp <= 0) {
      state.target = null;
      return { events };
    }

    // Update target reference
    state.target = target;

    // Check cooldown
    if (state.attackCooldown > 0) {
      return { events };
    }

    // Perform attack
    const rollResult = rollAttack(state.attacker, target);

    // Reset cooldown
    state.attackCooldown = state.attacker.combatStats.attackSpeed;

    // Generate event based on roll result
    if (rollResult.type === 'miss') {
      events.push({
        eventType: 'miss',
        sourceId: state.attacker.id,
        sourceName: state.attacker.name,
        targetId: target.id,
        targetName: target.name,
      });
    } else if (rollResult.type === 'dodge') {
      events.push({
        eventType: 'dodge',
        sourceId: state.attacker.id,
        sourceName: state.attacker.name,
        targetId: target.id,
        targetName: target.name,
      });
    } else {
      // Hit or crit
      const isCrit = rollResult.type === 'crit';
      const damage = calculateDamage(state.attacker, target, isCrit);

      events.push({
        eventType: isCrit ? 'crit' : 'attack',
        sourceId: state.attacker.id,
        sourceName: state.attacker.name,
        targetId: target.id,
        targetName: target.name,
        value: damage,
      });
    }

    return { events };
  };
}
