/**
 * Command handlers - execute player commands.
 */

import type { OutputLine, Exit, Item, EquipSlot, Creature, Corpse, Container, Location, StatusEffect, Spell, Player, Rng, NPC, PropDefinition } from '@solo-mud/shared';
import { createRng, getWeaponDamage, CREATURE_TEMPLATES, TUTORIAL_STEPS, SHOP_ITEM_TEMPLATES, CONSUMABLE_EFFECTS, getDrunkLevel, checkDrunkStumble, getRandomStumbleText, xpForLevel, calculateXpGain, CLASSES, getNpcsAtLocation, getNpcActivity, SEWER_VALVE_ROOM, SPELLS, getClassSpells, getLearnableSpells, getFutureSpells, formatCurrency, addCopper, canAfford, spendCurrency, formatPrice, getCombatNpcsAtLocation, findPropByName, TAG_INTERACTIONS } from '@solo-mud/shared';
import { handleCreatureDeath } from '../game/ecosystem';
import { handlePlayerDeath } from '../game/game-loop';
import { generateSewerLoot, SEWER_LOOT_TABLES, SEWER_ITEM_TEMPLATES } from '../loot/sewer-loot';
import { generateWildernessLoot, WILDERNESS_LOOT_TABLES } from '../loot/wilderness-loot';
import { generateNpcLoot, calculateNpcGoldDrop } from '../loot/npc-loot';
import { addAssaultBounty, addMurderBounty, getInfamyDisplay } from '../game/infamy';
import { selectNpcAction, applyNpcAction } from '../game/npc-combat';
import { sessionManager, type GameSession } from '../game/session';
import { getBotManager } from '../game/game-loop';
import { parseCommand, getDirection, isPropVerb, type ParsedCommand } from './parser';
import { isPropOnCooldown, setPropCooldown, formatCooldownMessage, applyPropRewards, pickRandomText, getRemainingCooldown } from './prop-helpers';
import { generateDescription, generateExitProse, generateCreatureProse, type Biome, type Weather, type ExitInfo } from '../descriptions';
import { adminHandlers } from './admin-handlers';
import { calculateCombatStats, getEffectiveStats, getLevelHitModifier, getLevelDamageModifier } from '../character';

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
  l: handleLook,
  who: handleWho,
  examine: handleExamine,
  help: handleHelp,
  inventory: handleInventory,
  i: handleInventory,
  keyring: handleKeyring,
  keys: handleKeyring,
  take: handleTake,
  get: handleTake,
  drop: handleDrop,
  equip: handleEquip,
  wear: handleEquip,
  wield: handleEquip,
  unequip: handleUnequip,
  equipment: handleEquipment,
  eq: handleEquipment,
  use: handleUse,
  drink: handleDrink,
  quaff: handleDrink,
  debug: handleDebug,
  attack: handleAttack,
  kill: handleAttack,
  flee: handleFlee,
  loot: handleLoot,
  open: handleOpen,
  unlock: handleUnlock,
  close: handleClose,
  shut: handleClose,
  leave: handleLeave,
  exit: handleLeave,
  talk: handleTalk,
  say: handleSay,
  tutorial: handleTutorial,
  list: handleList,
  buy: handleBuy,
  sell: handleSell,
  map: handleMap,
  cast: handleCast,
  c: handleCast,
  spells: handleSpells,
  skills: handleSpells,
  abilities: handleSpells,
  learn: handleLearn,
  status: handleStatus,
  stats: handleStatus,
  slots: handleSlots,
  quickslots: handleSlots,
  assign: handleAssign,
  unassign: handleUnassign,
  // Quick slot shortcuts
  q1: handleUseSlot,
  q2: handleUseSlot,
  q3: handleUseSlot,
  q4: handleUseSlot,
  a1: handleUseSlot,
  a2: handleUseSlot,
  a3: handleUseSlot,
  a4: handleUseSlot,
  // Movement commands
  north: handleMove,
  south: handleMove,
  east: handleMove,
  west: handleMove,
  up: handleMove,
  down: handleMove,
  n: handleMove,
  s: handleMove,
  e: handleMove,
  w: handleMove,
  go: handleMove,
};

/**
 * Execute a command and return the result.
 */
