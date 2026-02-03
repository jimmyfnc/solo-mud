/**
 * Socket.io server setup and event handling with character persistence.
 */

import { Server as SocketServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  CLASSES,
  type ClientMessage,
  type CreateCharacterMessage,
  type LoadCharacterMessage,
  type DeleteCharacterMessage,
  type IdentifyPlayerMessage,
  type LinkPlayerCodeMessage,
  type OutputLine,
  type ClassName,
  type Item,
  type Player,
  type World,
} from '@solo-mud/shared';
import { sessionManager, type GameSession } from './game/session';
import { restoreSession } from './game/restore';
import { executeCommand } from './commands/handlers';
import {
  getOrCreatePlayer,
  findPlayerByCode,
  type PlayerRecord,
} from './db/repositories/PlayerRepository';
import {
  createCharacter,
  getCharactersByPlayerId,
  findCharacterById,
  deleteCharacter,
  updateCharacter,
  MAX_CHARACTERS_PER_PLAYER,
} from './db/repositories/CharacterRepository';
import {
  recordVisit,
  recordUnlock,
  recordItemRemoved,
  recordItemDropped,
} from './db/repositories/WorldStateRepository';

export interface GameSocket extends Socket {
  playerId?: string;
  playerRecord?: PlayerRecord;
  session?: GameSession;
  awaitingCharacterSelection?: boolean;
}

/**
 * Extract all items owned by a player (equipped + inventory) from the world.
 */
function getOwnedItems(player: Player, world: World): Record<string, Item> {
  const owned: Record<string, Item> = {};

  // Collect equipped items
  for (const itemId of Object.values(player.equipment)) {
    const item = itemId ? world.items[itemId] : undefined;
    if (item) {
      owned[itemId] = item;
    }
  }

  // Collect inventory items
  for (const slot of player.inventory) {
    const item = slot.itemId ? world.items[slot.itemId] : undefined;
    if (item) {
      owned[slot.itemId] = item;
    }
  }

  return owned;
}

/**
 * Create and configure the Socket.io server.
 */
