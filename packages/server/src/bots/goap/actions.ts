/**
 * GOAP Action definitions and precondition checking.
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
  // Combat actions
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

  // Survival actions
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

  // Movement actions
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

  // Economy actions
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

  // Social actions
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

  // Utility actions
  loot: {
    id: 'loot',
    category: 'utility',
    description: 'Loot items from ground',
    preconditions: [{ type: 'not_in_combat' }],
    effects: ['gain_items'],
    getCost: () => 5,
    getCommand: () => 'take all',
  },

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
