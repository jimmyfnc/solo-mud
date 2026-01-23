/**
 * Socket.io server setup and event handling.
 */

import { Server as SocketServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type ClientMessage,
  type OutputLine,
} from '@solo-mud/shared';
import { sessionManager, type GameSession } from './game/session';
import { executeCommand } from './commands/handlers';

export interface GameSocket extends Socket {
  playerId?: string;
  session?: GameSession;
}

/**
 * Create and configure the Socket.io server.
 */
export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env['CLIENT_ORIGIN'] ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: GameSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a game session for this connection
    const playerName = `Adventurer_${socket.id.slice(0, 6)}`;
    const session = sessionManager.createSession(socket.id, playerName);
    socket.session = session;
    socket.playerId = session.playerId;

    // Send welcome message
    sendOutput(socket, [
      { text: 'Welcome to Solo MUD!', style: 'system' },
      { text: `You are ${session.player.name}.`, style: 'system' },
      { text: 'Type "look" to see your surroundings, or "help" for commands.', style: 'system' },
    ]);

    // Handle client commands
    socket.on(CLIENT_EVENTS.COMMAND, (message: ClientMessage) => {
      if (message.type === 'command') {
        sessionManager.touchSession(socket.id);
        handleCommand(socket, message.input);
      }
    });

    // Handle sync requests
    socket.on(CLIENT_EVENTS.SYNC_REQUEST, () => {
      sessionManager.touchSession(socket.id);
      handleSyncRequest(socket);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
      sessionManager.removeSession(socket.id);
    });
  });

  return io;
}

/**
 * Send output lines to a client.
 */
export function sendOutput(socket: GameSocket, lines: OutputLine[]): void {
  socket.emit(SERVER_EVENTS.OUTPUT, {
    type: 'output',
    lines,
  });
}

/**
 * Send an error message to a client.
 */
export function sendError(socket: GameSocket, message: string, code?: string): void {
  socket.emit(SERVER_EVENTS.ERROR, {
    type: 'error',
    message,
    code,
  });
}

/**
 * Handle a command from a client.
 */
function handleCommand(socket: GameSocket, input: string): void {
  const session = socket.session;
  if (!session) {
    sendError(socket, 'No active session. Please reconnect.');
    return;
  }

  const result = executeCommand(session, input);
  sendOutput(socket, result.output);
}

/**
 * Handle a sync request from a client.
 * This is a placeholder - actual sync will be implemented later.
 */
function handleSyncRequest(socket: GameSocket): void {
  sendOutput(socket, [
    { text: 'Sync requested. (Not yet implemented)', style: 'system' },
  ]);
}
