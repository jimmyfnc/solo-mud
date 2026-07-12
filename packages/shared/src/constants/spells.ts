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

export const REND: Spell = {
  id: 'rend',
  name: 'Rend',
  description: 'Tear into your enemy, causing them to bleed over time.',
  classes: ['warrior'],
  levelRequired: 8,
  manaCost: 20,
  cooldown: 12,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'physical',
  baseValue: 6, // 6 damage per tick
  spellPowerScaling: 0.15,
  duration: 15, // 15 seconds
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 40,
};

export const INTIMIDATING_ROAR: Spell = {
  id: 'intimidating_roar',
  name: 'Intimidating Roar',
  alias: 'iroar',
  description: 'Let out a terrifying roar, reducing enemy attack power.',
  classes: ['warrior'],
  levelRequired: 12,
  manaCost: 25,
  cooldown: 45,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'physical',
  baseValue: 15, // -15% attack power
  spellPowerScaling: 0,
  duration: 20,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 60,
};

export const CHARGE: Spell = {
  id: 'charge',
  name: 'Charge',
  description: 'Rush at your enemy with tremendous force, dealing damage and stunning them.',
  classes: ['warrior'],
  levelRequired: 16,
  manaCost: 15,
  cooldown: 20,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 30,
  spellPowerScaling: 0.4,
  duration: 2, // 2 second stun
  castTime: 0,
  outOfCombat: true, // Can be used to initiate
  requiresTarget: true,
  learnCost: 80,
};

export const SECOND_WIND: Spell = {
  id: 'second_wind',
  name: 'Second Wind',
  alias: 'sw',
  description: 'Catch your breath in battle, recovering health over time.',
  classes: ['warrior'],
  levelRequired: 20,
  manaCost: 30,
  cooldown: 120,
  target: 'self',
  effect: 'heal',
  damageType: 'physical',
  baseValue: 50,
  spellPowerScaling: 0.3,
  duration: 10, // Heal over 10 seconds
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 100,
};

export const EXECUTE: Spell = {
  id: 'execute',
  name: 'Execute',
  alias: 'exec',
  description: 'A devastating finishing blow that deals massive damage to wounded enemies.',
  classes: ['warrior'],
  levelRequired: 24,
  manaCost: 35,
  cooldown: 15,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 60, // High base, bonus vs low HP
  spellPowerScaling: 0.6,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 120,
};

export const BERSERKER_RAGE: Spell = {
  id: 'berserker_rage',
  name: 'Berserker Rage',
  alias: 'brage',
  description: 'Enter a berserker frenzy, greatly increasing attack speed and damage.',
  classes: ['warrior'],
  levelRequired: 28,
  manaCost: 40,
  cooldown: 180,
  target: 'self',
  effect: 'buff',
  baseValue: 25, // +25% damage
  spellPowerScaling: 0,
  duration: 20,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 150,
};

