/**
 * Command handlers - execute player commands.
 */

import type { OutputLine, Exit, Item, EquipSlot, Creature, Corpse, Location, NPC } from '@solo-mud/shared';
import { createRng, getWeaponDamage, CREATURE_TEMPLATES, TUTORIAL_STEPS, SHOP_ITEM_TEMPLATES } from '@solo-mud/shared';
import { handleCreatureDeath } from '../game/ecosystem';
import type { GameSession } from '../game/session';
import { parseCommand, getDirection, type ParsedCommand } from './parser';
import { generateDescription, generateExitProse, generateCreatureProse, type Biome, type Weather, type ExitInfo } from '../descriptions';

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
  attack: handleAttack,
  kill: handleAttack,
  flee: handleFlee,
  loot: handleLoot,
  talk: handleTalk,
  say: handleSay,
  tutorial: handleTutorial,
  list: handleList,
  buy: handleBuy,
  sell: handleSell,
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

  // If in conversation and input is a number, treat as dialogue response
  if (session.conversationNpc && /^\d+$/.test(parsed.command)) {
    return handleSay({ session, parsed: { ...parsed, command: 'say', target: parsed.command } });
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

  // Get creatures in this location
  const creatures = location.creatures
    .map(id => world.creatures[id])
    .filter(Boolean) as Creature[];

  // Add creature prose (fits naturally into the description)
  if (creatures.length > 0) {
    const creatureProse = generateCreatureProse(creatures);
    output.push({ text: creatureProse, style: 'normal' });
  }

  // Detailed mode: show tactical breakdown
  if (detailed) {
    // Items
    const items = location.items.map(id => world.items[id]).filter(Boolean) as Item[];
    if (items.length > 0) {
      const itemNames = items.map(i => i.name).join(', ');
      output.push({ text: '', style: 'normal' }); // blank line
      output.push({ text: `Items: ${itemNames}`, style: 'success' });
    }

    // Creatures tactical breakdown
    if (creatures.length > 0) {
      const creatureList = creatures.map(c => {
        const behavior = c.behavior === 'passive' ? '' : ` [${c.behavior.toUpperCase()}]`;
        return `${c.name} (Lvl ${c.level})${behavior}`;
      }).join(', ');
      // Use 'combat' style for aggressive/territorial, 'normal' for passive
      const hasHostile = creatures.some(c => c.behavior !== 'passive');
      output.push({ text: `Creatures: ${creatureList}`, style: hasHostile ? 'combat' : 'normal' });
    }

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
      { text: '  take <item> from <corpse> - Loot an item from a corpse', style: 'normal' },
      { text: '  drop <item> - Drop an item', style: 'normal' },
      { text: '  inventory (i) - Check your inventory', style: 'normal' },
      { text: '  equipment (eq) - View equipped items', style: 'normal' },
      { text: '  equip <item> - Equip an item from inventory', style: 'normal' },
      { text: '  unequip <slot> - Remove equipped item', style: 'normal' },
      { text: '  attack <target> (k) - Attack a creature', style: 'normal' },
      { text: '  flee - Escape from combat (50% chance)', style: 'normal' },
      { text: '  loot [corpse] - Examine a corpse for loot', style: 'normal' },
      { text: '  quit (logout, exit) - Save and return to character select', style: 'normal' },
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

  // Check if taking from a corpse
  if (parsed.source) {
    return handleTakeFromCorpse(ctx, location);
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
 * Handle taking items from a corpse.
 */
function handleTakeFromCorpse(ctx: CommandContext, _location: Location): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;
  const sourceLower = parsed.source!.toLowerCase();
  const targetLower = parsed.target!.toLowerCase();

  // Find the corpse
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );

  const corpse = corpses.find((c) =>
    c.name.toLowerCase().includes(sourceLower) ||
    sourceLower === 'corpse'
  );

  if (!corpse) {
    return {
      output: [{ text: `You don't see a "${parsed.source}" to take from.`, style: 'error' }],
    };
  }

  if (corpse.loot.length === 0) {
    return {
      output: [{ text: `The ${corpse.name}'s corpse has nothing left.`, style: 'normal' }],
    };
  }

  // Handle "take all from corpse"
  if (targetLower === 'all') {
    const taken: string[] = [];
    for (const itemId of [...corpse.loot]) {
      const item = world.items[itemId];
      if (item && player.inventory.length < player.inventorySlots) {
        player.inventory.push({ itemId, quantity: 1 });
        taken.push(item.name);
        const idx = corpse.loot.indexOf(itemId);
        if (idx !== -1) corpse.loot.splice(idx, 1);
      }
    }

    if (taken.length === 0) {
      return {
        output: [{ text: 'Your inventory is full.', style: 'error' }],
      };
    }

    // Mark corpse as looted
    if (corpse.loot.length === 0) {
      corpse.looted = true;
      corpse.lootedAt = Date.now();
    }

    return {
      output: [{ text: `You take ${taken.join(' and ')}.`, style: 'success' }],
      updatePlayer: true,
    };
  }

  // Handle "take 1 from corpse" (by number)
  const numMatch = targetLower.match(/^(\d+)$/);
  if (numMatch) {
    const index = parseInt(numMatch[1]!, 10) - 1;
    if (index < 0 || index >= corpse.loot.length) {
      return {
        output: [{ text: `Invalid number. Use 1-${corpse.loot.length}.`, style: 'error' }],
      };
    }

    const itemId = corpse.loot[index]!;
    const item = world.items[itemId];

    if (player.inventory.length >= player.inventorySlots) {
      return {
        output: [{ text: 'Your inventory is full.', style: 'error' }],
      };
    }

    player.inventory.push({ itemId, quantity: 1 });
    corpse.loot.splice(index, 1);

    if (corpse.loot.length === 0) {
      corpse.looted = true;
      corpse.lootedAt = Date.now();
    }

    return {
      output: [{ text: `You take the ${item?.name ?? 'item'}.`, style: 'success' }],
      updatePlayer: true,
    };
  }

  // Handle "take dagger from corpse" (by name)
  const itemIndex = corpse.loot.findIndex((id) => {
    const item = world.items[id];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (itemIndex === -1) {
    return {
      output: [{ text: `The corpse doesn't have a "${parsed.target}".`, style: 'error' }],
    };
  }

  if (player.inventory.length >= player.inventorySlots) {
    return {
      output: [{ text: 'Your inventory is full.', style: 'error' }],
    };
  }

  const itemId = corpse.loot[itemIndex]!;
  const item = world.items[itemId];

  player.inventory.push({ itemId, quantity: 1 });
  corpse.loot.splice(itemIndex, 1);

  if (corpse.loot.length === 0) {
    corpse.looted = true;
    corpse.lootedAt = Date.now();
  }

  return {
    output: [{ text: `You take the ${item?.name ?? 'item'}.`, style: 'success' }],
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

  // Check for aggressive creatures (aggro on sight)
  const aggroOutput = checkAggro(session);
  if (aggroOutput.length > 0) {
    output.push(...aggroOutput);
  }

  return {
    output,
    updateRoom: true,
    updatePlayer: true,
  };
}

/**
 * Check for aggressive creatures in the player's location and trigger aggro.
 * Returns output lines describing the aggro event.
 */
function checkAggro(session: GameSession): OutputLine[] {
  const { world, player, combatStats } = session;
  const location = world.locations[player.locationId];

  if (!location) return [];

  // Find aggressive creatures that aren't already in combat
  const aggressiveCreatures = location.creatures
    .map((id) => world.creatures[id])
    .filter((c): c is Creature => !!c && c.behavior === 'aggressive' && c.currentHp > 0 && !c.inCombat);

  if (aggressiveCreatures.length === 0) return [];

  const output: OutputLine[] = [];
  const rng = createRng(`aggro-${Date.now()}`);

  // First aggressive creature initiates combat
  const aggressor = aggressiveCreatures[0]!;

  output.push({
    text: `The ${aggressor.name} snarls and attacks you!`,
    style: 'combat',
  });

  // Mark both as in combat
  player.inCombat = true;
  player.targetId = aggressor.id;
  aggressor.inCombat = true;
  aggressor.targetId = player.id;

  // Creature gets a free attack (ambush)
  const creatureHitChance = 0.8; // Slight advantage on aggro
  const creatureHits = rng.next() < creatureHitChance;

  if (!creatureHits) {
    output.push({
      text: `The ${aggressor.name} lunges at you but misses!`,
      style: 'combat',
    });
  } else {
    // Creature damage
    const minDmg = Math.max(1, aggressor.level);
    const maxDmg = Math.max(2, aggressor.level * 2 + 2);
    let damage = minDmg + Math.floor(rng.next() * (maxDmg - minDmg + 1));

    // Apply defense reduction
    const defenseReduction = Math.floor(combatStats.defense / 20);
    damage = Math.max(1, damage - defenseReduction);

    player.currentHp -= damage;

    output.push({
      text: `The ${aggressor.name} hits you for ${damage} damage!`,
      style: 'combat',
    });

    // Show player HP
    const hpPercent = Math.floor((player.currentHp / player.maxHp) * 100);
    output.push({
      text: `Your HP: ${player.currentHp}/${player.maxHp} (${hpPercent}%)`,
      style: player.currentHp < player.maxHp * 0.3 ? 'error' : 'system',
    });

    if (player.currentHp <= 0) {
      output.push({
        text: 'You have been slain!',
        style: 'error',
      });
      player.currentHp = 1; // Prevent death for now
    }
  }

  // Note other aggressive creatures
  if (aggressiveCreatures.length > 1) {
    const others = aggressiveCreatures.slice(1);
    const names = others.map((c) => c.name).join(', ');
    output.push({
      text: `${others.length > 1 ? 'Other hostile creatures' : 'Another hostile creature'} nearby: ${names}`,
      style: 'combat',
    });
  }

  return output;
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

/**
 * Handle the "attack" command - attack a creature.
 */
function handleAttack(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player, combatStats } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Attack what? Specify a target.', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot attack anything here.', style: 'error' }],
    };
  }

  // Find creature by name
  const targetLower = parsed.target.toLowerCase();
  let targetCreature: Creature | undefined;

  for (const creatureId of location.creatures) {
    const creature = world.creatures[creatureId];
    if (creature && creature.name.toLowerCase().includes(targetLower)) {
      targetCreature = creature;
      break;
    }
  }

  if (!targetCreature) {
    return {
      output: [{ text: `You don't see any "${parsed.target}" here to attack.`, style: 'error' }],
    };
  }

  // Check if creature is already dead
  if (targetCreature.currentHp <= 0) {
    return {
      output: [{ text: `The ${targetCreature.name} is already dead.`, style: 'error' }],
    };
  }

  const output: OutputLine[] = [];

  // Get player's weapon
  const weaponId = player.equipment.weapon;
  const weapon = weaponId ? world.items[weaponId] : undefined;
  const weaponName = weapon?.name ?? 'bare hands';

  // Calculate player damage
  const weaponDamage = weapon ? getWeaponDamage(weapon) : { min: 1, max: 2 };
  const rng = createRng(`${world.seed}-combat-${Date.now()}`);

  // Roll to hit (85% base + DEX bonus)
  const hitChance = 0.85 + (combatStats.hitChance / 100) * 0.15;
  const playerHits = rng.next() < hitChance;

  if (!playerHits) {
    output.push({
      text: `You swing your ${weaponName} at the ${targetCreature.name} but miss!`,
      style: 'combat',
    });
  } else {
    // Calculate damage
    const baseDamage = weaponDamage.min + Math.floor(rng.next() * (weaponDamage.max - weaponDamage.min + 1));
    const attackBonus = Math.floor(combatStats.attackPower / 10);

    // Check for crit
    const critChance = combatStats.critChance / 100;
    const isCrit = rng.next() < critChance;
    const critMultiplier = isCrit ? 2 : 1;

    const damage = Math.max(1, (baseDamage + attackBonus) * critMultiplier);

    // Apply damage
    targetCreature.currentHp -= damage;

    if (isCrit) {
      output.push({
        text: `CRITICAL HIT! You strike the ${targetCreature.name} with your ${weaponName} for ${damage} damage!`,
        style: 'combat',
      });
    } else {
      output.push({
        text: `You hit the ${targetCreature.name} with your ${weaponName} for ${damage} damage.`,
        style: 'combat',
      });
    }

    // Special handling for training dummy - reset HP and complete tutorial
    if (targetCreature.templateId === 'training_dummy') {
      targetCreature.currentHp = targetCreature.maxHp; // Reset HP

      if (!player.tutorial.completedSteps.includes('hit_dummy')) {
        player.tutorial.completedSteps.push('hit_dummy');
        output.push({ text: '', style: 'normal' });
        output.push({ text: '[Tutorial] Combat practice complete!', style: 'success' });
      }

      output.push({ text: 'The training dummy wobbles but stays upright, ready for more.', style: 'normal' });

      return {
        output,
        updatePlayer: true,
      };
    }

    // Check if creature died
    if (targetCreature.currentHp <= 0) {
      output.push({
        text: `The ${targetCreature.name} collapses and dies!`,
        style: 'success',
      });

      // Get template for tier
      const template = CREATURE_TEMPLATES[targetCreature.templateId];
      const tier = template?.tier ?? 'common';

      // Generate loot (placeholder - use existing loot system or empty for now)
      const loot: string[] = [];
      // TODO: Generate actual loot based on creature template

      // Use ecosystem death handler
      handleCreatureDeath(world, targetCreature, 'player', tier, loot);

      // Calculate rewards
      const xpReward = targetCreature.level * 10;
      const goldReward = targetCreature.behavior === 'passive' ? 0 : Math.floor(targetCreature.level * (2 + rng.next() * 3));

      player.xp += xpReward;
      player.gold += goldReward;

      output.push({
        text: `You gain ${xpReward} XP${goldReward > 0 ? ` and ${goldReward} gold` : ''}.`,
        style: 'success',
      });

      // Note about looting
      output.push({
        text: `Use "loot ${targetCreature.name.toLowerCase()}" to check the corpse.`,
        style: 'system',
      });

      // Check for level up
      if (player.xp >= player.xpToNextLevel) {
        player.level++;
        player.xpToNextLevel = player.level * 100 + (player.level - 1) * 50;
        output.push({
          text: `LEVEL UP! You are now level ${player.level}!`,
          style: 'success',
        });
      }

      // Mark player not in combat
      player.inCombat = false;
      player.targetId = undefined;

      return { output, updateRoom: true, updatePlayer: true };
    } else {
      // Show creature HP
      const hpPercent = Math.floor((targetCreature.currentHp / targetCreature.maxHp) * 100);
      output.push({
        text: `${targetCreature.name}: ${targetCreature.currentHp}/${targetCreature.maxHp} HP (${hpPercent}%)`,
        style: 'system',
      });
    }
  }

  // Set player in combat
  player.inCombat = true;
  player.targetId = targetCreature.id;
  targetCreature.inCombat = true;
  targetCreature.targetId = player.id;

  // Creature counter-attacks (if not dead and not passive)
  // Passive creatures don't fight back - they just bleat sadly
  if (targetCreature.currentHp > 0 && targetCreature.behavior !== 'passive') {
    // Creature hit chance
    const creatureHitChance = 0.75;
    const creatureHits = rng.next() < creatureHitChance;

    if (!creatureHits) {
      output.push({
        text: `The ${targetCreature.name} attacks but misses!`,
        style: 'combat',
      });
    } else {
      // Creature damage scales with level
      const minDmg = Math.max(1, targetCreature.level);
      const maxDmg = Math.max(2, targetCreature.level * 2 + 2);
      let creatureDamage = minDmg + Math.floor(rng.next() * (maxDmg - minDmg + 1));

      // Apply defense reduction
      const defenseReduction = Math.floor(combatStats.defense / 20);
      creatureDamage = Math.max(1, creatureDamage - defenseReduction);

      player.currentHp -= creatureDamage;

      output.push({
        text: `The ${targetCreature.name} hits you for ${creatureDamage} damage!`,
        style: 'combat',
      });

      // Show player HP
      const hpPercent = Math.floor((player.currentHp / player.maxHp) * 100);
      output.push({
        text: `Your HP: ${player.currentHp}/${player.maxHp} (${hpPercent}%)`,
        style: player.currentHp < player.maxHp * 0.3 ? 'error' : 'system',
      });

      // Check if player died
      if (player.currentHp <= 0) {
        output.push({
          text: 'You have been slain!',
          style: 'error',
        });
        // TODO: Handle player death properly
        player.currentHp = 1; // For now, just prevent going below 1
      }
    }
  } else if (targetCreature.currentHp > 0 && targetCreature.behavior === 'passive') {
    // Passive creature reaction
    output.push({
      text: `The ${targetCreature.name} bleats in fear but doesn't fight back.`,
      style: 'normal',
    });
  }

  return { output, updateRoom: true, updatePlayer: true };
}

