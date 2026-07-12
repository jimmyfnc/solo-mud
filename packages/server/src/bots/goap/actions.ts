/**
 * GOAP Action definitions and precondition checking.
 *
 * ## Action Cost System
 *
 * The GOAP planner chooses actions with the lowest cost that satisfy goal conditions.
 * Lower cost = more preferred action.
 *
 * ### Cost Scale Guidelines
 *
 * | Range | Meaning                            | Examples                      |
 * |-------|-------------------------------------|-------------------------------|
 * | 1-5   | Trivial - always choose if valid   | Use potion, loot, equip       |
 * | 6-10  | Cheap - generally preferred        | Attack, travel (familiar)     |
 * | 11-20 | Moderate - situational preference  | Explore, rest, say            |
 * | 21-30 | Expensive - only when necessary    | Flee (for brave bots)         |
 * | 31+   | Very expensive - last resort       | Rarely used                   |
 *
 * ### Personality Modifiers
 *
 * Costs are modified by personality traits:
 * - **bravery**: Affects flee cost (brave bots find fleeing expensive)
 * - **patience**: Affects rest cost (impatient bots find resting expensive)
 * - **greed**: Affects buy cost (greedy bots find spending expensive)
 * - **sociability**: Affects say cost (social bots find talking cheap)
 *
 * ### Survival Balancing
 *
 * Critical balance: flee vs attack when HP is low
 * - Attack base cost: 10 (always same)
 * - Flee base cost: 20 + bravery/5 (range: 20-40)
 * - After recent death: flee cost -10 (range: 10-30)
 *
 * This means:
 * - Cowardly bots (bravery 0-50) will flee when hurt
 * - Brave bots (bravery 70-100) keep fighting unless recently died
 * - Recent death makes ALL bots more likely to flee
 */

import type { BotActionDef, ActionPrecondition } from '@solo-mud/shared';
import type { BotPlayer } from '../bot-player';

/** Action definition with cost function */
export interface Action extends BotActionDef {
  /** Calculate cost for this action (lower = preferred) */
  getCost: (bot: BotPlayer) => number;
  /** Get the command to execute */
  getCommand: (bot: BotPlayer, context?: Record<string, string>) => string | null;
}

