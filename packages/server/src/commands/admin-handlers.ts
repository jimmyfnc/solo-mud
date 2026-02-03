/**
 * Admin command handlers — always-on for all players.
 * Commands are prefixed with "/" in player input.
 */

import type { CommandContext, CommandResult } from './handlers';
import { executeCommand, addToInventory } from './handlers';
import type { OutputLine } from '@solo-mud/shared';
import {
  CREATURE_TEMPLATES,
  SHOP_ITEM_TEMPLATES,
  STARTER_CLOTHING,
  CLASS_STARTER_WEAPONS,
  createItemFromTemplate,
  createRng,
  xpForLevel,
  CLASSES,
  type ItemTemplate,
} from '@solo-mud/shared';
import type { BotManager } from '../bots/bot-manager';
import { NAMED_BOTS } from '../bots/roster/named-bots';

type AdminHandler = (ctx: CommandContext) => CommandResult;

// Module-level BotManager reference (set via setBotManager)
let botManager: BotManager | null = null;

/**
 * Set the BotManager instance for bot admin commands.
 */
export function setBotManager(manager: BotManager): void {
  botManager = manager;
}

/**
 * Registry of admin command handlers.
 * Looked up after stripping the "/" prefix from input.
 */
export const adminHandlers: Record<string, AdminHandler> = {
  give: handleGive,
  tp: handleTeleport,
  heal: handleHeal,
  setlevel: handleSetLevel,
  spawn: handleSpawn,
  god: handleGod,
  items: handleItems,
  locations: handleLocations,
  creatures: handleCreatures,
  botlist: handleBotList,
  botinfo: handleBotInfo,
  botkill: handleBotKill,
  botspawn: handleBotSpawn,
  help: handleAdminHelp,
};

// ============ Item Registry (for /give and /items) ============

/**
 * Build a unified item template lookup from all sources.
 */
function getAllItemTemplates(): Map<string, ItemTemplate> {
  const templates = new Map<string, ItemTemplate>();

  // Shop items (SHOP_ITEM_TEMPLATES has a different shape — adapt to ItemTemplate)
  for (const [baseId, shop] of Object.entries(SHOP_ITEM_TEMPLATES)) {
    templates.set(baseId, {
      baseId,
      name: shop.name,
      tags: shop.tags,
      rarity: 'common',
      description: shop.description,
    });
  }

  // Starter clothing
  for (const tmpl of STARTER_CLOTHING) {
    if (!templates.has(tmpl.baseId)) {
      templates.set(tmpl.baseId, tmpl);
    }
  }

  // Class starter weapons
  for (const tmpl of Object.values(CLASS_STARTER_WEAPONS)) {
    if (!templates.has(tmpl.baseId)) {
      templates.set(tmpl.baseId, tmpl);
    }
  }

  return templates;
}

/**
 * Find an item template by exact baseId or partial name match.
 */
function findItemTemplate(search: string): ItemTemplate | null {
  const all = getAllItemTemplates();
  const lower = search.toLowerCase();

  // Exact baseId match first
  const exact = all.get(lower) ?? all.get(search);
  if (exact) return exact;

  // Partial name or baseId substring match
  for (const tmpl of all.values()) {
    if (tmpl.baseId.includes(lower) || tmpl.name.toLowerCase().includes(lower)) {
      return tmpl;
    }
  }

  return null;
}

// ============ Handlers ============

/**
 * /give <item> [quantity] — Add items to inventory.
 */
function handleGive(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { player, world } = session;
  const output: OutputLine[] = [];

  if (!parsed.target) {
    output.push({ text: 'Usage: /give <item_name_or_id> [quantity]', style: 'system' });
    output.push({ text: 'Use /items to see available items.', style: 'system' });
    return { output };
  }

  // Parse quantity from last arg if it's a number
  let quantity = 1;
  let searchTerm = parsed.args.join(' ');

  if (parsed.args.length >= 2) {
    const lastArg = parsed.args[parsed.args.length - 1]!;
    const maybeQty = parseInt(lastArg, 10);
    if (!isNaN(maybeQty) && maybeQty > 0) {
      quantity = Math.min(maybeQty, 99); // Cap at 99
      searchTerm = parsed.args.slice(0, -1).join(' ');
    }
  }

  const template = findItemTemplate(searchTerm);
  if (!template) {
    output.push({ text: `No item found matching "${searchTerm}".`, style: 'error' });
    output.push({ text: 'Use /items to see available items.', style: 'system' });
    return { output };
  }

  // Create and add items
  let added = 0;
  for (let i = 0; i < quantity; i++) {
    const item = createItemFromTemplate(template, 'admin');
    world.items[item.id] = item;

    if (addToInventory(player, world, item.id)) {
      added++;
    } else {
      // Inventory full - clean up unused item
      delete world.items[item.id];
      break;
    }
  }

  if (added === 0) {
    output.push({ text: 'Your inventory is full.', style: 'error' });
    return { output };
  }

  output.push({
    text: `[ADMIN] Gave ${added}x ${template.name} (${template.baseId}).`,
    style: 'success',
  });

  return { output, updatePlayer: true };
}