/**
 * Handle the "flee" command - escape from combat.
 */
function handleFlee(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player } = session;

  if (!player.inCombat) {
    return {
      output: [{ text: "You're not in combat.", style: 'system' }],
    };
  }

  // 50% chance to flee successfully
  const rng = createRng(`flee-${Date.now()}`);
  const fleeSuccess = rng.next() < 0.5;

  if (fleeSuccess) {
    player.inCombat = false;
    player.targetId = undefined;
    return {
      output: [{ text: 'You flee from combat!', style: 'success' }],
      updatePlayer: true,
    };
  } else {
    return {
      output: [{ text: 'You try to flee but fail! The enemy blocks your escape.', style: 'error' }],
    };
  }
}

/**
 * Handle the "loot" command - examine a corpse for items.
 */
function handleLoot(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot loot anything here.', style: 'error' }],
    };
  }

  // Find corpses in this location
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );

  if (corpses.length === 0) {
    return {
      output: [{ text: 'There are no corpses here to loot.', style: 'error' }],
    };
  }

  // If no target specified, use the only corpse or prompt
  let targetCorpse: Corpse | undefined;

  if (!parsed.target) {
    if (corpses.length === 1) {
      targetCorpse = corpses[0];
    } else {
      const names = corpses.map((c) => c.name).join(', ');
      return {
        output: [
          { text: 'Multiple corpses here. Specify which one:', style: 'system' },
          { text: `  ${names}`, style: 'normal' },
        ],
      };
    }
  } else {
    const targetLower = parsed.target.toLowerCase();
    targetCorpse = corpses.find((c) =>
      c.name.toLowerCase().includes(targetLower)
    );
  }

  if (!targetCorpse) {
    return {
      output: [{ text: `You don't see a "${parsed.target}" corpse here.`, style: 'error' }],
    };
  }

  // Show loot
  if (targetCorpse.loot.length === 0) {
    return {
      output: [{ text: `The ${targetCorpse.name}'s corpse has nothing left of value.`, style: 'normal' }],
    };
  }

  const output: OutputLine[] = [
    { text: `The ${targetCorpse.name}'s corpse contains:`, style: 'system' },
  ];

  targetCorpse.loot.forEach((itemId, index) => {
    const item = world.items[itemId];
    const name = item?.name ?? 'Unknown item';
    output.push({ text: `  ${index + 1}. ${name}`, style: 'normal' });
  });

  return { output };
}

