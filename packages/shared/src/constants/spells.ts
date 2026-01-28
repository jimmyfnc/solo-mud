/**
 * Spell definitions for all classes.
 * Each class has 3 spells to start, with more unlocking at higher levels.
 */

import type { Spell } from '../types/spells';

// ============ Warrior Spells (Combat abilities, low mana cost) ============

export const BATTLE_SHOUT: Spell = {
  id: 'battle_shout',
  name: 'Battle Shout',
  alias: 'bshout',
  description: 'Let out a mighty war cry, increasing your attack power.',
  classes: ['warrior'],
  levelRequired: 1,
  manaCost: 10,
  cooldown: 60,
  target: 'self',
  effect: 'buff',
  baseValue: 5, // +5 attack power
  spellPowerScaling: 0,
  duration: 120,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 0, // Starts with this
};

export const HEROIC_STRIKE: Spell = {
  id: 'heroic_strike',
  name: 'Heroic Strike',
  alias: 'hstrike',
  description: 'A powerful melee strike that deals bonus damage.',
  classes: ['warrior'],
  levelRequired: 2,
  manaCost: 15,
  cooldown: 6,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 15,
  spellPowerScaling: 0.3,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 10,
};

export const SHIELD_BASH: Spell = {
  id: 'shield_bash',
  name: 'Shield Bash',
  alias: 'sbash',
  description: 'Bash your enemy with your shield, dealing damage and stunning briefly.',
  classes: ['warrior'],
  levelRequired: 4,
  manaCost: 20,
  cooldown: 15,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 10,
  spellPowerScaling: 0.2,
  duration: 3, // 3 second stun
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 25,
};

// ============ Rogue Spells (Poison, stealth, precision) ============

export const BACKSTAB: Spell = {
  id: 'backstab',
  name: 'Backstab',
  alias: 'bs',
  description: 'A vicious attack from the shadows dealing heavy damage.',
  classes: ['rogue'],
  levelRequired: 1,
  manaCost: 20,
  cooldown: 8,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 25,
  spellPowerScaling: 0.4,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 0, // Starts with this
};

export const POISON_BLADE: Spell = {
  id: 'poison_blade',
  name: 'Poison Blade',
  alias: 'pb',
  description: 'Coat your weapon in poison, dealing damage over time.',
  classes: ['rogue'],
  levelRequired: 2,
  manaCost: 15,
  cooldown: 20,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'poison',
  baseValue: 5, // 5 damage per tick
  spellPowerScaling: 0.2,
  duration: 12, // 12 seconds
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 10,
};

export const EVASION: Spell = {
  id: 'evasion',
  name: 'Evasion',
  alias: 'ev',
  description: 'Heighten your reflexes, greatly increasing dodge chance.',
  classes: ['rogue'],
  levelRequired: 4,
  manaCost: 25,
  cooldown: 120,
  target: 'self',
  effect: 'buff',
  baseValue: 30, // +30% dodge
  spellPowerScaling: 0,
  duration: 15,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 25,
};

// ============ Mage Spells (Elemental damage, high mana cost) ============

export const FIRE_BOLT: Spell = {
  id: 'fire_bolt',
  name: 'Fire Bolt',
  alias: 'fb',
  description: 'Launch a small bolt of fire at your enemy.',
  classes: ['mage'],
  levelRequired: 1,
  manaCost: 10,
  cooldown: 3,
  target: 'enemy',
  effect: 'damage',
  damageType: 'fire',
  baseValue: 8,
  spellPowerScaling: 0.4,
  duration: 0,
  castTime: 1,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 0, // Starts with this
};

export const FIREBALL: Spell = {
  id: 'fireball',
  name: 'Fireball',
  alias: 'fball',
  description: 'Hurl a ball of fire at your enemy, dealing heavy fire damage.',
  classes: ['mage'],
  levelRequired: 4,
  manaCost: 25,
  cooldown: 6,
  target: 'enemy',
  effect: 'damage',
  damageType: 'fire',
  baseValue: 25,
  spellPowerScaling: 0.7,
  duration: 0,
  castTime: 2,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 25,
};

