/**
 * Command handlers - execute player commands.
 */

import type { OutputLine, Exit, Item, EquipSlot } from '@solo-mud/shared';
import { createRng } from '@solo-mud/shared';
import type { GameSession } from '../game/session';
import { parseCommand, getDirection, type ParsedCommand } from './parser';
import { generateDescription, generateExitProse, type Biome, type Weather, type ExitInfo } from '../descriptions';

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
  take: handleTake,
  drop: handleDrop,
  equip: handleEquip,
  unequip: handleUnequip,
  equipment: handleEquipment,
  use: handleUse,
  debug: handleDebug,
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
 * Generate room description output.
 * @param session - The game session
 * @param detailed - If true, show tactical breakdown (Items:, Creatures:, Exits: lines)
 * @param updateVisit - If true, increment visit count
 */
function generateRoomOutput(
  session: GameSession,
  detailed: boolean,
  updateVisit: boolean
): OutputLine[] {
  const { world, player } = session;
  const location = world.locations[player.locationId];

  if (!location) {
    return [{ text: 'You are nowhere. This should not happen.', style: 'error' }];
  }

  // Update visit count if requested
  if (updateVisit) {
    location.visitState.visitCount++;
    location.visitState.lastVisitTime = Date.now();
    if (!location.visitState.firstVisitTime) {
      location.visitState.firstVisitTime = Date.now();
    }
  }

  const output: OutputLine[] = [];

  // Location name (without debug ID)
  output.push({ text: `[ ${location.name} ]`, style: 'system' });

  // Get dominant biome
  const biomeEntries = Object.entries(location.biome) as [string, number][];
  biomeEntries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const dominantBiome = (biomeEntries[0]?.[0] ?? 'plains') as Biome;

  // Generate dynamic description using template system
  const descriptionCtx = {
    biome: dominantBiome,
    timeOfDay: world.time.timeOfDay,
    weather: world.weather.type as Weather,
    visitCount: location.visitState.visitCount,
    props: location.props,
    rng: createRng(`${world.seed}-${location.id}-${location.visitState.visitCount}`),
  };
  const description = generateDescription(descriptionCtx);
  output.push({ text: description, style: 'normal' });

  // Get exits for prose generation
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];

  // Generate natural exit prose
  const exitInfos: ExitInfo[] = exits.map(exit => {
    const destLocation = world.locations[exit.to];
    return {
      label: exit.label,
      destination: destLocation?.name ?? 'Unknown',
      isLocked: exit.type === 'locked',
    };
  });
  const exitProse = generateExitProse(exitInfos);
  output.push({ text: exitProse, style: 'normal' });

  // Detailed mode: show tactical breakdown
  if (detailed) {
    // Items
    const items = location.items.map(id => world.items[id]).filter(Boolean) as Item[];
    if (items.length > 0) {
      const itemNames = items.map(i => i.name).join(', ');
      output.push({ text: '', style: 'normal' }); // blank line
      output.push({ text: `Items: ${itemNames}`, style: 'success' });
    }

    // TODO: Creatures line will go here when creatures are implemented

    // Exits breakdown
    if (exits.length > 0) {
      const exitList = exits.map(exit => {
        const destLocation = world.locations[exit.to];
        const destName = destLocation?.name ?? 'Unknown';
        const locked = exit.type === 'locked' ? ' [LOCKED]' : '';
        return `${exit.label} (${destName})${locked}`;
      }).join(', ');
      output.push({ text: `Exits: ${exitList}`, style: 'system' });
    }
  }

  return output;
}

/**
 * Handle the "look" command - describe the current location in detail.
 */
