/**
 * Broadcast system for sending messages to players at specific locations.
 * Used by bots to make their actions visible to nearby players.
 */

import type { Server as SocketServer } from 'socket.io';
import type { OutputLine } from '@solo-mud/shared';
import { SERVER_EVENTS } from '@solo-mud/shared';
import { sessionManager } from '../game/session';
import type { GameSocket } from '../socket';

/** Global reference to the Socket.io server */
let ioServer: SocketServer | null = null;

/**
 * Set the Socket.io server instance for broadcasting.
 * Called during server initialization.
 */
export function setIoServer(io: SocketServer): void {
  ioServer = io;
}

/**
 * Get the Socket.io server instance.
 */
export function getIoServer(): SocketServer | null {
  return ioServer;
}

/**
 * Broadcast a message to all players at a specific location.
 * @param locationId - The location to broadcast to
 * @param lines - The output lines to send
 * @param excludeSessionId - Optional session ID to exclude (e.g., the speaker)
 */
export function broadcastToLocation(
  locationId: string,
  lines: OutputLine[],
  excludeSessionId?: string
): void {
  if (!ioServer) {
    return;
  }

  // Find all player sessions at this location
  const sessions = sessionManager.getAllSessions();
  const playersAtLocation = sessions.filter(
    (s) => s.player.locationId === locationId && s.id !== excludeSessionId
  );

  // Send to each player's socket
  for (const session of playersAtLocation) {
    const socket = ioServer.sockets.sockets.get(session.id) as GameSocket | undefined;
    if (socket) {
      socket.emit(SERVER_EVENTS.OUTPUT, { lines });
    }
  }
}

/**
 * Broadcast a bot saying something to players at the same location.
 */
export function broadcastBotSpeech(
  botName: string,
  message: string,
  locationId: string
): void {
  broadcastToLocation(locationId, [
    { text: `${botName} says "${message}"`, style: 'speech' },
  ]);
}

/**
 * Broadcast a bot arriving at a location.
 */
export function broadcastBotArrival(
  botName: string,
  locationId: string,
  fromDirection?: string
): void {
  const arrivalText = fromDirection
    ? `${botName} arrives from the ${fromDirection}.`
    : `${botName} arrives.`;

  broadcastToLocation(locationId, [
    { text: arrivalText, style: 'system' },
  ]);
}

/**
 * Broadcast a bot leaving a location.
 */
export function broadcastBotDeparture(
  botName: string,
  locationId: string,
  direction: string
): void {
  broadcastToLocation(locationId, [
    { text: `${botName} leaves ${direction}.`, style: 'system' },
  ]);
}

/**
 * Broadcast a bot performing an emote/action.
 */
export function broadcastBotEmote(
  botName: string,
  action: string,
  locationId: string
): void {
  broadcastToLocation(locationId, [
    { text: `${botName} ${action}`, style: 'emote' },
  ]);
}

/**
 * Broadcast a bot entering combat.
 */
export function broadcastBotCombatStart(
  botName: string,
  targetName: string,
  locationId: string
): void {
  broadcastToLocation(locationId, [
    { text: `${botName} attacks ${targetName}!`, style: 'combat' },
  ]);
}

/**
 * Broadcast a bot's combat action.
 */
export function broadcastBotCombatAction(
  botName: string,
  action: string,
  locationId: string
): void {
  broadcastToLocation(locationId, [
    { text: action, style: 'combat' },
  ]);
}