export function executeCommand(session: GameSession, input: string): CommandResult {
  const trimmed = input.trim();

  // Admin commands: prefixed with "/"
  if (trimmed.startsWith('/')) {
    const adminInput = trimmed.slice(1);
    const adminParsed = parseCommand(adminInput);

    if (!adminParsed.command) {
      return { output: [{ text: 'Type /help for admin commands.', style: 'system' }] };
    }

    const adminHandler = adminHandlers[adminParsed.command];
    if (!adminHandler) {
      return { output: [{ text: `Unknown admin command: /${adminParsed.command}. Type /help for a list.`, style: 'error' }] };
    }

    return adminHandler({ session, parsed: adminParsed });
  }

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
    // Check if this is a prop interaction verb before giving up
    if (isPropVerb(parsed.command) && parsed.target) {
      const propResult = handlePropInteraction({ session, parsed });
      if (propResult) {
        return propResult;
      }
    }
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
/**
 * Check if the player has an active light source.
 * Checks both consumable lightSource and light status effect.
 */
function hasLight(player: Player, gameTime: number): boolean {
  // Check consumable light source (lantern, etc.)
  if (player.lightSource && player.lightSource.expiresAt > gameTime) {
    return true;
  }
  // Check light status effect (from torch use)
  const lightEffect = player.statusEffects.find(e => e.id === 'light');
  if (lightEffect && lightEffect.appliedAt + lightEffect.duration > gameTime) {
    return true;
  }
  return false;
}

/**
 * Tags that indicate an item should stack in inventory.
 * Equipment (weapons, armor) and unique/quest items should NOT stack.
 */
const STACKABLE_TAGS = new Set([
  'consumable', 'potion', 'food', 'drink', 'beverage',
  'material', 'crafting',
  'currency', 'junk', 'trophy',
  'healing', 'container',
]);

/**
 * Tags that explicitly prevent stacking even if other stackable tags are present.
 */
const NON_STACKABLE_TAGS = new Set([
  'weapon', 'armor', 'unique', 'key', 'quest',
  'head', 'chest', 'legs', 'feet', 'hands', 'ring', 'neck',
]);

/**
 * Check if an item should stack with others of the same baseId.
 */
export function isStackable(item: Item): boolean {
  // If any non-stackable tag is present, don't stack
  if (item.tags.some(tag => NON_STACKABLE_TAGS.has(tag.toLowerCase()))) {
    return false;
  }
  // If any stackable tag is present, stack it
  return item.tags.some(tag => STACKABLE_TAGS.has(tag.toLowerCase()));
}

/**
 * Add an item to the player's inventory with proper stacking.
 * For stackable items (consumables, materials), stacks by baseId.
 * For non-stackable items (weapons, armor), creates a new slot.
 * Returns true if added successfully, false if inventory is full.
 */
export function addToInventory(player: Player, world: GameSession['world'], itemId: string): boolean {
  const item = world.items[itemId];
  if (!item) return false;

  // Keys go to keyring automatically (no duplicates by baseId)
  if (item.tags.includes('key')) {
    // Check if we already have this key type on the keyring
    const alreadyHasKey = player.keyring.some(keyId => {
      const existingKey = world.items[keyId];
      return existingKey && existingKey.baseId === item.baseId;
    });
    if (alreadyHasKey) {
      return false; // Don't pick up duplicate keys
    }
    player.keyring.push(itemId);
    return true;
  }

  if (isStackable(item)) {
    // For stackable items, find existing stack by baseId
    const existingSlot = player.inventory.find(slot => {
      const slotItem = world.items[slot.itemId];
      return slotItem && slotItem.baseId === item.baseId;
    });

    if (existingSlot) {
      existingSlot.quantity++;
      return true;
    }
  }

  // No existing stack or non-stackable: create new slot if space available
  if (player.inventory.length >= player.inventorySlots) {
    return false;
  }

  player.inventory.push({ itemId, quantity: 1 });
  return true;
}

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

  // Check if area is dark and player has no light
  const isDarkHere = location.isDark && !hasLight(player, world.time.totalMinutes);

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

  // If dark without light, show limited information
  if (isDarkHere) {
    output.push({ text: 'It is pitch dark. You cannot see anything.', style: 'combat' });
    output.push({ text: 'You hear sounds echoing in the darkness...', style: 'normal' });

    // Still show exits (you can feel your way along walls)
    const exitIds = world.adjacency[player.locationId] ?? [];
    const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];
    if (exits.length > 0) {
      const exitLabels = exits.map(e => e.label).join(', ');
      output.push({ text: `You can feel passages leading: ${exitLabels}`, style: 'system' });
    }

    // Hint about needing light
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'Use "use torch" to light your way.', style: 'system' });

    return output;
  }

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

  // Condense exits that go to the same destination (e.g., "north" and "inn" both to Inn)
  // Group by destination, prefer cardinal directions as primary
  const cardinals = ['north', 'south', 'east', 'west', 'up', 'down'];
  const exitsByDest = new Map<string, { primary: string; alternates: string[]; locked: boolean; destName: string }>();

  for (const exit of exits) {
    const destLocation = world.locations[exit.to];
    const destName = destLocation?.name ?? 'Unknown';
    const destKey = exit.to;

    if (!exitsByDest.has(destKey)) {
      exitsByDest.set(destKey, {
        primary: exit.label,
        alternates: [],
        locked: exit.type === 'locked',
        destName,
      });
    } else {
      const existing = exitsByDest.get(destKey)!;
      // If new label is cardinal and existing isn't, swap them
      if (cardinals.includes(exit.label) && !cardinals.includes(existing.primary)) {
        existing.alternates.push(existing.primary);
        existing.primary = exit.label;
      } else {
        existing.alternates.push(exit.label);
      }
    }
  }

  // Always show condensed exits line
  if (exitsByDest.size > 0) {
    const exitList = Array.from(exitsByDest.values()).map(e => {
      const locked = e.locked ? ' [LOCKED]' : '';
      const alt = e.alternates.length > 0 ? `/${e.alternates.join('/')}` : '';
      return `${e.primary}${alt}${locked}`;
    }).join(', ');
    output.push({ text: `Exits: ${exitList}`, style: 'system' });
  }

  // Always show NPCs and containers (important for gameplay)
  // Containers (chests, crates, etc.)
  if (world.containers) {
    const containers = Object.values(world.containers).filter(
      (c) => c.locationId === player.locationId
    );
    if (containers.length > 0) {
      const containerNames = containers.map(c => {
        const status = c.opened ? ' (open)' : c.locked ? ' (locked)' : '';
        return `${c.name}${status}`;
      }).join(', ');
      output.push({ text: `Containers: ${containerNames}`, style: 'normal' });
    }
  }

  // NPCs (using schedule-aware lookup)
  const timeOfDay = world.time.timeOfDay;
  const npcs = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
  if (npcs.length > 0) {
    const npcList = npcs.map(n => {
      const title = n.title ? `${n.title} ` : '';
      const activity = getNpcActivity(n, timeOfDay);
      const activityText = activity ? ` (${activity})` : '';
      return `${title}${n.name}${activityText}`;
    }).join(', ');
    output.push({ text: `People: ${npcList}`, style: 'normal' });
  }

  // Detailed mode: show tactical breakdown (items, creature levels)
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

    // Corpses that can be looted
    const corpses = Object.values(world.corpses).filter(
      (c) => c.locationId === player.locationId
    );
    if (corpses.length > 0) {
      const corpseList = corpses.map(c => `${c.name}'s corpse`).join(', ');
      output.push({ text: `Corpses: ${corpseList}`, style: 'normal' });
    }

    // Show other players at this location
    const otherPlayers = sessionManager.getAllSessions()
      .filter(s => s.player.locationId === player.locationId && s.id !== session.id);

    for (const other of otherPlayers) {
      output.push({ text: `**${other.player.name}** (Level ${other.player.level} ${other.player.class}) is here.`, style: 'normal' });
    }

    // Show bots at this location
    const botManager = getBotManager();
    const botsHere = (botManager?.getAllBotSessions() || [])
      .filter(bs => bs.player.locationId === player.locationId);

    for (const botSession of botsHere) {
      const bot = botSession.player;
      output.push({ text: `**${bot.name}** (Level ${bot.level} ${bot.class}) is here.`, style: 'normal' });
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
 * Handle the "who" command - show online players.
 */
function handleWho(_ctx: CommandContext): CommandResult {
  const output: OutputLine[] = [];

  // Get real player sessions
  const sessions = sessionManager.getAllSessions();

  // Get bot sessions
  const botManager = getBotManager();
  const botSessions = botManager?.getAllBotSessions() || [];

  // Combine and sort by level
  const allPlayers = [
    ...sessions.map(s => ({
      name: s.player.name,
      level: s.player.level,
      class: s.player.class,
      location: s.player.locationId,
    })),
    ...botSessions.map(bs => ({
      name: bs.player.name,
      level: bs.player.level,
      class: bs.player.class,
      location: bs.player.locationId,
    })),
  ];

  allPlayers.sort((a, b) => b.level - a.level);

  output.push({ text: '--- Online Players ---', style: 'system' });

  if (allPlayers.length === 0) {
    output.push({ text: 'No one is online.', style: 'normal' });
  } else {
    for (const p of allPlayers) {
      output.push({ text: `${p.name} (Level ${p.level} ${p.class})`, style: 'normal' });
    }
    output.push({ text: `Total: ${allPlayers.length} player(s) online`, style: 'system' });
  }

  return { output };
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

  // Check if examining an item in the room or inventory
  const targetLower = parsed.target.toLowerCase();

  // Check room items first
  let item = location.items
    .map(id => world.items[id])
    .find(i => i?.name.toLowerCase().includes(targetLower));

  // Also check inventory
  if (!item) {
    const invSlot = player.inventory.find(slot => {
      const invItem = world.items[slot.itemId];
      return invItem?.name.toLowerCase().includes(targetLower);
    });
    if (invSlot) {
      item = world.items[invSlot.itemId];
    }
  }

  // Also check equipped items
  if (!item) {
    for (const eqItemId of Object.values(player.equipment)) {
      if (eqItemId) {
        const eqItem = world.items[eqItemId];
        if (eqItem?.name.toLowerCase().includes(targetLower)) {
          item = eqItem;
          break;
        }
      }
    }
  }

  if (item) {
    const output: OutputLine[] = [
      { text: `${item.name}`, style: 'system' },
      { text: `Rarity: ${item.rarity}`, style: 'normal' },
    ];

    // Show equipment slot
    const equipSlot = getEquipSlot(item);
    if (equipSlot) {
      const slotName = SLOT_NAMES[equipSlot];
      output.push({ text: `Slot: ${slotName}`, style: 'normal' });
    }

    // Show weapon damage
    if (item.tags.includes('weapon') || item.tags.includes('sword') || item.tags.includes('dagger') || item.tags.includes('mace') || item.tags.includes('axe') || item.tags.includes('staff') || item.tags.includes('bow')) {
      const damage = getWeaponDamage(item);
      output.push({ text: `Damage: ${damage.min}-${damage.max}`, style: 'combat' });
    }

    // Show stat bonuses from affixes
    if (item.affixes && item.affixes.length > 0) {
      const statBonuses: string[] = [];
      for (const affix of item.affixes) {
        for (const [stat, value] of Object.entries(affix.statMods)) {
          const sign = value >= 0 ? '+' : '';
          const statName = stat === 'str' ? 'STR' :
                          stat === 'dex' ? 'DEX' :
                          stat === 'con' ? 'CON' :
                          stat === 'int' ? 'INT' :
                          stat === 'wis' ? 'WIS' :
                          stat === 'attackPower' ? 'Attack' :
                          stat === 'defense' ? 'Defense' :
                          stat === 'attackSpeed' ? 'Speed' :
                          stat === 'critChance' ? 'Crit%' :
                          stat === 'hitChance' ? 'Hit%' : stat;
          statBonuses.push(`${sign}${value} ${statName}`);
        }
      }
      if (statBonuses.length > 0) {
        output.push({ text: `Stats: ${statBonuses.join(', ')}`, style: 'success' });
      }
    }

    output.push({ text: `Type: ${item.tags.join(', ')}`, style: 'normal' });
    return { output };
  }

  // Check if examining a prop
  const prop = location.props.find(p => p.toLowerCase().includes(targetLower));
  if (prop) {
    return {
      output: [{ text: `You examine the ${prop}. It looks interesting.`, style: 'normal' }],
    };
  }

  // Check for NPC (using schedule-aware lookup)
  const timeOfDay = world.time.timeOfDay;
  const npcsHere = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
  const npc = npcsHere.find(n => n.name.toLowerCase().includes(targetLower));

  if (npc) {
    const title = npc.title ? `${npc.title} ` : '';
    const activity = getNpcActivity(npc, timeOfDay);
    const output: OutputLine[] = [
      { text: `${title}${npc.name}`, style: 'system' },
    ];

    if (activity) {
      output.push({ text: `They appear to be ${activity}.`, style: 'normal' });
    }

    if (npc.role === 'guard' && npc.combat) {
      output.push({ text: `A trained guard, level ${npc.combat.level}.`, style: 'normal' });
    }

    if (npc.shop) {
      output.push({ text: 'This merchant has items for sale. Use "list" to see their wares.', style: 'normal' });
    } else {
      output.push({ text: `You can "talk to ${npc.name.toLowerCase()}" to start a conversation.`, style: 'normal' });
    }

    return { output };
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
      output: [{ text: 'Use what? Specify an item or object, or "use q1" for quick slot.', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot use anything here.', style: 'error' }],
    };
  }

  let targetLower = parsed.target.toLowerCase();

  // Check if target is a slot reference (q1-q4)
  const slotMatch = targetLower.match(/^q([1-4])$/);
  if (slotMatch) {
    const slotIndex = parseInt(slotMatch[1]!, 10) - 1;
    const slot = player.itemSlots[slotIndex];
    if (!slot) {
      return {
        output: [{ text: `Slot q${slotIndex + 1} is empty.`, style: 'error' }],
      };
    }
    const slotItem = world.items[slot.id];
    if (!slotItem) {
      player.itemSlots[slotIndex] = null;
      return {
        output: [{ text: `Invalid item in slot q${slotIndex + 1}. Slot cleared.`, style: 'error' }],
        updatePlayer: true,
      };
    }
    targetLower = slotItem.name.toLowerCase();
  }

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

    if (item.tags.includes('consumable') || item.tags.includes('potion') || item.tags.includes('food') || item.tags.includes('drink')) {
      // Look up the effect for this item
      const effect = CONSUMABLE_EFFECTS[item.baseId];
      const output: OutputLine[] = [];

      if (!effect) {
        // Generic consumable without specific effect
        if (inventorySlot.quantity > 1) {
          inventorySlot.quantity--;
        } else {
          const slotIndex = player.inventory.indexOf(inventorySlot);
          player.inventory.splice(slotIndex, 1);
        }
        return {
          output: [{ text: `You use the ${item.name}. It has no special effect.`, style: 'normal' }],
          updatePlayer: true,
        };
      }

      // Handle special items that aren't consumed normally
      if (effect.type === 'special') {
        return handleSpecialItem(ctx, item, effect.flavorText);
      }

      // Consume the item
      if (inventorySlot.quantity > 1) {
        inventorySlot.quantity--;
      } else {
        const slotIndex = player.inventory.indexOf(inventorySlot);
        player.inventory.splice(slotIndex, 1);
      }

      // Add flavor text
      output.push({ text: effect.flavorText, style: 'normal' });

      // Apply the effect
      switch (effect.type) {
        case 'heal_hp': {
          const healAmount = effect.amount ?? 0;
          const oldHp = player.currentHp;
          player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
          const actualHeal = player.currentHp - oldHp;
          if (actualHeal > 0) {
            output.push({ text: `You restore ${actualHeal} HP. (${player.currentHp}/${player.maxHp})`, style: 'success' });
          }
          break;
        }
        case 'heal_mp': {
          const restoreAmount = effect.amount ?? 0;
          const oldMp = player.currentMp;
          player.currentMp = Math.min(player.maxMp, player.currentMp + restoreAmount);
          const actualRestore = player.currentMp - oldMp;
          if (actualRestore > 0) {
            output.push({ text: `You restore ${actualRestore} MP. (${player.currentMp}/${player.maxMp})`, style: 'success' });
          }
          break;
        }
        case 'heal_both': {
          const amount = effect.amount ?? 0;
          const oldHp = player.currentHp;
          const oldMp = player.currentMp;
          player.currentHp = Math.min(player.maxHp, player.currentHp + amount);
          player.currentMp = Math.min(player.maxMp, player.currentMp + amount);
          const hpHealed = player.currentHp - oldHp;
          const mpRestored = player.currentMp - oldMp;
          if (hpHealed > 0 || mpRestored > 0) {
            const parts: string[] = [];
            if (hpHealed > 0) parts.push(`${hpHealed} HP`);
            if (mpRestored > 0) parts.push(`${mpRestored} MP`);
            output.push({ text: `You restore ${parts.join(' and ')}.`, style: 'success' });
          }
          break;
        }
        case 'apply_status': {
          if (effect.statusId) {
            const result = applyStatusEffect(player, effect.statusId, effect.stacks ?? 1, effect.duration ?? 0, world.time.totalMinutes);
            output.push(...result);
          }
          break;
        }
        case 'remove_status': {
          if (effect.statusId) {
            const existing = player.statusEffects.findIndex(e => e.id === effect.statusId);
            if (existing >= 0) {
              const removed = player.statusEffects.splice(existing, 1)[0];
              output.push({ text: `The ${removed?.name ?? effect.statusId} effect fades away.`, style: 'success' });
            } else {
              output.push({ text: `You weren't affected by that anyway.`, style: 'normal' });
            }
          }
          break;
        }
      }

      return { output, updatePlayer: true };
    }

    // Handle light sources (torch, lantern, etc.)
    if (item.tags.includes('light') || item.baseId === 'torch') {
      const output: OutputLine[] = [];

      // Check if player already has a light source active
      if (player.lightSource && player.lightSource.expiresAt > world.time.totalMinutes) {
        output.push({ text: `You already have a ${player.lightSource.name} lit.`, style: 'normal' });
        return { output };
      }

      // Consume the item
      if (inventorySlot.quantity > 1) {
        inventorySlot.quantity--;
      } else {
        const slotIndex = player.inventory.indexOf(inventorySlot);
        player.inventory.splice(slotIndex, 1);
      }

      // Torches last 30 game minutes
      const duration = item.baseId === 'lantern' ? 120 : 30;
      player.lightSource = {
        itemBaseId: item.baseId,
        name: item.name,
        expiresAt: world.time.totalMinutes + duration,
      };

      output.push({ text: `You light the ${item.name}. Shadows dance on the walls.`, style: 'success' });
      output.push({ text: `It will burn for about ${duration} minutes.`, style: 'system' });

      // If in a dark area, show what you can now see
      const location = world.locations[player.locationId];
      if (location?.isDark) {
        output.push({ text: '', style: 'normal' });
        output.push({ text: 'The flickering light reveals your surroundings...', style: 'normal' });
      }

      return { output, updatePlayer: true, updateRoom: location?.isDark };
    }

    return {
      output: [{ text: `You're not sure how to use the ${item.name}.`, style: 'normal' }],
    };
  }

  // Check containers BEFORE props — containers are interactive objects that
  // should take priority over decorative room descriptions
  if (world.containers) {
    const containers = Object.values(world.containers).filter(
      (c) => c.locationId === player.locationId
    );

    const container = containers.find((c) =>
      c.name.toLowerCase().includes(targetLower)
    );

    if (container) {
      // Delegate to open command to handle the container
      return handleOpen({ session, parsed: { ...parsed, command: 'open', target: container.name, args: [container.name], raw: parsed.raw } });
    }
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
    // Handle valve puzzle in the sewer
    if (prop.includes('valve') && player.locationId === SEWER_VALVE_ROOM) {
      return handleValvePuzzle(ctx, targetLower);
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
 * Get a description of what a status effect does.
 * Looks up spell data for buff effects, or returns hardcoded descriptions for others.
 */
function getEffectDescription(effectId: string): string | null {
  // Check if it's a spell-based effect (buff spells use their spell ID as the effect ID)
  const spell = SPELLS[effectId];
  if (spell && spell.effect === 'buff') {
    // Generate description based on spell properties
    if (spell.baseValue) {
      switch (effectId) {
        case 'blessing':
          return `+${spell.baseValue} Defense`;
        case 'battle_shout':
          return `+${spell.baseValue} Attack`;
        case 'evasion':
          return `+${spell.baseValue}% Dodge`;
        case 'haste':
          return `+${spell.baseValue}% Attack Speed`;
        default:
          return `+${spell.baseValue} (buff)`;
      }
    }
  }

  // Hardcoded descriptions for non-spell effects
  switch (effectId) {
    case 'light':
      return 'Illuminates dark areas';
    case 'drunk':
      return 'May stumble when moving';
    case 'poison':
    case 'poisoned':
      return 'Taking damage over time';
    case 'bleed':
      return 'Bleeding, taking damage over time';
    case 'hunters_mark':
      return 'Marked target takes +50% damage';
    case 'trapped':
      return 'Movement restricted';
    default:
      return null;
  }
}

/**
 * Apply a status effect to the player, stacking if already present.
 */
function applyStatusEffect(
  player: { statusEffects: StatusEffect[]; currentHp: number; maxHp: number },
  statusId: string,
  stacks: number,
  duration: number,
  gameTime: number
): OutputLine[] {
  const output: OutputLine[] = [];

  // Check for existing effect
  const existing = player.statusEffects.find(e => e.id === statusId);

  if (existing) {
    // Stack the effect
    existing.stacks += stacks;
    existing.duration = Math.max(existing.duration, duration); // Refresh duration
    existing.appliedAt = gameTime;
  } else {
    // Create new effect
    const effectNames: Record<string, string> = {
      drunk: 'Drunk',
      poisoned: 'Poisoned',
      blessed: 'Blessed',
      haste: 'Haste',
    };
    player.statusEffects.push({
      id: statusId,
      name: effectNames[statusId] ?? statusId,
      duration,
      stacks,
      appliedAt: gameTime,
    });
  }

  // Special handling for drunk status
  if (statusId === 'drunk') {
    const totalStacks = existing ? existing.stacks : stacks;
    const drunkLevel = getDrunkLevel(totalStacks);
    if (drunkLevel) {
      output.push({ text: drunkLevel.text, style: 'normal' });
      output.push({ text: `[Status: ${drunkLevel.name}]`, style: 'system' });
    }
  }

  return output;
}

/**
 * Handle the "drink" command - drink potions, wine, ale, etc.
 * Delegates to handleUse after verifying the item is drinkable.
 */
function handleDrink(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Drink what? Try "drink <potion>" or "drink wine".', style: 'system' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Find item in inventory
  const inventorySlot = player.inventory.find(slot => {
    const item = world.items[slot.itemId];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (!inventorySlot) {
    return {
      output: [{ text: `You don't have any "${parsed.target}" to drink.`, style: 'error' }],
    };
  }

  const item = world.items[inventorySlot.itemId];
  if (!item) {
    return {
      output: [{ text: 'That item seems corrupted.', style: 'error' }],
    };
  }

  // Check if item is drinkable
  const drinkableTags = ['potion', 'drink', 'consumable', 'wine', 'ale', 'beverage', 'elixir'];
  const isDrinkable = item.tags.some(tag => drinkableTags.includes(tag.toLowerCase()));

  if (!isDrinkable) {
    return {
      output: [{ text: `You can't drink the ${item.name}. That's not a beverage!`, style: 'error' }],
    };
  }

  // Delegate to handleUse for the actual consumption
  return handleUse(ctx);
}

/**
 * Handle special items that have unique behaviors.
 */
function handleSpecialItem(ctx: CommandContext, item: Item, flavorText: string): CommandResult {
  const { session } = ctx;
  const { world, player } = session;
  const output: OutputLine[] = [];

  output.push({ text: flavorText, style: 'normal' });

  if (item.baseId === 'torch') {
    // Check if already have light status
    const hasLight = player.statusEffects.some(e => e.id === 'light');
    if (hasLight) {
      output.push({ text: 'You already have a light source active.', style: 'system' });
    } else {
      // Apply light status (doesn't consume torch, just activates it)
      player.statusEffects.push({
        id: 'light',
        name: 'Torchlight',
        duration: 600, // 10 minutes game time
        stacks: 1,
        appliedAt: world.time.totalMinutes,
      });
      output.push({ text: 'The torch illuminates your surroundings.', style: 'success' });
      output.push({ text: '[Status: Torchlight - dark areas now visible]', style: 'system' });
    }
    return { output, updatePlayer: true };
  }

  if (item.baseId === 'travelers_map') {
    // Show a regional map with visited locations
    const location = world.locations[player.locationId];

    output.push({ text: '', style: 'normal' });
    output.push({ text: "You unfold the traveler's map and study it carefully...", style: 'emphasis' });
    output.push({ text: '', style: 'normal' });
    output.push({ text: '╔════════════════════════════════════════════════╗', style: 'system' });
    output.push({ text: '║          EASTHOLLOW REGIONAL MAP               ║', style: 'system' });
    output.push({ text: '╠════════════════════════════════════════════════╣', style: 'system' });

    // Collect all visited locations grouped by depth
    const visitedByDepth = new Map<number, Location[]>();
    let totalVisited = 0;

    for (const loc of Object.values(world.locations)) {
      if (loc.visitState.visitCount > 0) {
        totalVisited++;
        const depth = loc.isSafeZone ? -1 : (loc.depth ?? 0);
        if (!visitedByDepth.has(depth)) visitedByDepth.set(depth, []);
        visitedByDepth.get(depth)!.push(loc);
      }
    }

    // Town locations (depth -1 / safe zone)
    const townLocs = visitedByDepth.get(-1) ?? [];
    if (townLocs.length > 0) {
      output.push({ text: '║ 🏠 EASTHOLLOW (Safe Zone)                      ║', style: 'highlight' });
      for (const loc of townLocs) {
        const marker = loc.id === player.locationId ? '★' : '•';
        const name = loc.name.slice(0, 35);
        output.push({ text: `║   ${marker} ${name}`.padEnd(49) + '║', style: 'normal' });
      }
      output.push({ text: '╠────────────────────────────────────────────────╣', style: 'system' });
    }

    // Wilderness by depth
    const depths = Array.from(visitedByDepth.keys()).filter(d => d >= 0).sort((a, b) => a - b);
    for (const depth of depths) {
      const locs = visitedByDepth.get(depth) ?? [];
      const danger = depth <= 1 ? '🌿 Safe' : depth <= 3 ? '⚔️ Moderate' : depth <= 5 ? '💀 Dangerous' : '☠️ Deadly';
      output.push({ text: `║ Depth ${depth} - ${danger}`.padEnd(49) + '║', style: 'system' });

      for (const loc of locs) {
        const marker = loc.id === player.locationId ? '★' : '•';
        const biome = Object.entries(loc.biome).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'plains';
        const biomeIcon = biome === 'forest' ? '🌲' : biome === 'hills' ? '⛰️' :
                          biome === 'swamp' ? '🌿' : '🌾';
        const name = loc.name.slice(0, 28);
        output.push({ text: `║   ${marker} ${biomeIcon} ${name}`.padEnd(49) + '║', style: 'normal' });
      }

      if (depth < Math.max(...depths)) {
        output.push({ text: '║        │                                       ║', style: 'normal' });
        output.push({ text: '║        ▼                                       ║', style: 'normal' });
      }
    }

    output.push({ text: '╠════════════════════════════════════════════════╣', style: 'system' });

    // Current position
    const currentDepth = location?.isSafeZone ? 'Town' : `Depth ${location?.depth ?? '?'}`;
    output.push({ text: `║ ★ You are at: ${location?.name ?? 'Unknown'}`.padEnd(49) + '║', style: 'highlight' });
    output.push({ text: `║   Location: ${currentDepth}`.padEnd(49) + '║', style: 'normal' });

    // Stats
    const totalLocations = Object.keys(world.locations).length;
    const pct = Math.floor((totalVisited / totalLocations) * 100);
    output.push({ text: `║   Explored: ${totalVisited}/${totalLocations} locations (${pct}%)`.padEnd(49) + '║', style: 'normal' });

    output.push({ text: '╚════════════════════════════════════════════════╝', style: 'system' });
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'Legend: ★ Current  • Visited  🌿Safe ⚔️Moderate 💀Danger', style: 'system' });

    return { output };
  }

  return { output };
}

/** Puzzle hints mapped to their solutions */
const PUZZLE_HINTS: { hint: string; solution: string[] }[] = [
  { hint: 'Blood before sky, sky before earth', solution: ['red', 'blue', 'green'] },
  { hint: 'Blood before earth, earth before sky', solution: ['red', 'green', 'blue'] },
  { hint: 'Sky before blood, blood before earth', solution: ['blue', 'red', 'green'] },
  { hint: 'Sky before earth, earth before blood', solution: ['blue', 'green', 'red'] },
  { hint: 'Earth before blood, blood before sky', solution: ['green', 'red', 'blue'] },
  { hint: 'Earth before sky, sky before blood', solution: ['green', 'blue', 'red'] },
];

/**
 * Handle the valve puzzle in the sewer.
 * The puzzle randomizes each attempt - hint changes to match the solution.
 * Gate stays open until player leaves the sewer area.
 */
function handleValvePuzzle(ctx: CommandContext, targetLower: string): CommandResult {
  const { session } = ctx;
  const { world } = session;
  const output: OutputLine[] = [];

  // Check if gate is already open this session
  if (session.sewerGateOpen) {
    return {
      output: [
        { text: 'The valves have already been set correctly. The iron gate to the south stands open.', style: 'normal' },
        { text: 'You can proceed south to the King Rat\'s lair.', style: 'system' },
      ],
    };
  }

  // Generate puzzle solution if not set (randomized each attempt)
  if (!session.puzzleSolution) {
    const rng = createRng(`${world.seed}-puzzle-${Date.now()}`);
    const puzzleIndex = rng.nextInt(0, PUZZLE_HINTS.length - 1);
    session.puzzleSolution = PUZZLE_HINTS[puzzleIndex]!.solution;
    session.valveSequence = []; // Reset valve sequence for new puzzle
  }

  // Find the current hint based on solution
  const currentHint = PUZZLE_HINTS.find(p =>
    p.solution.every((v, i) => v === session.puzzleSolution![i])
  )?.hint ?? 'Blood before sky, sky before earth';

  // Determine which valve the player is trying to turn
  let valve: string | null = null;
  if (targetLower.includes('red')) {
    valve = 'red';
  } else if (targetLower.includes('blue')) {
    valve = 'blue';
  } else if (targetLower.includes('green')) {
    valve = 'green';
  }

  if (!valve) {
    // Generic valve interaction - show the randomized hint
    return {
      output: [
        { text: 'Three large valve wheels are mounted on the wall: a red one, a blue one, and a green one.', style: 'normal' },
        { text: `An ancient inscription above reads: "${currentHint}"`, style: 'system' },
        { text: 'Try "use red valve", "use blue valve", or "use green valve".', style: 'system' },
      ],
    };
  }

  // Initialize valve sequence if not present
  if (!session.valveSequence) {
    session.valveSequence = [];
  }

  // Check if this valve was already turned in the current sequence
  if (session.valveSequence.includes(valve)) {
    output.push({ text: `The ${valve} valve has already been turned. It won't budge further.`, style: 'normal' });
    return { output };
  }

  // Add this valve to the sequence
  session.valveSequence.push(valve);
  output.push({ text: `You grip the ${valve} valve wheel and turn it with effort. Ancient pipes groan and rumble.`, style: 'normal' });

  // Check if sequence is complete (3 valves)
  if (session.valveSequence.length === 3) {
    const isCorrect = session.valveSequence.every((v, i) => v === session.puzzleSolution![i]);

    if (isCorrect) {
      // Puzzle solved! Open gate for this session
      session.sewerGateOpen = true;
      session.valveSequence = undefined;
      session.puzzleSolution = undefined; // Will regenerate next time
      output.push({ text: '', style: 'normal' });
      output.push({ text: 'A deep grinding echoes through the chamber as the ancient mechanism engages.', style: 'system' });
      output.push({ text: 'The heavy iron gate blocking the south passage slowly rises, revealing a dark passage beyond.', style: 'success' });
      output.push({ text: 'A foul stench wafts from the newly opened way, and you hear heavy breathing in the darkness...', style: 'combat' });
      return { output };
    } else {
      // Wrong sequence - reset and generate new puzzle
      session.valveSequence = undefined;
      session.puzzleSolution = undefined; // Will regenerate on next attempt
      output.push({ text: '', style: 'normal' });
      output.push({ text: 'The pipes shudder violently, then fall silent. Nothing happens.', style: 'normal' });
      output.push({ text: 'The valves slowly reset to their original positions. The inscription seems to shimmer and change...', style: 'system' });
      return { output };
    }
  }

  // Sequence incomplete - give feedback
  const remaining = 3 - session.valveSequence.length;
  output.push({ text: `${remaining} valve${remaining > 1 ? 's' : ''} remain to be turned.`, style: 'system' });
  return { output };
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
      { text: '  drink <potion/beverage> - Drink a potion or beverage', style: 'normal' },
      { text: '  go <direction> - Move in a direction', style: 'normal' },
      { text: '  go <exit> to <destination> - Disambiguate multiple exits', style: 'normal' },
      { text: '  north/south/east/west (n/s/e/w) - Move directly', style: 'normal' },
      { text: '  up/down (u/d) - Move vertically', style: 'normal' },
      { text: '  take <item> - Pick up an item from the ground', style: 'normal' },
      { text: '  take <item> <source> - Take item from corpse/container', style: 'normal' },
      { text: '  take all <source> - Take everything from a source', style: 'normal' },
      { text: '  drop <item> - Drop an item', style: 'normal' },
      { text: '  inventory (i) - Check your inventory', style: 'normal' },
      { text: '  equipment (eq) - View equipped items', style: 'normal' },
      { text: '  equip <item> - Equip an item from inventory', style: 'normal' },
      { text: '  unequip <slot> - Remove equipped item', style: 'normal' },
      { text: '  attack <target> (k) - Attack a creature', style: 'normal' },
      { text: '  flee - Escape from combat (50% chance)', style: 'normal' },
      { text: '  cast <spell> - Cast a spell', style: 'normal' },
      { text: '  spells (skills, abilities) - View your known spells/abilities', style: 'normal' },
      { text: '  learn <spell> - Learn a spell from a trainer', style: 'normal' },
      { text: '  slots (quickslots) - View quick slot assignments', style: 'normal' },
      { text: '  assign <slot> <item/spell> - Assign to slot (q1-q4, a1-a4)', style: 'normal' },
      { text: '  unassign <slot> - Clear a quick slot', style: 'normal' },
      { text: '  loot [corpse/container] [#|all] - Loot items (# to take item, all for everything)', style: 'normal' },
      { text: '  open <container> - Open a chest or container', style: 'normal' },
      { text: '  unlock <direction> - Unlock a locked door/passage', style: 'normal' },
      { text: '  status (stats) - View your stats and active effects', style: 'normal' },
      { text: '  talk <npc> - Talk to someone', style: 'normal' },
      { text: '  say <number> - Respond in conversation', style: 'normal' },
      { text: '  list - View shop inventory', style: 'normal' },
      { text: '  buy <item> - Purchase from shop', style: 'normal' },
      { text: '  sell <item> - Sell to shop', style: 'normal' },
      { text: '  tutorial - Check tutorial progress', style: 'normal' },
      { text: '  map - Show a mini-map of nearby areas', style: 'normal' },
      { text: '  quit (logout, exit) - Save and return to character select', style: 'normal' },
      { text: '  debug - Show raw room/item data (dev mode)', style: 'normal' },
      { text: '  help (?) - Show this help message', style: 'normal' },
    ],
  };
}

/**
 * Handle the "map" command - show an expanded map of the local area.
 */
function handleMap(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { world, player } = session;
  const location = world.locations[player.locationId];
  const output: OutputLine[] = [];

  if (!location) {
    return { output: [{ text: 'You are lost in the void.', style: 'error' }] };
  }

  // Helper functions
  const getBiomeIcon = (loc: Location): string => {
    if (loc.isSafeZone) return '🏠';
    const biome = Object.entries(loc.biome).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'plains';
    return biome === 'forest' ? '🌲' : biome === 'hills' ? '⛰️' :
           biome === 'swamp' ? '🌿' : biome === 'mountains' ? '🏔️' :
           biome === 'desert' ? '🏜️' : '🌾';
  };

  const getDangerIcon = (loc: Location): string => {
    if (loc.isSafeZone) return '🛡️';
    const depth = loc.depth ?? 0;
    return depth <= 1 ? '🌿' : depth <= 3 ? '⚔️' : depth <= 5 ? '💀' : '☠️';
  };

  const formatName = (name: string, len: number): string => {
    return name.length > len ? name.slice(0, len - 1) + '…' : name.padEnd(len);
  };

  // Get exits from current location
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];

  // Build direction map for current location
  interface LocInfo {
    id: string;
    name: string;
    depth?: number;
    locked: boolean;
    isTown: boolean;
    biomeIcon: string;
    dangerIcon: string;
    creatures: string[];
    beyondExits: { dir: string; name: string; locked: boolean }[];
  }

  const getLocInfo = (locId: string, exitLocked: boolean): LocInfo | null => {
    const loc = world.locations[locId];
    if (!loc) return null;

    // Get what's beyond this location
    const beyondExitIds = world.adjacency[locId] ?? [];
    const beyondExits = beyondExitIds
      .map(id => world.exits[id])
      .filter(e => e && e.to !== player.locationId)
      .map(e => {
        const dest = world.locations[e!.to];
        return { dir: e!.label, name: dest?.name ?? '???', locked: e!.type === 'locked' };
      })
      .slice(0, 3); // Max 3 "beyond" exits

    // Get creatures
    const creatures = (loc.creatures ?? [])
      .map(id => world.creatures[id]?.name)
      .filter((n): n is string => !!n)
      .slice(0, 2);

    return {
      id: locId,
      name: loc.name,
      depth: loc.depth,
      locked: exitLocked,
      isTown: locId.startsWith('town_'),
      biomeIcon: getBiomeIcon(loc),
      dangerIcon: getDangerIcon(loc),
      creatures,
      beyondExits,
    };
  };

  // Categorize exits by direction
  const dirMap: Record<string, LocInfo> = {};
  for (const exit of exits) {
    const info = getLocInfo(exit.to, exit.type === 'locked');
    if (info) {
      dirMap[exit.label.toLowerCase()] = info;
    }
  }

  // Get current location info
  const currentBiomeIcon = getBiomeIcon(location);
  const currentDangerIcon = getDangerIcon(location);
  const depthLabel = location.isSafeZone ? 'Safe Zone' :
                     location.depth === undefined ? '' : `Depth ${location.depth}`;

  // Current location creatures
  const currentCreatures = (location.creatures ?? [])
    .map(id => world.creatures[id]?.name)
    .filter((n): n is string => !!n);

  // Build the expanded ASCII map
  output.push({ text: '', style: 'normal' });
  output.push({ text: '╔══════════════════════════════════════════════════════════════════════════╗', style: 'system' });
  output.push({ text: '║                            AREA MAP                                      ║', style: 'system' });
  output.push({ text: '╠══════════════════════════════════════════════════════════════════════════╣', style: 'system' });

  // === NORTH AREA ===
  const north = dirMap['north'];
  if (north) {
    const lockIcon = north.locked ? '🔒' : ' ';
    output.push({ text: `║                    ┌─────────────────────────┐                          ║`, style: 'normal' });
    output.push({ text: `║                    │ ${north.biomeIcon} ${formatName(north.name, 20)} ${lockIcon}│                          ║`, style: 'normal' });
    if (north.creatures.length > 0) {
      output.push({ text: `║                    │   ⚠️ ${formatName(north.creatures.join(', '), 17)}│                          ║`, style: 'error' });
    }
    if (north.beyondExits.length > 0) {
      const beyond = north.beyondExits.map(e => `${e.dir[0]}→${e.name.slice(0, 6)}`).join(' ');
      output.push({ text: `║                    │   ↗ ${formatName(beyond, 18)}│                          ║`, style: 'normal' });
    }
    output.push({ text: `║                    └───────────┬─────────────┘                          ║`, style: 'normal' });
    output.push({ text: `║                                │ N                                      ║`, style: 'normal' });
  } else {
    output.push({ text: `║                          ─ ─ ─ ─ ─ ─ ─                                  ║`, style: 'normal' });
    output.push({ text: `║                                                                          ║`, style: 'normal' });
  }

  // === WEST - CENTER - EAST ROW ===
  const west = dirMap['west'];
  const east = dirMap['east'];

  // West area
  if (west) {
    const lockIcon = west.locked ? '🔒' : ' ';
    output.push({ text: `║  ┌──────────────────┐         │          ┌──────────────────┐          ║`, style: 'normal' });
    output.push({ text: `║  │${west.biomeIcon} ${formatName(west.name, 14)} ${lockIcon}├── W ──┼── E ──┤${east ? east.biomeIcon : ' '} ${formatName(east?.name ?? '', 14)} ${east?.locked ? '🔒' : ' '}│          ║`, style: 'normal' });
    if (west.creatures.length > 0 || (east?.creatures.length ?? 0) > 0) {
      const wCreatures = west.creatures.length > 0 ? `⚠️${west.creatures[0]?.slice(0, 10) ?? ''}` : '';
      const eCreatures = east?.creatures.length ? `⚠️${east.creatures[0]?.slice(0, 10) ?? ''}` : '';
      output.push({ text: `║  │${formatName(wCreatures, 18)}│         │          │${formatName(eCreatures, 18)}│          ║`, style: 'error' });
    }
    output.push({ text: `║  └──────────────────┘         │          └──────────────────┘          ║`, style: 'normal' });
  } else if (east) {
    const lockIcon = east.locked ? '🔒' : ' ';
    output.push({ text: `║                               │          ┌──────────────────┐          ║`, style: 'normal' });
    output.push({ text: `║         ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┼── E ──┤${east.biomeIcon} ${formatName(east.name, 14)} ${lockIcon}│          ║`, style: 'normal' });
    if (east.creatures.length > 0) {
      output.push({ text: `║                               │          │⚠️ ${formatName(east.creatures.join(', '), 15)}│          ║`, style: 'error' });
    }
    output.push({ text: `║                               │          └──────────────────┘          ║`, style: 'normal' });
  } else {
    output.push({ text: `║                               │                                         ║`, style: 'normal' });
  }

  // === CURRENT LOCATION (CENTER) ===
  output.push({ text: `║              ╔═══════════════════════════════════╗                       ║`, style: 'highlight' });
  output.push({ text: `║              ║  ${currentBiomeIcon} ${currentDangerIcon} ${formatName(location.name, 24)}  ║                       ║`, style: 'highlight' });
  output.push({ text: `║              ║     ★ YOU ARE HERE ★               ║                       ║`, style: 'emphasis' });
  output.push({ text: `║              ║     ${formatName(depthLabel, 28)}  ║                       ║`, style: 'normal' });
  if (currentCreatures.length > 0) {
    output.push({ text: `║              ║     ⚠️ ${formatName(currentCreatures.slice(0, 2).join(', '), 24)}  ║                       ║`, style: 'error' });
  }
  output.push({ text: `║              ╚═══════════════════════════════════╝                       ║`, style: 'highlight' });

  // === SOUTH AREA ===
  const south = dirMap['south'];
  if (south) {
    const lockIcon = south.locked ? '🔒' : ' ';
    output.push({ text: `║                                │ S                                      ║`, style: 'normal' });
    output.push({ text: `║                    ┌───────────┴─────────────┐                          ║`, style: 'normal' });
    output.push({ text: `║                    │ ${south.biomeIcon} ${formatName(south.name, 20)} ${lockIcon}│                          ║`, style: 'normal' });
    if (south.creatures.length > 0) {
      output.push({ text: `║                    │   ⚠️ ${formatName(south.creatures.join(', '), 17)}│                          ║`, style: 'error' });
    }
    if (south.beyondExits.length > 0) {
      const beyond = south.beyondExits.map(e => `${e.dir[0]}→${e.name.slice(0, 6)}`).join(' ');
      output.push({ text: `║                    │   ↘ ${formatName(beyond, 18)}│                          ║`, style: 'normal' });
    }
    output.push({ text: `║                    └─────────────────────────┘                          ║`, style: 'normal' });
  } else {
    output.push({ text: `║                          ─ ─ ─ ─ ─ ─ ─                                  ║`, style: 'normal' });
  }

  // === OTHER EXITS ===
  const otherExits = exits.filter(e => !['north', 'south', 'east', 'west'].includes(e.label.toLowerCase()));
  if (otherExits.length > 0) {
    output.push({ text: `╠══════════════════════════════════════════════════════════════════════════╣`, style: 'system' });
    output.push({ text: `║  Other Paths:                                                            ║`, style: 'system' });
    for (const exit of otherExits) {
      const dest = world.locations[exit.to];
      const destName = dest?.name ?? 'Unknown';
      const dir = exit.label.charAt(0).toUpperCase() + exit.label.slice(1);
      const lock = exit.type === 'locked' ? ' 🔒' : '';
      const biome = dest ? getBiomeIcon(dest) : '?';
      const danger = dest ? getDangerIcon(dest) : '';
      output.push({ text: `║    ${biome}${danger} ${dir.padEnd(10)} → ${destName}${lock}`.padEnd(75) + '║', style: 'normal' });
    }
  }

  output.push({ text: `╠══════════════════════════════════════════════════════════════════════════╣`, style: 'system' });
  output.push({ text: `║  Legend: 🛡️ Safe  🌿 Low  ⚔️ Moderate  💀 Dangerous  🔒 Locked  ⚠️ Enemies  ║`, style: 'system' });
  output.push({ text: `║  Biomes: 🏠 Town  🌾 Plains  🌲 Forest  ⛰️ Hills  🌿 Swamp  🏔️ Mountains    ║`, style: 'system' });
  output.push({ text: `╚══════════════════════════════════════════════════════════════════════════╝`, style: 'system' });

  return { output };
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

  // Show corpses at this location
  const corpses = Object.values(world.corpses).filter(c => c.locationId === player.locationId);
  output.push({ text: '--- CORPSES HERE ---', style: 'system' });
  if (corpses.length === 0) {
    output.push({ text: '  (none)', style: 'normal' });
  } else {
    for (const corpse of corpses) {
      output.push({ text: `  ${corpse.id}: ${corpse.name}`, style: 'normal' });
      output.push({ text: `    Location: ${corpse.locationId} | Loot: ${corpse.loot.length} items`, style: 'normal' });
    }
  }
  output.push({ text: '', style: 'normal' });

  // Show all corpses in world
  const allCorpses = Object.values(world.corpses);
  output.push({ text: '--- ALL CORPSES ---', style: 'system' });
  output.push({ text: `  Total: ${allCorpses.length}`, style: 'normal' });
  for (const corpse of allCorpses.slice(0, 5)) {
    output.push({ text: `  ${corpse.name} at ${corpse.locationId}`, style: 'normal' });
  }
  if (allCorpses.length > 5) {
    output.push({ text: `  ... and ${allCorpses.length - 5} more`, style: 'normal' });
  }
  output.push({ text: '', style: 'normal' });

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

  // Show keyring if player has keys
  if (player.keyring && player.keyring.length > 0) {
    output.push({ text: '', style: 'normal' });
    output.push({ text: '=== Keyring ===', style: 'system' });
    for (const keyId of player.keyring) {
      const key = world.items[keyId];
      if (key) {
        output.push({ text: `  ${key.name}`, style: 'normal' });
      }
    }
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: `Slots: ${player.inventory.length}/${player.inventorySlots}`, style: 'normal' });
  output.push({ text: `Currency: ${formatCurrency(player.currency)}`, style: 'success' });
  output.push({ text: `Weight: ${player.carryWeight}/${player.maxCarryWeight}`, style: 'normal' });

  return { output };
}

