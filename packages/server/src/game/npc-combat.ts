/**
 * NPC Combat AI System
 * Handles intelligent spell selection and combat decisions for NPCs.
 */

import type { NPC, NpcCombatStats, Spell, Creature, Rng } from '@solo-mud/shared';
import { SPELLS } from '@solo-mud/shared';

/** Result of an NPC combat action */
export interface NpcCombatAction {
  type: 'spell' | 'attack' | 'none';
  spellId?: string;
  damage?: number;
  healing?: number;
  targetId?: string;
  message: string;
}

/** Combat context for AI decisions */
export interface CombatContext {
  npc: NPC;
  combat: NpcCombatStats;
  target: Creature | null;
  allies: NPC[];
  rng: Rng;
}

/**
 * Check if a spell is off cooldown and NPC has enough MP
 */
function canCastSpell(combat: NpcCombatStats, spellId: string): boolean {
  const spell = SPELLS[spellId];
  if (!spell) return false;
  if (!combat.knownSpells.includes(spellId)) return false;
  if (combat.currentMp < spell.manaCost) return false;

  const cooldownRemaining = combat.abilityCooldowns[spellId] ?? 0;
  return cooldownRemaining <= 0;
}

/**
 * Get all castable spells of a specific effect type
 */
function getCastableSpells(
  combat: NpcCombatStats,
  effectTypes: string[]
): Spell[] {
  return combat.knownSpells
    .map(id => SPELLS[id])
    .filter((spell): spell is Spell =>
      spell !== undefined &&
      effectTypes.includes(spell.effect) &&
      canCastSpell(combat, spell.id)
    );
}

/**
 * Find the best healing spell for current HP deficit
 */
function selectHealingSpell(combat: NpcCombatStats): string | null {
  const healSpells = getCastableSpells(combat, ['heal']);
  if (healSpells.length === 0) return null;

  const hpDeficit = combat.maxHp - combat.currentHp;

  // Sort by efficiency (healing vs mana cost) and pick best match
  return healSpells
    .sort((a, b) => {
      // Prefer spells that won't overheal
      const aOverheal = Math.max(0, a.baseValue - hpDeficit);
      const bOverheal = Math.max(0, b.baseValue - hpDeficit);
      if (aOverheal !== bOverheal) return aOverheal - bOverheal;
      // Otherwise prefer higher healing
      return b.baseValue - a.baseValue;
    })[0]?.id ?? null;
}

/**
 * Find the best damage spell
 */
function selectDamageSpell(combat: NpcCombatStats, targetHpPercent: number): string | null {
  const damageSpells = getCastableSpells(combat, ['damage']);
  if (damageSpells.length === 0) return null;

  // Priority: execute spells when target is low, otherwise highest damage
  return damageSpells
    .sort((a, b) => {
      // Execute-type spells (high damage, low cooldown) preferred when target is low
      if (targetHpPercent < 0.3) {
        const aIsExecute = a.id.includes('execute') || a.id.includes('kill_shot');
        const bIsExecute = b.id.includes('execute') || b.id.includes('kill_shot');
        if (aIsExecute && !bIsExecute) return -1;
        if (bIsExecute && !aIsExecute) return 1;
      }
      // Prefer instant cast for reactive combat
      if (a.castTime === 0 && b.castTime > 0) return -1;
      if (b.castTime === 0 && a.castTime > 0) return 1;
      // Otherwise highest damage
      return b.baseValue - a.baseValue;
    })[0]?.id ?? null;
}

/**
 * Find a debuff spell to apply
 */
function selectDebuffSpell(combat: NpcCombatStats): string | null {
  const debuffSpells = getCastableSpells(combat, ['debuff']);
  if (debuffSpells.length === 0) return null;

  // Prefer debuffs with longer duration or higher value
  return debuffSpells
    .sort((a, b) => (b.duration * b.baseValue) - (a.duration * a.baseValue))[0]?.id ?? null;
}

/**
 * Find a buff spell to apply
 */
function selectBuffSpell(combat: NpcCombatStats): string | null {
  const buffSpells = getCastableSpells(combat, ['buff']);
  if (buffSpells.length === 0) return null;

  // Check if we already have the buff active
  const activeBuffIds = combat.activeBuffs.map(b => b.id);
  const availableBuffs = buffSpells.filter(s => !activeBuffIds.includes(s.id));

  if (availableBuffs.length === 0) return null;

  // Prefer defensive buffs (shields) when low HP
  const hpPercent = combat.currentHp / combat.maxHp;
  if (hpPercent < 0.5) {
    const defensiveBuff = availableBuffs.find(s =>
      s.id.includes('shield') || s.id.includes('barrier') || s.id.includes('stand')
    );
    if (defensiveBuff) return defensiveBuff.id;
  }

  // Otherwise pick highest value buff
  return availableBuffs.sort((a, b) => b.baseValue - a.baseValue)[0]?.id ?? null;
}

