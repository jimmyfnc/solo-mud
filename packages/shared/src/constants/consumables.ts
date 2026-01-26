/**
 * Consumable item effects.
 * Defines what happens when items are used.
 */

/** Effect type for consumables */
export type ConsumableEffectType =
  | 'heal_hp'      // Restore HP
  | 'heal_mp'      // Restore MP
  | 'heal_both'    // Restore both
  | 'apply_status' // Apply a status effect
  | 'remove_status' // Remove a status effect
  | 'special';     // Special effect (handled by code)

/** Definition of a consumable's effect */
export interface ConsumableEffect {
  type: ConsumableEffectType;
  /** Amount to heal (for heal effects) */
  amount?: number;
  /** Percentage of max to heal (alternative to flat amount) */
  percentMax?: number;
  /** Status effect ID to apply/remove */
  statusId?: string;
  /** Number of stacks to add */
  stacks?: number;
  /** Duration in game ticks */
  duration?: number;
  /** Flavor text when consumed */
  flavorText: string;
}

/** Drunk status effect levels */
export const DRUNK_LEVELS = [
  { stacks: 1, name: 'Tipsy', text: 'You feel a pleasant warmth spreading through you.' },
  { stacks: 2, name: 'Buzzed', text: 'The world seems a bit more colorful now.' },
  { stacks: 3, name: 'Drunk', text: 'You stumble slightly. Everything is hilarious!' },
  { stacks: 4, name: 'Hammered', text: 'Whoa there! The room is spinning a bit...' },
  { stacks: 5, name: 'Wasted', text: 'You can barely stand. This was a terrible idea.' },
] as const;

/** Get drunk level info for a given stack count */
export function getDrunkLevel(stacks: number): typeof DRUNK_LEVELS[number] | undefined {
  if (stacks <= 0) return undefined;
  const index = Math.min(stacks, DRUNK_LEVELS.length) - 1;
  return DRUNK_LEVELS[index];
}

/** Consumable effects by item baseId */
export const CONSUMABLE_EFFECTS: Record<string, ConsumableEffect> = {
  // === Food (heals HP) ===
  bread: {
    type: 'heal_hp',
    amount: 10,
    flavorText: 'You tear off a piece of warm bread and eat it. Simple but satisfying.',
  },
  cheese_wedge: {
    type: 'heal_hp',
    amount: 15,
    flavorText: 'The sharp cheese is surprisingly good. You feel a bit better.',
  },
  rations: {
    type: 'heal_hp',
    amount: 20,
    flavorText: 'You munch on some dried meat and hardtack. Not gourmet, but filling.',
  },

  // === Drinks (restores MP) ===
  waterskin: {
    type: 'heal_mp',
    amount: 15,
    flavorText: 'Cool, refreshing water. You feel your mind clear.',
  },
  wine: {
    type: 'heal_both',
    amount: 10,
    flavorText: 'A decent vintage. The warmth spreads pleasantly through you.',
  },

  // === Alcohol (drunk status + minor MP restore) ===
  ale: {
    type: 'apply_status',
    statusId: 'drunk',
    stacks: 1,
    duration: 300, // 5 minutes game time
    flavorText: 'You down the frothy ale in a few gulps.',
  },

  // === Potions ===
  health_potion: {
    type: 'heal_hp',
    amount: 50,
    flavorText: 'The red liquid tastes bitter but works instantly.',
  },
  mana_potion: {
    type: 'heal_mp',
    amount: 50,
    flavorText: 'Blue energy courses through you as you drink.',
  },
  antidote: {
    type: 'remove_status',
    statusId: 'poisoned',
    flavorText: 'The antidote tastes foul but you feel the poison leaving your system.',
  },
  stamina_tonic: {
    type: 'heal_both',
    amount: 25,
    flavorText: 'Energy surges through your body!',
  },

  // === Special Items ===
  torch: {
    type: 'special',
    flavorText: 'You light the torch. It casts a warm, flickering glow.',
  },
  travelers_map: {
    type: 'special',
    flavorText: 'You unfold the weathered map and study the surrounding area.',
  },
};

/** Flavor text for being drunk at different levels */
export const DRUNK_FLAVOR_ACTIONS = [
  '*hic*',
  'You stumble a bit.',
  'Everything seems funnier than it should be.',
  'You hiccup loudly.',
  'The ground seems unsteady.',
  'Was that wall always there?',
  'You giggle for no reason.',
  'Your words come out slightly slurred.',
];

/** Get a random drunk flavor action */
export function getRandomDrunkFlavor(): string {
  return DRUNK_FLAVOR_ACTIONS[Math.floor(Math.random() * DRUNK_FLAVOR_ACTIONS.length)]!;
}