/**
 * Handle the "keyring" command - view collected keys.
 */
function handleKeyring(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player, world } = session;
  const output: OutputLine[] = [
    { text: '=== Keyring ===', style: 'system' },
  ];

  if (!player.keyring || player.keyring.length === 0) {
    output.push({ text: 'Your keyring is empty.', style: 'normal' });
  } else {
    for (const keyId of player.keyring) {
      const key = world.items[keyId];
      if (key) {
        output.push({ text: `  ${key.name}`, style: 'normal' });
      }
    }
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: 'Keys are stored here automatically and never take inventory space.', style: 'system' });

  return { output };
}

/**
 * Handle the "take" / "get" command.
 * - take <item>           → pick up from ground only
 * - take <item> from <source>  → take item from corpse/container (parser sets parsed.source)
 * - take <item> <source>  → take item from corpse/container (suffix parsing)
 * - take all <source>     → take everything from a source
 */
function handleTake(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target && parsed.args.length === 0) {
    return {
      output: [{ text: 'Take what? Try "take <item>" or "take <item> <source>".', style: 'system' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You cannot take anything here.', style: 'error' }],
    };
  }

  // --- "take X from Y" syntax (parser already split these) ---
  if (parsed.source) {
    return takeFromSource(world, player, parsed.target!.toLowerCase(), parsed.source.toLowerCase());
  }

  // --- Build the full input from args for suffix parsing ---
  const input = parsed.args.join(' ').toLowerCase();

  // --- "take all <source>" or "take <source> all" → take everything from a source ---
  if (input.startsWith('all ') && input.length > 4) {
    const sourceName = input.slice(4);
    return takeAllFromSource(world, player, sourceName);
  }
  if (input.endsWith(' all') && input.length > 4) {
    const sourceName = input.slice(0, -4);
    return takeAllFromSource(world, player, sourceName);
  }

  // --- Try suffix matching: "take <item> <source>" ---
  // Gather sources: corpses + opened containers
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );
  const openContainers = world.containers
    ? Object.values(world.containers).filter(
        (c) => c.locationId === player.locationId && c.opened
      )
    : [];
  const allContainers = world.containers
    ? Object.values(world.containers).filter(
        (c) => c.locationId === player.locationId
      )
    : [];

  // Try splitting args at each word boundary to find a source suffix
  const words = input.split(' ');
  if (words.length >= 2) {
    for (let split = 1; split < words.length; split++) {
      const sourcePart = words.slice(split).join(' ');
      const itemPart = words.slice(0, split).join(' ');

      // Check corpses
      const corpse = corpses.find((c) => c.name.toLowerCase().includes(sourcePart));
      if (corpse) {
        return takeItemFromContents(world, player, itemPart, corpse.name, corpse.loot, 'corpse', corpse);
      }

      // Check opened containers
      const container = openContainers.find((c) => c.name.toLowerCase().includes(sourcePart));
      if (container) {
        return takeItemFromContents(world, player, itemPart, container.name, container.contents, 'container', container);
      }

      // Check closed containers (give helpful message)
      const closedContainer = allContainers.find((c) => !c.opened && c.name.toLowerCase().includes(sourcePart));
      if (closedContainer) {
        return {
          output: [{ text: `The ${closedContainer.name} is closed. Try "open ${closedContainer.name.toLowerCase()}" first.`, style: 'error' }],
        };
      }
    }
  }

  // --- No source found: ground item pickup only ---
  const targetLower = input;
  const itemIndex = location.items.findIndex(id => {
    const item = world.items[id];
    return item?.name.toLowerCase().includes(targetLower);
  });

  if (itemIndex === -1) {
    return {
      output: [{ text: `You don't see any "${parsed.args.join(' ')}" here to take.`, style: 'error' }],
    };
  }

  const itemId = location.items[itemIndex]!;
  const item = world.items[itemId];

  if (!item) {
    return {
      output: [{ text: 'That item seems to have vanished.', style: 'error' }],
    };
  }

  location.items.splice(itemIndex, 1);

  // Check if it's a key (will go to keyring)
  const isKey = item.tags.includes('key');

  if (!addToInventory(player, world, itemId)) {
    // Couldn't add - put item back
    location.items.push(itemId);
    const errorMsg = isKey
      ? 'You already have that key on your keyring.'
      : 'Your inventory is full.';
    return {
      output: [{ text: errorMsg, style: 'error' }],
    };
  }

  const successMsg = isKey
    ? `You pick up the ${item.name} and add it to your keyring.`
    : `You pick up the ${item.name}.`;

  return {
    output: [{ text: successMsg, style: 'success' }],
    updateRoom: true,
    updatePlayer: true,
  };
}

/**
 * Take a specific item from a named source (corpse or container).
 * Handles "take X from Y" syntax.
 */
function takeFromSource(
  world: GameSession['world'],
  player: Player,
  itemQuery: string,
  sourceQuery: string
): CommandResult {
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );
  const containers = world.containers
    ? Object.values(world.containers).filter(
        (c) => c.locationId === player.locationId
      )
    : [];

  // Handle "take all from <source>"
  if (itemQuery === 'all') {
    return takeAllFromSource(world, player, sourceQuery);
  }

  // Find source by name
  const corpse = corpses.find((c) =>
    c.name.toLowerCase().includes(sourceQuery) || sourceQuery === 'corpse'
  );
  if (corpse) {
    return takeItemFromContents(world, player, itemQuery, corpse.name, corpse.loot, 'corpse', corpse);
  }

  const container = containers.find((c) => c.name.toLowerCase().includes(sourceQuery));
  if (container) {
    if (!container.opened) {
      return {
        output: [{ text: `The ${container.name} is closed. Try "open ${container.name.toLowerCase()}" first.`, style: 'error' }],
      };
    }
    return takeItemFromContents(world, player, itemQuery, container.name, container.contents, 'container', container);
  }

  return {
    output: [{ text: `You don't see a "${sourceQuery}" here to take from.`, style: 'error' }],
  };
}

/**
 * Take all items from a named source.
 */
function takeAllFromSource(
  world: GameSession['world'],
  player: Player,
  sourceQuery: string
): CommandResult {
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );
  const containers = world.containers
    ? Object.values(world.containers).filter(
        (c) => c.locationId === player.locationId
      )
    : [];

  // Find source
  const corpse = corpses.find((c) => c.name.toLowerCase().includes(sourceQuery));
  if (corpse) {
    return takeAllFromContents(world, player, corpse.name, corpse.loot, 'corpse', corpse);
  }

  const container = containers.find((c) => c.name.toLowerCase().includes(sourceQuery));
  if (container) {
    if (!container.opened) {
      return {
        output: [{ text: `The ${container.name} is closed. Try "open ${container.name.toLowerCase()}" first.`, style: 'error' }],
      };
    }
    return takeAllFromContents(world, player, container.name, container.contents, 'container', container);
  }

  return {
    output: [{ text: `You don't see a "${sourceQuery}" here to take from.`, style: 'error' }],
  };
}

/**
 * Take a specific item by name from a contents array (corpse loot or container).
 */
function takeItemFromContents(
  world: GameSession['world'],
  player: Player,
  itemQuery: string,
  sourceName: string,
  contents: string[],
  sourceType: 'corpse' | 'container',
  sourceRef: Corpse | Container
): CommandResult {
  if (contents.length === 0) {
    const msg = sourceType === 'corpse'
      ? `The ${sourceName}'s corpse has nothing left.`
      : `The ${sourceName} is empty.`;
    return { output: [{ text: msg, style: 'normal' }] };
  }

  const itemIndex = contents.findIndex((id) => {
    const item = world.items[id];
    return item?.name.toLowerCase().includes(itemQuery);
  });

  if (itemIndex === -1) {
    const descriptor = sourceType === 'corpse' ? `${sourceName}'s corpse` : sourceName;
    return {
      output: [{ text: `You don't see "${itemQuery}" in the ${descriptor}.`, style: 'error' }],
    };
  }

  const itemId = contents[itemIndex]!;
  const item = world.items[itemId];

  if (!addToInventory(player, world, itemId)) {
    return { output: [{ text: 'Your inventory is full.', style: 'error' }] };
  }

  contents.splice(itemIndex, 1);
  markSourceTaken(world, sourceType, sourceRef, contents);

  return {
    output: [{ text: `You take the ${item?.name ?? 'item'}.`, style: 'success' }],
    updatePlayer: true,
  };
}

/**
 * Take all items from a contents array (corpse loot or container).
 */
function takeAllFromContents(
  world: GameSession['world'],
  player: Player,
  sourceName: string,
  contents: string[],
  sourceType: 'corpse' | 'container',
  sourceRef: Corpse | Container
): CommandResult {
  if (contents.length === 0) {
    const msg = sourceType === 'corpse'
      ? `The ${sourceName}'s corpse has nothing left.`
      : `The ${sourceName} is empty.`;
    return { output: [{ text: msg, style: 'normal' }] };
  }

  const taken: string[] = [];
  for (const itemId of [...contents]) {
    const item = world.items[itemId];
    if (item && addToInventory(player, world, itemId)) {
      taken.push(item.name);
      const idx = contents.indexOf(itemId);
      if (idx !== -1) contents.splice(idx, 1);
    }
  }

  if (taken.length === 0) {
    return { output: [{ text: 'Your inventory is full.', style: 'error' }] };
  }

  markSourceTaken(world, sourceType, sourceRef, contents);

  return {
    output: [{ text: `You take ${taken.join(', ')}.`, style: 'success' }],
    updatePlayer: true,
  };
}

/**
 * Update source state after items are taken (corpse looted flag / container respawn timer).
 */