/** All defined actions */
export const ACTIONS: Record<string, Action> = {
  // =========================================================================
  // Combat Actions
  // =========================================================================

  /**
   * ATTACK - Standard combat action
   * Cost: 10 (fixed)
   * Preconditions: Must be in combat with a target
   */
  attack: {
    id: 'attack',
    category: 'combat',
    description: 'Attack current target',
    preconditions: [
      { type: 'in_combat', value: true },
      { type: 'has_target' },
    ],
    effects: ['damage_target'],
    getCost: () => 10,
    getCommand: () => 'attack',
  },

  /**
   * FLEE - Escape from combat
   * Base cost: 20
   * Bravery modifier: +0 to +20 (brave bots resist fleeing)
   * Recent death modifier: -10 (trauma makes fleeing acceptable)
   * Final range: 5-40
   * Minimum cost: 5 (always possible to choose flee)
   *
   * Balance note: At low HP, survive goal increases priority. If flee cost
   * is lower than attack cost (10), bot will flee. This happens when:
   * - Cowardly bot (bravery < 50): cost 20-30, flee at low HP
   * - After recent death: cost reduced by 10, more likely to flee
   */
  flee: {
    id: 'flee',
    category: 'combat',
    description: 'Flee from combat',
    preconditions: [{ type: 'in_combat', value: true }],
    effects: ['exit_combat'],
    getCost: (bot) => {
      // Base cost modified by bravery - brave bots find fleeing costly
      let cost = 20 + bot.botProfile.personality.bravery / 5;

      // Recent death makes fleeing more acceptable (learned caution)
      const recentDeath = bot.botProfile.memory.deaths.find(
        (d) => Date.now() - d.timestamp < 300000 // 5 minutes
      );
      if (recentDeath) {
        // Reduce fleeing cost after recent death (trauma makes survival instinct stronger)
        cost -= 10;
      }

      return Math.max(5, cost);
    },
    getCommand: () => 'flee',
  },

  // =========================================================================
  // Survival Actions
  // =========================================================================

  /**
   * USE_POTION - Consume a healing potion
   * Cost: 5 (very cheap - always use if available and hurt)
   * Preconditions: Must have health_potion, HP below 70%
   */
  use_potion: {
    id: 'use_potion',
    category: 'survival',
    description: 'Use a healing potion',
    preconditions: [
      { type: 'has_item', value: 'health_potion' },
      { type: 'hp_below', value: 70 },
    ],
    effects: ['restore_hp'],
    getCost: () => 5,
    getCommand: () => 'use health_potion',
  },

  /**
   * REST - Regenerate HP/MP faster
   * Base cost: 15
   * Patience modifier: +0 to +20 (impatient bots dislike resting)
   * Final range: 15-35
   * Preconditions: Must not be in combat
   */
  rest: {
    id: 'rest',
    category: 'survival',
    description: 'Rest to regenerate',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['regenerate'],
    getCost: (bot) => {
      // Impatient bots find resting costly
      return 15 + (100 - bot.botProfile.personality.patience) / 5;
    },
    getCommand: () => 'rest',
  },

  // =========================================================================
  // Movement Actions
  // =========================================================================

  /**
   * TRAVEL - Move to a known location
   * Base cost: 10
   * Experience modifier: -2 if knows 10+ locations (efficient pathfinding)
   * Final range: 5-10
   * Preconditions: Must not be in combat
   */
  travel: {
    id: 'travel',
    category: 'movement',
    description: 'Travel to a known location',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['change_location'],
    getCost: (bot) => {
      let cost = 10; // Base cost

      // Lower cost if destination is in preferred zones (known safe)
      // This is evaluated at planning time when context.destination is set
      // For now, just base on familiarity with locations
      const knownLocationCount = bot.botProfile.memory.knownLocations.length;
      if (knownLocationCount > 10) {
        // Experienced travelers move more efficiently
        cost -= 2;
      }

      return Math.max(5, cost);
    },
    getCommand: (_bot, context) => {
      if (context?.direction) {
        return context.direction;
      }
      return null;
    },
  },

  /**
   * EXPLORE - Discover a new location
   * Base cost: 15
   * Explorer activity preference: cost = 5 (explorers love this)
   * Restlessness modifier: -3 if haven't explored in 2+ minutes
   * Final range: 1-15
   * Minimum cost: 1
   */
  explore: {
    id: 'explore',
    category: 'movement',
    description: 'Explore a new direction',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['discover_location'],
    getCost: (bot) => {
      let cost = 15; // Base cost

      // Explorers find this cheaper
      if (bot.botProfile.personality.preferredActivities.includes('exploration')) {
        cost = 5;
      }

      // Even cheaper if haven't explored recently
      const lastExplore = bot.botProfile.memory.recentEvents.find(
        (e) => e.type === 'explored_location'
      );
      if (!lastExplore || Date.now() - lastExplore.timestamp > 120000) {
        cost -= 3; // Haven't explored in 2 minutes
      }

      return Math.max(1, cost); // Minimum cost of 1
    },
    getCommand: (_bot, context) => {
      if (context?.direction) {
        return context.direction;
      }
      // Default direction chosen at execution time
      return null;
    },
  },

  // =========================================================================
  // Economy Actions
  // =========================================================================

  /**
   * BUY_ITEM - Purchase from a shop
   * Base cost: 10
   * Greed modifier: +0 to +20 (greedy bots hate spending)
   * Final range: 10-30
   */
  buy_item: {
    id: 'buy_item',
    category: 'economy',
    description: 'Buy an item from a shop',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['gain_item', 'lose_gold'],
    getCost: (bot) => {
      // Greedy bots find spending costly
      return 10 + bot.botProfile.personality.greed / 5;
    },
    getCommand: (_bot, context) => {
      if (context?.item) {
        return `buy ${context.item}`;
      }
      return null;
    },
  },

  /**
   * SELL_ITEM - Sell to a shop
   * Cost: 10 (fixed - everyone likes getting gold)
   */
  sell_item: {
    id: 'sell_item',
    category: 'economy',
    description: 'Sell an item to a shop',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['lose_item', 'gain_gold'],
    getCost: () => 10,
    getCommand: (_bot, context) => {
      if (context?.item) {
        return `sell ${context.item}`;
      }
      return null;
    },
  },

  // =========================================================================
  // Social Actions
  // =========================================================================

  /**
   * CAROUSE - Buy and drink ale at the tavern (command chosen by executor:
   * 'buy ale' → 'drink ale' → broke-bot lament)
   * Base cost: 12, cheaper for social bots
   */
  carouse: {
    id: 'carouse',
    category: 'social',
    description: 'Buy and drink ale at the tavern',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['social_interaction'],
    getCost: (bot) => 12 - bot.botProfile.personality.sociability / 10,
    getCommand: (_bot, context) => context?.subcommand ?? null,
  },

  /**
   * SAY - Speak to the room
   * Base cost: 15
   * Sociability modifier: -0 to -10 (social bots love talking)
   * Final range: 5-15
   */
  say: {
    id: 'say',
    category: 'social',
    description: 'Say something to the room',
    preconditions: [],
    effects: ['social_interaction'],
    getCost: (bot) => {
      // Social bots find this cheap
      return 15 - bot.botProfile.personality.sociability / 10;
    },
    getCommand: (_bot, context) => {
      if (context?.message) {
        return `say ${context.message}`;
      }
      return null;
    },
  },

  // =========================================================================
  // Utility Actions
  // =========================================================================

  /**
   * LOOT - Pick up items from ground
   * Cost: 5 (very cheap - always grab loot)
   */
  loot: {
    id: 'loot',
    category: 'utility',
    description: 'Loot items from ground',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['gain_items'],
    getCost: () => 5,
    getCommand: () => 'take all',
  },

  /**
   * EQUIP - Equip an item from inventory
   * Cost: 5 (very cheap - always equip upgrades)
   */
  equip: {
    id: 'equip',
    category: 'utility',
    description: 'Equip an item',
    preconditions: [],
    effects: ['improve_stats'],
    getCost: () => 5,
    getCommand: (_bot, context) => {
      if (context?.item) {
        return `equip ${context.item}`;
      }
      return null;
    },
  },
};