export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow any localhost origin for development
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, process.env['CLIENT_ORIGIN'] ?? 'http://localhost:3000');
        }
      },
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: GameSocket) => {
    console.log(`Client connected: ${socket.id}`);

    // Mark as awaiting character selection
    socket.awaitingCharacterSelection = true;

    // Handle player identification (sent immediately after connect)
    socket.on(CLIENT_EVENTS.IDENTIFY_PLAYER, (message: IdentifyPlayerMessage) => {
      handleIdentifyPlayer(socket, message);
    });

    // Handle linking a player code from another device
    socket.on(CLIENT_EVENTS.LINK_PLAYER_CODE, (message: LinkPlayerCodeMessage) => {
      handleLinkPlayerCode(socket, message);
    });

    // Handle character creation
    socket.on(CLIENT_EVENTS.CREATE_CHARACTER, (message: CreateCharacterMessage) => {
      if (!socket.awaitingCharacterSelection) {
        sendError(socket, 'Already in game.');
        return;
      }
      handleCharacterCreation(socket, message);
    });

    // Handle loading an existing character
    socket.on(CLIENT_EVENTS.LOAD_CHARACTER, (message: LoadCharacterMessage) => {
      if (!socket.awaitingCharacterSelection) {
        sendError(socket, 'Already in game.');
        return;
      }
      handleLoadCharacter(socket, message);
    });

    // Handle character deletion
    socket.on(CLIENT_EVENTS.DELETE_CHARACTER, (message: DeleteCharacterMessage) => {
      handleDeleteCharacter(socket, message);
    });

    // Handle client commands
    socket.on(CLIENT_EVENTS.COMMAND, (message: ClientMessage) => {
      if (message.type === 'command') {
        if (socket.awaitingCharacterSelection) {
          sendError(socket, 'Please select or create a character first.');
          return;
        }
        sessionManager.touchSession(socket.id);
        handleCommand(socket, message.input);
      }
    });

    // Handle sync requests
    socket.on(CLIENT_EVENTS.SYNC_REQUEST, () => {
      if (socket.awaitingCharacterSelection) {
        // Re-send welcome if they're still on character select
        if (socket.playerRecord) {
          sendWelcome(socket, socket.playerRecord);
        }
        return;
      }
      sessionManager.touchSession(socket.id);
      handleSyncRequest(socket);
    });

    // Handle disconnection - save character state
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
      saveSessionState(socket);
      sessionManager.removeSession(socket.id);
    });

    // Send ASCII art banner on connect
    sendOutput(socket, [
      { text: '╔═════════════════════════════════════════════════════════════════════════╗', style: 'system' },
      { text: '║                                                                         ║', style: 'system' },
      { text: '║   ███████╗ ██████╗ ██╗      ██████╗     ███╗   ███╗██╗   ██╗██████╗     ║', style: 'system' },
      { text: '║   ██╔════╝██╔═══██╗██║     ██╔═══██╗    ████╗ ████║██║   ██║██╔══██╗    ║', style: 'system' },
      { text: '║   ███████╗██║   ██║██║     ██║   ██║    ██╔████╔██║██║   ██║██║  ██║    ║', style: 'system' },
      { text: '║   ╚════██║██║   ██║██║     ██║   ██║    ██║╚██╔╝██║██║   ██║██║  ██║    ║', style: 'system' },
      { text: '║   ███████║╚██████╔╝███████╗╚██████╔╝    ██║ ╚═╝ ██║╚██████╔╝██████╔╝    ║', style: 'system' },
      { text: '║   ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝     ╚═╝     ╚═╝ ╚═════╝ ╚═════╝     ║', style: 'system' },
      { text: '║                                                                         ║', style: 'system' },
      { text: '║              A Solo Adventure in a Living World                         ║', style: 'system' },
      { text: '║                                                                         ║', style: 'system' },
      { text: '╚═════════════════════════════════════════════════════════════════════════╝', style: 'system' },
      { text: '', style: 'normal' },
      { text: 'Connecting...', style: 'system' },
    ]);
  });

  return io;
}

/**
 * Handle player identification on connect.
 */
function handleIdentifyPlayer(socket: GameSocket, message: IdentifyPlayerMessage): void {
  // Get or create player record
  const playerRecord = getOrCreatePlayer(message.playerId);
  socket.playerRecord = playerRecord;
  socket.playerId = playerRecord.id;

  // Send welcome with character list
  sendWelcome(socket, playerRecord);
}

/**
 * Handle linking a player code from another device.
 */
function handleLinkPlayerCode(socket: GameSocket, message: LinkPlayerCodeMessage): void {
  const existingPlayer = findPlayerByCode(message.code);

  if (!existingPlayer) {
    sendError(socket, 'Invalid player code. Please check and try again.');
    return;
  }

  // Link to existing player
  socket.playerRecord = existingPlayer;
  socket.playerId = existingPlayer.id;

  sendOutput(socket, [
    { text: `Linked to player code: ${existingPlayer.playerCode}`, style: 'success' },
  ]);

  // Send updated welcome with their characters
  sendWelcome(socket, existingPlayer);
}

/**
 * Send welcome message with player info and character list.
 */
