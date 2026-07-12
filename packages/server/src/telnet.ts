/**
 * Telnet server for classic MUD client connections.
 * Supports raw TCP connections on a configurable port (default 4000).
 */

import * as net from 'net';
import { sessionManager, type GameSession } from './game/session';
import { restoreSession } from './game/restore';
import { executeCommand } from './commands/handlers';
import {
  getOrCreatePlayer,
  findPlayerByCode,
} from './db/repositories/PlayerRepository';
import {
  createCharacter,
  getCharactersByPlayerId,
  findCharacterById,
} from './db/repositories/CharacterRepository';
import { recordVisit } from './db/repositories/WorldStateRepository';
import {
  CLASSES,
  formatCurrency,
  type OutputLine,
  type ClassName,
} from '@solo-mud/shared';
import { MAX_COMMAND_LENGTH, MAX_TELNET_BUFFER_LENGTH } from './config/runtime';
import { getOwnedItems, saveCharacterState } from './game/character-persistence';

// ANSI color codes
const ANSI = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',

  // Foreground colors
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',

  // Bright colors
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  BRIGHT_CYAN: '\x1b[96m',
  BRIGHT_WHITE: '\x1b[97m',

  // Clear screen
  CLEAR: '\x1b[2J\x1b[H',
};

// Map output styles to ANSI colors
const STYLE_COLORS: Record<string, string> = {
  normal: ANSI.WHITE,
  error: ANSI.BRIGHT_RED,
  success: ANSI.BRIGHT_GREEN,
  combat: ANSI.BRIGHT_YELLOW,
  system: ANSI.CYAN,
  whisper: ANSI.MAGENTA,
  emphasis: ANSI.BRIGHT_CYAN,
  highlight: ANSI.BRIGHT_WHITE + ANSI.BOLD,
};

interface TelnetClient {
  socket: net.Socket;
  id: string;
  state: 'connecting' | 'identify' | 'character_select' | 'create_name' | 'create_class' | 'playing';
  playerId?: string;
  session?: GameSession;
  inputBuffer: string;
  // Character creation state
  pendingName?: string;
}

const clients: Map<string, TelnetClient> = new Map();
let clientIdCounter = 0;

/**
 * Create the telnet server.
 */
export function createTelnetServer(port: number = 4000): net.Server {
  const server = net.createServer((socket) => {
    const clientId = `telnet_${++clientIdCounter}`;
    const client: TelnetClient = {
      socket,
      id: clientId,
      state: 'connecting',
      inputBuffer: '',
    };

    clients.set(clientId, client);
    console.log(`Telnet client connected: ${clientId} from ${socket.remoteAddress}`);

    // Set socket options
    socket.setEncoding('utf8');
    socket.setNoDelay(true);

    // Send welcome banner
    sendBanner(client);

    // Handle incoming data
    socket.on('data', (data: string) => {
      handleInput(client, data);
    });

    // Handle disconnection
    socket.on('close', () => {
      console.log(`Telnet client disconnected: ${clientId}`);
      saveAndCleanup(client);
      clients.delete(clientId);
    });

    socket.on('error', (err) => {
      console.error(`Telnet client error ${clientId}:`, err.message);
      clients.delete(clientId);
    });
  });

  server.on('error', (err) => {
    console.error('Telnet server error:', err);
  });

  server.listen(port, () => {
    console.log(`Telnet server listening on port ${port}`);
  });

  return server;
}

/**
 * Send the welcome banner.
 */