function handleLook(ctx: CommandContext): CommandResult {
  const output = generateRoomOutput(ctx.session, true, true);
  return { output, updateRoom: true };
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
 * Handle the "use" command - use an item or interact with a prop.
 */
function handleUse(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Use what? Specify an item or object.', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot use anything here.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Check inventory first for usable items
  const inventorySlot = player.inventory.find(slot => {
    const item = world.items[slot.itemId];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (inventorySlot) {
    const item = world.items[inventorySlot.itemId];
    if (!item) {
      return {
        output: [{ text: 'That item seems corrupted.', style: 'error' }],
      };
    }

    // Handle different item types
    if (item.tags.includes('key')) {
      // Check if there's a locked exit that uses this key
      const exitIds = world.adjacency[player.locationId] ?? [];
      const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];
      const lockedExit = exits.find(e =>
        e.type === 'locked' &&
        e.requirement?.kind === 'item' &&
        e.requirement.value === inventorySlot.itemId
      );

      if (lockedExit) {
        const destLocation = world.locations[lockedExit.to];
        const destName = destLocation?.name ?? 'somewhere';
        return {
          output: [
            { text: `The ${item.name} fits the lock on the ${lockedExit.label} leading to ${destName}.`, style: 'success' },
            { text: `The way is now open! Use "go ${lockedExit.label}" to proceed.`, style: 'system' },
          ],
        };
      } else {
        return {
          output: [{ text: `The ${item.name} doesn't seem to fit any lock here.`, style: 'normal' }],
        };
      }
    }

    if (item.tags.includes('consumable') || item.tags.includes('potion')) {
      // Consume the item
      if (inventorySlot.quantity > 1) {
        inventorySlot.quantity--;
      } else {
        const slotIndex = player.inventory.indexOf(inventorySlot);
        player.inventory.splice(slotIndex, 1);
      }
      return {
        output: [{ text: `You use the ${item.name}. (Effect not yet implemented)`, style: 'success' }],
        updatePlayer: true,
      };
    }

    return {
      output: [{ text: `You're not sure how to use the ${item.name}.`, style: 'normal' }],
    };
  }

  // Check props in the room
  const prop = location.props.find(p => p.toLowerCase().includes(targetLower));
  if (prop) {
    // Different responses for different prop types
    if (prop.includes('well')) {
      return {
        output: [
          { text: `You peer into the ${prop}. The water below is dark and still.`, style: 'normal' },
          { text: `You could draw some water, but you have nothing to carry it in.`, style: 'system' },
        ],
      };
    }
    if (prop.includes('marker') || prop.includes('obelisk') || prop.includes('statue')) {
      return {
        output: [
          { text: `You touch the ${prop}. Ancient runes seem to glow faintly.`, style: 'normal' },
          { text: `It might be significant, but you cannot decipher its meaning yet.`, style: 'system' },
        ],
      };
    }
    if (prop.includes('campfire') || prop.includes('fire')) {
      return {
        output: [{ text: `You warm your hands by the ${prop}. The flames crackle softly.`, style: 'normal' }],
      };
    }
    return {
      output: [{ text: `You interact with the ${prop}, but nothing special happens.`, style: 'normal' }],
    };
  }

  return {
    output: [{ text: `You don't see any "${parsed.target}" to use.`, style: 'error' }],
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
      { text: '  use <item/object> - Use an item or interact with something', style: 'normal' },
      { text: '  go <direction> - Move in a direction', style: 'normal' },
      { text: '  go <exit> to <destination> - Disambiguate multiple exits', style: 'normal' },
      { text: '  north/south/east/west (n/s/e/w) - Move directly', style: 'normal' },
      { text: '  take <item> - Pick up an item', style: 'normal' },
      { text: '  drop <item> - Drop an item', style: 'normal' },
      { text: '  inventory (i) - Check your inventory', style: 'normal' },
      { text: '  equipment (eq) - View equipped items', style: 'normal' },
      { text: '  equip <item> - Equip an item from inventory', style: 'normal' },
      { text: '  unequip <slot> - Remove equipped item', style: 'normal' },
      { text: '  debug - Show raw room/item data (dev mode)', style: 'normal' },
      { text: '  help (?) - Show this help message', style: 'normal' },
    ],
  };
}

/**
 * Handle the "debug" command - show raw game data for testing.
 */
function handleDebug(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { world, player } = session;
  const location = world.locations[player.locationId];

  const output: OutputLine[] = [
    { text: '=== DEBUG INFO ===', style: 'system' },
    { text: '', style: 'normal' },
    { text: `World Seed: ${world.seed}`, style: 'normal' },
    { text: `Player ID: ${session.playerId}`, style: 'normal' },
    { text: `Location ID: ${player.locationId}`, style: 'normal' },
    { text: '', style: 'normal' },
  ];

  if (location) {
    output.push({ text: '--- LOCATION ---', style: 'system' });
    output.push({ text: `Name: ${location.name}`, style: 'normal' });
    output.push({ text: `Biome: ${JSON.stringify(location.biome)}`, style: 'normal' });
    output.push({ text: `Props: ${JSON.stringify(location.props)}`, style: 'normal' });
    output.push({ text: `Visit Count: ${location.visitState.visitCount}`, style: 'normal' });
    output.push({ text: `Item IDs: ${JSON.stringify(location.items)}`, style: 'normal' });
    output.push({ text: '', style: 'normal' });

    // Show exits with full data
    const exitIds = world.adjacency[player.locationId] ?? [];
    const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];
    output.push({ text: '--- EXITS ---', style: 'system' });
    for (const exit of exits) {
      const destLocation = world.locations[exit.to];
      const destName = destLocation?.name ?? 'Unknown';
      output.push({ text: `  ${exit.id}:`, style: 'normal' });
      output.push({ text: `    Label: ${exit.label} | To: ${exit.to} (${destName})`, style: 'normal' });
      output.push({ text: `    Type: ${exit.type} | Req: ${JSON.stringify(exit.requirement ?? null)}`, style: 'normal' });
    }
    output.push({ text: '', style: 'normal' });

    // Show items in room
    if (location.items.length > 0) {
      output.push({ text: '--- ROOM ITEMS ---', style: 'system' });
      for (const itemId of location.items) {
        const item = world.items[itemId];
        if (item) {
          output.push({ text: `  ${item.id}: ${item.name}`, style: 'normal' });
          output.push({ text: `    Rarity: ${item.rarity} | Tags: ${item.tags.join(', ')}`, style: 'normal' });
        }
      }
      output.push({ text: '', style: 'normal' });
    }
  }

  // Show inventory items
  if (player.inventory.length > 0) {
    output.push({ text: '--- INVENTORY ITEMS ---', style: 'system' });
    for (const slot of player.inventory) {
      const item = world.items[slot.itemId];
      if (item) {
        output.push({ text: `  ${item.id}: ${item.name} (x${slot.quantity})`, style: 'normal' });
        output.push({ text: `    Rarity: ${item.rarity} | Tags: ${item.tags.join(', ')}`, style: 'normal' });
      }
    }
    output.push({ text: '', style: 'normal' });
  }

  // Show adjacent locations summary
  output.push({ text: '--- ADJACENT LOCATIONS ---', style: 'system' });
  const exitIds = world.adjacency[player.locationId] ?? [];
  const adjacentLocIds = new Set(exitIds.map(id => world.exits[id]?.to).filter(Boolean) as string[]);
  for (const locId of adjacentLocIds) {
    const loc = world.locations[locId];
    if (loc) {
      output.push({ text: `  ${locId}: ${loc.name}`, style: 'normal' });
    }
  }

  return { output };
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
 * Handle the "take" command - pick up an item.
 */
function handleTake(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Take what?', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot take anything here.', style: 'error' }],
    };
  }

  // Find item in room matching target
  const targetLower = parsed.target.toLowerCase();
  const itemIndex = location.items.findIndex(id => {
    const item = world.items[id];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (itemIndex === -1) {
    return {
      output: [{ text: `You don't see any "${parsed.target}" here.`, style: 'error' }],
    };
  }

  const itemId = location.items[itemIndex]!;
  const item = world.items[itemId];

  if (!item) {
    return {
      output: [{ text: 'That item seems to have vanished.', style: 'error' }],
    };
  }

  // Check inventory capacity
  if (player.inventory.length >= player.inventorySlots) {
    return {
      output: [{ text: 'Your inventory is full.', style: 'error' }],
    };
  }

  // Remove from room
  location.items.splice(itemIndex, 1);

  // Add to inventory (check if stackable)
  const existingSlot = player.inventory.find(slot => slot.itemId === itemId);
  if (existingSlot) {
    existingSlot.quantity++;
  } else {
    player.inventory.push({ itemId, quantity: 1 });
  }

  return {
    output: [{ text: `You pick up the ${item.name}.`, style: 'success' }],
    updateRoom: true,
    updatePlayer: true,
  };
}

/**
 * Handle the "drop" command - drop an item.
 */
function handleDrop(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Drop what?', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot drop anything here.', style: 'error' }],
    };
  }

  // Find item in inventory matching target
  const targetLower = parsed.target.toLowerCase();
  const slotIndex = player.inventory.findIndex(slot => {
    const item = world.items[slot.itemId];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (slotIndex === -1) {
    return {
      output: [{ text: `You don't have any "${parsed.target}".`, style: 'error' }],
    };
  }

  const slot = player.inventory[slotIndex]!;
  const item = world.items[slot.itemId];

  if (!item) {
    return {
      output: [{ text: 'That item seems corrupted.', style: 'error' }],
    };
  }

  // Remove from inventory (or decrement quantity)
  if (slot.quantity > 1) {
    slot.quantity--;
  } else {
    player.inventory.splice(slotIndex, 1);
  }

  // Add to room
  location.items.push(slot.itemId);

  return {
    output: [{ text: `You drop the ${item.name}.`, style: 'normal' }],
    updateRoom: true,
    updatePlayer: true,
  };
}

/**
 * Handle movement commands.
 * Supports disambiguation with "go <exit> to <destination>" syntax.
 */
function handleMove(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  const dirResult = getDirection(parsed);
  if (!dirResult) {
    return {
      output: [{ text: 'Go where? Specify a direction.', style: 'error' }],
    };
  }

  const { direction, destination } = dirResult;

  // Find all exits matching that direction/label
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];
  const matchingExits = exits.filter(e => e.label.toLowerCase() === direction);

  if (matchingExits.length === 0) {
    return {
      output: [{ text: `You cannot go ${direction} from here.`, style: 'error' }],
    };
  }

  let exit: Exit;

  // Handle disambiguation when multiple exits match
  if (matchingExits.length > 1) {
    if (destination) {
      // User specified a destination - find the matching one
      const destLower = destination.toLowerCase();
      const matchedByDest = matchingExits.find(e => {
        const destLocation = world.locations[e.to];
        const destName = destLocation?.name ?? '';
        return destName.toLowerCase().includes(destLower);
      });

      if (!matchedByDest) {
        const availableDestinations = matchingExits.map(e => {
          const destLocation = world.locations[e.to];
          return destLocation?.name ?? 'Unknown';
        });
        return {
          output: [
            { text: `No ${direction} leads to "${destination}".`, style: 'error' },
            { text: `Available destinations: ${availableDestinations.join(', ')}`, style: 'system' },
          ],
        };
      }
      exit = matchedByDest;
    } else {
      // Multiple exits with same label - show disambiguation options
      const output: OutputLine[] = [
        { text: `There are multiple ways ${direction}. Specify which one:`, style: 'system' },
      ];
      for (const e of matchingExits) {
        const destLocation = world.locations[e.to];
        const destName = destLocation?.name ?? 'Unknown';
        const lockIndicator = e.type === 'locked' ? ' [LOCKED]' : '';
        output.push({ text: `  go ${direction} to ${destName}${lockIndicator}`, style: 'normal' });
      }
      return { output };
    }
  } else {
    exit = matchingExits[0]!;
  }

  // Check if locked
  let usedKeyMessage: OutputLine | null = null;
  if (exit.type === 'locked') {
    if (exit.requirement?.kind === 'item') {
      const keySlot = player.inventory.find(slot => slot.itemId === exit.requirement?.value);
      if (!keySlot) {
        const keyItem = world.items[exit.requirement.value as string];
        const keyName = keyItem?.name ?? 'a key';
        return {
          output: [{ text: `The way ${direction} is locked. You need ${keyName}.`, style: 'error' }],
        };
      }
      // Has key - unlock and proceed
      const keyItem = world.items[keySlot.itemId];
      usedKeyMessage = { text: `You use the ${keyItem?.name ?? 'key'} to unlock the way.`, style: 'success' };
    }
  }

  // Move player
  player.locationId = exit.to;

  // Brief description of new location (not detailed)
  const roomOutput = generateRoomOutput(session, false, true);

  const output: OutputLine[] = [];
  if (usedKeyMessage) {
    output.push(usedKeyMessage);
  }
  output.push({ text: `You go ${direction}.`, style: 'normal' });
  output.push(...roomOutput);

  return {
    output,
    updateRoom: true,
    updatePlayer: true,
  };
}