function markSourceTaken(
  world: GameSession['world'],
  sourceType: 'corpse' | 'container',
  sourceRef: Corpse | Container,
  contents: string[]
): void {
  if (sourceType === 'corpse') {
    const corpse = sourceRef as Corpse;
    if (contents.length === 0) {
      corpse.looted = true;
      corpse.lootedAt = Date.now();
    }
  } else {
    const container = sourceRef as Container;
    if (!container.originalContents && container.respawns) {
      container.originalContents = [...container.contents];
    }
    if (container.respawns && container.lastOpened === undefined) {
      container.lastOpened = world.time.totalMinutes;
    }
  }
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

  // Check for drunk stumbling
  const drunkEffect = player.statusEffects.find(e => e.id === 'drunk');
  let stumbled = false;
  let stumbleText: OutputLine | null = null;

  if (drunkEffect && exits.length > 1) {
    // Only stumble if there are other exits to stumble into
    if (checkDrunkStumble(drunkEffect.stacks)) {
      stumbled = true;
      stumbleText = { text: getRandomStumbleText(), style: 'error' };

      // Pick a random DIFFERENT exit
      const otherExits = exits.filter(e => e.label.toLowerCase() !== direction);
      if (otherExits.length > 0) {
        const randomExit = otherExits[Math.floor(Math.random() * otherExits.length)]!;
        // Replace matching exits with the stumbled-to exit
        matchingExits.length = 0;
        matchingExits.push(randomExit);
      }
    }
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
  if (exit.type === 'locked') {
    if (exit.requirement?.kind === 'item') {
      // Door requires a key - tell player to unlock it first
      const requiredKey = exit.requirement.value as string;
      const keyItem = world.items[requiredKey];
      const keyName = keyItem?.name ?? 'a key';

      // Check if player has the key to give a helpful hint
      const keySlot = player.inventory.find(slot => {
        const item = world.items[slot.itemId];
        return slot.itemId === requiredKey || item?.baseId === requiredKey || item?.id === requiredKey;
      });

      if (keySlot) {
        return {
          output: [
            { text: `The way ${direction} is locked.`, style: 'error' },
            { text: `You have a key that might fit. Try "unlock ${direction}".`, style: 'system' },
          ],
        };
      }
      return {
        output: [{ text: `The way ${direction} is locked. You need ${keyName}.`, style: 'error' }],
      };
    } else if (exit.requirement?.kind === 'quest') {
      // Check if player has completed the required quest/puzzle
      const questFlag = exit.requirement.value as string;

      // Special handling for sewer puzzle - uses session state, not permanent flags
      if (questFlag === 'sewer_puzzle_solved') {
        if (!session.sewerGateOpen) {
          return {
            output: [
              { text: 'A heavy iron gate blocks the passage. It seems to be controlled by some mechanism.', style: 'error' },
              { text: 'Perhaps the valves nearby hold the key to opening it...', style: 'system' },
            ],
          };
        }
        // Gate is open - can pass through
      } else if (!player.questFlags.includes(questFlag)) {
        // Other quests use permanent flags
        return {
          output: [{ text: `The way ${direction} is blocked. Something must be done to open it.`, style: 'error' }],
        };
      }
      // Quest/puzzle complete - can pass through
    }
  }

  // Check for required items (rope, etc.)
  if (exit.requiresItem) {
    const hasItem = player.inventory.some(slot => {
      const item = world.items[slot.itemId];
      return item?.baseId === exit.requiresItem;
    });

    if (!hasItem) {
      const message = exit.requiresItemMessage ?? `You need a ${exit.requiresItem} to go that way.`;
      return {
        output: [{ text: message, style: 'error' }],
      };
    }
    // Player has the item - they can pass (item is not consumed, it's reusable)
  }

  // Check for leaving town through gate (before moving)
  if (player.locationId === 'town_gate' && exit.to === 'loc_0') {
    if (!player.tutorial.completedSteps.includes('leave_town')) {
      player.tutorial.completedSteps.push('leave_town');

      // Check if tutorial is now complete
      const allSteps = ['talk_mira', 'class_training', 'hit_dummy', 'visit_shop', 'leave_town'];
      const completedAll = allSteps.every(s => player.tutorial.completedSteps.includes(s));

      if (completedAll && !player.tutorial.complete) {
        player.tutorial.complete = true;
      }
    }
  }

  // Track if leaving sewer area (to reset puzzle gate)
  const wasInSewer = exit.from.startsWith('sewer_');
  const nowInSewer = exit.to.startsWith('sewer_');

  // Move player
  const previousLocationId = player.locationId;
  player.locationId = exit.to;

  // If player is in combat, the creature pursues them
  let pursuitMessage: OutputLine | null = null;
  if (player.inCombat && player.targetId) {
    const creature = world.creatures[player.targetId];
    if (creature && creature.currentHp > 0) {
      // Remove creature from old location
      const oldLocation = world.locations[previousLocationId];
      if (oldLocation) {
        const idx = oldLocation.creatures.indexOf(creature.id);
        if (idx !== -1) {
          oldLocation.creatures.splice(idx, 1);
        }
      }

      // Add creature to new location
      const newLocation = world.locations[exit.to];
      if (newLocation && !newLocation.creatures.includes(creature.id)) {
        newLocation.creatures.push(creature.id);
      }

      // Update creature's location
      creature.locationId = exit.to;

      pursuitMessage = {
        text: `The ${creature.name} follows you, refusing to let you escape!`,
        style: 'combat',
      };
    }
  }

  // Reset sewer gate when leaving the sewer area (makes it repeatable)
  if (wasInSewer && !nowInSewer && session.sewerGateOpen) {
    session.sewerGateOpen = false;
    session.puzzleSolution = undefined;
    session.valveSequence = undefined;
  }

  // Brief description of new location (not detailed)
  const roomOutput = generateRoomOutput(session, false, true);

  const output: OutputLine[] = [];
  if (stumbleText) {
    output.push(stumbleText);
  }
  // Show actual direction traveled (may differ from intended if stumbled)
  const actualDirection = exit.label;
  if (stumbled) {
    output.push({ text: `You stumble ${actualDirection} instead.`, style: 'normal' });
  } else {
    output.push({ text: `You go ${actualDirection}.`, style: 'normal' });
  }
  output.push(...roomOutput);

  // Show pursuit message if creature followed
  if (pursuitMessage) {
    output.push(pursuitMessage);
  }

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

  // Mark both as in combat - player auto-attacks back
  player.inCombat = true;
  player.autoAttack = true;
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
      // Handle player death and respawn
      const deathOutput = handlePlayerDeath(session);
      output.push(...deathOutput);
      return output;
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

    if (!item) {
      output.push({ text: `  ${slotName}: (empty)`, style: 'system' });
    } else {
      // Build stat summary
      let stats = '';

      // Show weapon damage
      if (slot === 'weapon' || slot === 'offhand') {
        const damage = getWeaponDamage(item);
        stats = `[${damage.min}-${damage.max} dmg]`;
      }

      // Show affix stats
      if (item.affixes && item.affixes.length > 0) {
        const bonuses: string[] = [];
        for (const affix of item.affixes) {
          for (const [stat, value] of Object.entries(affix.statMods)) {
            const sign = value >= 0 ? '+' : '';
            const shortStat = stat === 'str' ? 'STR' :
                            stat === 'dex' ? 'DEX' :
                            stat === 'con' ? 'CON' :
                            stat === 'int' ? 'INT' :
                            stat === 'wis' ? 'WIS' :
                            stat === 'attackPower' ? 'ATK' :
                            stat === 'defense' ? 'DEF' :
                            stat === 'attackSpeed' ? 'SPD' :
                            stat === 'critChance' ? 'CRIT' :
                            stat === 'hitChance' ? 'HIT' : stat.toUpperCase();
            bonuses.push(`${sign}${value} ${shortStat}`);
          }
        }
        if (bonuses.length > 0) {
          stats = stats ? `${stats} ${bonuses.join(', ')}` : bonuses.join(', ');
        }
      }

      const statDisplay = stats ? ` (${stats})` : '';
      output.push({ text: `  ${slotName}: ${item.name}${statDisplay}`, style: 'normal' });
    }
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
    // Add to inventory (equipment is non-stackable, so this creates a new slot)
    addToInventory(player, world, existingItemId);
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

  // Remove from equipment
  delete player.equipment[targetSlot];

  // Add to inventory (equipment is non-stackable, so this creates a new slot)
  if (!addToInventory(player, world, itemId)) {
    // Re-equip if inventory is full (shouldn't happen, but safety check)
    player.equipment[targetSlot] = itemId;
    return {
      output: [{ text: 'Your inventory is full. Drop something first.', style: 'error' }],
    };
  }

  return {
    output: [{ text: `You unequip the ${item.name}.`, style: 'normal' }],
    updatePlayer: true,
  };
}

/**
 * Handle the "attack" / "kill" command - initiate combat with a creature.
 * First use triggers one immediate combat round. Subsequent uses while
 * already fighting the same target are blocked (no spam damage).
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
    // Check for NPC targets
    const timeOfDay = world.time.timeOfDay;
    const npcsHere = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
    const targetNpc = npcsHere.find(n => n.name.toLowerCase().includes(targetLower));

    if (targetNpc) {
      return handleNpcAttack(ctx, targetNpc);
    }

    return {
      output: [{ text: `You don't see any "${parsed.target}" here to attack.`, style: 'error' }],
    };
  }

  if (targetCreature.currentHp <= 0) {
    return {
      output: [{ text: `The ${targetCreature.name} is already dead.`, style: 'error' }],
    };
  }

  // --- Already fighting same target: block spam ---
  if (player.inCombat && player.targetId === targetCreature.id) {
    return {
      output: [{ text: `You are already fighting the ${targetCreature.name}.`, style: 'system' }],
    };
  }

  // --- Already fighting different target: switch ---
  if (player.inCombat && player.targetId !== targetCreature.id) {
    // Disengage old target
    const oldCreature = world.creatures[player.targetId!];
    if (oldCreature) {
      oldCreature.inCombat = false;
      oldCreature.targetId = undefined;
    }

    player.targetId = targetCreature.id;
    targetCreature.inCombat = true;
    targetCreature.targetId = player.id;

    return {
      output: [{ text: `You turn to attack the ${targetCreature.name}!`, style: 'combat' }],
      updatePlayer: true,
    };
  }

  // --- New combat: initiate and run one immediate round ---
  const output: OutputLine[] = [];

  // Darkness ambush: creature gets a surprise hit in the dark
  const isDarkHere = location.isDark && !hasLight(player, world.time.totalMinutes);

  if (isDarkHere && targetCreature.behavior !== 'passive') {
    output.push({
      text: 'Something lurks in the darkness... it strikes before you can react!',
      style: 'combat',
    });

    const ambushRng = createRng(`${world.seed}-ambush-${Date.now()}`);
    const minDmg = Math.max(1, targetCreature.level);
    const maxDmg = Math.max(2, targetCreature.level * 2 + 2);
    const baseDmg = minDmg + Math.floor(ambushRng.next() * (maxDmg - minDmg + 1));
    const ambushDmg = Math.floor(baseDmg * 1.5);

    player.currentHp -= ambushDmg;

    output.push({
      text: `The ${targetCreature.name} ambushes you for ${ambushDmg} damage!`,
      style: 'combat',
    });
    output.push({
      text: `Your HP: ${player.currentHp}/${player.maxHp}`,
      style: player.currentHp <= player.maxHp * 0.25 ? 'error' : 'system',
    });

    if (player.currentHp <= 0) {
      output.push({ text: '', style: 'normal' });
      output.push({
        text: 'You collapse in the darkness, never seeing what killed you...',
        style: 'error',
      });
      const deathOutput = handlePlayerDeath(session);
      output.push(...deathOutput);
      return { output, updatePlayer: true, updateRoom: true };
    }

    output.push({ text: '', style: 'normal' });
    output.push({ text: 'You recover and prepare to fight back!', style: 'normal' });
  }

  // Check for ranger trap
  if (player.placedTrap && player.placedTrap.locationId === player.locationId) {
    const trapResult = triggerRangerTrap(player, targetCreature, createRng(`trap-${Date.now()}`));
    output.push(...trapResult.output);

    if (trapResult.creatureKilled) {
      const template = CREATURE_TEMPLATES[targetCreature.templateId];
      const tier = template?.tier ?? 'common';

      // Generate loot for trap kills
      let lootItems: Item[] = [];
      const lootRng = createRng(`trap-loot-${Date.now()}`);
      if (SEWER_LOOT_TABLES[targetCreature.templateId]) {
        lootItems = generateSewerLoot(targetCreature.templateId, targetCreature.level, lootRng);
      } else if (WILDERNESS_LOOT_TABLES[targetCreature.templateId]) {
        lootItems = generateWildernessLoot(targetCreature.templateId, targetCreature.level, lootRng);
      }
      const loot: string[] = [];
      for (const item of lootItems) {
        world.items[item.id] = item;
        loot.push(item.id);
      }

      handleCreatureDeath(world, targetCreature, 'player', tier, loot);

      // XP reward (with level difference penalty)
      const xpGain = calculateXpGain(player.level, targetCreature.level);
      player.xp += xpGain;
      output.push({ text: `You gain ${xpGain} XP.`, style: 'success' });

      while (player.xp >= player.xpToNextLevel) {
        player.level++;
        player.xpToNextLevel = xpForLevel(player.level + 1);
        const classDef = CLASSES[player.class];
        player.maxHp += classDef.hpPerLevel;
        player.maxMp += classDef.mpPerLevel;
        player.currentHp = player.maxHp;
        player.currentMp = player.maxMp;
        output.push({
          text: `★ LEVEL UP! You are now level ${player.level}!`,
          style: 'success',
        });
      }

      output.push({
        text: `Use "loot ${targetCreature.name.toLowerCase()}" to check the corpse.`,
        style: 'system',
      });

      // Chain aggro: check for next hostile creature
      const chainOutput = checkChainAggro(world, player, location);
      if (chainOutput) output.push(...chainOutput);

      return { output, updateRoom: true, updatePlayer: true };
    }
  }

  // --- Set up combat state ---
  player.inCombat = true;
  player.autoAttack = true;
  player.targetId = targetCreature.id;
  targetCreature.inCombat = true;
  targetCreature.targetId = player.id;

  // --- First combat round: player attacks ---
  const weaponId = player.equipment.weapon;
  const weapon = weaponId ? world.items[weaponId] : undefined;
  const weaponName = weapon?.name ?? 'bare hands';
  const weaponDamage = weapon ? getWeaponDamage(weapon) : { min: 1, max: 2 };
  const rng = createRng(`${world.seed}-combat-${Date.now()}`);

  // Level-based hit modifier (harder to hit higher level enemies)
  const levelHitMod = getLevelHitModifier(player.level, targetCreature.level);
  const baseHitChance = 0.85 + (combatStats.hitChance / 100) * 0.15;
  const hitChance = baseHitChance * levelHitMod;
  const playerHits = rng.next() < hitChance;

  if (!playerHits) {
    const missReason = levelHitMod < 1.0 ? ` (Level ${targetCreature.level} enemy)` : '';
    output.push({
      text: `You swing your ${weaponName} at the ${targetCreature.name} but miss!${missReason}`,
      style: 'combat',
    });
  } else {
    const baseDamage = weaponDamage.min + Math.floor(rng.next() * (weaponDamage.max - weaponDamage.min + 1));
    const attackBonus = Math.floor(combatStats.attackPower / 10);
    const critChance = combatStats.critChance / 100;
    const isCrit = rng.next() < critChance;

    // Level-based damage modifier (deal less damage to higher level enemies)
    const levelDmgMod = getLevelDamageModifier(player.level, targetCreature.level);
    const rawDamage = (baseDamage + attackBonus) * (isCrit ? 2 : 1);
    const damage = Math.max(1, Math.floor(rawDamage * levelDmgMod));

    targetCreature.currentHp -= damage;

    if (isCrit) {
      output.push({
        text: `CRITICAL HIT! You strike the ${targetCreature.name} with your ${weaponName} for ${damage} damage!`,
        style: 'combat',
      });
    } else {
      output.push({
        text: `You hit the ${targetCreature.name} for ${damage} damage.`,
        style: 'combat',
      });
    }

    // Training dummy: reset HP, don't kill
    if (targetCreature.templateId === 'training_dummy') {
      targetCreature.currentHp = targetCreature.maxHp;
      if (!player.tutorial.completedSteps.includes('hit_dummy')) {
        player.tutorial.completedSteps.push('hit_dummy');
        output.push({ text: '', style: 'normal' });
        output.push({ text: '[Tutorial] Combat practice complete!', style: 'success' });
      }
      output.push({ text: 'The training dummy wobbles but stays upright, ready for more.', style: 'normal' });
      player.inCombat = false;
      player.autoAttack = false;
      player.targetId = undefined;
      targetCreature.inCombat = false;
      targetCreature.targetId = undefined;
      return { output, updatePlayer: true };
    }

    // Check if creature died from first hit
    if (targetCreature.currentHp <= 0) {
      return handleCreatureKill(session, targetCreature, rng, output);
    }

    // Show creature HP
    const hpPercent = Math.floor((targetCreature.currentHp / targetCreature.maxHp) * 100);
    output.push({
      text: `${targetCreature.name}: ${targetCreature.currentHp}/${targetCreature.maxHp} HP (${hpPercent}%)`,
      style: 'system',
    });
  }

  // --- First combat round: creature counter-attacks ---
  if (targetCreature.currentHp > 0 && targetCreature.behavior !== 'passive') {
    const creatureHits = rng.next() < 0.75;

    if (!creatureHits) {
      output.push({
        text: `The ${targetCreature.name} attacks but misses!`,
        style: 'combat',
      });
    } else {
      const minDmg = Math.max(1, targetCreature.level);
      const maxDmg = Math.max(2, targetCreature.level * 2 + 2);
      let creatureDamage = minDmg + Math.floor(rng.next() * (maxDmg - minDmg + 1));
      const defenseReduction = Math.floor(combatStats.defense / 20);
      creatureDamage = Math.max(1, creatureDamage - defenseReduction);

      player.currentHp -= creatureDamage;

      output.push({
        text: `The ${targetCreature.name} hits you for ${creatureDamage} damage!`,
        style: 'combat',
      });

      const hpPercent = Math.floor((player.currentHp / player.maxHp) * 100);
      output.push({
        text: `Your HP: ${player.currentHp}/${player.maxHp} (${hpPercent}%)`,
        style: player.currentHp < player.maxHp * 0.3 ? 'error' : 'system',
      });

      if (player.currentHp <= 0) {
        const deathOutput = handlePlayerDeath(session);
        output.push(...deathOutput);
        return { output, updateRoom: true, updatePlayer: true };
      }
    }
  } else if (targetCreature.currentHp > 0 && targetCreature.behavior === 'passive') {
    output.push({
      text: `The ${targetCreature.name} bleats in fear but doesn't fight back.`,
      style: 'normal',
    });
  }

  return { output, updateRoom: true, updatePlayer: true };
}

/**
 * Handle creature death during combat: loot, XP, level-up, chain aggro.
 * Shared by handleAttack (first hit kill) and processPlayerCombat (tick kill).
 */
function handleCreatureKill(
  session: GameSession,
  creature: Creature,
  rng: Rng,
  output: OutputLine[]
): CommandResult {
  const { world, player } = session;
  const location = world.locations[player.locationId];

  output.push({
    text: `The ${creature.name} collapses and dies!`,
    style: 'success',
  });

  const template = CREATURE_TEMPLATES[creature.templateId];
  const tier = template?.tier ?? 'common';

  // Generate loot
  let lootItems: Item[] = [];
  if (SEWER_LOOT_TABLES[creature.templateId]) {
    lootItems = generateSewerLoot(creature.templateId, creature.level, rng);
  } else if (WILDERNESS_LOOT_TABLES[creature.templateId]) {
    lootItems = generateWildernessLoot(creature.templateId, creature.level, rng);
  }
  const loot: string[] = [];
  for (const item of lootItems) {
    world.items[item.id] = item;
    loot.push(item.id);
  }

  handleCreatureDeath(world, creature, 'player', tier, loot);

  // XP reward
  const tierMultiplier = tier === 'apex' ? 3.0 : tier === 'dangerous' ? 2.0 : tier === 'common' ? 1.5 : 1.0;
  const behaviorMultiplier = creature.behavior === 'aggressive' ? 1.2 :
                              creature.behavior === 'territorial' ? 1.1 : 0.5;
  const baseXp = creature.level * 10;
  const xpReward = Math.floor(baseXp * tierMultiplier * behaviorMultiplier);

  const copperReward = creature.behavior === 'passive' ? 0 : Math.floor(creature.level * (2 + rng.next() * 3));

  player.xp += xpReward;
  if (copperReward > 0) {
    player.currency = addCopper(player.currency, copperReward);
  }

  output.push({
    text: `You gain ${xpReward} XP${copperReward > 0 ? ` and ${formatPrice(copperReward)}` : ''}.`,
    style: 'success',
  });

  // Level up
  while (player.xp >= player.xpToNextLevel) {
    player.level++;
    player.xpToNextLevel = xpForLevel(player.level + 1);
    const classDef = CLASSES[player.class];
    const hpGain = classDef.hpPerLevel;
    const mpGain = classDef.mpPerLevel;
    player.maxHp += hpGain;
    player.maxMp += mpGain;
    player.currentHp = player.maxHp;
    player.currentMp = player.maxMp;
    player.maxCarryWeight = 50 + (player.baseStats.str * 5);

    output.push({ text: '', style: 'normal' });
    output.push({ text: '╔═══════════════════════════════════════╗', style: 'success' });
    output.push({ text: `║       ⭐ LEVEL UP! Level ${player.level}! ⭐        ║`, style: 'success' });
    output.push({ text: '╠═══════════════════════════════════════╣', style: 'success' });
    output.push({ text: `║  HP: +${hpGain} (now ${player.maxHp})`.padEnd(40) + '║', style: 'normal' });
    output.push({ text: `║  MP: +${mpGain} (now ${player.maxMp})`.padEnd(40) + '║', style: 'normal' });
    output.push({ text: '║  Health & Mana fully restored!'.padEnd(40) + '║', style: 'normal' });
    output.push({ text: `║  Next level: ${player.xpToNextLevel} XP`.padEnd(40) + '║', style: 'normal' });
    output.push({ text: '╚═══════════════════════════════════════╝', style: 'success' });
  }

  output.push({
    text: `Use "loot ${creature.name.toLowerCase()}" to check the corpse.`,
    style: 'system',
  });

  // End combat, then check chain aggro
  player.inCombat = false;
  player.autoAttack = false;
  player.targetId = undefined;

  if (location) {
    const chainOutput = checkChainAggro(world, player, location);
    if (chainOutput) output.push(...chainOutput);
  }

  return { output, updateRoom: true, updatePlayer: true };
}

/**
 * Check for chain aggro: after killing a creature, engage the next
 * aggressive creature in the room. No free ambush hit — combat just continues.
 */
function checkChainAggro(
  world: GameSession['world'],
  player: Player,
  location: Location
): OutputLine[] | null {
  const nextAggressor = location.creatures
    .map((id) => world.creatures[id])
    .find((c): c is Creature =>
      !!c && c.behavior === 'aggressive' && c.currentHp > 0 && !c.inCombat
    );

  if (!nextAggressor) return null;

  player.inCombat = true;
  player.autoAttack = true;
  player.targetId = nextAggressor.id;
  nextAggressor.inCombat = true;
  nextAggressor.targetId = player.id;

  return [
    { text: '', style: 'normal' as const },
    { text: `The ${nextAggressor.name} attacks!`, style: 'combat' as const },
  ];
}

/**
 * Handle attacking an NPC - applies infamy and triggers retaliation.
 * NPCs with combat stats will fight back; all NPCs can be killed.
 */
function handleNpcAttack(ctx: CommandContext, npc: NPC): CommandResult {
  const { session } = ctx;
  const { world, player, combatStats } = session;
  const output: OutputLine[] = [];

  // Check if NPC is already dead (via combat field)
  if (npc.combat && npc.combat.currentHp <= 0) {
    return {
      output: [{ text: `${npc.name} is already dead.`, style: 'error' }],
    };
  }

  // Warn about attacking town NPCs
  output.push({ text: '', style: 'normal' });
  output.push({ text: '⚠️ WARNING: Attacking town residents has consequences!', style: 'error' });

  // Get town ID from location (assume locations starting with 'town_' are in a town)
  const townId = player.locationId.startsWith('town_') ? 'easthollow' : 'unknown';

  // Apply assault infamy
  player.infamy = addAssaultBounty(player, townId, world.time.totalMinutes);

  const infamyDisplay = getInfamyDisplay(player.infamy);
  if (infamyDisplay) {
    output.push({ text: `Infamy: ${infamyDisplay}`, style: 'error' });
  }

  // Calculate player attack
  const weaponId = player.equipment.weapon;
  const weapon = weaponId ? world.items[weaponId] : undefined;
  const weaponName = weapon?.name ?? 'bare hands';
  const weaponDamage = weapon ? getWeaponDamage(weapon) : { min: 1, max: 2 };
  const rng = createRng(`${world.seed}-npc-combat-${Date.now()}`);

  // Player attacks NPC
  const baseDamage = weaponDamage.min + Math.floor(rng.next() * (weaponDamage.max - weaponDamage.min + 1));
  const attackBonus = Math.floor(combatStats.attackPower / 10);
  const critChance = combatStats.critChance / 100;
  const isCrit = rng.next() < critChance;
  const damage = (baseDamage + attackBonus) * (isCrit ? 2 : 1);

  if (isCrit) {
    output.push({
      text: `CRITICAL HIT! You strike ${npc.name} with your ${weaponName} for ${damage} damage!`,
      style: 'combat',
    });
  } else {
    output.push({
      text: `You attack ${npc.name} for ${damage} damage!`,
      style: 'combat',
    });
  }

  // Check if NPC has combat stats
  if (npc.combat) {
    npc.combat.currentHp -= damage;

    // Check if NPC died
    if (npc.combat.currentHp <= 0) {
      return handleNpcDeath(ctx, npc, rng, output, townId);
    }

    // Show NPC HP
    const hpPercent = Math.floor((npc.combat.currentHp / npc.combat.maxHp) * 100);
    output.push({
      text: `${npc.name}: ${npc.combat.currentHp}/${npc.combat.maxHp} HP (${hpPercent}%)`,
      style: 'system',
    });

    // NPC retaliates using AI
    const npcAction = selectNpcAction({
      npc,
      combat: npc.combat,
      target: {
        id: player.id,
        name: player.name,
        currentHp: player.currentHp,
        maxHp: player.maxHp,
        level: player.level,
        templateId: 'player',
        behavior: 'aggressive',
        mobility: 'static',
        locationId: player.locationId,
        homeLocationId: player.locationId,
        spawnLocationId: player.locationId,
        inCombat: true,
        description: 'A player',
      },
      allies: [],
      rng,
    });

    npc.combat = applyNpcAction(npc.combat, npcAction, world.time.totalMinutes);

    output.push({ text: npcAction.message, style: 'combat' });

    // Apply NPC damage to player
    if (npcAction.damage && npcAction.damage > 0) {
      const defenseReduction = Math.floor(combatStats.defense / 20);
      const actualDamage = Math.max(1, npcAction.damage - defenseReduction);
      player.currentHp -= actualDamage;

      output.push({
        text: `Your HP: ${player.currentHp}/${player.maxHp}`,
        style: player.currentHp < player.maxHp * 0.3 ? 'error' : 'system',
      });

      if (player.currentHp <= 0) {
        const deathOutput = handlePlayerDeath(session);
        output.push(...deathOutput);
        return { output, updateRoom: true, updatePlayer: true };
      }
    }
  } else {
    // NPC without combat stats (citizen) - dies immediately
    return handleNpcDeath(ctx, npc, rng, output, townId);
  }

  // Alert nearby guards
  const guardAlert = alertNearbyGuards(ctx, npc, output);
  if (guardAlert) {
    output.push(...guardAlert);
  }

  return { output, updateRoom: true, updatePlayer: true };
}

/**
 * Handle an NPC being killed.
 */
function handleNpcDeath(
  ctx: CommandContext,
  npc: NPC,
  rng: Rng,
  output: OutputLine[],
  townId: string
): CommandResult {
  const { session } = ctx;
  const { world, player } = session;
  const location = world.locations[player.locationId];

  // Apply murder infamy
  const npcLevel = npc.combat?.level ?? 10;
  player.infamy = addMurderBounty(player, townId, npcLevel, world.time.totalMinutes);

  output.push({ text: '', style: 'normal' });
  output.push({ text: `You have murdered ${npc.name}!`, style: 'error' });

  const infamyDisplay = getInfamyDisplay(player.infamy);
  if (infamyDisplay) {
    output.push({ text: `Infamy: ${infamyDisplay}`, style: 'error' });
  }

  // Generate loot
  const role = npc.role ?? 'citizen';
  const lootItems = generateNpcLoot(role, npcLevel, rng);
  const goldDrop = calculateNpcGoldDrop(role, npcLevel, rng);

  // Add gold to currency
  player.currency = addCopper(player.currency, goldDrop);
  // Format copper as currency string
  const goldCoins = Math.floor(goldDrop / 100);
  const silverCoins = Math.floor((goldDrop % 100) / 10);
  const copperCoins = goldDrop % 10;
  let goldStr = '';
  if (goldCoins > 0) goldStr += `${goldCoins}g `;
  if (silverCoins > 0) goldStr += `${silverCoins}s `;
  if (copperCoins > 0 || goldStr === '') goldStr += `${copperCoins}c`;
  output.push({ text: `You find ${goldStr.trim()} on the body.`, style: 'success' });

  // Create corpse
  const corpseId = `corpse_npc_${npc.id}_${Date.now()}`;
  const loot: string[] = [];
  for (const item of lootItems) {
    world.items[item.id] = item;
    loot.push(item.id);
  }

  const corpse: Corpse = {
    id: corpseId,
    creatureId: npc.id,
    templateId: npc.role ?? 'citizen',
    name: `corpse of ${npc.name}`,
    locationId: player.locationId,
    createdAt: world.time.totalMinutes,
    killedBy: 'player',
    looted: false,
    loot,
    decayAt: world.time.totalMinutes + 30, // 30 game minutes to decay
    isNpc: true,
  };

  world.corpses[corpseId] = corpse;

  // Mark NPC as dead (set HP to 0)
  if (npc.combat) {
    npc.combat.currentHp = 0;
  }

  // Remove NPC from location (they're now a corpse)
  if (location?.npcs) {
    const idx = location.npcs.indexOf(npc.id);
    if (idx !== -1) {
      location.npcs.splice(idx, 1);
    }
  }

  // XP reward (reduced for NPCs - they're not monsters)
  const xpGain = Math.floor(npcLevel * 5);
  player.xp += xpGain;
  output.push({ text: `You gain ${xpGain} XP.`, style: 'success' });

  // Check level up
  while (player.xp >= player.xpToNextLevel) {
    player.level++;
    player.xpToNextLevel = xpForLevel(player.level + 1);
    const classDef = CLASSES[player.class];
    player.maxHp += classDef.hpPerLevel;
    player.maxMp += classDef.mpPerLevel;
    player.currentHp = player.maxHp;
    player.currentMp = player.maxMp;
    output.push({
      text: `★ LEVEL UP! You are now level ${player.level}!`,
      style: 'success',
    });
  }

  if (loot.length > 0) {
    output.push({
      text: `Use "loot corpse" to search ${npc.name}'s body.`,
      style: 'system',
    });
  }

  // Alert guards
  const guardAlert = alertNearbyGuards(ctx, npc, output);
  if (guardAlert) {
    output.push(...guardAlert);
  }

  return { output, updateRoom: true, updatePlayer: true };
}

/**
 * Alert nearby guards when player attacks/kills an NPC.
 */
function alertNearbyGuards(
  ctx: CommandContext,
  _targetNpc: NPC,
  _output: OutputLine[]
): OutputLine[] | null {
  const { session } = ctx;
  const { world, player } = session;
  const location = world.locations[player.locationId];

  if (!location) return null;

  // Find guards at this location
  const guards = getCombatNpcsAtLocation(
    world.npcs,
    location.npcs ?? [],
    player.locationId,
    world.time.timeOfDay
  ).filter(n => n.role === 'guard' && n.combat && n.combat.currentHp > 0);

  if (guards.length === 0) return null;

  const alertOutput: OutputLine[] = [];
  alertOutput.push({ text: '', style: 'normal' });
  alertOutput.push({ text: '🚨 GUARDS ALERTED!', style: 'error' });

  for (const guard of guards) {
    alertOutput.push({
      text: `${guard.name} shouts: "Criminal! You'll pay for this!"`,
      style: 'combat',
    });
  }

  // Guards will attack player on their next action (handled in game loop)
  // For now, just set up the alert message
  alertOutput.push({
    text: 'The guards move to attack you!',
    style: 'combat',
  });

  return alertOutput;
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
 * Handle the "loot" command - inspect a corpse or container (never takes items).
 * Supports: loot, loot <source>
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

  // Gather inspectable sources: corpses + containers at this location
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );
  const allContainers = world.containers
    ? Object.values(world.containers).filter(
        (c) => c.locationId === player.locationId
      )
    : [];

  const input = parsed.args.join(' ').toLowerCase();

  // --- No args: if one source, inspect it; if multiple, list ---
  if (!input) {
    const total = corpses.length + allContainers.filter((c) => c.opened).length;
    if (total === 0) {
      return {
        output: [{ text: 'There is nothing here to loot.', style: 'error' }],
      };
    }
    if (total === 1) {
      const corpse = corpses[0];
      if (corpse) return showSourceContents(world, corpse.name, corpse.loot, 'corpse');
      const container = allContainers.find((c) => c.opened);
      if (container) return showSourceContents(world, container.name, container.contents, 'container');
    }
    const names = [
      ...corpses.map((c) => `${c.name} (corpse)`),
      ...allContainers.filter((c) => c.opened).map((c) => c.name),
    ].join(', ');
    return {
      output: [
        { text: 'Multiple lootable things here. Specify which one:', style: 'system' },
        { text: `  ${names}`, style: 'normal' },
      ],
    };
  }

  // --- loot <source>: find corpse or container by name ---

  // Handle "loot corpse" keyword - matches any corpse in the room
  if (input === 'corpse' || input === 'body') {
    if (corpses.length === 0) {
      return {
        output: [{ text: 'There are no corpses here to loot.', style: 'error' }],
      };
    }
    if (corpses.length === 1) {
      const c = corpses[0]!;
      return showSourceContents(world, c.name, c.loot, 'corpse');
    }
    // Multiple corpses - list them
    const names = corpses.map((c) => c.name).join(', ');
    return {
      output: [
        { text: 'Multiple corpses here. Specify which one:', style: 'system' },
        { text: `  ${names}`, style: 'normal' },
      ],
    };
  }

  // Check corpses by name
  const corpse = corpses.find((c) => c.name.toLowerCase().includes(input));
  if (corpse) {
    return showSourceContents(world, corpse.name, corpse.loot, 'corpse');
  }

  // Check containers (including closed ones — give helpful message)
  const container = allContainers.find((c) => c.name.toLowerCase().includes(input));
  if (container) {
    if (!container.opened) {
      return {
        output: [{ text: `The ${container.name} is closed. Try "open ${container.name.toLowerCase()}" first.`, style: 'error' }],
      };
    }
    return showSourceContents(world, container.name, container.contents, 'container');
  }

  return {
    output: [{ text: `You don't see "${parsed.args.join(' ')}" here to loot.`, style: 'error' }],
  };
}