function sendBanner(client: TelnetClient): void {
  const banner = `
${ANSI.CYAN}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║   ${ANSI.BRIGHT_WHITE}███████╗ ██████╗ ██╗      ██████╗     ███╗   ███╗██╗   ██╗██████╗${ANSI.CYAN}      ║
║   ${ANSI.BRIGHT_WHITE}██╔════╝██╔═══██╗██║     ██╔═══██╗    ████╗ ████║██║   ██║██╔══██╗${ANSI.CYAN}     ║
║   ${ANSI.BRIGHT_WHITE}███████╗██║   ██║██║     ██║   ██║    ██╔████╔██║██║   ██║██║  ██║${ANSI.CYAN}     ║
║   ${ANSI.BRIGHT_WHITE}╚════██║██║   ██║██║     ██║   ██║    ██║╚██╔╝██║██║   ██║██║  ██║${ANSI.CYAN}     ║
║   ${ANSI.BRIGHT_WHITE}███████║╚██████╔╝███████╗╚██████╔╝    ██║ ╚═╝ ██║╚██████╔╝██████╔╝${ANSI.CYAN}     ║
║   ${ANSI.BRIGHT_WHITE}╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝     ╚═╝     ╚═╝ ╚═════╝ ╚═════╝${ANSI.CYAN}      ║
║                                                                             ║
║              ${ANSI.BRIGHT_YELLOW}A Solo Adventure in a Living World${ANSI.CYAN}                          ║
║                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════╝${ANSI.RESET}

`;

  send(client, banner);
  send(client, `${ANSI.BRIGHT_WHITE}Enter your player code (or press Enter for a new account):${ANSI.RESET} `);
  client.state = 'identify';
}

/**
 * Handle input from a telnet client.
 */
function handleInput(client: TelnetClient, data: string): void {
  // Accumulate input and look for line endings
  client.inputBuffer += data;
  if (client.inputBuffer.length > MAX_TELNET_BUFFER_LENGTH) {
    send(client, `${ANSI.BRIGHT_RED}Input buffer limit exceeded.${ANSI.RESET}\n`);
    client.socket.destroy();
    return;
  }

  // Process complete lines
  let newlineIndex: number;
  while ((newlineIndex = client.inputBuffer.indexOf('\n')) !== -1) {
    const line = client.inputBuffer.slice(0, newlineIndex).replace(/\r/g, '').trim();
    client.inputBuffer = client.inputBuffer.slice(newlineIndex + 1);

    if (line.length > 0 || client.state === 'identify') {
      processCommand(client, line);
    }
  }
}

/**
 * Process a command from the client.
 */
function processCommand(client: TelnetClient, input: string): void {
  if (input.length > MAX_COMMAND_LENGTH) {
    send(client, `${ANSI.BRIGHT_RED}Commands may not exceed ${MAX_COMMAND_LENGTH} characters.${ANSI.RESET}\n`);
    return;
  }
  switch (client.state) {
    case 'identify':
      handleIdentify(client, input);
      break;

    case 'character_select':
      handleCharacterSelect(client, input);
      break;

    case 'create_name':
      handleCreateName(client, input);
      break;

    case 'create_class':
      handleCreateClass(client, input);
      break;

    case 'playing':
      handleGameCommand(client, input);
      break;
  }
}

/**
 * Handle player identification.
 */
