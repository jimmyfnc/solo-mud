/**
 * Command handler adapter for bot players.
 * Converts BotSession to GameSession-compatible format for executeCommand.
 * Broadcasts bot actions to nearby players.
 */

import type { BotSession } from './bot-session';
import { executeCommand } from '../commands/handlers';
import type { GameSession } from '../game/session';
import {
  broadcastBotSpeech,
  broadcastBotDeparture,
  broadcastBotArrival,
  broadcastBotCombatStart,
} from '../broadcast';

/** Direction opposites for arrival messages */
const OPPOSITE_DIRECTION: Record<string, string> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  up: 'below',
  down: 'above',
  in: 'outside',
  out: 'inside',
};

/**
 * Execute a command for a bot player.
 * Adapts BotSession to work with the regular command system.
 * Broadcasts relevant actions to nearby players.
 */
export async function executeBotCommand(session: BotSession, command: string): Promise<void> {
  const bot = session.player;
  const previousLocation = bot.locationId;

  // Create a minimal GameSession-compatible object
  // BotSession is structurally similar to GameSession, just without socket-related fields
  const gameSession: GameSession = {
    id: session.id,
    playerId: session.playerId,
    player: bot as GameSession['player'], // BotPlayer extends Player
    combatStats: session.combatStats,
    world: session.world,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    incursionState: session.incursionState,
    valveSequence: session.valveSequence,
    puzzleSolution: session.puzzleSolution,
    sewerGateOpen: session.sewerGateOpen,
  };

  // Parse command to determine broadcast type
  const cmdParts = command.toLowerCase().trim().split(/\s+/);
  const cmdName = cmdParts[0] ?? '';
  const cmdArg = cmdParts.slice(1).join(' ');

  // Broadcast speech BEFORE executing (so it broadcasts even if command "fails")
  if (cmdName === 'say' && cmdArg) {
    broadcastBotSpeech(bot.name, cmdArg, bot.locationId);
  }

  // Broadcast combat start
  if (cmdName === 'attack' || cmdName === 'kill') {
    const targetName = cmdArg || 'something';
    broadcastBotCombatStart(bot.name, targetName, bot.locationId);
  }

  // Check if this is a movement command
  const movementCommands = ['north', 'south', 'east', 'west', 'up', 'down', 'n', 's', 'e', 'w', 'u', 'd', 'in', 'out'];
  const isMovement = movementCommands.includes(cmdName) || cmdName === 'go';
  const direction = cmdName === 'go' ? cmdArg : cmdName;

  // Execute command first to see if movement succeeds
  executeCommand(gameSession, command);

  // Check if bot actually moved to a new location
  const newLocation = bot.locationId;
  if (isMovement && newLocation !== previousLocation) {
    // Normalize short directions
    const fullDirection = direction === 'n' ? 'north' :
                          direction === 's' ? 'south' :
                          direction === 'e' ? 'east' :
                          direction === 'w' ? 'west' :
                          direction === 'u' ? 'up' :
                          direction === 'd' ? 'down' : direction;

    // Broadcast departure from old location
    broadcastBotDeparture(bot.name, previousLocation, fullDirection);

    // Broadcast arrival at new location
    const fromDirection = OPPOSITE_DIRECTION[fullDirection];
    broadcastBotArrival(bot.name, newLocation, fromDirection);
  } else if (!isMovement) {
    // For non-movement commands, we already executed above
    // Nothing more to do
  }

  // Sync any state changes back to bot session
  session.lastActivity = Date.now();
}
