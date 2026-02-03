/**
 * Command handler adapter for bot players.
 * Converts BotSession to GameSession-compatible format for executeCommand.
 */

import type { BotSession } from './bot-session';
import { executeCommand } from '../commands/handlers';
import type { GameSession } from '../game/session';

/**
 * Execute a command for a bot player.
 * Adapts BotSession to work with the regular command system.
 */
export async function executeBotCommand(session: BotSession, command: string): Promise<void> {
  // Create a minimal GameSession-compatible object
  // BotSession is structurally similar to GameSession, just without socket-related fields
  const gameSession: GameSession = {
    id: session.id,
    playerId: session.playerId,
    player: session.player as GameSession['player'], // BotPlayer extends Player
    combatStats: session.combatStats,
    world: session.world,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    incursionState: session.incursionState,
    valveSequence: session.valveSequence,
    puzzleSolution: session.puzzleSolution,
    sewerGateOpen: session.sewerGateOpen,
  };

  // Execute command (results go to bot's internal state, no socket output)
  executeCommand(gameSession, command);

  // Sync any state changes back to bot session
  session.lastActivity = Date.now();
}