/**
 * /tp <location_id> — Teleport to any location.
 */
function handleTeleport(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { player } = session;
  const output: OutputLine[] = [];

  if (!parsed.target) {
    output.push({ text: 'Usage: /tp <location_id>', style: 'system' });
    output.push({ text: 'Use /locations to see available locations.', style: 'system' });
    return { output };
  }

  const locationId = parsed.args.join('_').toLowerCase();
  const location = session.world.locations[locationId];

  if (!location) {
    // Try exact match with original args
    const altId = parsed.args.join(' ');
    const altLocation = session.world.locations[altId];
    if (!altLocation) {
      output.push({ text: `No location found: "${locationId}".`, style: 'error' });
      output.push({ text: 'Use /locations to see available locations.', style: 'system' });
      return { output };
    }
    // Use the alt ID
    player.locationId = altId;
  } else {
    player.locationId = locationId;
  }

  // Clear combat state on teleport
  player.inCombat = false;
  player.autoAttack = false;
  player.targetId = undefined;

  output.push({
    text: `[ADMIN] Teleported to ${session.world.locations[player.locationId]?.name ?? player.locationId}.`,
    style: 'success',
  });

  // Run a look command to show the new room
  const lookResult = executeCommand(session, 'look');
  output.push(...lookResult.output);

  return { output, updateRoom: true, updatePlayer: true };
}

/**
 * /heal — Restore HP and MP to full.
 */
function handleHeal(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const { player } = session;
  const output: OutputLine[] = [];

  player.currentHp = player.maxHp;
  player.currentMp = player.maxMp;

  // Clear negative status effects
  player.statusEffects = player.statusEffects.filter(
    e => e.id !== 'poison' && e.id !== 'bleed'
  );

  output.push({
    text: `[ADMIN] Restored to full health. HP: ${player.currentHp}/${player.maxHp}, MP: ${player.currentMp}/${player.maxMp}`,
    style: 'success',
  });

  return { output, updatePlayer: true };
}

/**
 * /setlevel <n> — Set player level and recalculate stats.
 */
function handleSetLevel(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { player } = session;
  const output: OutputLine[] = [];

  const targetLevel = parseInt(parsed.target ?? '', 10);
  if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 99) {
    output.push({ text: 'Usage: /setlevel <1-99>', style: 'system' });
    return { output };
  }

  const oldLevel = player.level;
  const classDef = CLASSES[player.class];

  player.level = targetLevel;
  player.xp = 0;
  player.xpToNextLevel = xpForLevel(targetLevel + 1);

  // Recalculate HP/MP based on level (matches player-factory.ts formulas)
  // HP = CON * 3 + hpPerLevel * level
  // MP = max(INT, WIS) * 2 + mpPerLevel * level
  player.maxHp = player.baseStats.con * 3 + classDef.hpPerLevel * targetLevel;
  const mentalStat = Math.max(player.baseStats.int, player.baseStats.wis);
  player.maxMp = mentalStat * 2 + classDef.mpPerLevel * targetLevel;
  player.currentHp = player.maxHp;
  player.currentMp = player.maxMp;

  // Recalculate carry weight
  player.maxCarryWeight = 50 + (player.baseStats.str * 5);

  output.push({
    text: `[ADMIN] Level changed: ${oldLevel} → ${targetLevel}. HP: ${player.maxHp}, MP: ${player.maxMp}. XP reset to 0.`,
    style: 'success',
  });

  return { output, updatePlayer: true };
}

/**
 * /spawn <creature_template_id> — Spawn a creature at the current location.
 */