export const FROST_BOLT: Spell = {
  id: 'frost_bolt',
  name: 'Frost Bolt',
  alias: 'frostb',
  description: 'Launch a bolt of ice, dealing damage and slowing the target.',
  classes: ['mage'],
  levelRequired: 2,
  manaCost: 20,
  cooldown: 6,
  target: 'enemy',
  effect: 'damage',
  damageType: 'ice',
  baseValue: 15,
  spellPowerScaling: 0.5,
  duration: 8, // 8 second slow
  castTime: 1.5,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 10,
};

export const ARCANE_MISSILE: Spell = {
  id: 'arcane_missile',
  name: 'Arcane Missile',
  alias: 'am',
  description: 'Fire a quick burst of arcane energy. Instant cast.',
  classes: ['mage'],
  levelRequired: 3,
  manaCost: 15,
  cooldown: 0,
  target: 'enemy',
  effect: 'damage',
  damageType: 'lightning',
  baseValue: 8,
  spellPowerScaling: 0.3,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 15,
};

// ============ Cleric Spells (Healing, holy damage, buffs) ============

export const LIGHT_HEAL: Spell = {
  id: 'light_heal',
  name: 'Light Heal',
  alias: 'lheal',
  description: 'Channel a small amount of divine light to restore health.',
  classes: ['cleric'],
  levelRequired: 1,
  manaCost: 10,
  cooldown: 3,
  target: 'self',
  effect: 'heal',
  damageType: 'holy',
  baseValue: 12,
  spellPowerScaling: 0.4,
  duration: 0,
  castTime: 1,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 0, // Starts with this
};

export const HEAL: Spell = {
  id: 'heal',
  name: 'Heal',
  description: 'Channel divine light to restore a significant amount of health.',
  classes: ['cleric'],
  levelRequired: 4,
  manaCost: 25,
  cooldown: 6,
  target: 'self',
  effect: 'heal',
  damageType: 'holy',
  baseValue: 30,
  spellPowerScaling: 0.8,
  duration: 0,
  castTime: 2,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 25,
};

export const SMITE: Spell = {
  id: 'smite',
  name: 'Smite',
  alias: 'sm',
  description: 'Call down holy wrath upon your enemy.',
  classes: ['cleric'],
  levelRequired: 2,
  manaCost: 25,
  cooldown: 6,
  target: 'enemy',
  effect: 'damage',
  damageType: 'holy',
  baseValue: 18,
  spellPowerScaling: 0.5,
  duration: 0,
  castTime: 1.5,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 10,
};

export const BLESSING: Spell = {
  id: 'blessing',
  name: 'Blessing',
  alias: 'bless',
  description: 'Bestow a holy blessing, increasing defense.',
  classes: ['cleric'],
  levelRequired: 3,
  manaCost: 30,
  cooldown: 60,
  target: 'self',
  effect: 'buff',
  damageType: 'holy',
  baseValue: 10, // +10 defense
  spellPowerScaling: 0,
  duration: 120,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 15,
};

// ============ Ranger Spells (Nature, marks, pet abilities) ============

export const HUNTERS_MARK: Spell = {
  id: 'hunters_mark',
  name: "Hunter's Mark",
  alias: 'hm',
  description: 'Mark your prey, increasing damage dealt to them.',
  classes: ['ranger'],
  levelRequired: 1,
  manaCost: 15,
  cooldown: 0,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'nature',
  baseValue: 10, // +10% damage taken
  spellPowerScaling: 0,
  duration: 60,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: true,
  learnCost: 0, // Starts with this
};

export const SERPENT_STING: Spell = {
  id: 'serpent_sting',
  name: 'Serpent Sting',
  alias: 'ss',
  description: 'Sting your target with nature venom, dealing damage over time.',
  classes: ['ranger'],
  levelRequired: 2,
  manaCost: 20,
  cooldown: 10,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'nature',
  baseValue: 4, // 4 damage per tick
  spellPowerScaling: 0.2,
  duration: 15,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 10,
};