/** Check if a single precondition is met */
function checkSinglePrecondition(precondition: ActionPrecondition, bot: BotPlayer): boolean {
  switch (precondition.type) {
    case 'in_combat':
      return bot.inCombat === precondition.value;
    case 'not_in_combat':
      return !bot.inCombat;
    case 'has_target':
      return bot.targetId !== undefined;
    case 'hp_above':
      return (bot.currentHp / bot.maxHp) * 100 >= (precondition.value as number);
    case 'hp_below':
      return (bot.currentHp / bot.maxHp) * 100 < (precondition.value as number);
    case 'mp_above':
      return (bot.currentMp / bot.maxMp) * 100 >= (precondition.value as number);
    case 'has_item':
      return bot.inventory.some((slot) => slot.itemId.includes(precondition.value as string));
    case 'has_currency': {
      const total = bot.currency.copper + bot.currency.silver * 10 + bot.currency.gold * 100;
      return total >= (precondition.value as number);
    }
    case 'knows_location':
      return bot.botProfile.memory.knownLocations.includes(precondition.value as string);
    case 'has_spell':
      return bot.spells.known.includes(precondition.value as string);
    default:
      return true;
  }
}

/** Check if all preconditions for an action are met */
export function checkPreconditions(actionId: string, bot: BotPlayer): boolean {
  const action = ACTIONS[actionId];
  if (!action) return false;

  return action.preconditions.every((pre) => checkSinglePrecondition(pre, bot));
}

/** Get all actions available to a bot */
export function getAvailableActions(bot: BotPlayer): string[] {
  return Object.keys(ACTIONS).filter((actionId) => checkPreconditions(actionId, bot));
}

/** Get action cost */
export function getActionCost(actionId: string, bot: BotPlayer): number {
  const action = ACTIONS[actionId];
  if (!action) return Infinity;
  return action.getCost(bot);
}

/** Get command for an action */
export function getActionCommand(
  actionId: string,
  bot: BotPlayer,
  context?: Record<string, string>
): string | null {
  const action = ACTIONS[actionId];
  if (!action) return null;
  return action.getCommand(bot, context);
}