function sendWelcome(socket: GameSocket, playerRecord: PlayerRecord): void {
  const characters = getCharactersByPlayerId(playerRecord.id);
  const classOptions = Object.values(CLASSES).map((cls) => ({
    id: cls.id,
    name: cls.name,
    description: cls.description,
    primaryStats: cls.primaryStats,
  }));

  socket.emit(SERVER_EVENTS.WELCOME, {
    type: 'welcome',
    playerId: playerRecord.id,
    playerCode: playerRecord.playerCode,
    characters,
    maxCharacters: MAX_CHARACTERS_PER_PLAYER,
    classes: classOptions,
  });
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
 * Handle character creation.
 */
function handleCharacterCreation(socket: GameSocket, message: CreateCharacterMessage): void {
  const { name, className } = message;

  if (!socket.playerRecord) {
    sendError(socket, 'Please wait for connection to complete.');
    return;
  }

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

  if (!/^[a-zA-Z][a-zA-Z0-9_ ]*[a-zA-Z0-9]$|^[a-zA-Z]$/.test(trimmedName)) {
    sendError(socket, 'Name must start with a letter. Can contain letters, numbers, spaces, and underscores.');
    return;
  }

  try {
    // Create the session
    const { session, worldSeed } = sessionManager.createSession(
      socket.id,
      trimmedName,
      className as ClassName
    );

    // Save to database (including owned items for restoration)
    const ownedItems = getOwnedItems(session.player, session.world);
    const characterRecord = createCharacter(
      socket.playerRecord.id,
      session.player,
      worldSeed,
      session.world.time.totalMinutes,
      ownedItems
    );

    // Update session with character ID
    session.characterId = characterRecord.id;
    socket.session = session;
    socket.awaitingCharacterSelection = false;

    // Record initial location visit
    recordVisit(characterRecord.id, session.player.locationId);

    // Send rich intro for new characters
    sendOutput(socket, [
      { text: '', style: 'normal' },
      { text: '═══════════════════════════════════════════════════════════', style: 'system' },
      { text: `  Welcome, ${session.player.name} the ${CLASSES[className].name}!`, style: 'success' },
      { text: '═══════════════════════════════════════════════════════════', style: 'system' },
      { text: '', style: 'normal' },
      { text: 'You awaken in the warmth of The Rusty Blade Inn, the smell of', style: 'normal' },
      { text: 'wood smoke and fresh bread filling the air. Outside, the town', style: 'normal' },
      { text: 'of Easthollow stirs to life. Beyond its walls, the wilderness', style: 'normal' },
      { text: 'awaits those brave enough to explore its mysteries.', style: 'normal' },
      { text: '', style: 'normal' },
      { text: 'Your adventure begins...', style: 'system' },
      { text: '', style: 'normal' },
    ]);

    // Auto-look to show surroundings
    const lookResult = executeCommand(session, 'look');
    sendOutput(socket, lookResult.output);

    // Send initial sync
    handleSyncRequest(socket);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create character.';
    sendError(socket, errorMessage);
  }
}

/**
 * Handle loading an existing character.
 */
function handleLoadCharacter(socket: GameSocket, message: LoadCharacterMessage): void {
  if (!socket.playerRecord) {
    sendError(socket, 'Please wait for connection to complete.');
    return;
  }

  const character = findCharacterById(message.characterId);

  if (!character) {
    sendError(socket, 'Character not found.');
    return;
  }

  // Verify ownership
  if (character.playerId !== socket.playerRecord.id) {
    sendError(socket, 'Character not found.');
    return;
  }

  try {
    // Restore the session
    const session = restoreSession(socket.id, character);
    sessionManager.setSession(socket.id, session);
    socket.session = session;
    socket.awaitingCharacterSelection = false;

    // Send welcome back message
    sendOutput(socket, [
      { text: '', style: 'normal' },
      { text: `Welcome back, ${session.player.name}!`, style: 'success' },
      { text: 'Your adventure continues...', style: 'system' },
      { text: '', style: 'normal' },
    ]);

    // Auto-look to show surroundings
    const lookResult = executeCommand(session, 'look');
    sendOutput(socket, lookResult.output);

    // Send full sync
    handleSyncRequest(socket);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load character.';
    sendError(socket, errorMessage);
  }
}

/**
 * Handle character deletion.
 */
function handleDeleteCharacter(socket: GameSocket, message: DeleteCharacterMessage): void {
  if (!socket.playerRecord) {
    sendError(socket, 'Please wait for connection to complete.');
    return;
  }

  const character = findCharacterById(message.characterId);

  if (!character) {
    sendError(socket, 'Character not found.');
    return;
  }

  // Verify ownership
  if (character.playerId !== socket.playerRecord.id) {
    sendError(socket, 'Character not found.');
    return;
  }

  // Verify confirmation name matches
  if (message.confirmName.toLowerCase() !== character.name.toLowerCase()) {
    sendError(socket, 'Character name does not match. Deletion cancelled.');
    return;
  }

  // Delete the character (CASCADE will clean up world state tables)
  const deleted = deleteCharacter(message.characterId, socket.playerRecord.id);

  if (!deleted) {
    sendError(socket, 'Failed to delete character.');
    return;
  }

  // Send confirmation with updated character list
  const characters = getCharactersByPlayerId(socket.playerRecord.id);
  socket.emit(SERVER_EVENTS.CHARACTER_DELETED, {
    type: 'character_deleted',
    characterId: message.characterId,
    characters,
  });

  sendOutput(socket, [
    { text: `Character "${character.name}" has been deleted.`, style: 'system' },
  ]);
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

  // Check for quit/logout commands
  const trimmedInput = input.trim().toLowerCase();
  if (trimmedInput === 'quit' || trimmedInput === 'logout' || trimmedInput === 'exit') {
    handleQuit(socket);
    return;
  }

  // Echo the command for debugging
  sendOutput(socket, [{ text: `> ${input}`, style: 'system' }]);

  const result = executeCommand(session, input);
  sendOutput(socket, result.output);

  // Send player update if HP/MP/gold/XP changed
  if (result.updatePlayer) {
    sendPlayerUpdate(socket, session);
  }

  // Auto-save after commands that modify state
  if (session.characterId) {
    saveCharacterState(session);
  }
}

/**
 * Send updated player state to the client (HP/MP bars, etc.)
 */
function sendPlayerUpdate(socket: GameSocket, session: GameSession): void {
  socket.emit(SERVER_EVENTS.PLAYER_UPDATE, {
    type: 'player_update',
    player: session.player,
    combatStats: session.combatStats,
  });
}

/**
 * Handle quitting to the character selection screen.
 */
function handleQuit(socket: GameSocket): void {
  const session = socket.session;

  if (session) {
    // Save character state before quitting
    if (session.characterId) {
      saveCharacterState(session);
    }

    sendOutput(socket, [
      { text: `Farewell, ${session.player.name}. Your progress has been saved.`, style: 'system' },
      { text: 'Returning to character selection...', style: 'system' },
    ]);

    // Clean up session
    sessionManager.removeSession(socket.id);
    socket.session = undefined;
  }

  // Return to character selection
  socket.awaitingCharacterSelection = true;

  // Send welcome with character list
  if (socket.playerRecord) {
    sendWelcome(socket, socket.playerRecord);
  }
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

  // Send full sync (includes characterId for session resume on refresh)
  socket.emit(SERVER_EVENTS.SYNC, {
    type: 'sync',
    player: session.player,
    combatStats: session.combatStats,
    room: buildRoomMessage(session),
    time: session.world.time,
    weather: session.world.weather,
    characterId: session.characterId,
  });
}

/**
 * Save session state to database on disconnect.
 */
function saveSessionState(socket: GameSocket): void {
  const session = socket.session;
  if (!session?.characterId) return;

  saveCharacterState(session);
  console.log(`Saved character ${session.characterId} for ${socket.id}`);
}

/**
 * Save character state to database.
 */
export function saveCharacterState(session: GameSession): void {
  if (!session.characterId) return;

  updateCharacter(session.characterId, {
    level: session.player.level,
    xp: session.player.xp,
    currency: session.player.currency,
    currentHp: session.player.currentHp,
    maxHp: session.player.maxHp,
    currentMp: session.player.currentMp,
    maxMp: session.player.maxMp,
    locationId: session.player.locationId,
    gameTime: session.world.time.totalMinutes,
    equipment: session.player.equipment,
    inventory: session.player.inventory,
    keyring: session.player.keyring ?? [],
    ownedItems: getOwnedItems(session.player, session.world),
    knownSpells: session.player.spells.known,
  });
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

// Export persistence functions for use in command handlers
export { recordVisit, recordUnlock, recordItemRemoved, recordItemDropped };