/**
 * Handle the "talk" command - talk to an NPC.
 */
function handleTalk(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Talk to whom? Try "talk <name>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot talk to anyone here.', style: 'error' }],
    };
  }

  // Find NPCs in this location
  const npcIds = location.npcs ?? [];
  if (npcIds.length === 0) {
    return {
      output: [{ text: 'There is no one here to talk to.', style: 'error' }],
    };
  }

  // Find the NPC by name
  const targetLower = parsed.target.toLowerCase();
  const npc = npcIds
    .map(id => world.npcs[id])
    .filter((n): n is NPC => n !== undefined)
    .find(n => n.name.toLowerCase().includes(targetLower));

  if (!npc) {
    return {
      output: [{ text: `You don't see "${parsed.target}" here.`, style: 'error' }],
    };
  }

  // Show NPC greeting and dialogue options
  const output: OutputLine[] = [];
  const title = npc.title ? `${npc.title} ` : '';
  output.push({ text: `${title}${npc.name} turns to you.`, style: 'normal' });

  if (npc.dialogue.length > 0) {
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'What would you like to discuss?', style: 'system' });
    npc.dialogue.forEach((topic, index) => {
      output.push({ text: `  ${index + 1}. ${topic.prompt}`, style: 'normal' });
    });
    output.push({ text: '', style: 'normal' });
    output.push({ text: `Type a number or "say <topic>" to respond.`, style: 'system' });
  }

  // Store current conversation for follow-up
  session.conversationNpc = npc.id;

  return { output };
}