/**
 * Show the contents of a loot source (inspect only, no taking).
 */
function showSourceContents(
  world: { items: Record<string, Item> },
  sourceName: string,
  contents: string[],
  sourceType: 'corpse' | 'container'
): CommandResult {
  const descriptor = sourceType === 'corpse' ? `${sourceName}'s corpse` : sourceName;

  if (contents.length === 0) {
    const msg = sourceType === 'corpse'
      ? `The ${descriptor} has nothing of value.`
      : `The ${sourceName} is empty.`;
    return { output: [{ text: msg, style: 'normal' }] };
  }

  const output: OutputLine[] = [
    { text: `The ${descriptor} contains:`, style: 'system' },
  ];

  if (contents.length === 1) {
    const item = world.items[contents[0]!];
    output.push({ text: `  ${item?.name ?? 'Unknown item'}`, style: 'normal' });
  } else {
    contents.forEach((itemId, index) => {
      const item = world.items[itemId];
      output.push({ text: `  ${index + 1}. ${item?.name ?? 'Unknown item'}`, style: 'normal' });
    });
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: `Use "take <item> ${sourceName.toLowerCase()}" or "take all ${sourceName.toLowerCase()}"`, style: 'system' });

  return { output };
}


/**
 * Handle the "spells" command - list known spells.
 */
function handleSpells(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player } = session;

  const output: OutputLine[] = [
    { text: '=== Your Spells ===', style: 'system' },
  ];

  if (player.spells.known.length === 0) {
    output.push({ text: 'You have not learned any spells yet.', style: 'normal' });
    output.push({ text: 'Visit a class trainer to learn spells.', style: 'system' });
    return { output };
  }

  for (const spellId of player.spells.known) {
    const spell = SPELLS[spellId];
    if (!spell) continue;

    const cooldownRemaining = player.abilityCooldowns[spellId] ?? 0;
    const cooldownText = cooldownRemaining > 0
      ? ` [CD: ${Math.ceil(cooldownRemaining / 1000)}s]`
      : '';

    const slotIndex = player.spells.slots.indexOf(spellId);
    const slotText = slotIndex >= 0 ? ` [Slot ${slotIndex + 1}]` : '';
    const aliasText = spell.alias ? ` [${spell.alias}]` : '';

    output.push({
      text: `  ${spell.name}${aliasText}${slotText}${cooldownText} - ${spell.manaCost} MP`,
      style: 'normal'
    });
    output.push({
      text: `    ${spell.description}`,
      style: 'system'
    });
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: 'Use "cast <spell>" to cast a spell.', style: 'system' });

  // Show learnable spells
  const learnable = getLearnableSpells(player.class, player.level, player.spells.known);
  if (learnable.length > 0) {
    output.push({ text: '', style: 'normal' });
    output.push({ text: 'Spells available to learn from trainers:', style: 'system' });
    for (const spell of learnable) {
      const aliasText = spell.alias ? ` [${spell.alias}]` : '';
      output.push({
        text: `  ${spell.name}${aliasText} (Level ${spell.levelRequired}) - ${spell.learnCost} gold`,
        style: 'normal'
      });
    }
  }

  return { output };
}

/**
 * Handle the "slots" command - show quick slot assignments.
 */
function handleSlots(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { world, player } = session;

  const output: OutputLine[] = [
    { text: '=== Quick Slots ===', style: 'system' },
    { text: '', style: 'normal' },
  ];

  // Show item slots (q1-q4)
  output.push({ text: 'Item Slots:', style: 'system' });
  for (let i = 0; i < 4; i++) {
    const slot = player.itemSlots[i];
    if (slot) {
      const item = world.items[slot.id];
      const name = item?.name ?? 'Unknown item';
      output.push({ text: `  [q${i + 1}] ${name}`, style: 'normal' });
    } else {
      output.push({ text: `  [q${i + 1}] (empty)`, style: 'system' });
    }
  }

  output.push({ text: '', style: 'normal' });

  // Show ability/spell slots (a1-a4)
  output.push({ text: 'Ability Slots:', style: 'system' });
  for (let i = 0; i < 4; i++) {
    const slot = player.abilitySlots[i];
    if (slot) {
      const spell = SPELLS[slot.id];
      const name = spell?.name ?? 'Unknown ability';
      output.push({ text: `  [a${i + 1}] ${name}`, style: 'normal' });
    } else {
      output.push({ text: `  [a${i + 1}] (empty)`, style: 'system' });
    }
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: 'Use "assign q1 <item>" or "assign a1 <spell>" to set slots.', style: 'system' });
  output.push({ text: 'Use "unassign q1" or "unassign a1" to clear slots.', style: 'system' });

  return { output };
}

/**
 * Handle the "assign" command - assign an item or spell to a quick slot.
 * Usage: assign q1 potion, assign a2 fireball
 */
