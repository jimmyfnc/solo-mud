/**
 * Socket.io server setup and event handling.
 */

import { Server as SocketServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  CLASSES,
  type ClientMessage,
  type CreateCharacterMessage,
  type OutputLine,
  type ClassName,
} from '@solo-mud/shared';
import { sessionManager, type GameSession } from './game/session';
import { executeCommand } from './commands/handlers';

export interface GameSocket extends Socket {
  playerId?: string;
  session?: GameSession;
  awaitingCharacterCreation?: boolean;
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

    // Mark as awaiting character creation
    socket.awaitingCharacterCreation = true;

    // Send welcome message and class options
    sendOutput(socket, [
      { text: 'Welcome to Solo MUD!', style: 'system' },
      { text: 'Create your character to begin your adventure.', style: 'system' },
    ]);

    // Send character creation options
    sendCharacterCreationOptions(socket);

    // Handle character creation
    socket.on(CLIENT_EVENTS.CREATE_CHARACTER, (message: CreateCharacterMessage) => {
      if (!socket.awaitingCharacterCreation) {
        sendError(socket, 'Character already created.');
        return;
      }

      handleCharacterCreation(socket, message);
    });

    // Handle client commands
    socket.on(CLIENT_EVENTS.COMMAND, (message: ClientMessage) => {
      if (message.type === 'command') {
        if (socket.awaitingCharacterCreation) {
          sendError(socket, 'Please create your character first.');
          return;
        }
        sessionManager.touchSession(socket.id);
        handleCommand(socket, message.input);
      }
    });

    // Handle sync requests
    socket.on(CLIENT_EVENTS.SYNC_REQUEST, () => {
      if (socket.awaitingCharacterCreation) {
        sendCharacterCreationOptions(socket);
        return;
      }
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
 */
function handleSyncRequest(socket: GameSocket): void {
  const session = socket.session;
  if (!session) {
    sendError(socket, 'No active session.');
    return;
  }

  // Send full sync
  socket.emit(SERVER_EVENTS.SYNC, {
    type: 'sync',
    player: session.player,
    combatStats: session.combatStats,
    room: buildRoomMessage(session),
    time: session.world.time,
    weather: session.world.weather,
  });
}

/**
 * Send character creation options to the client.
 */
function sendCharacterCreationOptions(socket: GameSocket): void {
  const classOptions = Object.values(CLASSES).map((cls) => ({
    id: cls.id,
    name: cls.name,
    description: cls.description,
    primaryStats: cls.primaryStats,
  }));

  socket.emit(SERVER_EVENTS.CHARACTER_CREATION, {
    type: 'character_creation',
    classes: classOptions,
  });
}

/**
 * Handle character creation from a client.
 */
function handleCharacterCreation(socket: GameSocket, message: CreateCharacterMessage): void {
  const { name, className } = message;

  // Validate class name
  if (!CLASSES[className]) {
    sendError(socket, `Invalid class: ${className}`);
    return;
  }

  // Validate player name
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    sendError(socket, 'Name must be between 2 and 20 characters.');
    return;
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedName)) {
    sendError(socket, 'Name must start with a letter and contain only letters, numbers, and underscores.');
    return;
  }

  // Create the session
  const session = sessionManager.createSession(socket.id, trimmedName, className as ClassName);
  socket.session = session;
  socket.playerId = session.playerId;
  socket.awaitingCharacterCreation = false;

  // Send welcome message
  sendOutput(socket, [
    { text: `Welcome, ${session.player.name} the ${CLASSES[className].name}!`, style: 'success' },
    { text: 'Your adventure begins...', style: 'system' },
    { text: 'Type "look" to see your surroundings, or "help" for commands.', style: 'system' },
  ]);

  // Send initial sync
  handleSyncRequest(socket);
}

/**
 * Build a room message from the current session state.
 */
function buildRoomMessage(session: GameSession): {
  type: 'room';
  location: typeof session.world.locations[string];
  exits: typeof session.world.exits[string][];
  items: typeof session.world.items[string][];
  enemies: never[];
  npcs: never[];
} {
  const location = session.world.locations[session.player.locationId]!;
  const exitIds = session.world.adjacency[session.player.locationId] ?? [];
  const exits = exitIds.map((id) => session.world.exits[id]!);
  const items = location.items.map((id) => session.world.items[id]!).filter(Boolean);

  return {
    type: 'room',
    location,
    exits,
    items,
    enemies: [],
    npcs: [],
  };
}
