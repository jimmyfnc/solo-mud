/**
 * Command handlers - execute player commands.
 */

import type { OutputLine, Location, Exit, Item } from '@solo-mud/shared';
import type { GameSession } from '../game/session';
import { parseCommand, getDirection, type ParsedCommand } from './parser';

export interface CommandContext {
  session: GameSession;
  parsed: ParsedCommand;
}

export interface CommandResult {
  output: OutputLine[];
  updateRoom?: boolean;
  updatePlayer?: boolean;
}

type CommandHandler = (ctx: CommandContext) => CommandResult;

/**
 * Registry of command handlers.
 */
const handlers: Record<string, CommandHandler> = {
  look: handleLook,
  examine: handleExamine,
  help: handleHelp,
  inventory: handleInventory,
  // Movement commands
  north: handleMove,
  south: handleMove,
  east: handleMove,
  west: handleMove,
  up: handleMove,
  down: handleMove,
  go: handleMove,
};

/**
 * Execute a command and return the result.
 */
export function executeCommand(session: GameSession, input: string): CommandResult {
  const parsed = parseCommand(input);

  if (!parsed.command) {
    return {
      output: [{ text: 'What would you like to do?', style: 'system' }],
    };
  }

  const handler = handlers[parsed.command];
  if (!handler) {
    return {
      output: [{ text: `Unknown command: ${parsed.command}`, style: 'error' }],
    };
  }

  return handler({ session, parsed });
}

/**
 * Handle the "look" command - describe the current location.
 */
function handleLook(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { world, player } = session;
  const location = world.locations[player.locationId];

  if (!location) {
    return {
      output: [{ text: 'You are nowhere. This should not happen.', style: 'error' }],
    };
  }

  // Update visit count
  location.visitState.visitCount++;
  location.visitState.lastVisitTime = Date.now();
  if (!location.visitState.firstVisitTime) {
    location.visitState.firstVisitTime = Date.now();
  }

  const output: OutputLine[] = [];

  // Location name
  output.push({ text: `[ ${location.name} ]`, style: 'system' });

  // Description based on biome and props
  const description = generateLocationDescription(location);
  output.push({ text: description, style: 'normal' });

  // Props
  if (location.props.length > 0) {
    output.push({ text: `You notice: ${location.props.join(', ')}.`, style: 'normal' });
  }

  // Items
  const items = location.items.map(id => world.items[id]).filter(Boolean) as Item[];
  if (items.length > 0) {
    const itemNames = items.map(i => i.name).join(', ');
    output.push({ text: `Items here: ${itemNames}`, style: 'success' });
  }

  // Exits
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];
  if (exits.length > 0) {
    const exitLabels = exits.map(e => {
      const lockIndicator = e.type === 'locked' ? ' [locked]' : '';
      return `${e.label}${lockIndicator}`;
    });
    output.push({ text: `Exits: ${exitLabels.join(', ')}`, style: 'system' });
  } else {
    output.push({ text: 'There are no obvious exits.', style: 'system' });
  }

  return { output, updateRoom: true };
}

/**
 * Generate a description for a location based on its biome.
 */
function generateLocationDescription(location: Location): string {
  const biomeEntries = Object.entries(location.biome) as [string, number][];
  biomeEntries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const dominantBiome = biomeEntries[0]?.[0] ?? 'plains';

  const descriptions: Record<string, string[]> = {
    plains: [
      'Open grasslands stretch before you.',
      'The wind sweeps across the open plain.',
      'Tall grass sways gently in the breeze.',
    ],
    forest: [
      'Trees tower around you, their leaves rustling softly.',
      'Dappled sunlight filters through the canopy.',
      'The forest is dense with undergrowth.',
    ],
    hills: [
      'Rocky terrain rises and falls around you.',
      'The hillside offers a commanding view.',
      'Boulders and scrub dot the landscape.',
    ],
    swamp: [
      'Murky water pools between twisted trees.',
      'The air is thick with moisture and decay.',
      'Fog clings to the marshy ground.',
    ],
    mountains: [
      'Jagged peaks rise into the clouds above.',
      'The rocky path winds through the mountains.',
      'Cold wind howls through the mountain pass.',
    ],
    desert: [
      'Endless dunes stretch to the horizon.',
      'The sun beats down mercilessly.',
      'Sand crunches beneath your feet.',
    ],
  };

  const biomeDescriptions = descriptions[dominantBiome] ?? descriptions['plains']!;
  const index = location.visitState.visitCount % biomeDescriptions.length;
  return biomeDescriptions[index]!;
}