function handleAssign(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (parsed.args.length < 2) {
    return {
      output: [
        { text: 'Usage: assign <slot> <item/spell>', style: 'error' },
        { text: 'Slots: q1-q4 (items), a1-a4 (abilities)', style: 'system' },
      ],
    };
  }

  const slotArg = parsed.args[0]!.toLowerCase();
  const targetName = parsed.args.slice(1).join(' ').toLowerCase();

  // Parse slot type and number
  const slotMatch = slotArg.match(/^([qa])(\d)$/);
  if (!slotMatch) {
    return {
      output: [{ text: 'Invalid slot. Use q1-q4 for items, a1-a4 for abilities.', style: 'error' }],
    };
  }

  const slotType = slotMatch[1] as 'q' | 'a';
  const slotNum = parseInt(slotMatch[2]!, 10);

  if (slotNum < 1 || slotNum > 4) {
    return {
      output: [{ text: 'Slot number must be 1-4.', style: 'error' }],
    };
  }

  const slotIndex = slotNum - 1;

  if (slotType === 'q') {
    // Assigning an item to item slot
    const inventorySlot = player.inventory.find(slot => {
      const item = world.items[slot.itemId];
      return item?.name.toLowerCase().includes(targetName);
    });

    if (!inventorySlot) {
      return {
        output: [{ text: `You don't have "${targetName}" in your inventory.`, style: 'error' }],
      };
    }

    const item = world.items[inventorySlot.itemId]!;

    // Check if it's a usable item (consumable)
    if (!item.tags.includes('consumable')) {
      return {
        output: [{ text: `${item.name} is not a usable item.`, style: 'error' }],
      };
    }

    player.itemSlots[slotIndex] = { type: 'item', id: inventorySlot.itemId };

    return {
      output: [{ text: `Assigned ${item.name} to slot q${slotNum}.`, style: 'success' }],
      updatePlayer: true,
    };
  } else {
    // Assigning a spell/ability to ability slot
    let foundSpell: Spell | undefined;
    for (const spellId of player.spells.known) {
      const spell = SPELLS[spellId];
      if (spell && spell.name.toLowerCase().includes(targetName)) {
        foundSpell = spell;
        break;
      }
    }

    if (!foundSpell) {
      return {
        output: [{ text: `You don't know a spell called "${targetName}".`, style: 'error' }],
      };
    }

    player.abilitySlots[slotIndex] = { type: 'ability', id: foundSpell.id };

    return {
      output: [{ text: `Assigned ${foundSpell.name} to slot a${slotNum}.`, style: 'success' }],
      updatePlayer: true,
    };
  }
}

/**
 * Handle the "unassign" command - clear a quick slot.
 * Usage: unassign q1, unassign a2
 */
function handleUnassign(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { player } = session;

  if (!parsed.target) {
    return {
      output: [
        { text: 'Usage: unassign <slot>', style: 'error' },
        { text: 'Slots: q1-q4 (items), a1-a4 (abilities)', style: 'system' },
      ],
    };
  }

  const slotArg = parsed.target.toLowerCase();

  // Parse slot type and number
  const slotMatch = slotArg.match(/^([qa])(\d)$/);
  if (!slotMatch) {
    return {
      output: [{ text: 'Invalid slot. Use q1-q4 for items, a1-a4 for abilities.', style: 'error' }],
    };
  }

  const slotType = slotMatch[1] as 'q' | 'a';
  const slotNum = parseInt(slotMatch[2]!, 10);

  if (slotNum < 1 || slotNum > 4) {
    return {
      output: [{ text: 'Slot number must be 1-4.', style: 'error' }],
    };
  }

  const slotIndex = slotNum - 1;

  if (slotType === 'q') {
    if (!player.itemSlots[slotIndex]) {
      return {
        output: [{ text: `Slot q${slotNum} is already empty.`, style: 'system' }],
      };
    }
    player.itemSlots[slotIndex] = null;
    return {
      output: [{ text: `Cleared item slot q${slotNum}.`, style: 'success' }],
      updatePlayer: true,
    };
  } else {
    if (!player.abilitySlots[slotIndex]) {
      return {
        output: [{ text: `Slot a${slotNum} is already empty.`, style: 'system' }],
      };
    }
    player.abilitySlots[slotIndex] = null;
    return {
      output: [{ text: `Cleared ability slot a${slotNum}.`, style: 'success' }],
      updatePlayer: true,
    };
  }
}

/**
 * Handle quick slot shortcuts (q1-q4 for items, a1-a4 for abilities).
 * Using a slot will use the item or cast the spell assigned to it.
 */
function handleUseSlot(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  const command = parsed.command.toLowerCase();
  const slotMatch = command.match(/^([qa])(\d)$/);

  if (!slotMatch) {
    return {
      output: [{ text: 'Invalid slot command.', style: 'error' }],
    };
  }

  const slotType = slotMatch[1] as 'q' | 'a';
  const slotNum = parseInt(slotMatch[2]!, 10);
  const slotIndex = slotNum - 1;

  if (slotType === 'q') {
    // Item slot - use the item
    const slot = player.itemSlots[slotIndex];
    if (!slot) {
      return {
        output: [{ text: `Slot q${slotNum} is empty. Use "assign q${slotNum} <item>" to set it.`, style: 'error' }],
      };
    }

    // Find the item in inventory
    const inventorySlot = player.inventory.find(inv => inv.itemId === slot.id);
    if (!inventorySlot) {
      // Item no longer in inventory - clear the slot
      player.itemSlots[slotIndex] = null;
      return {
        output: [{ text: `That item is no longer in your inventory. Slot cleared.`, style: 'error' }],
        updatePlayer: true,
      };
    }

    // Delegate to the use command
    return handleUse({ session, parsed: { ...parsed, command: 'use', target: world.items[slot.id]?.name ?? slot.id, args: [world.items[slot.id]?.name ?? slot.id], raw: parsed.raw } });
  } else {
    // Ability slot - cast the spell
    const slot = player.abilitySlots[slotIndex];
    if (!slot) {
      return {
        output: [{ text: `Slot a${slotNum} is empty. Use "assign a${slotNum} <spell>" to set it.`, style: 'error' }],
      };
    }

    // Check if player still knows the spell
    if (!player.spells.known.includes(slot.id)) {
      player.abilitySlots[slotIndex] = null;
      return {
        output: [{ text: `You no longer know that spell. Slot cleared.`, style: 'error' }],
        updatePlayer: true,
      };
    }

    // Delegate to the cast command
    const spell = SPELLS[slot.id];
    return handleCast({ session, parsed: { ...parsed, command: 'cast', target: spell?.name ?? slot.id, args: [spell?.name ?? slot.id], raw: parsed.raw } });
  }
}

/**
 * Handle the "cast" command - cast a spell.
 * Supports: cast <spell name>, cast a1 (slot reference)
 */
function handleCast(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Cast what? Try "cast <spell name>" or "cast a1".', style: 'error' }],
    };
  }

  let spellName = parsed.target.toLowerCase();

  // Check if target is a slot reference (a1-a4)
  const slotMatch = spellName.match(/^a([1-4])$/);
  if (slotMatch) {
    const slotIndex = parseInt(slotMatch[1]!, 10) - 1;
    const slot = player.abilitySlots[slotIndex];
    if (!slot) {
      return {
        output: [{ text: `Slot a${slotIndex + 1} is empty.`, style: 'error' }],
      };
    }
    const slotSpell = SPELLS[slot.id];
    if (!slotSpell) {
      return {
        output: [{ text: `Invalid spell in slot a${slotIndex + 1}.`, style: 'error' }],
      };
    }
    spellName = slotSpell.name.toLowerCase();
  }

  // Find the spell by name, alias, or ID with prioritized matching
  // Priority: exact ID/alias > exact name > starts with > contains
  let spell: Spell | undefined;
  let bestMatchType = 0; // 0=none, 1=contains, 2=starts, 3=exact name, 4=exact ID/alias

  for (const spellId of player.spells.known) {
    const s = SPELLS[spellId];
    if (!s) continue;

    const sName = s.name.toLowerCase();
    const sAlias = s.alias?.toLowerCase();

    // Exact ID or alias match (highest priority)
    if (s.id === spellName || sAlias === spellName) {
      spell = s;
      bestMatchType = 4;
      break;
    }

    // Exact name match
    if (sName === spellName && bestMatchType < 3) {
      spell = s;
      bestMatchType = 3;
    }
    // Starts with match
    else if (sName.startsWith(spellName) && bestMatchType < 2) {
      spell = s;
      bestMatchType = 2;
    }
    // Contains match (lowest priority)
    else if (sName.includes(spellName) && bestMatchType < 1) {
      spell = s;
      bestMatchType = 1;
    }
  }

  if (!spell) {
    return {
      output: [{ text: `You don't know a spell called "${parsed.target}".`, style: 'error' }],
    };
  }

  // Check if spell can be used out of combat
  if (!spell.outOfCombat && !player.inCombat) {
    return {
      output: [{ text: `${spell.name} can only be used in combat.`, style: 'error' }],
    };
  }

  // Check mana
  if (player.currentMp < spell.manaCost) {
    return {
      output: [{ text: `Not enough mana. ${spell.name} costs ${spell.manaCost} MP.`, style: 'error' }],
    };
  }

  // Check cooldown
  const cooldownRemaining = player.abilityCooldowns[spell.id] ?? 0;
  if (cooldownRemaining > 0) {
    return {
      output: [{ text: `${spell.name} is on cooldown for ${Math.ceil(cooldownRemaining / 1000)} more seconds.`, style: 'error' }],
    };
  }

  // Check GCD
  if (player.globalCooldown > 0) {
    return {
      output: [{ text: 'You are not ready yet.', style: 'error' }],
    };
  }

  // For targeted spells, find a target
  let targetCreature: Creature | undefined;
  if (spell.requiresTarget && spell.target === 'enemy') {
    // If in combat with a target, use that
    if (player.targetId) {
      targetCreature = world.creatures[player.targetId];
    }

    // Otherwise look for creatures in the room
    if (!targetCreature) {
      const location = world.locations[player.locationId];
      if (location?.creatures) {
        for (const creatureId of location.creatures) {
          const creature = world.creatures[creatureId];
          if (creature && creature.currentHp > 0) {
            targetCreature = creature;
            break;
          }
        }
      }
    }

    if (!targetCreature) {
      return {
        output: [{ text: `${spell.name} requires a target. No enemies here.`, style: 'error' }],
      };
    }
  }

  // Deduct mana
  player.currentMp -= spell.manaCost;

  // Set cooldown
  if (spell.cooldown > 0) {
    player.abilityCooldowns[spell.id] = spell.cooldown * 1000;
  }

  // Trigger GCD (1.5 seconds)
  player.globalCooldown = 1500;

  const output: OutputLine[] = [];

  // Execute spell effect
  switch (spell.effect) {
    case 'damage': {
      if (!targetCreature) break;

      // Calculate damage: baseValue + (spellPower * scaling)
      const spellPower = player.baseStats.int * 2; // Simple spell power calculation
      const damage = Math.floor(spell.baseValue + (spellPower * spell.spellPowerScaling));

      targetCreature.currentHp -= damage;

      output.push({
        text: `You cast ${spell.name} on ${targetCreature.name} for ${damage} ${spell.damageType ?? 'magic'} damage!`,
        style: 'combat'
      });

      // Check if creature died
      if (targetCreature.currentHp <= 0) {
        const template = CREATURE_TEMPLATES[targetCreature.templateId];
        const tier = template?.tier ?? 'common';

        // Generate loot
        let lootItems: Item[] = [];
        const rng = createRng(Date.now().toString());
        if (SEWER_LOOT_TABLES[targetCreature.templateId]) {
          lootItems = generateSewerLoot(targetCreature.templateId, targetCreature.level, rng);
        } else if (WILDERNESS_LOOT_TABLES[targetCreature.templateId]) {
          lootItems = generateWildernessLoot(targetCreature.templateId, targetCreature.level, rng);
        }

        // Add items to world
        const loot: string[] = [];
        for (const item of lootItems) {
          world.items[item.id] = item;
          loot.push(item.id);
        }

        handleCreatureDeath(world, targetCreature, 'player', tier, loot);
        output.push({ text: `${targetCreature.name} has been slain!`, style: 'success' });

        // Give XP (with level difference penalty)
        const xpGain = calculateXpGain(player.level, targetCreature.level);
        const xpResult = grantXp(player, xpGain);
        output.push(...xpResult);

        // Note about looting
        output.push({
          text: `Use "loot ${targetCreature.name.toLowerCase()}" to check the corpse.`,
          style: 'system',
        });

        // Exit combat if no more enemies
        const location = world.locations[player.locationId];
        const remainingEnemies = location?.creatures?.some(id => {
          const c = world.creatures[id];
          return c && c.currentHp > 0;
        });

        if (!remainingEnemies) {
          player.inCombat = false;
          player.targetId = undefined;
        }
      }
      break;
    }

    case 'heal': {
      const spellPower = player.baseStats.wis * 2;
      const healing = Math.floor(spell.baseValue + (spellPower * spell.spellPowerScaling));
      const oldHp = player.currentHp;
      player.currentHp = Math.min(player.maxHp, player.currentHp + healing);
      const actualHealing = player.currentHp - oldHp;

      output.push({
        text: `You cast ${spell.name} and restore ${actualHealing} health!`,
        style: 'success'
      });
      break;
    }

    case 'buff': {
      // Create a status effect
      const effect: StatusEffect = {
        id: spell.id,
        name: spell.name,
        duration: spell.duration,
        stacks: 1,
        appliedAt: world.time.totalMinutes,
      };

      // Remove existing effect of same type
      player.statusEffects = player.statusEffects.filter(e => e.id !== spell.id);
      player.statusEffects.push(effect);

      output.push({
        text: `You cast ${spell.name}. Effect active for ${spell.duration} seconds.`,
        style: 'success'
      });
      break;
    }

    case 'debuff': {
      if (!targetCreature) break;

      // For now, debuffs just deal initial damage (DoTs would need tick processing)
      const spellPower = player.baseStats.int * 2;
      const damage = Math.floor(spell.baseValue + (spellPower * spell.spellPowerScaling));

      targetCreature.currentHp -= damage;

      output.push({
        text: `You cast ${spell.name} on ${targetCreature.name}, dealing ${damage} ${spell.damageType ?? 'magic'} damage!`,
        style: 'combat'
      });

      if (targetCreature.currentHp <= 0) {
        const template = CREATURE_TEMPLATES[targetCreature.templateId];
        const tier = template?.tier ?? 'common';

        // Generate loot
        let lootItems: Item[] = [];
        const rng = createRng(Date.now().toString());
        if (SEWER_LOOT_TABLES[targetCreature.templateId]) {
          lootItems = generateSewerLoot(targetCreature.templateId, targetCreature.level, rng);
        } else if (WILDERNESS_LOOT_TABLES[targetCreature.templateId]) {
          lootItems = generateWildernessLoot(targetCreature.templateId, targetCreature.level, rng);
        }

        // Add items to world
        const loot: string[] = [];
        for (const item of lootItems) {
          world.items[item.id] = item;
          loot.push(item.id);
        }

        handleCreatureDeath(world, targetCreature, 'player', tier, loot);
        output.push({ text: `${targetCreature.name} has been slain!`, style: 'success' });

        // Give XP (with level difference penalty)
        const xpGain = calculateXpGain(player.level, targetCreature.level);
        const xpResult = grantXp(player, xpGain);
        output.push(...xpResult);

        // Note about looting
        output.push({
          text: `Use "loot ${targetCreature.name.toLowerCase()}" to check the corpse.`,
          style: 'system',
        });
      }
      break;
    }

    case 'utility': {
      // Handle utility spells like Set Trap and Track
      if (spell.id === 'set_trap') {
        // Check if already have a trap set
        if (player.placedTrap) {
          // Check if it's in this location
          if (player.placedTrap.locationId === player.locationId) {
            output.push({ text: 'You already have a trap set here.', style: 'error' });
            // Refund mana
            player.currentMp += spell.manaCost;
            player.abilityCooldowns[spell.id] = 0;
            break;
          }
          // Remove old trap
          output.push({ text: 'Your previous trap fades away as you set a new one.', style: 'system' });
        }

        // Check if in combat - can't set traps in combat
        if (player.inCombat) {
          output.push({ text: 'You cannot set a trap while in combat!', style: 'error' });
          player.currentMp += spell.manaCost;
          player.abilityCooldowns[spell.id] = 0;
          break;
        }

        // Calculate trap damage based on ranger level
        const baseDamage = spell.baseValue + Math.floor(player.level * spell.spellPowerScaling * 10);
        const dotDamage = Math.floor(baseDamage * 0.2); // DOT is 20% of initial per tick

        // Place the trap
        const now = Date.now();
        player.placedTrap = {
          locationId: player.locationId,
          rangerLevel: player.level,
          damage: baseDamage,
          dotDamage: dotDamage,
          rootDuration: 60, // 60 seconds base root duration
          placedAt: now,
          expiresAt: now + (spell.duration * 1000), // 10 minutes
        };

        const location = world.locations[player.locationId];
        output.push({
          text: `You carefully set a trap in ${location?.name || 'this area'}.`,
          style: 'success'
        });
        output.push({
          text: `The trap will deal ${baseDamage} initial damage and ${dotDamage}/tick while rooted.`,
          style: 'system'
        });
        output.push({
          text: 'The trap will trigger when a creature enters combat with you here.',
          style: 'system'
        });
      } else if (spell.id === 'track') {
        // Track spell - show creatures in adjacent locations
        const adjacentCreatures: string[] = [];
        const exitIds = world.adjacency[player.locationId] ?? [];

        for (const exitId of exitIds) {
          const exit = world.exits[exitId];
          if (exit) {
            const targetLocId = exit.from === player.locationId ? exit.to : exit.from;
            const targetLoc = world.locations[targetLocId];
            if (targetLoc?.creatures) {
              for (const creatureId of targetLoc.creatures) {
                const creature = world.creatures[creatureId];
                if (creature && creature.currentHp > 0) {
                  adjacentCreatures.push(`${creature.name} (${targetLoc.name})`);
                }
              }
            }
          }
        }

        output.push({ text: 'You read the signs of the wild...', style: 'normal' });
        if (adjacentCreatures.length > 0) {
          output.push({ text: 'Nearby creatures:', style: 'system' });
          for (const c of adjacentCreatures) {
            output.push({ text: `  - ${c}`, style: 'normal' });
          }
        } else {
          output.push({ text: 'You sense no creatures nearby.', style: 'system' });
        }
      } else {
        output.push({ text: `You use ${spell.name}.`, style: 'normal' });
      }
      break;
    }

    default:
      output.push({ text: `You cast ${spell.name}.`, style: 'normal' });
  }

  output.push({ text: `(${player.currentMp}/${player.maxMp} MP remaining)`, style: 'system' });

  return { output, updatePlayer: true };
}

/**
 * Grant XP to player and handle level ups.
 */
function grantXp(player: any, xp: number): OutputLine[] {
  const output: OutputLine[] = [];
  player.xp += xp;
  output.push({ text: `You gain ${xp} experience!`, style: 'success' });

  // Check for level up
  while (player.xp >= player.xpToNextLevel) {
    player.xp -= player.xpToNextLevel;
    player.level++;
    player.xpToNextLevel = xpForLevel(player.level + 1);

    // Increase stats
    const classDef = CLASSES[player.class as keyof typeof CLASSES];
    const hpGain = classDef.hpPerLevel + Math.floor(classDef.baseStats.con / 3);
    const mpGain = classDef.mpPerLevel + Math.floor(Math.max(classDef.baseStats.int, classDef.baseStats.wis) / 3);

    player.maxHp += hpGain;
    player.maxMp += mpGain;
    player.currentHp = player.maxHp;
    player.currentMp = player.maxMp;

    output.push({ text: '', style: 'normal' });
    output.push({ text: '╔════════════════════════════════════════╗', style: 'system' });
    output.push({ text: `║       LEVEL UP! Level ${player.level}!        ║`, style: 'success' });
    output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });
    output.push({ text: `║  HP: +${hpGain} (now ${player.maxHp})`.padEnd(40) + '║', style: 'normal' });
    output.push({ text: `║  MP: +${mpGain} (now ${player.maxMp})`.padEnd(40) + '║', style: 'normal' });
    output.push({ text: '║  Health and Mana fully restored!'.padEnd(40) + '║', style: 'normal' });
    output.push({ text: `║  Next level: ${player.xpToNextLevel} XP`.padEnd(40) + '║', style: 'normal' });
    output.push({ text: '╚════════════════════════════════════════╝', style: 'system' });
  }

  return output;
}

/**
 * Handle the "learn" command - learn a spell from a trainer.
 */
