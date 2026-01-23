/**
 * Enemy AI behavior system.
 */

import type { CombatStats, CombatEvent } from '@solo-mud/shared';
import type { CombatEntity } from './auto-attack';
import type { TickContext, TickHandlerResult } from './tick';
import { rollAttack, calculateDamage } from './auto-attack';

/** AI behavior types */
export type AIBehavior = 'passive' | 'aggressive' | 'defensive';

/** AI state machine states */
export type AIState = 'idle' | 'combat' | 'evading' | 'dead';

/** Enemy definition */
export interface Enemy extends CombatEntity {
  level: number;
  xpReward: number;
  behavior: AIBehavior;
  aggroRange: number;
  leashRange: number;
}

/** AI state for an enemy */
export interface EnemyAIState {
  enemy: Enemy;
  currentTarget: CombatEntity | null;
  aggroList: Map<string, number>; // entityId -> aggro amount
  attackCooldown: number;
  state: AIState;
  homePosition: string; // Room ID where enemy spawned
  currentPosition: string; // Current room ID
}

/** AI context providers */
export interface AIContext {
  /** Get all valid targets in range */
  getEntitiesInRange: () => CombatEntity[];
  /** Resolve a target by ID (returns null if dead/gone) */
  resolveTarget: (targetId: string | null) => CombatEntity | null;
}

/** Enemy AI controller interface */
export interface EnemyAI {
  /** Process one AI tick */
  tick: (context: TickContext) => TickHandlerResult;
  /** Handle damage taken from an attacker */
  onDamageTaken: (attackerId: string, damage: number) => void;
  /** Update target to highest aggro */
  updateTarget: () => void;
}

/** Aggro decay rate per second when evading */
const AGGRO_DECAY_RATE = 10;

/**
 * Create an enemy AI controller.
 */
export function createEnemyAI(state: EnemyAIState, context: AIContext): EnemyAI {
  const ai: EnemyAI = {
    tick(tickContext: TickContext): TickHandlerResult {
      const events: CombatEvent[] = [];

      // Check for death
      if (state.enemy.currentHp <= 0 && state.state !== 'dead') {
        state.state = 'dead';
        state.currentTarget = null;
        events.push({
          eventType: 'death',
          sourceId: state.enemy.id,
          sourceName: state.enemy.name,
        });
        return { events };
      }

      // Don't process if dead
      if (state.state === 'dead') {
        return { events };
      }

      // Reduce attack cooldown
      if (state.attackCooldown > 0) {
        state.attackCooldown = Math.max(0, state.attackCooldown - tickContext.deltaMs);
      }

      // State machine
      switch (state.state) {
        case 'idle':
          processIdleState(state, context);
          break;

        case 'combat':
          processCombatState(state, context, events, tickContext);
          break;

        case 'evading':
          processEvadingState(state, context, tickContext);
          break;
      }

      return { events };
    },

    onDamageTaken(attackerId: string, damage: number): void {
      // Add aggro
      const currentAggro = state.aggroList.get(attackerId) ?? 0;
      state.aggroList.set(attackerId, currentAggro + damage);

      // Enter combat if not already
      if (state.state === 'idle') {
        state.state = 'combat';
      }

      // Update target if needed
      this.updateTarget();
    },

    updateTarget(): void {
      let highestAggro = 0;
      let newTarget: CombatEntity | null = null;

      for (const [entityId, aggro] of state.aggroList) {
        if (aggro > highestAggro) {
          const entity = context.resolveTarget(entityId);
          if (entity && entity.currentHp > 0) {
            highestAggro = aggro;
            newTarget = entity;
          }
        }
      }

      state.currentTarget = newTarget;
    },
  };

  return ai;
}

/**
 * Process idle state - check for aggro targets.
 */
function processIdleState(state: EnemyAIState, context: AIContext): void {
  // Only aggressive enemies auto-aggro
  if (state.enemy.behavior !== 'aggressive') {
    return;
  }

  const entitiesInRange = context.getEntitiesInRange();
  if (entitiesInRange.length === 0) {
    return;
  }

  // Aggro the first valid target (usually the player)
  const target = entitiesInRange[0]!;
  state.aggroList.set(target.id, 1);
  state.currentTarget = target;
  state.state = 'combat';
}

/**
 * Process combat state - attack target.
 */
function processCombatState(
  state: EnemyAIState,
  context: AIContext,
  events: CombatEvent[],
  tickContext: TickContext
): void {
  // Check if we should evade (target gone or too far from home)
  const distanceFromHome = calculateDistance(state.homePosition, state.currentPosition);
  if (distanceFromHome > state.enemy.leashRange) {
    state.state = 'evading';
    state.currentTarget = null;
    return;
  }

  // Validate current target
  const target = context.resolveTarget(state.currentTarget?.id ?? null);
  if (!target || target.currentHp <= 0) {
    // Try to find new target
    state.currentTarget = null;

    // Update to next highest aggro target
    let foundTarget = false;
    for (const [entityId] of state.aggroList) {
      const entity = context.resolveTarget(entityId);
      if (entity && entity.currentHp > 0) {
        state.currentTarget = entity;
        foundTarget = true;
        break;
      }
    }

    if (!foundTarget) {
      state.state = 'evading';
      return;
    }
  } else {
    state.currentTarget = target;
  }

  // Check if we can attack
  if (state.attackCooldown > 0 || !state.currentTarget) {
    return;
  }

  // Perform attack
  const rollResult = rollAttack(state.enemy, state.currentTarget);
  state.attackCooldown = state.enemy.combatStats.attackSpeed;

  if (rollResult.type === 'miss') {
    events.push({
      eventType: 'miss',
      sourceId: state.enemy.id,
      sourceName: state.enemy.name,
      targetId: state.currentTarget.id,
      targetName: state.currentTarget.name,
    });
  } else if (rollResult.type === 'dodge') {
    events.push({
      eventType: 'dodge',
      sourceId: state.enemy.id,
      sourceName: state.enemy.name,
      targetId: state.currentTarget.id,
      targetName: state.currentTarget.name,
    });
  } else {
    const isCrit = rollResult.type === 'crit';
    const damage = calculateDamage(state.enemy, state.currentTarget, isCrit);

    events.push({
      eventType: isCrit ? 'crit' : 'attack',
      sourceId: state.enemy.id,
      sourceName: state.enemy.name,
      targetId: state.currentTarget.id,
      targetName: state.currentTarget.name,
      value: damage,
    });
  }
}

/**
 * Process evading state - return home and decay aggro.
 */
function processEvadingState(
  state: EnemyAIState,
  context: AIContext,
  tickContext: TickContext
): void {
  // Decay aggro
  const decayAmount = (AGGRO_DECAY_RATE * tickContext.deltaMs) / 1000;
  for (const [entityId, aggro] of state.aggroList) {
    const newAggro = aggro - decayAmount;
    if (newAggro <= 0) {
      state.aggroList.delete(entityId);
    } else {
      state.aggroList.set(entityId, newAggro);
    }
  }

  // Check if we're back home
  if (state.currentPosition === state.homePosition) {
    state.state = 'idle';
    state.aggroList.clear();
    state.currentTarget = null;
  }
}

/**
 * Calculate simple distance between room IDs.
 * In a real implementation, this would use the world graph.
 */
function calculateDistance(roomA: string, roomB: string): number {
  if (roomA === roomB) return 0;

  // Simple heuristic: extract numbers from room IDs and calculate difference
  const numA = parseInt(roomA.replace(/\D/g, ''), 10) || 0;
  const numB = parseInt(roomB.replace(/\D/g, ''), 10) || 0;
  return Math.abs(numA - numB);
}