/**
 * Find an interrupt spell (for future use when creatures can cast)
 */
function _selectInterruptSpell(combat: NpcCombatStats): string | null {
  const utilitySpells = getCastableSpells(combat, ['utility']);
  const interruptSpell = utilitySpells.find(s =>
    s.id === 'kick' || s.id === 'counterspell' || s.id === 'shield_bash'
  );
  return interruptSpell?.id ?? null;
}

// Export for future use
export { _selectInterruptSpell as selectInterruptSpell };

/**
 * Find an emergency escape/survival spell
 */
function selectEmergencySpell(combat: NpcCombatStats): string | null {
  // Class-specific emergency abilities
  const emergencySpells = [
    'second_wind',     // Warrior heal
    'last_stand',      // Warrior survival
    'vanish',          // Rogue escape
    'evasion',         // Rogue defensive
    'ice_barrier',     // Mage shield
    'blink',           // Mage escape
    'greater_heal',    // Cleric heal
    'guardian_angel',  // Cleric survival
    'holy_shield',     // Cleric shield
    'feign_death',     // Ranger escape
  ];

  for (const spellId of emergencySpells) {
    if (canCastSpell(combat, spellId)) {
      return spellId;
    }
  }
  return null;
}

/**
 * Find wounded ally that needs healing (for support/defensive AI)
 */
function findWoundedAlly(allies: NPC[]): NPC | null {
  const wounded = allies
    .filter(ally => ally.combat && ally.combat.currentHp < ally.combat.maxHp * 0.5)
    .sort((a, b) => {
      const aPercent = (a.combat?.currentHp ?? 0) / (a.combat?.maxHp ?? 1);
      const bPercent = (b.combat?.currentHp ?? 0) / (b.combat?.maxHp ?? 1);
      return aPercent - bPercent; // Most wounded first
    });
  return wounded[0] ?? null;
}

/**
 * Main AI decision function - selects the best action for an NPC
 *
 * Decision Tree:
 * 1. HP < 30%? → Use emergency ability (heal, vanish, etc.)
 * 2. Ally HP < 50%? → Heal ally (defensive/support AI)
 * 3. No active buff? → Apply self-buff
 * 4. Target missing debuff? → Apply debuff
 * 5. Default → Damage rotation
 */
export function selectNpcAction(ctx: CombatContext): NpcCombatAction {
  const { npc, combat, target, allies, rng } = ctx;

  if (!target) {
    return { type: 'none', message: `${npc.name} has no target.` };
  }

  const hpPercent = combat.currentHp / combat.maxHp;
  const targetHpPercent = target.currentHp / target.maxHp;

  // 1. EMERGENCY: HP < 30% - use survival ability
  if (hpPercent < 0.3) {
    const emergencySpell = selectEmergencySpell(combat);
    if (emergencySpell) {
      return createSpellAction(npc, combat, emergencySpell, target, rng);
    }
  }

  // 2. SUPPORT: Heal wounded allies (defensive/support AI only)
  if (combat.aiPriority === 'defensive' || combat.aiPriority === 'support') {
    const woundedAlly = findWoundedAlly(allies);
    if (woundedAlly && combat.class === 'cleric') {
      const healSpell = selectHealingSpell(combat);
      if (healSpell) {
        // Note: For now, clerics self-heal since we don't have ally targeting
        // This would be expanded for true ally healing
        return createSpellAction(npc, combat, healSpell, target, rng);
      }
    }
  }

  // 3. BUFF: Apply self-buff if none active
  if (combat.activeBuffs.length === 0 || rng.next() < 0.3) {
    const buffSpell = selectBuffSpell(combat);
    if (buffSpell) {
      return createSpellAction(npc, combat, buffSpell, target, rng);
    }
  }

  // 4. DEBUFF: Apply debuff to target (20% chance to prioritize)
  if (rng.next() < 0.2) {
    const debuffSpell = selectDebuffSpell(combat);
    if (debuffSpell) {
      return createSpellAction(npc, combat, debuffSpell, target, rng);
    }
  }

  // 5. DAMAGE: Use damage rotation
  const damageSpell = selectDamageSpell(combat, targetHpPercent);
  if (damageSpell) {
    return createSpellAction(npc, combat, damageSpell, target, rng);
  }

  // Fallback: Basic attack
  return createBasicAttack(npc, combat, target, rng);
}

/**
 * Create a spell action result
 */
