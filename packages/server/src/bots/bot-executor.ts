/**
 * BotExecutor - executes bot AI decisions as game commands.
 *
 * ## Tick Timing
 *
 * The AI tick interval controls how often bots make decisions:
 * - 1000ms (1s): Very fast - bots feel twitchy, unrealistic
 * - 2000ms (2s): Fast - active bots, good for combat-heavy areas
 * - 3000ms (3s): Normal - balanced, human-like reaction time (CURRENT)
 * - 5000ms (5s): Slow - relaxed, good for social areas
 * - 10000ms (10s): Very slow - almost idle, good for background NPCs
 *
 * Current value: 3000ms provides a good balance between responsiveness
 * and natural-feeling behavior. Bots don't instantly react but aren't
 * noticeably sluggish either.
 *
 * ## Conversation Trigger Chances
 *
 * These probabilities control how often bots speak:
 *
 * | Trigger       | Chance | Reasoning                                    |
 * |---------------|--------|----------------------------------------------|
 * | greeting      | 30%    | Noticeable but not annoying                  |
 * | combat_start  | 100%*  | Always bark when combat starts               |
 * | victory       | 100%*  | Always celebrate after winning               |
 * | low_hp        | 100%*  | Always call for help when in danger          |
 * | idle          | 5%     | Rare - keeps chat lively without spam        |
 *
 * *These triggers fire once per event, not per tick, so 100% is fine.
 *
 * ### Adjusting Conversation Frequency
 *
 * To make bots more chatty:
 * - Increase greeting chance to 50-70%
 * - Increase idle chance to 10-15%
 *
 * To make bots quieter:
 * - Decrease greeting chance to 10-20%
 * - Decrease idle chance to 1-2%
 */

import type { BotSession } from './bot-session';
import { getTotalCopper } from '@solo-mud/shared';
import { getNextAction, completeAction } from './goap/planner';
import { getActionCommand } from './goap/actions';
import {
  generateGreeting,
  generateCombatBark,
  generateVictory,
  generateLowHpCall,
  generateIdleChat,
} from './conversation';
import { getItemDisplayName, getOpenWorkOrders } from '../economy/economy-manager';

/**
 * Minimum time between AI ticks in ms.
 *
 * Recommended values:
 * - 2000ms: Fast-paced, good for dungeons
 * - 3000ms: Normal pace, balanced (current)
 * - 5000ms: Relaxed pace, good for towns
 *
 * Changing this affects:
 * - Bot responsiveness in combat
 * - How quickly bots move between rooms
 * - Server CPU usage (lower = more processing)
 */
const MIN_TICK_INTERVAL = 3000; // 3 seconds

/** Types of conversation triggers */
export interface ConversationTrigger {
  type: 'greeting' | 'combat_start' | 'victory' | 'low_hp' | 'idle';
  targetName?: string; // For greetings
}

/** Context for triggering conversations */
export interface TriggerContext {
  playerEntered?: string; // Name of player who entered the room
  combatStarted?: boolean; // Combat just began
  combatEnded?: boolean; // Combat just ended
  wasHealed?: boolean; // Bot was healed
}

/** Get random exit from current location */
function getRandomExit(session: BotSession): string | null {
  const { world, player } = session;

  // Get exit IDs for this location from adjacency list
  const exitIds = world.adjacency[player.locationId];
  if (!exitIds || exitIds.length === 0) {
    return null;
  }

  // Get actual exit objects
  const exits = exitIds
    .map(id => world.exits[id])
    .filter(exit => exit && exit.type !== 'locked');

  if (exits.length === 0) {
    return null;
  }

  const exit = exits[Math.floor(Math.random() * exits.length)];
  if (!exit) return null;

  // Prefix with "go" so named exits ("out", "inn", "passage") parse as
  // movement — the parser only accepts bare compass words.
  return `go ${exit.label}`;
}

function getStepToward(session: BotSession, destinationId: string): string | null {
  const { world, player } = session;
  if (player.locationId === destinationId) return null;
  const queue: Array<{ locationId: string; firstExitId?: string }> = [{ locationId: player.locationId }];
  const visited = new Set([player.locationId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const exitId of world.adjacency[current.locationId] ?? []) {
      const exit = world.exits[exitId];
      if (!exit || exit.type === 'locked' || exit.requirement) continue;
      if (visited.has(exit.to)) continue;
      const firstExitId = current.firstExitId ?? exit.id;
      if (exit.to === destinationId) {
        const firstExit = world.exits[firstExitId];
        return firstExit ? `go ${firstExit.label}` : null;
      }
      visited.add(exit.to);
      queue.push({ locationId: exit.to, firstExitId });
    }
  }
  return null;
}

export class BotExecutor {
  /** Track which bots have already called for help this combat */
  private lowHpCalledThisCombat: Set<string> = new Set();

  /** Check if bot should tick based on time */
  shouldTick(session: BotSession): boolean {
    const bot = session.player;
    const now = Date.now();
    return now - bot.lastAiTick >= MIN_TICK_INTERVAL;
  }