function handleIdentify(client: TelnetClient, input: string): void {
  if (input.length === 0) {
    // New player - generate ID
    const playerId = `telnet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const playerRecord = getOrCreatePlayer(playerId);
    client.playerId = playerRecord.id;

    send(client, `\n${ANSI.BRIGHT_GREEN}New account created!${ANSI.RESET}\n`);
    send(client, `${ANSI.BRIGHT_YELLOW}Your player code is: ${ANSI.BRIGHT_WHITE}${playerRecord.playerCode}${ANSI.RESET}\n`);
    send(client, `${ANSI.DIM}(Save this code to access your characters from any device)${ANSI.RESET}\n\n`);

    showCharacterMenu(client);
  } else {
    // Try to find existing player by code
    const existingPlayer = findPlayerByCode(input.toUpperCase());

    if (existingPlayer) {
      client.playerId = existingPlayer.id;
      send(client, `\n${ANSI.BRIGHT_GREEN}Welcome back!${ANSI.RESET}\n\n`);
      showCharacterMenu(client);
    } else {
      send(client, `${ANSI.BRIGHT_RED}Invalid player code. Try again or press Enter for new account:${ANSI.RESET} `);
    }
  }
}

/**
 * Show the character selection menu.
 */
function showCharacterMenu(client: TelnetClient): void {
  if (!client.playerId) return;

  const characters = getCharactersByPlayerId(client.playerId);

  send(client, `${ANSI.CYAN}═══════════════════════════════════════${ANSI.RESET}\n`);
  send(client, `${ANSI.BRIGHT_WHITE}         CHARACTER SELECTION${ANSI.RESET}\n`);
  send(client, `${ANSI.CYAN}═══════════════════════════════════════${ANSI.RESET}\n\n`);

  if (characters.length > 0) {
    characters.forEach((char, index) => {
      const className = char.class.charAt(0).toUpperCase() + char.class.slice(1);
      send(client, `  ${ANSI.BRIGHT_WHITE}${index + 1}.${ANSI.RESET} ${char.name} - Level ${char.level} ${className}\n\n`);
    });
  } else {
    send(client, `  ${ANSI.DIM}No characters yet.${ANSI.RESET}\n\n`);
  }

  send(client, `  ${ANSI.BRIGHT_WHITE}N.${ANSI.RESET} Create New Character\n`);
  send(client, `  ${ANSI.BRIGHT_WHITE}Q.${ANSI.RESET} Quit\n\n`);

  send(client, `${ANSI.BRIGHT_WHITE}Enter choice:${ANSI.RESET} `);
  client.state = 'character_select';
}

/**
 * Handle character selection input.
 */
function handleCharacterSelect(client: TelnetClient, input: string): void {
  if (!client.playerId) return;

  const choice = input.toLowerCase();

  if (choice === 'q' || choice === 'quit') {
    send(client, `\n${ANSI.BRIGHT_YELLOW}Farewell, adventurer!${ANSI.RESET}\n`);
    client.socket.end();
    return;
  }

  if (choice === 'n' || choice === 'new') {
    startCharacterCreation(client);
    return;
  }

  // Try to parse as number
  const index = parseInt(choice, 10) - 1;
  const characters = getCharactersByPlayerId(client.playerId);

  if (index >= 0 && index < characters.length) {
    loadCharacter(client, characters[index]!.id);
  } else {
    send(client, `${ANSI.BRIGHT_RED}Invalid choice. Try again:${ANSI.RESET} `);
  }
}

/**
 * Start character creation.
 */
function startCharacterCreation(client: TelnetClient): void {
  send(client, `\n${ANSI.CYAN}═══════════════════════════════════════${ANSI.RESET}\n`);
  send(client, `${ANSI.BRIGHT_WHITE}       CREATE NEW CHARACTER${ANSI.RESET}\n`);
  send(client, `${ANSI.CYAN}═══════════════════════════════════════${ANSI.RESET}\n\n`);

  send(client, `${ANSI.BRIGHT_WHITE}Enter character name:${ANSI.RESET} `);
  client.state = 'create_name';
}

/**
 * Handle character name input.
 */
function handleCreateName(client: TelnetClient, input: string): void {
  const name = input.trim();

  if (name.length < 2 || name.length > 20) {
    send(client, `${ANSI.BRIGHT_RED}Name must be between 2 and 20 characters. Try again:${ANSI.RESET} `);
    return;
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_ ]*[a-zA-Z0-9]$|^[a-zA-Z]$/.test(name)) {
    send(client, `${ANSI.BRIGHT_RED}Name must start with a letter. Try again:${ANSI.RESET} `);
    return;
  }

  client.pendingName = name;

  send(client, `\n${ANSI.BRIGHT_WHITE}Choose your class:${ANSI.RESET}\n\n`);

  const classEntries = Object.entries(CLASSES);
  classEntries.forEach(([_id, cls], index) => {
    send(client, `  ${ANSI.BRIGHT_WHITE}${index + 1}.${ANSI.RESET} ${ANSI.BRIGHT_YELLOW}${cls.name}${ANSI.RESET}\n`);
    send(client, `     ${ANSI.DIM}${cls.description}${ANSI.RESET}\n`);
    send(client, `     Primary: ${cls.primaryStats.join(', ')}\n\n`);
  });

  send(client, `${ANSI.BRIGHT_WHITE}Enter choice (1-${classEntries.length}):${ANSI.RESET} `);
  client.state = 'create_class';
}

/**
 * Handle class selection input.
 */
function handleCreateClass(client: TelnetClient, input: string): void {
  if (!client.playerId || !client.pendingName) return;

  const classEntries = Object.entries(CLASSES);
  const index = parseInt(input, 10) - 1;

  if (index < 0 || index >= classEntries.length) {
    send(client, `${ANSI.BRIGHT_RED}Invalid choice. Enter 1-${classEntries.length}:${ANSI.RESET} `);
    return;
  }

  const [className] = classEntries[index]!;

  try {
    // Create the session
    const { session, worldSeed } = sessionManager.createSession(
      client.id,
      client.pendingName,
      className as ClassName
    );

    // Save to database (including owned items for restoration)
    const ownedItems = getOwnedItems(session.player, session.world);
    const characterRecord = createCharacter(
      client.playerId,
      session.player,
      worldSeed,
      session.world.time.totalMinutes,
      ownedItems
    );

    session.characterId = characterRecord.id;
    client.session = session;
    client.state = 'playing';

    // Record initial location visit
    recordVisit(characterRecord.id, session.player.locationId);

    // Send intro
    send(client, `\n${ANSI.CYAN}═══════════════════════════════════════════════════════════${ANSI.RESET}\n`);
    send(client, `  ${ANSI.BRIGHT_GREEN}Welcome, ${session.player.name} the ${CLASSES[className as ClassName].name}!${ANSI.RESET}\n`);
    send(client, `${ANSI.CYAN}═══════════════════════════════════════════════════════════${ANSI.RESET}\n\n`);

    send(client, `You awaken in the warmth of The Rusty Blade Inn, the smell of\n`);
    send(client, `wood smoke and fresh bread filling the air. Outside, the town\n`);
    send(client, `of Easthollow stirs to life. Beyond its walls, the wilderness\n`);
    send(client, `awaits those brave enough to explore its mysteries.\n\n`);
    send(client, `${ANSI.BRIGHT_YELLOW}Your adventure begins...${ANSI.RESET}\n\n`);

    // Auto-look
    const lookResult = executeCommand(session, 'look');
    sendOutput(client, lookResult.output);
    sendPrompt(client);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create character.';
    send(client, `${ANSI.BRIGHT_RED}Error: ${errorMessage}${ANSI.RESET}\n`);
    showCharacterMenu(client);
  }
}

/**
 * Load an existing character.
 */
function loadCharacter(client: TelnetClient, characterId: string): void {
  const character = findCharacterById(characterId);

  if (!character) {
    send(client, `${ANSI.BRIGHT_RED}Character not found.${ANSI.RESET}\n`);
    showCharacterMenu(client);
    return;
  }

  if (sessionManager.hasActiveCharacter(character.id)) {
    send(client, `${ANSI.BRIGHT_RED}That character is already active in another session.${ANSI.RESET}\n`);
    showCharacterMenu(client);
    return;
  }

  try {
    const session = restoreSession(client.id, character);
    sessionManager.setSession(client.id, session);
    client.session = session;
    client.state = 'playing';

    send(client, `\n${ANSI.BRIGHT_GREEN}Welcome back, ${session.player.name}!${ANSI.RESET}\n`);
    send(client, `${ANSI.BRIGHT_YELLOW}Your adventure continues...${ANSI.RESET}\n\n`);

    // Auto-look
    const lookResult = executeCommand(session, 'look');
    sendOutput(client, lookResult.output);
    sendPrompt(client);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load character.';
    send(client, `${ANSI.BRIGHT_RED}Error: ${errorMessage}${ANSI.RESET}\n`);
    showCharacterMenu(client);
  }
}

/**
 * Handle a game command.
 */
function handleGameCommand(client: TelnetClient, input: string): void {
  if (!client.session) {
    send(client, `${ANSI.BRIGHT_RED}No active session.${ANSI.RESET}\n`);
    return;
  }

  const trimmedInput = input.trim().toLowerCase();

  // Handle quit/logout
  if (trimmedInput === 'quit' || trimmedInput === 'logout' || trimmedInput === 'exit') {
    saveCharacterState(client.session);
    send(client, `\n${ANSI.BRIGHT_YELLOW}Farewell, ${client.session.player.name}. Your progress has been saved.${ANSI.RESET}\n`);
    send(client, `${ANSI.DIM}Returning to character selection...${ANSI.RESET}\n\n`);

    sessionManager.removeSession(client.id);
    client.session = undefined;
    showCharacterMenu(client);
    return;
  }

  // Execute the command
  sessionManager.touchSession(client.id);
  const result = executeCommand(client.session, input);
  sendOutput(client, result.output);

  // Save after commands
  if (client.session.characterId) {
    saveCharacterState(client.session);
  }

  sendPrompt(client);
}

/**
 * Send raw text to client.
 */
function send(client: TelnetClient, text: string): void {
  if (!client.socket.destroyed) {
    client.socket.write(text);
  }
}

/**
 * Send styled output lines to client.
 */
function sendOutput(client: TelnetClient, lines: OutputLine[]): void {
  for (const line of lines) {
    const color = STYLE_COLORS[line.style ?? 'normal'] ?? ANSI.WHITE;
    send(client, `${color}${line.text}${ANSI.RESET}\n`);
  }
}

/**
 * Send the game prompt with status info.
 */
function sendPrompt(client: TelnetClient): void {
  if (!client.session) return;

  const { player } = client.session;
  const { combatStats: _combatStats } = client.session;

  // Calculate HP color
  const hpPercent = player.currentHp / player.maxHp;
  const hpColor = hpPercent < 0.33 ? ANSI.BRIGHT_RED :
                  hpPercent < 0.66 ? ANSI.BRIGHT_YELLOW : ANSI.BRIGHT_GREEN;

  // Calculate MP color
  const mpPercent = player.currentMp / player.maxMp;
  const mpColor = mpPercent < 0.33 ? ANSI.BRIGHT_RED :
                  mpPercent < 0.66 ? ANSI.BRIGHT_YELLOW : ANSI.BRIGHT_BLUE;

  // Build status line
  const hp = `${hpColor}HP:${player.currentHp}/${player.maxHp}${ANSI.RESET}`;
  const mp = `${mpColor}MP:${player.currentMp}/${player.maxMp}${ANSI.RESET}`;
  const xp = `${ANSI.BRIGHT_MAGENTA}XP:${player.xp}${ANSI.RESET}`;
  const currency = `${ANSI.BRIGHT_YELLOW}${formatCurrency(player.currency)}${ANSI.RESET}`;

  // Combat status
  let combatStatus = '';
  if (player.inCombat) {
    combatStatus = ` ${ANSI.BRIGHT_RED}[COMBAT]${ANSI.RESET}`;
  }

  send(client, `\n${ANSI.DIM}[${ANSI.RESET}${hp} ${mp} ${xp} ${currency}${ANSI.DIM}]${ANSI.RESET}${combatStatus}\n`);
  send(client, `${ANSI.BRIGHT_WHITE}> ${ANSI.RESET}`);
}

/**
 * Save session state and clean up on disconnect.
 */
function saveAndCleanup(client: TelnetClient): void {
  if (client.session?.characterId) {
    saveCharacterState(client.session);
    console.log(`Saved telnet character ${client.session.characterId}`);
  }
  sessionManager.removeSession(client.id);
}

/**
 * Broadcast a message to all connected telnet clients in the playing state.
 */
export function broadcastToTelnet(lines: OutputLine[]): void {
  for (const client of clients.values()) {
    if (client.state === 'playing' && client.session) {
      sendOutput(client, lines);
      sendPrompt(client);
    }
  }
}

/**
 * Send output to a specific telnet client by session ID.
 */
export function sendToTelnetSession(sessionId: string, lines: OutputLine[]): void {
  const client = clients.get(sessionId);
  if (client && client.state === 'playing') {
    sendOutput(client, lines);
    sendPrompt(client);
  }
}
