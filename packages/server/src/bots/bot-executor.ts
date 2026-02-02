/**
 * BotExecutor - executes bot AI decisions as game commands.
 */

import type { BotSession } from './bot-session';
import { getNextAction, completeAction } from './goap/planner';
import { getActionCommand } from './goap/actions';

/** Minimum time between AI ticks in ms */
const MIN_TICK_INTERVAL = 3000; // 3 seconds

/** Get random exit from current location */
function getRandomExit(session: BotSession): string | null {
  const location = session.world.locations[session.player.locationId];
  if (!location || !location.exits || location.exits.length === 0) {
    return null;
  }

  const exit = location.exits[Math.floor(Math.random() * location.exits.length)];
  return exit.direction;
}

export class BotExecutor {
  /** Check if bot should tick based on time */
  shouldTick(session: BotSession): boolean {
    const bot = session.player;
    const now = Date.now();
    return now - bot.lastAiTick >= MIN_TICK_INTERVAL;
  }

  /** Get the next command for a bot to execute */
  getNextCommand(session: BotSession): string | null {
    const bot = session.player;

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

    // For say action, pick a catchphrase
    if (actionId === 'say') {
      const catchphrases = bot.botProfile.personality.catchphrases;
      if (catchphrases.length > 0) {
        context.message = catchphrases[Math.floor(Math.random() * catchphrases.length)];
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
}
