/**
 * Combat module - combat engine and mechanics.
 */

export {
  CombatTicker,
  type TickContext,
  type TickResult,
  type TickHandler,
  type TickHandlerResult,
  type TickCompleteHandler,
  type CombatTickerOptions,
} from './tick';

export {
  createAutoAttackHandler,
  calculateDamage,
  rollAttack,
  type AutoAttackState,
  type CombatEntity,
  type AttackRollResult,
  type TargetResolver,
} from './auto-attack';
