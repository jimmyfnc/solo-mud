/**
 * Command parser - parses player input into structured commands.
 */

export interface ParsedCommand {
  /** The normalized command name */
  command: string;
  /** Arguments after the command */
  args: string[];
  /** First argument (common pattern for targets) */
  target?: string;
  /** Original raw input */
  raw: string;
}

/** Direction shortcuts */
const DIRECTION_SHORTCUTS: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  u: 'up',
  d: 'down',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
};

/** Command aliases */
const COMMAND_ALIASES: Record<string, string> = {
  l: 'look',
  i: 'inventory',
  inv: 'inventory',
  get: 'take',
  grab: 'take',
  pickup: 'take',
  exam: 'examine',
  ex: 'examine',
  eq: 'equipment',
  att: 'attack',
  kill: 'attack',
  k: 'attack',
  '?': 'help',
  quit: 'exit',
  logout: 'exit',
};

/**
 * Parse a raw input string into a structured command.
 */
export function parseCommand(input: string): ParsedCommand {
  const raw = input;
  const trimmed = input.trim();

  if (!trimmed) {
    return { command: '', args: [], raw };
  }

  // Parse tokens, handling quoted strings
  const tokens = tokenize(trimmed);

  if (tokens.length === 0) {
    return { command: '', args: [], raw };
  }

  // First token is the command (lowercase)
  let command = tokens[0]!.toLowerCase();
  const args = tokens.slice(1);

  // Apply direction shortcuts (single letter becomes full direction)
  if (DIRECTION_SHORTCUTS[command]) {
    command = DIRECTION_SHORTCUTS[command]!;
  }

  // Apply command aliases
  if (COMMAND_ALIASES[command]) {
    command = COMMAND_ALIASES[command]!;
  }

  return {
    command,
    args,
    target: args[0],
    raw,
  };
}

/**
 * Tokenize input, handling quoted strings as single tokens.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (inQuotes) {
      if (char === quoteChar) {
        // End of quoted string
        if (current) {
          tokens.push(current);
          current = '';
        }
        inQuotes = false;
        quoteChar = '';
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      // Start of quoted string
      if (current) {
        tokens.push(current);
        current = '';
      }
      inQuotes = true;
      quoteChar = char;
    } else if (char === ' ' || char === '\t') {
      // Whitespace - end current token
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Don't forget the last token
  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Check if a command is a movement command.
 */
export function isMovementCommand(command: string): boolean {
  const movementCommands = [
    'go', 'move', 'walk', 'run',
    'north', 'south', 'east', 'west', 'up', 'down',
    'northeast', 'northwest', 'southeast', 'southwest',
  ];
  return movementCommands.includes(command);
}

/**
 * Get the direction from a movement command.
 * Returns { direction, destination } where destination is used for disambiguation.
 * Supports: "go north", "go passage", "go passage to Hollow"
 */
export function getDirection(parsed: ParsedCommand): { direction: string; destination?: string } | undefined {
  const { command, args } = parsed;

  // Direct direction command (compass directions)
  const directions = [
    'north', 'south', 'east', 'west', 'up', 'down',
    'northeast', 'northwest', 'southeast', 'southwest',
  ];

  if (directions.includes(command)) {
    return { direction: command };
  }

  // "go <direction>" style
  if (command === 'go' || command === 'move' || command === 'walk') {
    let dir = args[0]?.toLowerCase();
    if (!dir) {
      return undefined;
    }

    // Check shortcuts in args
    if (DIRECTION_SHORTCUTS[dir]) {
      dir = DIRECTION_SHORTCUTS[dir]!;
    }

    // Check for "to <destination>" syntax for disambiguation
    // e.g., "go passage to Hollow" -> direction: "passage", destination: "Hollow"
    const toIndex = args.findIndex(a => a.toLowerCase() === 'to');
    if (toIndex > 0 && toIndex < args.length - 1) {
      const destination = args.slice(toIndex + 1).join(' ');
      return { direction: dir, destination };
    }

    // Return the direction (can be compass or custom exit label like "passage")
    return { direction: dir };
  }

  return undefined;
}