/** Map item tags to equipment slots */
const TAG_TO_SLOT: Record<string, EquipSlot> = {
  weapon: 'weapon',
  sword: 'weapon',
  axe: 'weapon',
  mace: 'weapon',
  staff: 'weapon',
  dagger: 'weapon',
  bow: 'weapon',
  shield: 'offhand',
  offhand: 'offhand',
  helm: 'head',
  helmet: 'head',
  head: 'head',
  chest: 'chest',
  armor: 'chest',
  gloves: 'hands',
  hands: 'hands',
  gauntlets: 'hands',
  legs: 'legs',
  pants: 'legs',
  leggings: 'legs',
  boots: 'feet',
  feet: 'feet',
  shoes: 'feet',
  ring: 'ring1',
  necklace: 'necklace',
  amulet: 'necklace',
  cloak: 'cloak',
  cape: 'cloak',
};

/** Get equipment slot for an item based on its tags */
function getEquipSlot(item: Item): EquipSlot | null {
  for (const tag of item.tags) {
    const slot = TAG_TO_SLOT[tag.toLowerCase()];
    if (slot) {
      return slot;
    }
  }
  return null;
}

/** Slot display names */
const SLOT_NAMES: Record<EquipSlot, string> = {
  weapon: 'Weapon',
  offhand: 'Off-hand',
  head: 'Head',
  chest: 'Chest',
  hands: 'Hands',
  legs: 'Legs',
  feet: 'Feet',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  necklace: 'Necklace',
  cloak: 'Cloak',
};