/**
 * Handle the "say" command - respond to NPC dialogue.
 */
function handleSay(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!session.conversationNpc) {
    return {
      output: [{ text: "You're not talking to anyone. Use 'talk <npc>' first.", style: 'error' }],
    };
  }

  const npc = world.npcs[session.conversationNpc];
  if (!npc) {
    session.conversationNpc = undefined;
    return {
      output: [{ text: 'That person seems to have left.', style: 'error' }],
    };
  }

  // Check if player is still in same location
  const location = world.locations[player.locationId];
  if (!location?.npcs?.includes(npc.id)) {
    session.conversationNpc = undefined;
    return {
      output: [{ text: `${npc.name} is no longer here.`, style: 'error' }],
    };
  }

  // Find the dialogue option - by number or keyword
  let topic = npc.dialogue.find((_, i) => parsed.target === String(i + 1));

  if (!topic && parsed.target) {
    const targetLower = parsed.target.toLowerCase();
    topic = npc.dialogue.find(t =>
      t.prompt.toLowerCase().includes(targetLower) ||
      t.id.toLowerCase().includes(targetLower)
    );
  }

  if (!topic) {
    return {
      output: [
        { text: `${npc.name} doesn't understand what you mean.`, style: 'normal' },
        { text: 'Pick a number from the list, or a keyword from one of the options.', style: 'system' },
      ],
    };
  }

  const output: OutputLine[] = [];
  const title = npc.title ? `${npc.title} ` : '';
  output.push({ text: `${title}${npc.name}: "${topic.response}"`, style: 'normal' });

  // Check if this completes a tutorial step
  if (topic.teachesCommand && !player.tutorial.completedSteps.includes(topic.teachesCommand)) {
    player.tutorial.completedSteps.push(topic.teachesCommand);
    output.push({ text: '', style: 'normal' });
    output.push({ text: `[Tutorial] ${topic.teachesCommand} complete!`, style: 'success' });
  }

  // Show remaining options or end conversation
  const remainingTopics = npc.dialogue.filter(t => t.id !== topic!.id && t.id !== 'farewell');
  if (remainingTopics.length > 0) {
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'Anything else?', style: 'system' });
    npc.dialogue.forEach((t, index) => {
      output.push({ text: `  ${index + 1}. ${t.prompt}`, style: 'normal' });
    });
  } else {
    session.conversationNpc = undefined;
  }

  // End conversation on farewell
  if (topic.id === 'farewell') {
    session.conversationNpc = undefined;
  }

  return { output, updatePlayer: true };
}