function handleLearn(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Learn what? Try "learn <spell name>".', style: 'error' }],
    };
  }

  // Must be in conversation with an NPC
  if (!session.conversationNpc) {
    return {
      output: [{ text: 'You need to talk to a trainer first. Use "talk <trainer>".', style: 'error' }],
    };
  }

  const npc = world.npcs[session.conversationNpc];
  if (!npc) {
    session.conversationNpc = undefined;
    session.learnableSpells = undefined;
    return {
      output: [{ text: 'That trainer seems to have left.', style: 'error' }],
    };
  }

  // Check if NPC is a trainer
  if (!npc.trainsClass) {
    return {
      output: [{ text: `${npc.name} is not a trainer.`, style: 'error' }],
    };
  }

  // Check if trainer trains player's class
  if (npc.trainsClass !== player.class) {
    return {
      output: [{ text: `${npc.name} only trains ${npc.trainsClass}s, not ${player.class}s.`, style: 'error' }],
    };
  }

  // Check if target is a number (learn 1, learn 2, etc.)
  const numMatch = parsed.target.match(/^(\d+)$/);
  if (numMatch && session.learnableSpells) {
    const index = parseInt(numMatch[1]!, 10) - 1;
    if (index >= 0 && index < session.learnableSpells.length) {
      const spellId = session.learnableSpells[index]!;
      const spell = SPELLS[spellId];
      if (spell) {
        // Check currency (learnCost is in copper)
        if (!canAfford(player.currency, spell.learnCost)) {
          return {
            output: [
              { text: `${spell.name} costs ${formatPrice(spell.learnCost)} to learn.`, style: 'error' },
              { text: `You have ${formatCurrency(player.currency)}.`, style: 'system' },
            ],
          };
        }

        // Learn the spell
        player.spells.known.push(spell.id);
        player.currency = spendCurrency(player.currency, spell.learnCost);

        // Update learnable list
        session.learnableSpells = session.learnableSpells.filter(id => id !== spell.id);

        const output: OutputLine[] = [
          { text: `${npc.name} teaches you the secrets of ${spell.name}.`, style: 'normal' },
          { text: `✨ Learned: ${spell.name}!`, style: 'success' },
          { text: `   ${spell.description}`, style: 'normal' },
          { text: `   Mana cost: ${spell.manaCost} | Cooldown: ${spell.cooldown}s`, style: 'system' },
        ];
        if (spell.learnCost > 0) {
          output.push({ text: `Paid ${formatPrice(spell.learnCost)}. Remaining: ${formatCurrency(player.currency)}.`, style: 'system' });
        }
        output.push({ text: 'Use "cast <spell>" to use your new ability.', style: 'system' });

        return { output, updatePlayer: true };
      }
    }
    return {
      output: [{ text: `Invalid number. Use 1-${session.learnableSpells.length}.`, style: 'error' }],
    };
  }

  // Find the spell by name
  const spellName = parsed.target.toLowerCase();
  const learnable = getLearnableSpells(player.class, player.level, player.spells.known);
  const spell = learnable.find(s =>
    s.id === spellName || s.name.toLowerCase().includes(spellName)
  );

  if (!spell) {
    // Check if they already know it
    const alreadyKnown = player.spells.known.some(id => {
      const s = SPELLS[id];
      return s && (s.id === spellName || s.name.toLowerCase().includes(spellName));
    });

    if (alreadyKnown) {
      return {
        output: [{ text: `You already know that spell.`, style: 'error' }],
      };
    }

    // Check if it's a spell for their class but wrong level
    const classSpells = getClassSpells(player.class);
    const tooHighLevel = classSpells.find(s =>
      (s.id === spellName || s.name.toLowerCase().includes(spellName)) &&
      s.levelRequired > player.level
    );

    if (tooHighLevel) {
      return {
        output: [{ text: `You need to be level ${tooHighLevel.levelRequired} to learn ${tooHighLevel.name}.`, style: 'error' }],
      };
    }

    return {
      output: [{ text: `${npc.name} doesn't teach a spell called "${parsed.target}".`, style: 'error' }],
    };
  }

  // Check currency (learnCost is in copper)
  if (!canAfford(player.currency, spell.learnCost)) {
    return {
      output: [
        { text: `${spell.name} costs ${formatPrice(spell.learnCost)} to learn.`, style: 'error' },
        { text: `You have ${formatCurrency(player.currency)}.`, style: 'system' },
      ],
    };
  }

  // Learn the spell
  player.currency = spendCurrency(player.currency, spell.learnCost);
  player.spells.known.push(spell.id);

  const output: OutputLine[] = [];
  const title = npc.title ? `${npc.title} ` : '';
  output.push({ text: `${title}${npc.name} teaches you the secrets of ${spell.name}.`, style: 'normal' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: `✨ Learned: ${spell.name}!`, style: 'success' });
  output.push({ text: `   ${spell.description}`, style: 'system' });
  output.push({ text: `   Mana cost: ${spell.manaCost} | Cooldown: ${spell.cooldown}s`, style: 'system' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: `Paid ${formatPrice(spell.learnCost)}. Remaining: ${formatCurrency(player.currency)}.`, style: 'normal' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: 'Use "cast <spell>" to use your new ability.', style: 'system' });

  return { output, updatePlayer: true };
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

  // Find NPCs in this location (using schedule-aware lookup)
  const timeOfDay = world.time.timeOfDay;
  const npcsHere = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
  if (npcsHere.length === 0) {
    return {
      output: [{ text: 'There is no one here to talk to.', style: 'error' }],
    };
  }

  // Find the NPC by name
  const targetLower = parsed.target.toLowerCase();
  const npc = npcsHere.find(n => n.name.toLowerCase().includes(targetLower));

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
    session.learnableSpells = undefined;
    return {
      output: [{ text: 'That person seems to have left.', style: 'error' }],
    };
  }

  // Check if player is still in same location (use schedule-aware lookup)
  const location = world.locations[player.locationId];
  const npcsHereForSay = getNpcsAtLocation(world.npcs, location?.npcs ?? [], player.locationId, world.time.timeOfDay);
  if (!npcsHereForSay.some(n => n.id === npc.id)) {
    session.conversationNpc = undefined;
    session.learnableSpells = undefined;
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

  // Handle special teaching actions with class/level-based responses
  let responseText = topic.response;
  if ((topic.action === 'teach_track' || topic.action === 'teach_trap') && topic.teachSpell && topic.teachLevel) {
    const isRanger = player.class === 'ranger';
    const meetsLevel = player.level >= topic.teachLevel;
    const alreadyKnows = player.spells.known.includes(topic.teachSpell);

    if (isRanger && alreadyKnows) {
      responseText = `You've already mastered ${SPELLS[topic.teachSpell]?.name || 'that technique'}. Use it well.`;
    } else if (isRanger && meetsLevel && topic.rangerReadyResponse) {
      responseText = topic.rangerReadyResponse;
    } else if (isRanger && !meetsLevel && topic.rangerResponse) {
      responseText = topic.rangerResponse;
    }
    // Non-rangers get the default response
  }

  output.push({ text: `${title}${npc.name}: "${responseText}"`, style: 'normal' });

  // Check if this completes a tutorial step
  if (topic.teachesCommand && !player.tutorial.completedSteps.includes(topic.teachesCommand)) {
    player.tutorial.completedSteps.push(topic.teachesCommand);
    output.push({ text: '', style: 'normal' });
    output.push({ text: `[Tutorial] ${topic.teachesCommand} complete!`, style: 'success' });
  }

  // Handle special dialogue actions
  if (topic.action === 'heal') {
    const oldHp = player.currentHp;
    const oldMp = player.currentMp;
    player.currentHp = player.maxHp;
    player.currentMp = player.maxMp;
    const hpHealed = player.currentHp - oldHp;
    const mpRestored = player.currentMp - oldMp;
    output.push({ text: '', style: 'normal' });
    if (hpHealed > 0 || mpRestored > 0) {
      output.push({ text: `You are fully healed! (+${hpHealed} HP, +${mpRestored} MP)`, style: 'success' });
    } else {
      output.push({ text: 'You are already at full health.', style: 'system' });
    }
  }

  if (topic.action === 'train') {
    // Show training options for this NPC's class
    const trainableClass = npc.trainsClass;
    if (trainableClass && player.class === trainableClass) {
      const learnable = getLearnableSpells(player.class, player.level, player.spells.known);
      if (learnable.length > 0) {
        output.push({ text: '', style: 'normal' });
        output.push({ text: '=== Available Training ===', style: 'system' });
        for (const spell of learnable) {
          output.push({
            text: `  ${spell.name} (Level ${spell.levelRequired}) - ${spell.learnCost} gold`,
            style: 'normal'
          });
          output.push({
            text: `    ${spell.description}`,
            style: 'system'
          });
        }
        output.push({ text: '', style: 'normal' });
        output.push({ text: 'Use "learn <spell>" to learn a new spell.', style: 'system' });
      } else {
        output.push({ text: '', style: 'normal' });
        output.push({ text: 'You have learned all the spells I can teach at your level.', style: 'system' });

        // Show future spells that unlock at higher levels
        const future = getFutureSpells(player.class, player.level, player.spells.known);
        if (future.length > 0) {
          output.push({ text: '', style: 'normal' });
          output.push({ text: '=== Future Training ===', style: 'system' });
          for (const spell of future) {
            output.push({
              text: `  ${spell.name} - unlocks at level ${spell.levelRequired} (${spell.learnCost} gold)`,
              style: 'normal'
            });
          }
        }
      }
    } else if (trainableClass && player.class !== trainableClass) {
      output.push({ text: '', style: 'normal' });
      output.push({ text: `I only train ${trainableClass}s. You should seek a trainer for your class.`, style: 'system' });
    }
  }

  // Handle skills_list action - show full class skill progression
  if (topic.action === 'skills_list') {
    const trainableClass = npc.trainsClass;
    if (trainableClass && player.class === trainableClass) {
      const allSpells = getClassSpells(player.class).sort((a, b) => a.levelRequired - b.levelRequired);
      const knownSpellIds = player.spells.known;

      // Build numbered list of learnable spells
      const learnableList: string[] = [];
      let learnableNum = 1;

      output.push({ text: '', style: 'normal' });
      output.push({ text: `=== ${player.class.charAt(0).toUpperCase() + player.class.slice(1)} Skill Progression ===`, style: 'system' });

      for (const spell of allSpells) {
        const isKnown = knownSpellIds.includes(spell.id);
        const canLearn = spell.levelRequired <= player.level && !isKnown;
        const isFuture = spell.levelRequired > player.level;

        let prefix = '  ';
        let status = '';
        if (isKnown) {
          status = '[KNOWN]';
        } else if (canLearn) {
          prefix = `  ${learnableNum}. `;
          status = `[${spell.learnCost} gold]`;
          learnableList.push(spell.id);
          learnableNum++;
        } else if (isFuture) {
          status = `[Level ${spell.levelRequired}]`;
        }

        output.push({
          text: `${prefix}${spell.name} ${status}`,
          style: isKnown ? 'system' : canLearn ? 'normal' : 'system'
        });
        output.push({
          text: `      ${spell.description}`,
          style: 'system'
        });
      }

      // Store learnable spells for "learn 1" etc.
      session.learnableSpells = learnableList;

      output.push({ text: '', style: 'normal' });
      if (learnableList.length > 0) {
        output.push({ text: 'Use "learn <#>" or "learn <spell name>" to learn.', style: 'system' });
      }
    } else if (trainableClass && player.class !== trainableClass) {
      output.push({ text: '', style: 'normal' });
      output.push({ text: `I only train ${trainableClass}s. You should seek a trainer for your class.`, style: 'system' });
    }
  }

  // Handle special teaching dialogue for ranger skills
  if ((topic.action === 'teach_track' || topic.action === 'teach_trap') && topic.teachSpell && topic.teachLevel) {
    const isRanger = player.class === 'ranger';
    const meetsLevel = player.level >= topic.teachLevel;
    const alreadyKnows = player.spells.known.includes(topic.teachSpell);
    const spell = SPELLS[topic.teachSpell];

    if (isRanger && meetsLevel && !alreadyKnows && spell) {
      output.push({ text: '', style: 'normal' });
      output.push({
        text: `Use "learn ${spell.name.toLowerCase()}" to learn this skill for ${spell.learnCost} gold.`,
        style: 'system'
      });
    }
  }

  // End conversation on farewell - check BEFORE showing menu
  if (topic.id === 'farewell') {
    session.conversationNpc = undefined;
    session.learnableSpells = undefined;
    return { output, updatePlayer: true };
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
    session.learnableSpells = undefined;
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
  if (!location) {
    return {
      output: [{ text: 'There is no shop here.', style: 'error' }],
    };
  }

  // Find merchant NPC (using schedule-aware lookup)
  const timeOfDay = world.time.timeOfDay;
  const npcsHere = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
  const merchant = npcsHere.find(npc => npc?.shop);

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
    output.push({ text: `  ${name} - ${formatPrice(price)}${stock}`, style: 'normal' });
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: `Your currency: ${formatCurrency(player.currency)}`, style: 'system' });
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
  if (!location) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  // Find merchant NPC (using schedule-aware lookup)
  const timeOfDay = world.time.timeOfDay;
  const npcsHere = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
  const merchant = npcsHere.find(npc => npc?.shop);

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

  // Check currency (price is in copper)
  if (!canAfford(player.currency, price)) {
    return {
      output: [{ text: `You need ${formatPrice(price)} but only have ${formatCurrency(player.currency)}.`, style: 'error' }],
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
  player.currency = spendCurrency(player.currency, price);
  if (shopItem.stock !== undefined) {
    shopItem.stock--;
  }
  world.items[newItem.id] = newItem;

  if (!addToInventory(player, world, newItem.id)) {
    // Refund if inventory full (shouldn't happen, but safety check)
    player.currency = addCopper(player.currency, price);
    if (shopItem.stock !== undefined) {
      shopItem.stock++;
    }
    delete world.items[newItem.id];
    return {
      output: [{ text: 'Your inventory is full.', style: 'error' }],
    };
  }

  return {
    output: [{ text: `You buy ${newItem.name} for ${formatPrice(price)}.`, style: 'success' }],
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
      output: [{ text: 'Sell what? Try "sell <item>" or "sell <item> all".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  // Find merchant NPC (using schedule-aware lookup)
  const timeOfDay = world.time.timeOfDay;
  const npcsHere = getNpcsAtLocation(world.npcs, location.npcs ?? [], location.id, timeOfDay);
  const merchant = npcsHere.find(npc => npc?.shop);

  if (!merchant?.shop) {
    return {
      output: [{ text: 'There is no merchant here.', style: 'error' }],
    };
  }

  // Check for "sell <item> all" syntax
  const args = parsed.args.join(' ').toLowerCase();
  const sellAll = args === 'all' || args.endsWith(' all') || parsed.target.toLowerCase() === 'all';
  let targetLower = parsed.target.toLowerCase();

  // If "sell all <item>" or "sell <item> all", extract the item name
  if (sellAll && targetLower === 'all' && parsed.args.length > 0) {
    // "sell all <item>" - args[0] is the item
    targetLower = parsed.args[0]?.toLowerCase() ?? '';
  } else if (sellAll && args.endsWith(' all')) {
    // "sell <item> all" - target is the item, remove "all" from consideration
    // targetLower is already set correctly
  }

  if (!targetLower || targetLower === 'all') {
    return {
      output: [{ text: 'Sell what? Try "sell <item>" or "sell <item> all".', style: 'error' }],
    };
  }

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
  const item = world.items[slot.itemId];

  if (!item) {
    return {
      output: [{ text: 'That item seems to be corrupted.', style: 'error' }],
    };
  }

  // Look up base sell value from templates
  // Priority: SHOP_ITEM_TEMPLATES.sellValue > SEWER_ITEM_TEMPLATES.baseValue > default by rarity
  let basePrice = 5; // Default fallback
  const shopTemplate = SHOP_ITEM_TEMPLATES[item.baseId];
  const sewerTemplate = SEWER_ITEM_TEMPLATES[item.baseId];

  if (shopTemplate?.sellValue !== undefined) {
    basePrice = shopTemplate.sellValue;
  } else if (sewerTemplate?.baseValue !== undefined) {
    basePrice = sewerTemplate.baseValue;
  } else {
    // Estimate by rarity if no template found
    const rarityValues: Record<string, number> = {
      junk: 1, common: 5, uncommon: 15, rare: 50, epic: 150, legendary: 500
    };
    basePrice = rarityValues[item.rarity] ?? 5;
  }

  // Check if item is not sellable (keys, quest items)
  if (basePrice === 0 && (item.tags.includes('key') || item.tags.includes('quest'))) {
    return {
      output: [{ text: `${merchant.name} isn't interested in the ${item.name}.`, style: 'normal' }],
    };
  }

  const sellPrice = Math.max(1, Math.floor(basePrice * merchant.shop.sellMultiplier));

  // Determine how many to sell
  const quantityToSell = sellAll ? slot.quantity : 1;
  const totalPrice = sellPrice * quantityToSell;

  // Complete sale
  player.currency = addCopper(player.currency, totalPrice);

  if (quantityToSell >= slot.quantity) {
    // Remove entire slot
    player.inventory.splice(invIndex, 1);
  } else {
    // Decrement quantity
    slot.quantity -= quantityToSell;
  }

  const qtyText = quantityToSell > 1 ? ` (x${quantityToSell})` : '';
  return {
    output: [{ text: `You sell ${item.name}${qtyText} for ${formatPrice(totalPrice)}.`, style: 'success' }],
    updatePlayer: true,
  };
}

/**
 * Handle the "status" command - show player stats and active effects.
 */
function handleStatus(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player, world } = session;

  const output: OutputLine[] = [];

  // Check for pending level ups (in case XP was gained without level check)
  while (player.xp >= player.xpToNextLevel) {
    player.level++;
    player.xpToNextLevel = xpForLevel(player.level + 1);

    const classDef = CLASSES[player.class];
    const hpGain = classDef.hpPerLevel;
    const mpGain = classDef.mpPerLevel;

    player.maxHp += hpGain;
    player.maxMp += mpGain;
    player.currentHp = player.maxHp;
    player.currentMp = player.maxMp;
    player.maxCarryWeight = 50 + (player.baseStats.str * 5);

    output.push({
      text: '╔═══════════════════════════════════════╗',
      style: 'success',
    });
    output.push({
      text: `║       ⭐ LEVEL UP! Level ${player.level}! ⭐        ║`,
      style: 'success',
    });
    output.push({
      text: '╠═══════════════════════════════════════╣',
      style: 'success',
    });
    output.push({
      text: `║  HP: +${hpGain} (now ${player.maxHp})`.padEnd(40) + '║',
      style: 'normal',
    });
    output.push({
      text: `║  MP: +${mpGain} (now ${player.maxMp})`.padEnd(40) + '║',
      style: 'normal',
    });
    output.push({
      text: '║  Health & Mana fully restored!'.padEnd(40) + '║',
      style: 'normal',
    });
    output.push({
      text: `║  Next level: ${player.xpToNextLevel} XP`.padEnd(40) + '║',
      style: 'normal',
    });
    output.push({
      text: '╚═══════════════════════════════════════╝',
      style: 'success',
    });
    output.push({ text: '', style: 'normal' });
  }

  // Header
  output.push({ text: '╔════════════════════════════════════════╗', style: 'system' });
  output.push({ text: `║  ${player.name.toUpperCase()} - ${player.class.charAt(0).toUpperCase() + player.class.slice(1)}`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });

  // Level and XP
  output.push({ text: `║  Level: ${player.level}`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: `║  XP: ${player.xp} / ${player.xpToNextLevel}`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });

  // HP and MP
  const hpPercent = Math.floor((player.currentHp / player.maxHp) * 100);
  const mpPercent = Math.floor((player.currentMp / player.maxMp) * 100);
  const hpStyle = hpPercent <= 25 ? 'error' : hpPercent <= 50 ? 'combat' : 'success';
  output.push({ text: `║  HP: ${player.currentHp}/${player.maxHp} (${hpPercent}%)`.padEnd(40) + '║', style: hpStyle });
  output.push({ text: `║  MP: ${player.currentMp}/${player.maxMp} (${mpPercent}%)`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });

  // Effective Stats (base + level bonus + gear)
  const effectiveStats = getEffectiveStats(player, world.items);
  const classDef = CLASSES[player.class];
  const primaryStat = classDef.primaryStats[0] as keyof typeof player.baseStats;
  const levelBonus = Math.max(0, player.level - 1);

  output.push({ text: '║  Stats:'.padEnd(40) + '║', style: 'system' });
  // Show stats with level bonus highlighted
  const strDisplay = primaryStat === 'str' && levelBonus > 0
    ? `${effectiveStats.str} (+${levelBonus})`
    : `${effectiveStats.str}`;
  const dexDisplay = primaryStat === 'dex' && levelBonus > 0
    ? `${effectiveStats.dex} (+${levelBonus})`
    : `${effectiveStats.dex}`;
  const conDisplay = primaryStat === 'con' && levelBonus > 0
    ? `${effectiveStats.con} (+${levelBonus})`
    : `${effectiveStats.con}`;
  const intDisplay = primaryStat === 'int' && levelBonus > 0
    ? `${effectiveStats.int} (+${levelBonus})`
    : `${effectiveStats.int}`;
  const wisDisplay = primaryStat === 'wis' && levelBonus > 0
    ? `${effectiveStats.wis} (+${levelBonus})`
    : `${effectiveStats.wis}`;

  output.push({ text: `║    STR: ${strDisplay}  DEX: ${dexDisplay}  CON: ${conDisplay}`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: `║    INT: ${intDisplay}  WIS: ${wisDisplay}`.padEnd(40) + '║', style: 'normal' });

  // Combat Stats (derived from effective stats)
  const combat = calculateCombatStats(effectiveStats);
  output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });
  output.push({ text: '║  Combat Stats:'.padEnd(40) + '║', style: 'system' });
  output.push({ text: `║    Attack: ${combat.attackPower}  Spell Pwr: ${combat.spellPower}`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: `║    Defense: ${combat.defense}%`.padEnd(40) + '║', style: 'normal' });
  output.push({ text: `║    Fire: ${combat.fireResist}%  Ice: ${combat.iceResist}%  Light: ${combat.lightningResist}%  Psn: ${combat.poisonResist}%`.padEnd(40) + '║', style: 'normal' });
  const hitPct = Math.floor(combat.hitChance * 100);
  const dodgePct = Math.floor(combat.dodgeChance * 100);
  const critPct = Math.floor(combat.critChance * 100);
  output.push({ text: `║    Hit: ${hitPct}%  Dodge: ${dodgePct}%  Crit: ${critPct}%`.padEnd(40) + '║', style: 'normal' });

  // Currency
  output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });
  output.push({ text: `║  Currency: ${formatCurrency(player.currency)}`.padEnd(40) + '║', style: 'normal' });

  // Active Status Effects
  if (player.statusEffects.length > 0) {
    output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });
    output.push({ text: '║  Active Effects:'.padEnd(40) + '║', style: 'system' });
    for (const effect of player.statusEffects) {
      const remaining = effect.appliedAt !== undefined
        ? Math.max(0, effect.duration - (world.time.totalMinutes - effect.appliedAt))
        : effect.duration;
      const stackText = effect.stacks > 1 ? ` x${effect.stacks}` : '';
      const durationText = remaining > 0 ? ` (${remaining}m)` : ' (permanent)';
      output.push({ text: `║    • ${effect.name}${stackText}${durationText}`.padEnd(40) + '║', style: 'success' });

      // Show effect description/stats
      const effectDesc = getEffectDescription(effect.id);
      if (effectDesc) {
        output.push({ text: `║        ${effectDesc}`.padEnd(40) + '║', style: 'normal' });
      }
    }
  }

  // Combat status
  if (player.inCombat) {
    output.push({ text: '╠════════════════════════════════════════╣', style: 'system' });
    output.push({ text: '║  ⚔️  IN COMBAT'.padEnd(40) + '║', style: 'combat' });
    if (player.targetId) {
      const target = world.creatures[player.targetId];
      if (target) {
        output.push({ text: `║    Target: ${target.name} (${target.currentHp}/${target.maxHp} HP)`.padEnd(40) + '║', style: 'combat' });
      }
    }
  }

  output.push({ text: '╚════════════════════════════════════════╝', style: 'system' });

  return { output };
}