/**
 * Handle the "equipment" command - show equipped items.
 */
function handleEquipment(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player, world } = session;
  const output: OutputLine[] = [
    { text: '=== Equipment ===', style: 'system' },
  ];

  const slots: EquipSlot[] = ['weapon', 'offhand', 'head', 'chest', 'hands', 'legs', 'feet', 'ring1', 'ring2', 'necklace', 'cloak'];

  for (const slot of slots) {
    const itemId = player.equipment[slot];
    const item = itemId ? world.items[itemId] : null;
    const slotName = SLOT_NAMES[slot];
    const itemName = item ? item.name : '(empty)';
    output.push({ text: `  ${slotName}: ${itemName}`, style: item ? 'normal' : 'system' });
  }

  return { output };
}

/**
 * Handle the "equip" command - equip an item from inventory.
 */
function handleEquip(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Equip what?', style: 'system' }],
    };
  }

  // Find item in inventory matching target
  const targetLower = parsed.target.toLowerCase();
  const slotIndex = player.inventory.findIndex(slot => {
    const item = world.items[slot.itemId];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (slotIndex === -1) {
    return {
      output: [{ text: `You don't have any "${parsed.target}" in your inventory.`, style: 'error' }],
    };
  }

  const inventorySlot = player.inventory[slotIndex]!;
  const item = world.items[inventorySlot.itemId];

  if (!item) {
    return {
      output: [{ text: 'That item seems corrupted.', style: 'error' }],
    };
  }

  // Determine equipment slot
  const equipSlot = getEquipSlot(item);
  if (!equipSlot) {
    return {
      output: [{ text: `You cannot equip the ${item.name}.`, style: 'error' }],
    };
  }

  // Handle ring slots specially (use ring2 if ring1 is occupied)
  let targetSlot = equipSlot;
  if (equipSlot === 'ring1' && player.equipment.ring1) {
    if (!player.equipment.ring2) {
      targetSlot = 'ring2';
    }
  }

  // Unequip existing item in that slot
  const existingItemId = player.equipment[targetSlot];
  if (existingItemId) {
    // Add to inventory
    const existingSlot = player.inventory.find(s => s.itemId === existingItemId);
    if (existingSlot) {
      existingSlot.quantity++;
    } else {
      player.inventory.push({ itemId: existingItemId, quantity: 1 });
    }
  }

  // Remove from inventory
  if (inventorySlot.quantity > 1) {
    inventorySlot.quantity--;
  } else {
    player.inventory.splice(slotIndex, 1);
  }

  // Equip the item
  player.equipment[targetSlot] = inventorySlot.itemId;

  const output: OutputLine[] = [
    { text: `You equip the ${item.name}.`, style: 'success' },
  ];

  if (existingItemId) {
    const existingItem = world.items[existingItemId];
    if (existingItem) {
      output.push({ text: `(${existingItem.name} moved to inventory)`, style: 'system' });
    }
  }

  return { output, updatePlayer: true };
}

/**
 * Handle the "unequip" command - remove an equipped item.
 */
function handleUnequip(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Unequip what? Specify a slot (weapon, chest, etc.) or item name.', style: 'system' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Try to find by slot name
  const slots: EquipSlot[] = ['weapon', 'offhand', 'head', 'chest', 'hands', 'legs', 'feet', 'ring1', 'ring2', 'necklace', 'cloak'];
  let targetSlot: EquipSlot | null = null;

  // Check if target matches a slot name
  for (const slot of slots) {
    if (slot === targetLower || SLOT_NAMES[slot].toLowerCase() === targetLower) {
      targetSlot = slot;
      break;
    }
  }

  // If not a slot, try to find by item name
  if (!targetSlot) {
    for (const slot of slots) {
      const itemId = player.equipment[slot];
      if (itemId) {
        const item = world.items[itemId];
        if (item?.name.toLowerCase().includes(targetLower)) {
          targetSlot = slot;
          break;
        }
      }
    }
  }

  if (!targetSlot) {
    return {
      output: [{ text: `You don't have "${parsed.target}" equipped.`, style: 'error' }],
    };
  }

  const itemId = player.equipment[targetSlot];
  if (!itemId) {
    return {
      output: [{ text: `Nothing is equipped in the ${SLOT_NAMES[targetSlot]} slot.`, style: 'error' }],
    };
  }

  const item = world.items[itemId];
  if (!item) {
    return {
      output: [{ text: 'That item seems corrupted.', style: 'error' }],
    };
  }

  // Check inventory space
  if (player.inventory.length >= player.inventorySlots) {
    return {
      output: [{ text: 'Your inventory is full. Drop something first.', style: 'error' }],
    };
  }

  // Remove from equipment
  delete player.equipment[targetSlot];

  // Add to inventory
  const existingSlot = player.inventory.find(s => s.itemId === itemId);
  if (existingSlot) {
    existingSlot.quantity++;
  } else {
    player.inventory.push({ itemId, quantity: 1 });
  }

  return {
    output: [{ text: `You unequip the ${item.name}.`, style: 'normal' }],
    updatePlayer: true,
  };
}
