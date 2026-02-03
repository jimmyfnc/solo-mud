/**
 * Character module - player creation and management.
 */

export {
  createPlayer,
  calculateMaxHp,
  calculateMaxMp,
  calculateMaxCarryWeight,
  type CreatePlayerOptions,
} from './player-factory';

export {
  calculateCombatStats,
  getEffectiveStats,
  recalculatePlayerStats,
  getLevelHitModifier,
  getLevelDamageModifier,
} from './stats';