/**
 * Handle the "tutorial" command - show tutorial progress.
 */
function handleTutorial(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player } = session;

  if (player.tutorial.complete) {
    return {
      output: [{ text: 'Tutorial complete! You know all you need to venture forth.', style: 'success' }],
    };
  }

  if (player.tutorial.skipped) {
    return {
      output: [{ text: 'Tutorial skipped. Use "help" if you need command reminders.', style: 'system' }],
    };
  }

  const output: OutputLine[] = [
    { text: 'Tutorial Progress:', style: 'system' },
  ];

  for (const step of TUTORIAL_STEPS) {
    const done = player.tutorial.completedSteps.includes(step.id);
    const mark = done ? '[✓]' : '[ ]';
    output.push({ text: `  ${mark} ${step.description}`, style: done ? 'success' : 'normal' });
  }

  const completed = player.tutorial.completedSteps.length;
  output.push({ text: '', style: 'normal' });
  output.push({ text: `${completed}/${TUTORIAL_STEPS.length} steps complete`, style: 'system' });

  return { output };
}

/**
 * Handle the "list" command - show shop inventory.
 */
function handleList(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { world, player } = session;

  const location = world.locations[player.locationId];
  if (!location?.npcs?.length) {
    return {
      output: [{ text: 'There is no shop here.', style: 'error' }],
    };
  }

  // Find merchant NPC
  const merchant = location.npcs
    .map(id => world.npcs[id])
    .find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  const output: OutputLine[] = [
    { text: `${merchant.name}'s Wares:`, style: 'system' },
    { text: '', style: 'normal' },
  ];

  for (const item of merchant.shop.items) {
    const template = SHOP_ITEM_TEMPLATES[item.baseId];
    const name = template?.name ?? item.baseId;
    const price = Math.ceil(item.basePrice * merchant.shop.buyMultiplier);
    const stock = item.stock !== undefined ? ` (${item.stock} in stock)` : '';
    output.push({ text: `  ${name} - ${price}g${stock}`, style: 'normal' });
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: `Your gold: ${player.gold}`, style: 'system' });
  output.push({ text: "Use 'buy <item>' to purchase.", style: 'system' });

  // Mark tutorial step
  if (!player.tutorial.completedSteps.includes('visit_shop')) {
    player.tutorial.completedSteps.push('visit_shop');
    output.push({ text: '', style: 'normal' });
    output.push({ text: '[Tutorial] Visited a shop!', style: 'success' });
  }

  return { output, updatePlayer: true };
}