/**
 * Handle the "examine" command - look at something specific.
 */
function handleExamine(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;

  if (!parsed.target) {
    return {
      output: [{ text: 'Examine what?', style: 'system' }],
    };
  }

  const { world, player } = session;
  const location = world.locations[player.locationId];

  if (!location) {
    return {
      output: [{ text: 'You cannot examine anything here.', style: 'error' }],
    };
  }

  // Check if examining an item in the room
  const targetLower = parsed.target.toLowerCase();
  const item = location.items
    .map(id => world.items[id])
    .find(i => i?.name.toLowerCase().includes(targetLower));

  if (item) {
    const output: OutputLine[] = [
      { text: `${item.name}`, style: 'system' },
      { text: `Rarity: ${item.rarity}`, style: 'normal' },
      { text: `Tags: ${item.tags.join(', ')}`, style: 'normal' },
    ];
    return { output };
  }

  // Check if examining a prop
  const prop = location.props.find(p => p.toLowerCase().includes(targetLower));
  if (prop) {
    return {
      output: [{ text: `You examine the ${prop}. It looks interesting.`, style: 'normal' }],
    };
  }

  return {
    output: [{ text: `You don't see any "${parsed.target}" here.`, style: 'error' }],
  };
}

/**
 * Handle the "help" command.
 */
function handleHelp(_ctx: CommandContext): CommandResult {
  return {
    output: [
      { text: 'Available commands:', style: 'system' },
      { text: '  look (l) - Examine your surroundings', style: 'normal' },
      { text: '  examine <target> - Look at something closely', style: 'normal' },
      { text: '  go <direction> - Move in a direction', style: 'normal' },
      { text: '  north/south/east/west (n/s/e/w) - Move directly', style: 'normal' },
      { text: '  take <item> - Pick up an item', style: 'normal' },
      { text: '  drop <item> - Drop an item', style: 'normal' },
      { text: '  inventory (i) - Check your inventory', style: 'normal' },
      { text: '  help (?) - Show this help message', style: 'normal' },
    ],
  };
}

/**
 * Handle the "inventory" command.
 */
function handleInventory(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player, world } = session;
  const output: OutputLine[] = [
    { text: '=== Inventory ===', style: 'system' },
  ];

  if (player.inventory.length === 0) {
    output.push({ text: 'Your inventory is empty.', style: 'normal' });
  } else {
    for (const slot of player.inventory) {
      const item = world.items[slot.itemId];
      if (item) {
        const qty = slot.quantity > 1 ? ` (x${slot.quantity})` : '';
        output.push({ text: `  ${item.name}${qty}`, style: 'normal' });
      }
    }
  }

  output.push({ text: `Gold: ${player.gold}`, style: 'success' });
  output.push({ text: `Weight: ${player.carryWeight}/${player.maxCarryWeight}`, style: 'normal' });

  return { output };
}

/**
 * Handle movement commands.
 */
function handleMove(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  const direction = getDirection(parsed);
  if (!direction) {
    return {
      output: [{ text: 'Go where? Specify a direction.', style: 'error' }],
    };
  }

  // Find exit in that direction
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];
  const exit = exits.find(e => e.label.toLowerCase() === direction);

  if (!exit) {
    return {
      output: [{ text: `You cannot go ${direction} from here.`, style: 'error' }],
    };
  }

  // Check if locked
  if (exit.type === 'locked') {
    if (exit.requirement?.kind === 'item') {
      const hasKey = player.inventory.some(slot => slot.itemId === exit.requirement?.value);
      if (!hasKey) {
        return {
          output: [{ text: `The way ${direction} is locked. You need a key.`, style: 'error' }],
        };
      }
      // Has key - unlock and proceed
    }
  }

  // Move player
  player.locationId = exit.to;

  // Auto-look at new location
  const lookResult = handleLook(ctx);

  return {
    output: [
      { text: `You go ${direction}.`, style: 'normal' },
      ...lookResult.output,
    ],
    updateRoom: true,
    updatePlayer: true,
  };
}
