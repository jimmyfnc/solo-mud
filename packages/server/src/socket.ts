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

export interface GameSocket extends Socket {
  playerId?: string;
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

    // Send welcome message
    sendOutput(socket, [
      { text: 'Welcome to Solo MUD!', style: 'system' },
      { text: 'Type "help" for a list of commands.', style: 'system' },
    ]);

    // Handle client commands
    socket.on(CLIENT_EVENTS.COMMAND, (message: ClientMessage) => {
      if (message.type === 'command') {
        handleCommand(socket, message.input);
      }
    });

    // Handle sync requests
    socket.on(CLIENT_EVENTS.SYNC_REQUEST, () => {
      handleSyncRequest(socket);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
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
 * This is a placeholder - actual command handling will be implemented later.
 */
function handleCommand(socket: GameSocket, input: string): void {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === 'help') {
    sendOutput(socket, [
      { text: 'Available commands:', style: 'system' },
      { text: '  look - Examine your surroundings', style: 'normal' },
      { text: '  go <direction> - Move in a direction', style: 'normal' },
      { text: '  take <item> - Pick up an item', style: 'normal' },
      { text: '  drop <item> - Drop an item', style: 'normal' },
      { text: '  inventory - Check your inventory', style: 'normal' },
      { text: '  help - Show this help message', style: 'normal' },
    ]);
  } else {
    sendOutput(socket, [
      { text: `You typed: ${input}`, style: 'normal' },
      { text: '(Command system not yet implemented)', style: 'system' },
    ]);
  }
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