export const LAST_STAND: Spell = {
  id: 'last_stand',
  name: 'Last Stand',
  alias: 'ls',
  description: 'Make your final stand, temporarily increasing max health and becoming immune to death.',
  classes: ['warrior'],
  levelRequired: 30,
  manaCost: 50,
  cooldown: 300,
  target: 'self',
  effect: 'buff',
  baseValue: 30, // +30% max HP
  spellPowerScaling: 0,
  duration: 12,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 200,
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

export const KICK: Spell = {
  id: 'kick',
  name: 'Kick',
  description: 'A swift kick that interrupts spellcasting.',
  classes: ['rogue'],
  levelRequired: 8,
  manaCost: 15,
  cooldown: 15,
  target: 'enemy',
  effect: 'utility',
  damageType: 'physical',
  baseValue: 5, // Minor damage
  spellPowerScaling: 0.1,
  duration: 4, // 4 second interrupt
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 40,
};

export const CHEAP_SHOT: Spell = {
  id: 'cheap_shot',
  name: 'Cheap Shot',
  alias: 'cs',
  description: 'A dirty attack that stuns and damages your opponent.',
  classes: ['rogue'],
  levelRequired: 12,
  manaCost: 30,
  cooldown: 25,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 20,
  spellPowerScaling: 0.35,
  duration: 4, // 4 second stun
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 60,
};

export const VANISH: Spell = {
  id: 'vanish',
  name: 'Vanish',
  alias: 'van',
  description: 'Disappear into the shadows, dropping combat and becoming invisible briefly.',
  classes: ['rogue'],
  levelRequired: 16,
  manaCost: 35,
  cooldown: 180,
  target: 'self',
  effect: 'utility',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 10, // 10 seconds of stealth
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 80,
};

export const BLADE_FLURRY: Spell = {
  id: 'blade_flurry',
  name: 'Blade Flurry',
  alias: 'bf',
  description: 'Enter a whirlwind of blades, increasing attack speed dramatically.',
  classes: ['rogue'],
  levelRequired: 20,
  manaCost: 40,
  cooldown: 120,
  target: 'self',
  effect: 'buff',
  baseValue: 30, // +30% attack speed
  spellPowerScaling: 0,
  duration: 15,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 100,
};

export const EXPOSE_ARMOR: Spell = {
  id: 'expose_armor',
  name: 'Expose Armor',
  alias: 'ea',
  description: 'Find weaknesses in your enemy\'s armor, reducing their defense.',
  classes: ['rogue'],
  levelRequired: 24,
  manaCost: 25,
  cooldown: 30,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'physical',
  baseValue: 20, // -20% armor
  spellPowerScaling: 0,
  duration: 30,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 120,
};

export const SHADOW_STEP: Spell = {
  id: 'shadow_step',
  name: 'Shadow Step',
  alias: 'sstep',
  description: 'Step through the shadows to appear behind your target.',
  classes: ['rogue'],
  levelRequired: 28,
  manaCost: 30,
  cooldown: 30,
  target: 'enemy',
  effect: 'utility',
  damageType: 'shadow',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 150,
};

export const DEATHS_EMBRACE: Spell = {
  id: 'deaths_embrace',
  name: "Death's Embrace",
  alias: 'de',
  description: 'A devastating assassination technique that deals massive damage.',
  classes: ['rogue'],
  levelRequired: 30,
  manaCost: 50,
  cooldown: 60,
  target: 'enemy',
  effect: 'damage',
  damageType: 'shadow',
  baseValue: 80,
  spellPowerScaling: 0.7,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 200,
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

export const ICE_BARRIER: Spell = {
  id: 'ice_barrier',
  name: 'Ice Barrier',
  alias: 'ib',
  description: 'Surround yourself with a shield of ice that absorbs damage.',
  classes: ['mage'],
  levelRequired: 8,
  manaCost: 35,
  cooldown: 60,
  target: 'self',
  effect: 'buff',
  damageType: 'ice',
  baseValue: 50, // Absorbs 50 damage
  spellPowerScaling: 0.5,
  duration: 60,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 40,
};

export const BLIZZARD: Spell = {
  id: 'blizzard',
  name: 'Blizzard',
  alias: 'bliz',
  description: 'Call down a storm of ice, dealing damage over time to enemies.',
  classes: ['mage'],
  levelRequired: 12,
  manaCost: 45,
  cooldown: 20,
  target: 'area',
  effect: 'damage',
  damageType: 'ice',
  baseValue: 8, // 8 damage per tick
  spellPowerScaling: 0.25,
  duration: 12, // 12 seconds
  castTime: 2,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 60,
};

export const POLYMORPH: Spell = {
  id: 'polymorph',
  name: 'Polymorph',
  alias: 'poly',
  description: 'Transform your enemy into a harmless sheep. Any damage breaks the effect.',
  classes: ['mage'],
  levelRequired: 16,
  manaCost: 40,
  cooldown: 45,
  target: 'enemy',
  effect: 'debuff',
  damageType: 'lightning',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 20, // 20 seconds max
  castTime: 1.5,
  outOfCombat: true,
  requiresTarget: true,
  learnCost: 80,
};

export const BLINK: Spell = {
  id: 'blink',
  name: 'Blink',
  description: 'Teleport a short distance, breaking movement-impairing effects.',
  classes: ['mage'],
  levelRequired: 20,
  manaCost: 25,
  cooldown: 20,
  target: 'self',
  effect: 'utility',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 0,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 100,
};

export const PYROBLAST: Spell = {
  id: 'pyroblast',
  name: 'Pyroblast',
  alias: 'pyro',
  description: 'Channel a massive ball of fire for devastating damage.',
  classes: ['mage'],
  levelRequired: 24,
  manaCost: 60,
  cooldown: 30,
  target: 'enemy',
  effect: 'damage',
  damageType: 'fire',
  baseValue: 70,
  spellPowerScaling: 0.9,
  duration: 0,
  castTime: 3.5,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 120,
};

export const COUNTERSPELL: Spell = {
  id: 'counterspell',
  name: 'Counterspell',
  alias: 'counter',
  description: 'Interrupt an enemy spellcast and lock out that school of magic.',
  classes: ['mage'],
  levelRequired: 28,
  manaCost: 30,
  cooldown: 24,
  target: 'enemy',
  effect: 'utility',
  damageType: 'lightning',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 6, // 6 second lockout
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 150,
};

export const TIME_WARP: Spell = {
  id: 'time_warp',
  name: 'Time Warp',
  alias: 'tw',
  description: 'Bend time itself, greatly increasing casting speed for you and allies.',
  classes: ['mage'],
  levelRequired: 30,
  manaCost: 80,
  cooldown: 600, // 10 minute cooldown
  target: 'self',
  effect: 'buff',
  baseValue: 30, // +30% haste
  spellPowerScaling: 0,
  duration: 40,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 200,
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

export const PURIFY: Spell = {
  id: 'purify',
  name: 'Purify',
  description: 'Cleanse yourself of poisons and diseases.',
  classes: ['cleric'],
  levelRequired: 8,
  manaCost: 20,
  cooldown: 10,
  target: 'self',
  effect: 'utility',
  damageType: 'holy',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 0,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 40,
};

export const HOLY_SHIELD: Spell = {
  id: 'holy_shield',
  name: 'Holy Shield',
  alias: 'hshield',
  description: 'Summon a barrier of holy light that absorbs damage.',
  classes: ['cleric'],
  levelRequired: 12,
  manaCost: 40,
  cooldown: 45,
  target: 'self',
  effect: 'buff',
  damageType: 'holy',
  baseValue: 40, // Absorbs 40 damage
  spellPowerScaling: 0.6,
  duration: 30,
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 60,
};

export const CONSECRATE: Spell = {
  id: 'consecrate',
  name: 'Consecrate',
  alias: 'cons',
  description: 'Consecrate the ground beneath you, damaging enemies over time.',
  classes: ['cleric'],
  levelRequired: 16,
  manaCost: 50,
  cooldown: 20,
  target: 'area',
  effect: 'damage',
  damageType: 'holy',
  baseValue: 10, // 10 damage per tick
  spellPowerScaling: 0.3,
  duration: 10,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 80,
};

export const GREATER_HEAL: Spell = {
  id: 'greater_heal',
  name: 'Greater Heal',
  alias: 'gheal',
  description: 'Channel powerful divine energy to restore a massive amount of health.',
  classes: ['cleric'],
  levelRequired: 20,
  manaCost: 60,
  cooldown: 10,
  target: 'self',
  effect: 'heal',
  damageType: 'holy',
  baseValue: 80,
  spellPowerScaling: 1.0,
  duration: 0,
  castTime: 2.5,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 100,
};

export const RESURRECTION: Spell = {
  id: 'resurrection',
  name: 'Resurrection',
  alias: 'res',
  description: 'Return a fallen ally to life. Cannot be used in combat.',
  classes: ['cleric'],
  levelRequired: 24,
  manaCost: 100,
  cooldown: 300, // 5 minute cooldown
  target: 'ally',
  effect: 'utility',
  damageType: 'holy',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 0,
  castTime: 10, // Long cast time
  outOfCombat: true,
  requiresTarget: true,
  learnCost: 120,
};

export const DIVINE_WRATH: Spell = {
  id: 'divine_wrath',
  name: 'Divine Wrath',
  alias: 'dwrath',
  description: 'Call down the wrath of the gods, dealing massive holy damage.',
  classes: ['cleric'],
  levelRequired: 28,
  manaCost: 70,
  cooldown: 30,
  target: 'enemy',
  effect: 'damage',
  damageType: 'holy',
  baseValue: 65,
  spellPowerScaling: 0.8,
  duration: 0,
  castTime: 2,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 150,
};

export const GUARDIAN_ANGEL: Spell = {
  id: 'guardian_angel',
  name: 'Guardian Angel',
  alias: 'ga',
  description: 'Call upon a guardian angel to protect you, preventing death once.',
  classes: ['cleric'],
  levelRequired: 30,
  manaCost: 80,
  cooldown: 600, // 10 minute cooldown
  target: 'self',
  effect: 'buff',
  damageType: 'holy',
  baseValue: 50, // Restores 50% HP when triggered
  spellPowerScaling: 0,
  duration: 120, // 2 minute buff duration
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 200,
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

export const CONCUSSIVE_SHOT: Spell = {
  id: 'concussive_shot',
  name: 'Concussive Shot',
  alias: 'conc',
  description: 'Fire a powerful shot that dazes your target, slowing their movement.',
  classes: ['ranger'],
  levelRequired: 12,
  manaCost: 25,
  cooldown: 15,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 18,
  spellPowerScaling: 0.35,
  duration: 8, // 8 second slow
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 60,
};

export const FEIGN_DEATH: Spell = {
  id: 'feign_death',
  name: 'Feign Death',
  alias: 'fd',
  description: 'Play dead to drop all threat and exit combat. Movement breaks the effect.',
  classes: ['ranger'],
  levelRequired: 16,
  manaCost: 20,
  cooldown: 30,
  target: 'self',
  effect: 'utility',
  baseValue: 0,
  spellPowerScaling: 0,
  duration: 60, // Can stay feigned for 60 seconds
  castTime: 0,
  outOfCombat: false,
  requiresTarget: false,
  learnCost: 80,
};

export const AIMED_SHOT: Spell = {
  id: 'aimed_shot',
  name: 'Aimed Shot',
  alias: 'aim',
  description: 'A carefully aimed shot that deals heavy damage.',
  classes: ['ranger'],
  levelRequired: 20,
  manaCost: 35,
  cooldown: 12,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 50,
  spellPowerScaling: 0.6,
  duration: 0,
  castTime: 2.5,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 100,
};

export const EXPLOSIVE_TRAP: Spell = {
  id: 'explosive_trap',
  name: 'Explosive Trap',
  alias: 'etrap',
  description: 'Place an explosive trap that detonates when triggered, dealing area damage.',
  classes: ['ranger'],
  levelRequired: 24,
  manaCost: 40,
  cooldown: 45,
  target: 'self',
  effect: 'damage',
  damageType: 'fire',
  baseValue: 45,
  spellPowerScaling: 0.5,
  duration: 600, // Trap lasts 10 minutes
  castTime: 2,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 120,
};

export const ASPECT_OF_CHEETAH: Spell = {
  id: 'aspect_of_cheetah',
  name: 'Aspect of the Cheetah',
  alias: 'cheetah',
  description: 'Take on the aspect of a cheetah, greatly increasing movement speed.',
  classes: ['ranger'],
  levelRequired: 28,
  manaCost: 30,
  cooldown: 0, // Always active toggle
  target: 'self',
  effect: 'buff',
  damageType: 'nature',
  baseValue: 30, // +30% movement speed
  spellPowerScaling: 0,
  duration: 0, // Permanent until cancelled
  castTime: 0,
  outOfCombat: true,
  requiresTarget: false,
  learnCost: 150,
};

export const KILL_SHOT: Spell = {
  id: 'kill_shot',
  name: 'Kill Shot',
  alias: 'ks',
  description: 'A devastating finishing shot that can only be used on wounded enemies. Deals massive damage.',
  classes: ['ranger'],
  levelRequired: 30,
  manaCost: 45,
  cooldown: 15,
  target: 'enemy',
  effect: 'damage',
  damageType: 'physical',
  baseValue: 90, // High damage, execute-style
  spellPowerScaling: 0.8,
  duration: 0,
  castTime: 0,
  outOfCombat: false,
  requiresTarget: true,
  learnCost: 200,
};

// ============ Spell Registry ============

/** All spells indexed by ID */
export const SPELLS: Record<string, Spell> = {
  // Warrior (10 spells)
  battle_shout: BATTLE_SHOUT,
  heroic_strike: HEROIC_STRIKE,
  shield_bash: SHIELD_BASH,
  rend: REND,
  intimidating_roar: INTIMIDATING_ROAR,
  charge: CHARGE,
  second_wind: SECOND_WIND,
  execute: EXECUTE,
  berserker_rage: BERSERKER_RAGE,
  last_stand: LAST_STAND,
  // Rogue (10 spells)
  backstab: BACKSTAB,
  poison_blade: POISON_BLADE,
  evasion: EVASION,
  kick: KICK,
  cheap_shot: CHEAP_SHOT,
  vanish: VANISH,
  blade_flurry: BLADE_FLURRY,
  expose_armor: EXPOSE_ARMOR,
  shadow_step: SHADOW_STEP,
  deaths_embrace: DEATHS_EMBRACE,
  // Mage (12 spells)
  fire_bolt: FIRE_BOLT,
  frost_bolt: FROST_BOLT,
  arcane_missile: ARCANE_MISSILE,
  fireball: FIREBALL,
  ice_barrier: ICE_BARRIER,
  blizzard: BLIZZARD,
  polymorph: POLYMORPH,
  blink: BLINK,
  pyroblast: PYROBLAST,
  counterspell: COUNTERSPELL,
  time_warp: TIME_WARP,
  // Cleric (11 spells)
  light_heal: LIGHT_HEAL,
  smite: SMITE,
  blessing: BLESSING,
  heal: HEAL,
  purify: PURIFY,
  holy_shield: HOLY_SHIELD,
  consecrate: CONSECRATE,
  greater_heal: GREATER_HEAL,
  resurrection: RESURRECTION,
  divine_wrath: DIVINE_WRATH,
  guardian_angel: GUARDIAN_ANGEL,
  // Ranger (12 spells)
  hunters_mark: HUNTERS_MARK,
  serpent_sting: SERPENT_STING,
  rapid_shot: RAPID_SHOT,
  track: TRACK,
  set_trap: SET_TRAP,
  concussive_shot: CONCUSSIVE_SHOT,
  feign_death: FEIGN_DEATH,
  aimed_shot: AIMED_SHOT,
  explosive_trap: EXPLOSIVE_TRAP,
  aspect_of_cheetah: ASPECT_OF_CHEETAH,
  kill_shot: KILL_SHOT,
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
    spell.classes.some(spellClass => spellClass === className)
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