/**
 * Handle the "open" command - open a container to see its contents.
 */
function handleOpen(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Open what? Try "open <container>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You are nowhere.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Check containers in location
  if (world.containers) {
    const containers = Object.values(world.containers).filter(
      (c) => c.locationId === player.locationId
    );

    const container = containers.find((c) =>
      c.name.toLowerCase().includes(targetLower)
    );

    if (container) {
      const output: OutputLine[] = [];

      if (container.locked) {
        output.push({ text: `The ${container.name} is locked.`, style: 'error' });
        if (container.keyId) {
          output.push({ text: 'You need a key to open it.', style: 'system' });
        }
        return { output };
      }

      output.push({ text: `You open the ${container.name}.`, style: 'normal' });

      if (container.contents.length === 0) {
        output.push({ text: 'It is empty.', style: 'normal' });
      } else if (container.contents.length === 1) {
        const item = world.items[container.contents[0]!];
        output.push({ text: `Inside you find: ${item?.name ?? 'an item'}.`, style: 'normal' });
        output.push({ text: `Use "loot ${container.name.toLowerCase()}" to take it.`, style: 'system' });
      } else {
        output.push({ text: 'Inside you find:', style: 'system' });
        container.contents.forEach((itemId, index) => {
          const item = world.items[itemId];
          output.push({ text: `  ${index + 1}. ${item?.name ?? 'Unknown item'}`, style: 'normal' });
        });
        output.push({ text: '', style: 'normal' });
        output.push({ text: `Use "loot ${container.name.toLowerCase()}" to take items.`, style: 'system' });
      }

      container.opened = true;
      return { output };
    }
  }

  // Check if it's a corpse (can also be "opened" to check)
  const corpses = Object.values(world.corpses).filter(
    (c) => c.locationId === player.locationId
  );

  const corpse = corpses.find((c) =>
    c.name.toLowerCase().includes(targetLower)
  );

  if (corpse) {
    // Redirect to loot command for corpses
    return handleLoot({ session, parsed: { ...parsed, command: 'loot' } });
  }

  return {
    output: [{ text: `You don't see a "${parsed.target}" here to open.`, style: 'error' }],
  };
}

/**
 * Handle the "unlock" command - unlock a locked exit/door.
 * Usage: unlock <direction> or unlock door
 */
function handleUnlock(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Unlock what? Try "unlock <direction>" or "unlock door".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You are nowhere.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Get exits from this location
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];

  // Find a locked exit matching the target (direction or "door")
  let targetExit: Exit | undefined;

  if (targetLower === 'door' || targetLower === 'gate') {
    // Find any locked exit
    targetExit = exits.find(e => e.type === 'locked');
  } else {
    // Match by direction label
    targetExit = exits.find(e => e.label.toLowerCase() === targetLower);
  }

  if (!targetExit) {
    return {
      output: [{ text: `You don't see anything to unlock in that direction.`, style: 'error' }],
    };
  }

  // Check if it's already unlocked
  if (targetExit.type !== 'locked') {
    return {
      output: [{ text: `The way ${targetExit.label} is not locked.`, style: 'normal' }],
    };
  }

  // Check if it requires an item key
  if (targetExit.requirement?.kind !== 'item') {
    // Quest/puzzle locked - can't unlock with a key
    return {
      output: [
        { text: `The way ${targetExit.label} is blocked by something other than a lock.`, style: 'error' },
        { text: 'Perhaps a puzzle or mechanism controls it...', style: 'system' },
      ],
    };
  }

  // Check if player has the required key (check keyring first, then inventory)
  const requiredKey = targetExit.requirement.value as string;

  // Check keyring first
  let keyItemId = player.keyring?.find(keyId => {
    const item = world.items[keyId];
    return keyId === requiredKey || item?.baseId === requiredKey || item?.id === requiredKey;
  });

  // Fall back to inventory if not on keyring
  if (!keyItemId) {
    const keySlot = player.inventory.find(slot => {
      const item = world.items[slot.itemId];
      return slot.itemId === requiredKey || item?.baseId === requiredKey || item?.id === requiredKey;
    });
    if (keySlot) {
      keyItemId = keySlot.itemId;
    }
  }

  if (!keyItemId) {
    const keyItem = world.items[requiredKey];
    const keyName = keyItem?.name ?? 'a key';
    return {
      output: [{ text: `The way ${targetExit.label} is locked. You need ${keyName}.`, style: 'error' }],
    };
  }

  // Unlock the exit
  const keyItem = world.items[keyItemId];
  targetExit.type = 'open';

  // Also unlock the reverse exit if it exists
  const reverseExitIds = world.adjacency[targetExit.to] ?? [];
  for (const exitId of reverseExitIds) {
    const reverseExit = world.exits[exitId];
    if (reverseExit && reverseExit.to === player.locationId && reverseExit.type === 'locked') {
      reverseExit.type = 'open';
    }
  }

  const destLocation = world.locations[targetExit.to];
  const destName = destLocation?.name ?? 'somewhere';

  return {
    output: [
      { text: `You use the ${keyItem?.name ?? 'key'} to unlock the way ${targetExit.label}.`, style: 'success' },
      { text: `The passage to ${destName} is now open.`, style: 'normal' },
    ],
  };
}

/**
 * Handle the "close" command - close a container or door.
 */
function handleClose(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  if (!parsed.target) {
    return {
      output: [{ text: 'Close what? Try "close <container>".', style: 'error' }],
    };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You are nowhere.', style: 'error' }],
    };
  }

  const targetLower = parsed.target.toLowerCase();

  // Check containers in location
  if (world.containers) {
    const containers = Object.values(world.containers).filter(
      (c) => c.locationId === player.locationId
    );

    const container = containers.find((c) =>
      c.name.toLowerCase().includes(targetLower)
    );

    if (container) {
      if (!container.opened) {
        return {
          output: [{ text: `The ${container.name} is already closed.`, style: 'normal' }],
        };
      }

      container.opened = false;
      return {
        output: [{ text: `You close the ${container.name}.`, style: 'normal' }],
      };
    }
  }

  return {
    output: [{ text: `You don't see a "${parsed.target}" here to close.`, style: 'error' }],
  };
}

/**
 * Handle the "leave" command - leave the current room.
 * If only one exit exists, automatically use it.
 * If multiple exits exist, show the available options.
 */
function handleLeave(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;

  const location = world.locations[player.locationId];
  if (!location) {
    return {
      output: [{ text: 'You are nowhere.', style: 'error' }],
    };
  }

  // Get all exits from current location
  const exitIds = world.adjacency[player.locationId] ?? [];
  const exits = exitIds.map(id => world.exits[id]).filter(Boolean) as Exit[];

  if (exits.length === 0) {
    return {
      output: [{ text: 'There are no exits here. You are trapped!', style: 'error' }],
    };
  }

  // If only one exit, automatically use it
  if (exits.length === 1) {
    const exit = exits[0]!;
    // Reuse the movement handler with the exit's label
    return handleMove({
      session,
      parsed: { ...parsed, command: exit.label.toLowerCase(), target: undefined },
    });
  }

  // Multiple exits - show the list of options
  const output: OutputLine[] = [
    { text: 'Which way would you like to leave? Available exits:', style: 'system' },
  ];

  for (const exit of exits) {
    const destLocation = world.locations[exit.to];
    const destName = destLocation?.name ?? 'Unknown';
    const lockIndicator = exit.type === 'locked' ? ' [LOCKED]' : '';
    output.push({ text: `  ${exit.label} - ${destName}${lockIndicator}`, style: 'normal' });
  }

  return { output };
}

/**
 * Trigger a ranger's trap on a creature.
 * Returns output and whether creature was killed.
 */
function triggerRangerTrap(
  player: Player,
  creature: Creature,
  rng: { next: () => number }
): { output: OutputLine[]; creatureKilled: boolean } {
  const trap = player.placedTrap!;
  const output: OutputLine[] = [];
  const now = Date.now();

  // Check if trap expired
  if (now > trap.expiresAt) {
    player.placedTrap = undefined;
    return { output: [], creatureKilled: false };
  }

  // Calculate effectiveness based on creature level vs ranger level
  const levelDiff = creature.level - trap.rangerLevel;

  // Size/level effectiveness
  if (levelDiff >= 5) {
    output.push({
      text: `The ${creature.name} is too powerful - it destroys your trap instantly!`,
      style: 'error',
    });
    player.placedTrap = undefined;
    return { output, creatureKilled: false };
  }

  if (levelDiff >= 3 && rng.next() < 0.5) {
    output.push({
      text: `The ${creature.name} spots your trap and avoids it!`,
      style: 'error',
    });
    player.placedTrap = undefined;
    return { output, creatureKilled: false };
  }

  // Calculate modified values
  let effectiveDamage = trap.damage;
  let effectiveRootDuration = trap.rootDuration;

  if (levelDiff > 0) {
    const reduction = levelDiff * 0.15;
    effectiveDamage = Math.floor(effectiveDamage * (1 - reduction));
    effectiveRootDuration = Math.floor(effectiveRootDuration * (1 - reduction));
  }

  // Apply damage
  creature.currentHp -= effectiveDamage;
  output.push({
    text: `★ Your trap springs! The ${creature.name} takes ${effectiveDamage} damage!`,
    style: 'success',
  });

  // Remove trap
  player.placedTrap = undefined;

  if (creature.currentHp <= 0) {
    output.push({
      text: `The ${creature.name} dies instantly in your trap!`,
      style: 'success',
    });
    return { output, creatureKilled: true };
  }

  // Apply root effect
  const rootDurationMs = effectiveRootDuration * 1000;
  const breakAttemptInterval = levelDiff >= 2 ? 5000 : 10000;

  creature.trapped = {
    expiresAt: now + rootDurationMs,
    trappedByPlayerId: player.id,
    dotDamage: trap.dotDamage,
    nextDotTick: now + 5000,
    nextBreakAttempt: now + breakAttemptInterval,
    rangerLevel: trap.rangerLevel,
  };

  output.push({
    text: `The ${creature.name} is caught in your trap and cannot flee for ${effectiveRootDuration} seconds!`,
    style: 'success',
  });

  if (levelDiff >= 2) {
    output.push({
      text: `The powerful creature strains against the trap - it may break free quickly!`,
      style: 'system',
    });
  }

  return { output, creatureKilled: false };
}

// ============ PROP INTERACTION HANDLERS ============

/**
 * Handle prop interaction commands.
 * Called when verb matches PROP_VERBS and target is found.
 * Returns null if no prop found (caller should fall through to other handlers).
 */
export function handlePropInteraction(ctx: CommandContext): CommandResult | null {
  const { session, parsed } = ctx;
  const { world, player } = session;
  const { command: verb, target, item } = parsed;

  if (!target) {
    return null; // No target, let other handlers try
  }

  const locationId = player.locationId;

  // Find the prop in this location
  const prop = findPropByName(locationId, target);
  if (!prop) {
    return null; // Not a prop - let other handlers try
  }

  // Check if this verb works with this prop
  if (!prop.verbs.includes(verb)) {
    return {
      output: [{ text: `You can't ${verb} the ${prop.name}.`, style: 'error' }],
    };
  }

  // Check if prop is hidden and trying wrong verb
  if (prop.hidden && prop.discoverVerb && verb !== prop.discoverVerb) {
    return null; // Don't reveal hidden props
  }

  // If an item is specified, handle item+prop interaction
  if (item) {
    return handleItemPropInteraction(ctx, prop, verb, item);
  }

  // Handle default interaction
  const interaction = prop.defaultInteraction;
  if (!interaction) {
    const examineText = pickRandomText(prop.examineText || [`You see ${prop.name}.`]);
    return {
      output: [{ text: examineText, style: 'normal' }],
    };
  }

  // Check if item is required
  if (interaction.requiresItem) {
    const hasItem = player.inventory.some(slot => {
      const invItem = world.items[slot.itemId];
      return invItem?.baseId === interaction.requiresItem;
    });
    if (!hasItem) {
      return {
        output: [{ text: `You need a ${interaction.requiresItem} to do that.`, style: 'error' }],
      };
    }
  }

  // Check cooldown
  const gameTime = world.time.totalMinutes;
  if (interaction.cooldown && isPropOnCooldown(player, prop.id, gameTime)) {
    const remaining = getRemainingCooldown(player, prop.id, gameTime);
    return {
      output: [{ text: formatCooldownMessage(remaining), style: 'system' }],
    };
  }

  const output: OutputLine[] = [];

  // Execute interaction - show text
  const text = pickRandomText(interaction.text);
  output.push({ text, style: 'normal' });

  // Apply rewards if any
  if (interaction.rewards) {
    const rewardMessages = applyPropRewards(player, interaction.rewards, world);
    for (const msg of rewardMessages) {
      output.push({ text: msg, style: 'success' });
    }

    // If rewards include consuming an item, remove it
    if (interaction.rewards.consumeItem) {
      const slotIndex = player.inventory.findIndex(slot => {
        const invItem = world.items[slot.itemId];
        return invItem?.baseId === interaction.rewards!.consumeItem;
      });
      if (slotIndex !== -1) {
        const slot = player.inventory[slotIndex]!;
        if (slot.quantity > 1) {
          slot.quantity--;
        } else {
          player.inventory.splice(slotIndex, 1);
        }
      }
    }
  }

  // Set cooldown
  if (interaction.cooldown) {
    setPropCooldown(player, prop.id, gameTime, interaction.cooldown);
  }

  return { output, updatePlayer: true };
}

/**
 * Handle item + prop interactions (e.g., "toss coin well", "fill waterskin fountain")
 */
function handleItemPropInteraction(
  ctx: CommandContext,
  prop: PropDefinition,
  verb: string,
  itemName: string
): CommandResult {
  const { session } = ctx;
  const { world, player } = session;
  const output: OutputLine[] = [];

  // Find item in player inventory
  const itemNameLower = itemName.toLowerCase();
  const invSlotIndex = player.inventory.findIndex(slot => {
    const invItem = world.items[slot.itemId];
    return invItem?.name.toLowerCase().includes(itemNameLower);
  });

  if (invSlotIndex === -1) {
    return {
      output: [{ text: `You don't have a ${itemName}.`, style: 'error' }],
    };
  }

  const invSlot = player.inventory[invSlotIndex]!;
  const invItem = world.items[invSlot.itemId]!;
  const gameTime = world.time.totalMinutes;

  // Check for specific item interactions on this prop
  if (prop.itemInteractions && prop.itemInteractions[invItem.baseId]) {
    const interaction = prop.itemInteractions[invItem.baseId]!;

    // Check cooldown
    const cooldownKey = `${prop.id}_${invItem.baseId}`;
    if (interaction.cooldown && isPropOnCooldown(player, cooldownKey, gameTime)) {
      const remaining = getRemainingCooldown(player, cooldownKey, gameTime);
      return {
        output: [{ text: formatCooldownMessage(remaining), style: 'system' }],
      };
    }

    // Show interaction text
    const text = pickRandomText(interaction.text);
    output.push({ text, style: 'normal' });

    // Apply rewards
    if (interaction.rewards) {
      // Check if this reward consumes the item
      if (interaction.rewards.consumeItem === invItem.baseId) {
        if (invSlot.quantity > 1) {
          invSlot.quantity--;
        } else {
          player.inventory.splice(invSlotIndex, 1);
        }
        output.push({ text: `You use your ${invItem.name}.`, style: 'system' });
      }

      const rewardMessages = applyPropRewards(player, interaction.rewards, world);
      for (const msg of rewardMessages) {
        output.push({ text: msg, style: 'success' });
      }
    }

    // Set cooldown
    if (interaction.cooldown) {
      setPropCooldown(player, cooldownKey, gameTime, interaction.cooldown);
    }

    return { output, updatePlayer: true };
  }

  // Check for tag-based interactions
  if (prop.tags && invItem.tags) {
    for (const propTag of prop.tags) {
      const tagInteraction = TAG_INTERACTIONS[propTag];
      if (!tagInteraction) continue;

      // Check if item has any of the required tags
      const hasMatchingTag = tagInteraction.itemTags.some(t => invItem.tags.includes(t));
      if (!hasMatchingTag) continue;

      // Check if verb matches (or use default 'use')
      const requiredVerb = tagInteraction.verb || 'use';
      if (verb !== requiredVerb) continue;

      // Check cooldown
      const cooldownKey = `${prop.id}_tag_${propTag}`;
      if (isPropOnCooldown(player, cooldownKey, gameTime)) {
        const remaining = getRemainingCooldown(player, cooldownKey, gameTime);
        return {
          output: [{ text: formatCooldownMessage(remaining), style: 'system' }],
        };
      }

      // Apply effect text with placeholders
      const text = tagInteraction.text
        .replace(/\$\{item\}/g, invItem.name)
        .replace(/\$\{prop\}/g, prop.name);
      output.push({ text, style: 'normal' });

      // Consume item if required
      if (tagInteraction.consumeItem) {
        if (invSlot.quantity > 1) {
          invSlot.quantity--;
        } else {
          player.inventory.splice(invSlotIndex, 1);
        }
      }

      // Handle result item creation
      if (tagInteraction.resultItem) {
        const resultBaseId = tagInteraction.resultItem.replace(/\$\{item\.baseId\}/g, invItem.baseId);
        // For now, just message about the result - item creation would need more infrastructure
        output.push({ text: `You now have a ${resultBaseId}.`, style: 'success' });
      }

      // Handle effects
      if (tagInteraction.effect === 'light_source') {
        // Apply light effect similar to torch
        player.lightSource = {
          itemBaseId: invItem.baseId,
          name: invItem.name,
          expiresAt: gameTime + 30, // 30 game minutes
        };
        output.push({ text: `The ${invItem.name} provides light.`, style: 'system' });
      }

      // Set cooldown (default 5 minutes for tag interactions)
      setPropCooldown(player, cooldownKey, gameTime, 5);

      return { output, updatePlayer: true };
    }
  }

  // No matching interaction
  return {
    output: [{ text: `You can't ${verb} your ${invItem.name} with the ${prop.name}.`, style: 'error' }],
  };
}