export const RAPID_SHOT: Spell = {
  id: 'rapid_shot',
  name: 'Rapid Shot',
  alias: 'rs',
  description: 'Fire a quick volley of arrows at your target.',
  classes: ['ranger'],
  levelRequired: 3,
  manaCost: 25,
  cooldown: 10,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 20,
  spellPowerScaling: 0.4,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 15,
};

export const TRACK: Spell = {
  id: 'track',
  name: 'Track',
  description: 'Read the signs of the wild to detect creatures in nearby areas.',
  classes: ['ranger'],
  levelRequired: 5,
  manaCost: 15,
  cooldown: 30,
  target: 'self',
  effect: 'utility',
  damageType: 'nature',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 0,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 25,
};

export const SET_TRAP: Spell = {
  id: 'set_trap',
  name: 'Set Trap',
  alias: 'trap',
  description: 'Place a hidden trap in your current location. When triggered, it deals damage and roots the creature, preventing escape. Effectiveness depends on creature size and level.',
  classes: ['ranger'],
  levelRequired: 10,
  manaCost: 30,
  cooldown: 60, // 1 minute cooldown
  target: 'self',
  effect: 'utility', // Special handling for trap placement
  damageType: 'physical',
  baseValue: 25, // initial damage
  spellPowerScaling: 0.3,
  duration: 600, // trap lasts 10 minutes if not triggered
  castTime: 3, // takes time to set up
  outOfCombat: true, // can only place when not in combat
  requiresTarget: false,
  learnCost: 50,
};

// ============ Spell Registry ============

/** All spells indexed by ID */
export const SPELLS: Record<string, Spell> = {
  // Warrior
  battle_shout: BATTLE_SHOUT,
  heroic_strike: HEROIC_STRIKE,
  shield_bash: SHIELD_BASH,
  // Rogue
  backstab: BACKSTAB,
  poison_blade: POISON_BLADE,
  evasion: EVASION,
  // Mage
  fire_bolt: FIRE_BOLT,
  fireball: FIREBALL,
  frost_bolt: FROST_BOLT,
  arcane_missile: ARCANE_MISSILE,
  // Cleric
  light_heal: LIGHT_HEAL,
  heal: HEAL,
  smite: SMITE,
  blessing: BLESSING,
  // Ranger
  hunters_mark: HUNTERS_MARK,
  serpent_sting: SERPENT_STING,
  rapid_shot: RAPID_SHOT,
  track: TRACK,
  set_trap: SET_TRAP,
};

/** Get starter spell ID for a class (the free spell they begin with) */
export function getStarterSpellId(className: string): string | undefined {
  switch (className) {
    case 'warrior': return 'battle_shout';
    case 'rogue': return 'backstab';
    case 'mage': return 'fire_bolt';
    case 'cleric': return 'light_heal';
    case 'ranger': return 'hunters_mark';
    default: return undefined;
  }
}

/** Get all spells available to a class */
export function getClassSpells(className: string): Spell[] {
  return Object.values(SPELLS).filter(spell =>
    spell.classes.includes(className as any)
  );
}

/** Get spells a player can learn at their current level */
export function getLearnableSpells(className: string, level: number, knownSpellIds: string[]): Spell[] {
  return getClassSpells(className).filter(spell =>
    spell.levelRequired <= level &&
    !knownSpellIds.includes(spell.id)
    // Note: We include starter spells (learnCost: 0) in case they weren't granted at creation
  );
}

/** Get spells that unlock at higher levels (not yet available) */
export function getFutureSpells(className: string, level: number, knownSpellIds: string[]): Spell[] {
  return getClassSpells(className)
    .filter(spell =>
      spell.levelRequired > level &&
      !knownSpellIds.includes(spell.id)
    )
    .sort((a, b) => a.levelRequired - b.levelRequired);
}