function createSpellAction(
  npc: NPC,
  combat: NpcCombatStats,
  spellId: string,
  target: Creature,
  rng: Rng
): NpcCombatAction {
  const spell = SPELLS[spellId];
  if (!spell) {
    return createBasicAttack(npc, combat, target, rng);
  }

  let damage = 0;
  let healing = 0;
  let message = '';

  // Calculate damage variance (80% - 120%)
  const variance = 0.8 + rng.next() * 0.4;

  switch (spell.effect) {
    case 'damage':
      damage = Math.floor(spell.baseValue * variance * (1 + combat.level * 0.05));
      message = `${npc.title ?? ''} ${npc.name} casts ${spell.name} on ${target.name} for ${damage} damage!`.trim();
      break;

    case 'heal':
      healing = Math.floor(spell.baseValue * variance * (1 + combat.level * 0.05));
      message = `${npc.title ?? ''} ${npc.name} casts ${spell.name}, healing for ${healing}!`.trim();
      break;

    case 'buff':
      message = `${npc.title ?? ''} ${npc.name} casts ${spell.name}!`.trim();
      break;

    case 'debuff':
      message = `${npc.title ?? ''} ${npc.name} casts ${spell.name} on ${target.name}!`.trim();
      break;

    case 'utility':
      message = `${npc.title ?? ''} ${npc.name} uses ${spell.name}!`.trim();
      break;
  }

  return {
    type: 'spell',
    spellId,
    damage,
    healing,
    targetId: target.id,
    message,
  };
}

/**
 * Create a basic attack action
 */
function createBasicAttack(
  npc: NPC,
  combat: NpcCombatStats,
  target: Creature,
  rng: Rng
): NpcCombatAction {
  const variance = 0.8 + rng.next() * 0.4;
  const damage = Math.floor(combat.damage * variance);

  return {
    type: 'attack',
    damage,
    targetId: target.id,
    message: `${npc.title ?? ''} ${npc.name} strikes ${target.name} for ${damage} damage!`.trim(),
  };
}

/**
 * Apply the result of an NPC combat action
 * Returns updated combat stats and any effects to apply
 */
export function applyNpcAction(
  combat: NpcCombatStats,
  action: NpcCombatAction,
  currentTime: number
): NpcCombatStats {
  const updatedCombat = { ...combat };

  if (action.type === 'spell' && action.spellId) {
    const spell = SPELLS[action.spellId];
    if (spell) {
      // Deduct mana
      updatedCombat.currentMp = Math.max(0, updatedCombat.currentMp - spell.manaCost);

      // Set cooldown (in seconds, converted to game ticks)
      updatedCombat.abilityCooldowns = {
        ...updatedCombat.abilityCooldowns,
        [action.spellId]: spell.cooldown,
      };

      // Apply self-healing
      if (action.healing && action.healing > 0) {
        updatedCombat.currentHp = Math.min(
          updatedCombat.maxHp,
          updatedCombat.currentHp + action.healing
        );
      }

      // Add buff to active buffs
      if (spell.effect === 'buff') {
        const existingBuffIndex = updatedCombat.activeBuffs.findIndex(b => b.id === spell.id);
        if (existingBuffIndex === -1) {
          updatedCombat.activeBuffs = [
            ...updatedCombat.activeBuffs,
            {
              id: spell.id,
              name: spell.name,
              duration: spell.duration,
              stacks: 1,
              appliedAt: currentTime,
            },
          ];
        }
      }
    }
  }

  return updatedCombat;
}

/**
 * Tick down cooldowns for an NPC (called each game tick)
 */
export function tickNpcCooldowns(combat: NpcCombatStats, tickSeconds: number): NpcCombatStats {
  const updatedCooldowns: Record<string, number> = {};

  for (const [spellId, remaining] of Object.entries(combat.abilityCooldowns)) {
    const newRemaining = remaining - tickSeconds;
    if (newRemaining > 0) {
      updatedCooldowns[spellId] = newRemaining;
    }
  }

  // Also tick down buff durations
  const updatedBuffs = combat.activeBuffs
    .map(buff => ({
      ...buff,
      duration: buff.duration - tickSeconds,
    }))
    .filter(buff => buff.duration > 0);

  return {
    ...combat,
    abilityCooldowns: updatedCooldowns,
    activeBuffs: updatedBuffs,
  };
}

/**
 * Regenerate NPC mana over time
 */
export function regenNpcMana(combat: NpcCombatStats, tickSeconds: number): NpcCombatStats {
  // Base regen: 2% max mana per 10 seconds
  const regenRate = 0.002 * tickSeconds;
  const regenAmount = Math.floor(combat.maxMp * regenRate);

  return {
    ...combat,
    currentMp: Math.min(combat.maxMp, combat.currentMp + regenAmount),
  };
}
