/**
 * BotPlayer - extends Player with bot-specific properties.
 */

import type { Player } from '@solo-mud/shared';
import type { BotProfile } from '@solo-mud/shared';

/** A bot player is a Player with additional bot state */
export interface BotPlayer extends Player {
  /** Flag indicating this is a bot, not a real player */
  isBot: true;
  /** Bot's personality, relationships, and memory */
  botProfile: BotProfile;
  /** Current goal being pursued */
  currentGoalId?: string;
  /** Current action plan (list of action IDs) */
  currentPlan?: string[];
  /** Timestamp of last AI tick */
  lastAiTick: number;
  /** Named bot definition ID (if this is a named bot) */
  namedBotId?: string;
}

/** Type guard to check if a Player is a BotPlayer */
export function isBotPlayer(player: Player): player is BotPlayer {
  return 'isBot' in player && (player as BotPlayer).isBot === true;
}