/**
 * Handle the "buy" command - purchase from shop.
 */
function handleBuy(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Buy what? Try "buy <item>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  const merchant = location?.npcs
    ?.map(id => world.npcs[id])
    .find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Find the item in shop
  const shopItem = merchant.shop.items.find(item => {
    const template = SHOP_ITEM_TEMPLATES[item.baseId];
    return template?.name.toLowerCase().includes(targetLower) || item.baseId.includes(targetLower);
  });

  if (!shopItem) {
    return {
      output: [{ text: `${merchant.name} doesn't sell "${parsed.target}".`, style: 'error' }],
    };
  }

  const template = SHOP_ITEM_TEMPLATES[shopItem.baseId];
  const price = Math.ceil(shopItem.basePrice * merchant.shop.buyMultiplier);

  // Check gold
  if (player.gold < price) {
    return {
      output: [{ text: `You need ${price} gold but only have ${player.gold}.`, style: 'error' }],
    };
  }

  // Check stock
  if (shopItem.stock !== undefined && shopItem.stock <= 0) {
    return {
      output: [{ text: `${merchant.name} is out of ${template?.name ?? shopItem.baseId}.`, style: 'error' }],
    };
  }

  // Check inventory space
  if (player.inventory.length >= player.inventorySlots) {
    return {
      output: [{ text: 'Your inventory is full.', style: 'error' }],
    };
  }

  // Create the item - generate a unique ID
  const itemId = `item_shop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newItem = {
    id: itemId,
    baseId: shopItem.baseId,
    name: template?.name ?? shopItem.baseId,
    tags: template?.tags ?? [],
    rarity: 'common' as const,
    affixes: [],
  };

  // Complete purchase
  player.gold -= price;
  if (shopItem.stock !== undefined) {
    shopItem.stock--;
  }
  world.items[newItem.id] = newItem;
  player.inventory.push({ itemId: newItem.id, quantity: 1 });

  return {
    output: [{ text: `You buy ${newItem.name} for ${price} gold.`, style: 'success' }],
    updatePlayer: true,
  };
}

/**
 * Handle the "sell" command - sell to shop.
 */
function handleSell(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Sell what? Try "sell <item>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  const merchant = location?.npcs
    ?.map(id => world.npcs[id])
    .find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Find item in inventory
  const invIndex = player.inventory.findIndex(slot => {
    const item = world.items[slot.itemId];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (invIndex === -1) {
    return {
      output: [{ text: `You don't have "${parsed.target}".`, style: 'error' }],
    };
  }

  const slot = player.inventory[invIndex]!;
  const item = world.items[slot.itemId]!;

  // Calculate sell price (base 10g for common items)
  const basePrice = 10;
  const sellPrice = Math.floor(basePrice * merchant.shop.sellMultiplier);

  // Complete sale
  player.gold += sellPrice;
  player.inventory.splice(invIndex, 1);

  return {
    output: [{ text: `You sell ${item.name} for ${sellPrice} gold.`, style: 'success' }],
    updatePlayer: true,
  };
}