function handleSpawn(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const { world, player } = session;
  const output: OutputLine[] = [];

  if (!parsed.target) {
    output.push({ text: 'Usage: /spawn <creature_template_id>', style: 'system' });
    output.push({ text: 'Use /creatures to see available templates.', style: 'system' });
    return { output };
  }

  const templateId = parsed.args.join('_').toLowerCase();
  const template = CREATURE_TEMPLATES[templateId];

  if (!template) {
    output.push({ text: `No creature template found: "${templateId}".`, style: 'error' });
    output.push({ text: 'Use /creatures to see available templates.', style: 'system' });
    return { output };
  }

  const location = world.locations[player.locationId];
  if (!location) {
    output.push({ text: 'Cannot spawn here — invalid location.', style: 'error' });
    return { output };
  }

  // Create creature using same pattern as processRespawns
  const creatureId = `creature_${templateId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const level = template.baseLevel;
  const hp = template.baseHp;
  const rng = createRng(`admin-spawn-${creatureId}`);
  const idleDesc = template.descriptions.idle[Math.floor(rng.next() * template.descriptions.idle.length)] ?? '';

  const creature = {
    id: creatureId,
    templateId,
    name: template.name,
    level,
    behavior: template.behavior,
    mobility: template.mobility,
    currentHp: hp,
    maxHp: hp,
    locationId: player.locationId,
    homeLocationId: player.locationId,
    spawnLocationId: player.locationId,
    inCombat: false,
    description: idleDesc,
  };

  world.creatures[creatureId] = creature;
  location.creatures.push(creatureId);

  output.push({
    text: `[ADMIN] Spawned ${template.name} (L${level}) at ${location.name}.`,
    style: 'success',
  });

  return { output, updateRoom: true };
}

/**
 * /god — Toggle invincibility.
 */
function handleGod(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  session.invincible = !session.invincible;

  return {
    output: [{
      text: `[ADMIN] God mode ${session.invincible ? 'ON' : 'OFF'}. ${session.invincible ? 'You are now invincible.' : 'You can take damage again.'}`,
      style: 'success',
    }],
  };
}

/**
 * /items [search] — List available item template IDs.
 */
function handleItems(ctx: CommandContext): CommandResult {
  const { parsed } = ctx;
  const output: OutputLine[] = [];
  const search = parsed.args.join(' ').toLowerCase();

  const all = getAllItemTemplates();
  const entries = [...all.entries()]
    .filter(([baseId, tmpl]) =>
      !search || baseId.includes(search) || tmpl.name.toLowerCase().includes(search)
    )
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    output.push({ text: `No items matching "${search}".`, style: 'error' });
    return { output };
  }

  output.push({ text: `[ADMIN] Available items${search ? ` matching "${search}"` : ''}:`, style: 'system' });
  for (const [baseId, tmpl] of entries) {
    output.push({
      text: `  ${baseId} — ${tmpl.name} [${tmpl.tags.join(', ')}]`,
      style: 'normal',
    });
  }
  output.push({ text: `(${entries.length} items. Use /give <baseId> [qty] to add.)`, style: 'system' });

  return { output };
}

/**
 * /locations — List all location IDs.
 */
function handleLocations(ctx: CommandContext): CommandResult {
  const { session } = ctx;
  const output: OutputLine[] = [];

  const locations = Object.entries(session.world.locations)
    .sort(([a], [b]) => a.localeCompare(b));

  output.push({ text: `[ADMIN] Available locations (${locations.length}):`, style: 'system' });
  for (const [id, loc] of locations) {
    const marker = id === session.player.locationId ? ' ← YOU ARE HERE' : '';
    output.push({
      text: `  ${id} — ${loc.name}${marker}`,
      style: marker ? 'success' : 'normal',
    });
  }
  output.push({ text: `(Use /tp <location_id> to teleport.)`, style: 'system' });

  return { output };
}

/**
 * /creatures — List all creature template IDs.
 */
function handleCreatures(_: CommandContext): CommandResult {
  const output: OutputLine[] = [];

  const templates = Object.entries(CREATURE_TEMPLATES)
    .sort(([a], [b]) => a.localeCompare(b));

  output.push({ text: `[ADMIN] Available creature templates (${templates.length}):`, style: 'system' });
  for (const [id, tmpl] of templates) {
    output.push({
      text: `  ${id} — ${tmpl.name} (L${tmpl.baseLevel}, ${tmpl.behavior}, ${tmpl.tier})`,
      style: 'normal',
    });
  }
  output.push({ text: `(Use /spawn <template_id> to spawn.)`, style: 'system' });

  return { output };
}

// ============ Bot Admin Handlers ============

/**
 * /botlist — List all active bots (named + generic).
 */
function handleBotList(_: CommandContext): CommandResult {
  const output: OutputLine[] = [];

  if (!botManager) {
    output.push({ text: '[ADMIN] Bot system not initialized.', style: 'error' });
    return { output };
  }

  const allBots = botManager.getAllBots();

  // Separate named and generic bots
  const named = allBots.filter(bot => bot.player.namedBotId);
  const generic = allBots.filter(bot => !bot.player.namedBotId);

  output.push({ text: '[ADMIN] Active Bots:', style: 'system' });

  if (named.length > 0) {
    output.push({ text: '  Named Bots:', style: 'normal' });
    for (const bot of named) {
      const p = bot.player;
      const locationName = p.locationId ?? 'unknown';
      output.push({
        text: `    ${p.name} (${bot.id}) - L${p.level} ${p.class} - ${locationName} [NAMED]`,
        style: 'normal',
      });
    }
  }

  if (generic.length > 0) {
    output.push({ text: '  Generic Bots:', style: 'normal' });
    for (const bot of generic) {
      const p = bot.player;
      const locationName = p.locationId ?? 'unknown';
      output.push({
        text: `    ${p.name} (${bot.id}) - L${p.level} ${p.class} - ${locationName} [GENERIC]`,
        style: 'normal',
      });
    }
  }

  if (allBots.length === 0) {
    output.push({ text: '  No active bots.', style: 'normal' });
  }

  output.push({
    text: `(Total: ${allBots.length} bots — ${named.length} named, ${generic.length} generic)`,
    style: 'system',
  });

  return { output };
}

/**
 * /botinfo <name or id> — Show detailed bot information.
 */
function handleBotInfo(ctx: CommandContext): CommandResult {
  const { parsed } = ctx;
  const output: OutputLine[] = [];

  if (!botManager) {
    output.push({ text: '[ADMIN] Bot system not initialized.', style: 'error' });
    return { output };
  }

  if (!parsed.target) {
    output.push({ text: 'Usage: /botinfo <name or id>', style: 'system' });
    return { output };
  }

  const search = parsed.args.join(' ').toLowerCase();
  const allBots = botManager.getAllBots();

  // Find bot by ID or name
  const bot = allBots.find(
    b => b.id.toLowerCase() === search || b.player.name.toLowerCase() === search
  );

  if (!bot) {
    output.push({ text: `No bot found matching "${parsed.args.join(' ')}".`, style: 'error' });
    output.push({ text: 'Use /botlist to see all active bots.', style: 'system' });
    return { output };
  }

  const p = bot.player;
  const profile = p.botProfile;
  const personality = profile.personality;

  output.push({ text: `[ADMIN] Bot Info: ${p.name}`, style: 'system' });
  output.push({ text: '  Basic Info:', style: 'normal' });
  output.push({ text: `    ID: ${bot.id}`, style: 'normal' });
  output.push({ text: `    Class: ${p.class}`, style: 'normal' });
  output.push({ text: `    Level: ${p.level}`, style: 'normal' });
  output.push({ text: `    HP: ${p.currentHp}/${p.maxHp}`, style: 'normal' });
  output.push({ text: `    MP: ${p.currentMp}/${p.maxMp}`, style: 'normal' });
  output.push({ text: `    Location: ${p.locationId ?? 'unknown'}`, style: 'normal' });
  output.push({ text: `    Type: ${profile.isNamed ? 'Named' : 'Generic'}`, style: 'normal' });

  output.push({ text: '  Personality:', style: 'normal' });
  output.push({ text: `    Bravery: ${personality.bravery}`, style: 'normal' });
  output.push({ text: `    Greed: ${personality.greed}`, style: 'normal' });
  output.push({ text: `    Sociability: ${personality.sociability}`, style: 'normal' });
  output.push({ text: `    Patience: ${personality.patience}`, style: 'normal' });
  output.push({ text: `    Aggression: ${personality.aggression}`, style: 'normal' });
  output.push({ text: `    Speech Style: ${personality.speechStyle}`, style: 'normal' });

  if (p.currentGoalId) {
    output.push({ text: `  Current Goal: ${p.currentGoalId}`, style: 'normal' });
  }

  if (profile.backstory) {
    output.push({ text: '  Backstory:', style: 'normal' });
    output.push({ text: `    ${profile.backstory}`, style: 'normal' });
  }

  return { output };
}

/**
 * /botkill <name or id> — Kill a bot.
 */
function handleBotKill(ctx: CommandContext): CommandResult {
  const { parsed } = ctx;
  const output: OutputLine[] = [];

  if (!botManager) {
    output.push({ text: '[ADMIN] Bot system not initialized.', style: 'error' });
    return { output };
  }

  if (!parsed.target) {
    output.push({ text: 'Usage: /botkill <name or id>', style: 'system' });
    return { output };
  }

  const search = parsed.args.join(' ').toLowerCase();
  const allBots = botManager.getAllBots();

  // Find bot by ID or name
  const bot = allBots.find(
    b => b.id.toLowerCase() === search || b.player.name.toLowerCase() === search
  );

  if (!bot) {
    output.push({ text: `No bot found matching "${parsed.args.join(' ')}".`, style: 'error' });
    output.push({ text: 'Use /botlist to see all active bots.', style: 'system' });
    return { output };
  }

  const botName = bot.player.name;
  const result = botManager.handleBotDeath(bot.id);

  if (result.wasNamed) {
    output.push({
      text: `[ADMIN] Killed named bot "${botName}". They will respawn later.`,
      style: 'success',
    });
  } else {
    output.push({
      text: `[ADMIN] Killed generic bot "${botName}". They have been removed.`,
      style: 'success',
    });
  }

  return { output };
}

/**
 * /botspawn [named_bot_id] — Spawn a bot.
 */
function handleBotSpawn(ctx: CommandContext): CommandResult {
  const { session, parsed } = ctx;
  const output: OutputLine[] = [];

  if (!botManager) {
    output.push({ text: '[ADMIN] Bot system not initialized.', style: 'error' });
    return { output };
  }

  const namedBotId = parsed.target ? parsed.args.join('_').toLowerCase() : null;

  if (namedBotId) {
    // Try to find the named bot definition
    const definition = NAMED_BOTS[namedBotId];
    if (!definition) {
      output.push({ text: `No named bot definition found: "${namedBotId}".`, style: 'error' });
      output.push({ text: 'Available named bots:', style: 'system' });
      for (const id of Object.keys(NAMED_BOTS)) {
        const def = NAMED_BOTS[id];
        output.push({ text: `  ${id} — ${def?.name}`, style: 'normal' });
      }
      return { output };
    }

    // Check if this bot is in the respawn queue
    if (botManager.isAwaitingRespawn(namedBotId)) {
      // Force immediate respawn by processing with a far-future time
      const respawned = botManager.processRespawnQueue(Number.MAX_SAFE_INTEGER);
      if (respawned.includes(definition.name)) {
        output.push({
          text: `[ADMIN] Force-respawned named bot "${definition.name}".`,
          style: 'success',
        });
        return { output };
      }
    }

    // Check if the bot is already active
    const namedBots = botManager.getNamedBots();
    const existingBot = namedBots.get(namedBotId);
    if (existingBot && existingBot.player.currentHp > 0) {
      output.push({
        text: `Named bot "${definition.name}" is already active.`,
        style: 'error',
      });
      return { output };
    }

    output.push({
      text: `Named bot "${definition.name}" is not in respawn queue and cannot be spawned.`,
      style: 'error',
    });
    output.push({
      text: 'Use /botkill on them first, then wait or use /botspawn to force respawn.',
      style: 'system',
    });
    return { output };
  }

  // Spawn a generic bot at player's location
  const newBot = botManager.spawnGenericBot();
  const playerLoc = session.player.locationId;
  const location = session.world.locations[playerLoc];

  // Move the bot to the player's location
  newBot.player.locationId = playerLoc;

  output.push({
    text: `[ADMIN] Spawned generic bot "${newBot.player.name}" at ${location?.name ?? playerLoc}.`,
    style: 'success',
  });

  return { output };
}

/**
 * /help — Show available admin commands.
 */
function handleAdminHelp(_: CommandContext): CommandResult {
  const output: OutputLine[] = [];

  output.push({ text: '[ADMIN] Available Commands:', style: 'system' });
  output.push({ text: '  /give <item> [qty]    — Add items to inventory', style: 'normal' });
  output.push({ text: '  /tp <location_id>     — Teleport to any location', style: 'normal' });
  output.push({ text: '  /heal                 — Restore HP and MP to full', style: 'normal' });
  output.push({ text: '  /setlevel <1-99>      — Set player level', style: 'normal' });
  output.push({ text: '  /spawn <template_id>  — Spawn creature here', style: 'normal' });
  output.push({ text: '  /god                  — Toggle invincibility', style: 'normal' });
  output.push({ text: '  /items [search]       — List item IDs', style: 'normal' });
  output.push({ text: '  /locations            — List location IDs', style: 'normal' });
  output.push({ text: '  /creatures            — List creature templates', style: 'normal' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: '  Bot Commands:', style: 'system' });
  output.push({ text: '  /botlist              — List all active bots', style: 'normal' });
  output.push({ text: '  /botinfo <name|id>    — Show bot details', style: 'normal' });
  output.push({ text: '  /botkill <name|id>    — Kill a bot', style: 'normal' });
  output.push({ text: '  /botspawn [bot_id]    — Spawn generic or named bot', style: 'normal' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: '  /help                 — This help text', style: 'normal' });

  return { output };
}
