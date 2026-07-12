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
  computePlayerCombatStats,
  getEffectiveStats,
  recalculatePlayerStats,
  getLevelHitModifier,
  getLevelDamageModifier,
} from './stats';
