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
  /** Source for "take X from Y" syntax */
  source?: string;
  /** Item being used with a prop verb (e.g., "toss coin well" -> item: "coin") */
  item?: string;
  /** Original raw input */
  raw: string;
}

/** Prop interaction verbs for environmental objects */
export const PROP_VERBS = [
  // Universal
  'use', 'examine', 'look',
  // Positional
  'sit', 'lean', 'kneel', 'stand',
  // Physical
  'push', 'pull', 'lift', 'pry', 'kick', 'dig',
  // Combat
  'attack', 'hit', 'shoot',
  // Social
  'pet', 'feed', 'tip', 'talk', 'wave', 'greet',
  // Sensory
  'smell', 'sniff', 'listen', 'taste', 'feel',
  // Object manipulation
  'light', 'ring', 'blow', 'fill', 'drink', 'read',
  // Special
  'toss', 'throw', 'offer', 'donate', 'pray',
  'warm', 'cool', 'stir', 'pump', 'weigh',
  'scatter', 'shoo', 'whistle', 'watch',
  'search', 'take', 'leave',
];

/** Prop verbs that use an item with a target (e.g., "toss coin well", "offer bread altar") */
const PROP_VERBS_WITH_ITEM = new Set([
  'toss', 'throw', 'offer', 'donate', 'feed', 'fill', 'light',
]);

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
  reply: 'say',
  browse: 'list',
  shop: 'list',
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

  // Handle "take X from Y" syntax
  if ((command === 'take' || command === 'get') && args.length >= 3) {
    const fromIndex = args.findIndex(a => a.toLowerCase() === 'from');
    if (fromIndex > 0 && fromIndex < args.length - 1) {
      const target = args.slice(0, fromIndex).join(' ');
      const source = args.slice(fromIndex + 1).join(' ');
      return {
        command,
        args,
        target,
        source,
        raw,
      };
    }
  }

  // Handle "talk to X" syntax
  if (command === 'talk' && args[0]?.toLowerCase() === 'to' && args.length >= 2) {
    return {
      command,
      args: args.slice(1),
      target: args.slice(1).join(' '),
      raw,
    };
  }

  // Handle prop verbs that use an item with a target (e.g., "toss coin well", "offer bread altar")
  // Pattern: <verb> <item> <target> OR <verb> <item> in/into/at/to <target>
  if (PROP_VERBS_WITH_ITEM.has(command) && args.length >= 2) {
    // Check for preposition patterns: "toss coin into well", "offer bread to altar"
    const prepIndex = args.findIndex(a => ['in', 'into', 'at', 'to'].includes(a.toLowerCase()));
    if (prepIndex > 0 && prepIndex < args.length - 1) {
      const item = args.slice(0, prepIndex).join(' ');
      const target = args.slice(prepIndex + 1).join(' ');
      return {
        command,
        args,
        target,
        item,
        raw,
      };
    }
    // Simple pattern: "toss coin well" - first arg is item, last arg is target
    // For now, treat first token as item, rest as target
    const item = args[0];
    const target = args.slice(1).join(' ');
    return {
      command,
      args,
      target,
      item,
      raw,
    };
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
 * Check if a command is a prop interaction verb.
 */
export function isPropVerb(command: string): boolean {
  return PROP_VERBS.includes(command);
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
