/**
 * Spell and ability system types.
 */

import type { ClassName } from './character';

/** Target type for spells */
export type SpellTarget = 'self' | 'enemy' | 'ally' | 'area';

/** Effect type for spells */
export type SpellEffect = 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';

/** Damage type for spells */
export type DamageType = 'physical' | 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'nature' | 'poison';

/** Spell definition */
export interface Spell {
  id: string;
  name: string;
  /** Short alias for quick casting (e.g., "lheal" for Light Heal) */
  alias?: string;
  description: string;
  /** Classes that can learn this spell */
  classes: ClassName[];
  /** Minimum level required to learn */
  levelRequired: number;
  /** Mana cost to cast */
  manaCost: number;
  /** Cooldown in seconds */
  cooldown: number;
  /** Target type */
  target: SpellTarget;
  /** Primary effect type */
  effect: SpellEffect;
  /** Damage type (for damage spells) */
  damageType?: DamageType;
  /** Base effect value (damage/heal amount before modifiers) */
  baseValue: number;
  /** Scaling factor for spell power (0-1, where 0.5 = 50% of spell power added) */
  spellPowerScaling: number;
  /** Duration in seconds (for buffs/debuffs, 0 = instant) */
  duration: number;
  /** Cast time in seconds (0 = instant) */
  castTime: number;
  /** Whether this spell can be used outside of combat */
  outOfCombat: boolean;
  /** Whether this spell requires a target */
  requiresTarget: boolean;
  /** Gold cost to learn from trainer */
  learnCost: number;
}

/** Player's known spells */
export interface PlayerSpells {
  /** IDs of spells the player has learned */
  known: string[];
  /** Quick slot bindings (spell ID or null) */
  slots: (string | null)[];
}

/** Spell cast result */
export interface SpellCastResult {
  success: boolean;
  message: string;
  damage?: number;
  healing?: number;
  manaCost?: number;
  cooldownTriggered?: number;
}