  getEconomyCommand(session: BotSession): string | null {
    const bot = session.player;
    if (bot.botProfile.personality.greed < 55) return null;
    const order = getOpenWorkOrders(session.world)[0];
    if (!order) return null;

    const materialName = getItemDisplayName(order.materialBaseId);
    const carried = bot.inventory.some(slot =>
      session.world.items[slot.itemId]?.baseId === order.materialBaseId
    );
    if (carried) {
      const merchantLocation = session.world.npcs[order.merchantId]?.locationId;
      if (!merchantLocation) return null;
      return bot.locationId === merchantLocation
        ? `turnin ${materialName}`
        : getStepToward(session, merchantLocation);
    }

    const node = Object.values(session.world.economy?.resourceNodes ?? {}).find(candidate =>
      candidate.materialBaseId === order.materialBaseId && candidate.quantity > 0
    );
    if (!node) return null;

    if (node.requiredToolTag) {
      const hasTool = bot.inventory.some(slot =>
        session.world.items[slot.itemId]?.tags.includes(node.requiredToolTag!)
      ) || Object.values(bot.equipment).some(itemId =>
        itemId ? session.world.items[itemId]?.tags.includes(node.requiredToolTag!) : false
      );
      if (!hasTool) {
        const toolMerchantId = node.requiredToolTag === 'pickaxe' ? 'npc_thom' : 'npc_kira';
        const toolBaseId = node.requiredToolTag === 'pickaxe' ? 'mining_pick' : 'iron_axe';
        const toolMerchantLocation = session.world.npcs[toolMerchantId]?.locationId;
        if (!toolMerchantLocation) return null;
        return bot.locationId === toolMerchantLocation
          ? `buy ${getItemDisplayName(toolBaseId)}`
          : getStepToward(session, toolMerchantLocation);
      }
    }

    if (bot.locationId === node.locationId) {
      return `${node.gatherVerb} ${materialName}`;
    }
    return getStepToward(session, node.locationId);
  }

  /** Get the next command for a bot to execute */
  getNextCommand(session: BotSession, triggerContext?: TriggerContext): string | null {
    const bot = session.player;

    // Check for conversation triggers first
    if (triggerContext) {
      const trigger = this.checkConversationTriggers(session, triggerContext);
      if (trigger) {
        const speechCommand = this.generateSpeechCommand(session, trigger);
        if (speechCommand) {
          return speechCommand;
        }
      }
    }

    // Get next action from GOAP
    const actionId = getNextAction(bot);
    if (!actionId) {
      return null;
    }

    // Build context for command generation
    const context: Record<string, string> = {};

    // For movement actions, pick a direction
    if (actionId === 'travel' || actionId === 'explore') {
      const direction = getRandomExit(session);
      if (direction) {
        context.direction = direction;
      }
    }

    // For carouse: buy ale → drink ale → lament being broke
    if (actionId === 'carouse') {
      const world = session.world;
      const hasAle = bot.inventory.some(slot => world.items[slot.itemId]?.baseId === 'ale');
      if (hasAle) {
        context.subcommand = 'drink ale';
      } else if (getTotalCopper(bot.currency) >= 2) {
        context.subcommand = 'buy ale';
      } else {
        context.subcommand = 'say Another round! ...ah, forget it, no coin left.';
      }
    }

    // For say action, pick a catchphrase
    if (actionId === 'say') {
      const catchphrases = bot.botProfile.personality.catchphrases;
      const phrase = catchphrases[Math.floor(Math.random() * catchphrases.length)];
      if (phrase) {
        context.message = phrase;
      }
    }

    // Get command from action
    const command = getActionCommand(actionId, bot, context);

    // Mark action complete (for single-step actions)
    completeAction(bot);

    return command;
  }

  /** Update last tick time */
  markTicked(session: BotSession): void {
    session.player.lastAiTick = Date.now();
  }

  /**
   * Check for conversation triggers based on session state and context.
   * @param session - The bot session
   * @param context - Optional trigger context (player entered, combat events)
   * @returns A conversation trigger if one should fire, null otherwise
   */
  checkConversationTriggers(
    session: BotSession,
    context?: TriggerContext
  ): ConversationTrigger | null {
    const bot = session.player;

    // Combat ended - reset low HP tracking and possibly trigger victory
    if (context?.combatEnded) {
      this.lowHpCalledThisCombat.delete(bot.id);
      if (bot.currentHp > 0) {
        return { type: 'victory' };
      }
      return null;
    }

    // Combat started - trigger combat bark
    if (context?.combatStarted) {
      return { type: 'combat_start' };
    }

    // Player entered the room - 30% chance to greet
    // Tuning: Lower (10-20%) for quieter world, higher (50-70%) for lively world
    if (context?.playerEntered) {
      if (Math.random() < 0.3) {
        return { type: 'greeting', targetName: context.playerEntered };
      }
      return null;
    }

    // Low HP check (only once per combat)
    if (bot.inCombat && bot.currentHp < bot.maxHp * 0.3) {
      if (!this.lowHpCalledThisCombat.has(bot.id)) {
        this.lowHpCalledThisCombat.add(bot.id);
        return { type: 'low_hp' };
      }
      return null;
    }

    // Idle chat (5% chance when not in combat)
    // Tuning: Lower (1-2%) for quieter world, higher (10-15%) for chatty bots
    // Note: This fires every tick, so 5% * ~20 ticks/minute = ~1 idle chat/minute
    if (!bot.inCombat && Math.random() < 0.05) {
      return { type: 'idle' };
    }

    return null;
  }

  /**
   * Generate a speech command from a conversation trigger.
   * @param session - The bot session
   * @param trigger - The conversation trigger
   * @returns A 'say' command string, or null if no speech should be generated
   */
  generateSpeechCommand(session: BotSession, trigger: ConversationTrigger): string | null {
    const bot = session.player;
    let speech: string | null = null;

    switch (trigger.type) {
      case 'greeting':
        if (!trigger.targetName) {
          return null;
        }
        speech = generateGreeting(bot, trigger.targetName);
        break;
      case 'combat_start':
        speech = generateCombatBark(bot);
        break;
      case 'victory':
        speech = generateVictory(bot);
        break;
      case 'low_hp':
        speech = generateLowHpCall(bot);
        break;
      case 'idle':
        speech = generateIdleChat(bot);
        break;
    }

    if (speech) {
      return `say ${speech}`;
    }

    return null;
  }
}
