/**
 * Game loop - handles periodic game updates like creature movement,
 * respawns, and time-based events.
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import type { Creature, NPC, OutputLine, World } from '@solo-mud/shared';
import { createRng, CREATURE_TEMPLATES, CHASE_CHANCE, EVENLY_MATCHED_THRESHOLD, ZONE_ACTIVITY } from '@solo-mud/shared';
import { sessionManager, type GameSession } from './session';
import { SimulationEngine, getZoneType } from '../npc/simulation';
import {
  getDistanceFromPlayer,
  findPreyInAdjacentLocations,
  shouldCorpseFade,
  handleCreatureDeath,
  canHunt,
  getAdjacentLocations,
  isInTerritory,
  resolveInstantCombat,
} from './ecosystem';

/** How often the world ticks (creature movement, etc.) in ms */
const WORLD_TICK_INTERVAL = 30000; // 30 seconds

/** How often combat ticks (creature attacks) in ms */
const COMBAT_TICK_INTERVAL = 5000; // 5 seconds

/** Chance for a roaming creature to move each tick */
const ROAM_CHANCE = 0.3;

/** Store for socket.io server reference */
let ioServer: SocketServer | null = null;

/** Interval IDs for the game loops */
let worldLoopInterval: ReturnType<typeof setInterval> | null = null;
let combatLoopInterval: ReturnType<typeof setInterval> | null = null;

/** Simulation engine instance */
let simulationEngine: SimulationEngine | null = null;

/** Track last simulation tick per location */
const lastSimulationTick: Map<string, number> = new Map();

/**
 * Start the game loop.
 */
export function startGameLoop(io: SocketServer): void {
  ioServer = io;

  if (worldLoopInterval) {
    clearInterval(worldLoopInterval);
  }
  if (combatLoopInterval) {
    clearInterval(combatLoopInterval);
  }

  // Initialize simulation engine with message sender
  simulationEngine = new SimulationEngine((playerId, message) => {
    const session = sessionManager.getSession(playerId);
    if (!session) return;

    const socket = getSocketForSession(session);
    if (socket) {
      socket.emit('output', {
        type: 'output',
        lines: [formatSimulationMessage(message)],
      });
    }
  });

  worldLoopInterval = setInterval(worldTick, WORLD_TICK_INTERVAL);
  combatLoopInterval = setInterval(combatTick, COMBAT_TICK_INTERVAL);

  console.log(`Game loop started (world: ${WORLD_TICK_INTERVAL / 1000}s, combat: ${COMBAT_TICK_INTERVAL / 1000}s)`);
}

/**
 * Stop the game loop.
 */
export function stopGameLoop(): void {
  if (worldLoopInterval) {
    clearInterval(worldLoopInterval);
    worldLoopInterval = null;
  }
  if (combatLoopInterval) {
    clearInterval(combatLoopInterval);
    combatLoopInterval = null;
  }
  simulationEngine = null;
  lastSimulationTick.clear();
  console.log('Game loop stopped');
}

/**
 * World tick - handles creature movement, respawns, etc.
 */
function worldTick(): void {
  const sessions = sessionManager.getAllSessions();

  for (const session of sessions) {
    processCorpses(session);
    processRespawns(session);
    processHunting(session);
    processCreatureMovement(session);
  }

  // Run NPC simulation tick
  runSimulationTick();
}

/**
 * Combat tick - handles ongoing combat (creature auto-attacks).
 */
function combatTick(): void {
  const sessions = sessionManager.getAllSessions();

  for (const session of sessions) {
    processPlayerCombat(session);
    processCreatureVsCreatureCombat(session);
  }
}

/** Player info for simulation engine */
interface PlayerInfo {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

/**
 * Run the NPC simulation tick for all locations with players.
 */
function runSimulationTick(): void {
  if (!simulationEngine) return;

  const now = Date.now();
  const sessions = sessionManager.getAllSessions();

  // Group players by location
  const playersByLocation = new Map<string, { players: PlayerInfo[]; session: GameSession }>();

  for (const session of sessions) {
    const locationId = session.player.locationId;

    if (!playersByLocation.has(locationId)) {
      playersByLocation.set(locationId, { players: [], session });
    }

    const entry = playersByLocation.get(locationId)!;
    entry.players.push({
      id: session.id,
      name: session.player.name,
      level: session.player.level,
      hp: session.player.currentHp,
      maxHp: session.player.maxHp,
    });
  }

  // Run simulation for each location with players
  for (const [locationId, { players, session }] of playersByLocation) {
    const zoneType = getZoneType(locationId);
    const config = ZONE_ACTIVITY[zoneType];

    if (!config || !config.enabled) continue;

    // Check if enough time has passed for this location
    const lastTick = lastSimulationTick.get(locationId) || 0;
    const interval = config.minInterval + Math.random() * (config.maxInterval - config.minInterval);

    if (now - lastTick >= interval) {
      const npcsAtLocation = getNpcsAtLocation(session.world, locationId);
      simulationEngine.runTick(locationId, npcsAtLocation, players);
      lastSimulationTick.set(locationId, now);
    }
  }
}

/**
 * Get NPCs at a specific location from the world state.
 */
function getNpcsAtLocation(world: World, locationId: string): NPC[] {
  const location = world.locations[locationId];
  if (!location?.npcs) return [];

  return location.npcs
    .map(id => world.npcs[id])
    .filter((npc): npc is NPC => npc !== undefined);
}

/**
 * Format a simulation message as an OutputLine.
 */
function formatSimulationMessage(message: {
  type: string;
  subtype: string;
  npcName?: string;
  action?: string;
  says?: string;
  lines?: Array<{ npcName: string; action?: string; says?: string }>;
}): OutputLine {
  // Handle conversation messages
  if (message.subtype === 'npc_conversation' && message.lines) {
    const conversationText = message.lines
      .map(line => {
        if (line.action && line.says) {
          return `${line.npcName} ${line.action}, "${line.says}"`;
        } else if (line.says) {
          return `${line.npcName} says, "${line.says}"`;
        } else if (line.action) {
          return `${line.npcName} ${line.action}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');

    return { text: conversationText, style: 'normal' };
  }

  // Handle ambient actions
  if (message.action && !message.says) {
    return { text: `${message.npcName} ${message.action}`, style: 'normal' };
  }

  // Handle ambient speech
  if (message.says && !message.action) {
    return { text: `${message.npcName} says, "${message.says}"`, style: 'normal' };
  }

  // Handle combined action + speech
  if (message.action && message.says) {
    return { text: `${message.npcName} ${message.action}, "${message.says}"`, style: 'normal' };
  }

  // Fallback
  return { text: `${message.npcName} does something.`, style: 'normal' };
}

/**
 * Process player combat for a session.
 * Creatures in combat with the player will attack automatically.
 */
function processPlayerCombat(session: GameSession): void {
  const { world, player, combatStats } = session;

  // Skip if player not in combat
  if (!player.inCombat || !player.targetId) {
    return;
  }

  const socket = getSocketForSession(session);
  if (!socket) return;

  // Find the creature the player is fighting
  const creature = world.creatures[player.targetId];
  if (!creature || creature.currentHp <= 0) {
    // Target died or doesn't exist - clear combat
    player.inCombat = false;
    player.targetId = undefined;
    return;
  }

  // Passive creatures don't attack - they just wait to die
  if (creature.behavior === 'passive') {
    return;
  }

  // Creature attacks the player
  const rng = createRng(`combat-tick-${Date.now()}`);
  const output: OutputLine[] = [];

  const creatureHitChance = 0.75;
  const creatureHits = rng.next() < creatureHitChance;

  if (!creatureHits) {
    output.push({
      text: `The ${creature.name} attacks but misses!`,
      style: 'combat',
    });
  } else {
    const minDmg = Math.max(1, creature.level);
    const maxDmg = Math.max(2, creature.level * 2 + 2);
    let damage = minDmg + Math.floor(rng.next() * (maxDmg - minDmg + 1));

    // Apply defense reduction
    const defenseReduction = Math.floor(combatStats.defense / 20);
    damage = Math.max(1, damage - defenseReduction);

    player.currentHp -= damage;

    output.push({
      text: `The ${creature.name} attacks you for ${damage} damage!`,
      style: 'combat',
    });

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
      player.inCombat = false;
      player.targetId = undefined;
      creature.inCombat = false;
      creature.targetId = undefined;
    }
  }

  sendNotifications(socket, output);
}

/**
 * Process creature-vs-creature combat for tick-based fights.
 */
function processCreatureVsCreatureCombat(session: GameSession): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  // Find creatures in combat with other creatures (not player)
  const creaturesInCombat = Object.values(world.creatures).filter(
    (c) => c.inCombat && c.targetId && !c.targetId.startsWith('player')
  );

  const processed = new Set<string>();

  for (const attacker of creaturesInCombat) {
    if (processed.has(attacker.id)) continue;

    const defender = world.creatures[attacker.targetId!];
    if (!defender || defender.currentHp <= 0) {
      attacker.inCombat = false;
      attacker.targetId = undefined;
      continue;
    }

    processed.add(attacker.id);
    processed.add(defender.id);

    const rng = createRng(`cvc-tick-${Date.now()}-${attacker.id}`);

    // Both creatures attack each other
    const attackerDmg = Math.max(1, attacker.level + Math.floor(rng.next() * attacker.level));
    const defenderDmg = Math.max(1, defender.level + Math.floor(rng.next() * defender.level));

    defender.currentHp -= attackerDmg;
    attacker.currentHp -= defenderDmg;

    // Notify if player is watching
    const distance = getDistanceFromPlayer(world, player.locationId, attacker.locationId);
    if (socket && distance === 0) {
      sendNotification(socket, {
        text: `The ${attacker.name} and ${defender.name} exchange blows!`,
        style: 'combat',
      });
    }

    // Check for deaths
    if (defender.currentHp <= 0) {
      const defenderTemplate = CREATURE_TEMPLATES[defender.templateId];
      handleCreatureDeath(world, defender, 'creature', defenderTemplate?.tier ?? 'common');
      attacker.inCombat = false;
      attacker.targetId = undefined;

      if (socket && distance === 0) {
        sendNotification(socket, {
          text: `The ${attacker.name} kills the ${defender.name}!`,
          style: 'combat',
        });
      }
    }

    if (attacker.currentHp <= 0) {
      const attackerTemplate = CREATURE_TEMPLATES[attacker.templateId];
      handleCreatureDeath(world, attacker, 'creature', attackerTemplate?.tier ?? 'common');
      if (defender.currentHp > 0) {
        defender.inCombat = false;
        defender.targetId = undefined;
      }

      if (socket && distance === 0) {
        sendNotification(socket, {
          text: `The ${defender.name} kills the ${attacker.name}!`,
          style: 'combat',
        });
      }
    }
  }
}

/**
 * Process corpse decay - remove faded corpses and notify players.
 */
function processCorpses(session: GameSession): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  const toRemove: string[] = [];

  for (const [id, corpse] of Object.entries(world.corpses)) {
    if (shouldCorpseFade(corpse)) {
      toRemove.push(id);

      // Notify player if in same room
      if (socket && corpse.locationId === player.locationId) {
        sendNotification(socket, {
          text: `The ${corpse.name}'s remains are picked clean by scavengers.`,
          style: 'normal',
        });
      }
    }
  }

  for (const id of toRemove) {
    delete world.corpses[id];
  }
}

/**
 * Process respawn queue - spawn creatures whose timer has elapsed.
 */
function processRespawns(session: GameSession): void {
  const { world, player } = session;
  const now = Date.now();
  const socket = getSocketForSession(session);

  const toProcess: number[] = [];

  for (let i = 0; i < world.respawnQueue.length; i++) {
    const entry = world.respawnQueue[i]!;
    if (now >= entry.respawnAt) {
      // Delay if player is at spawn location
      if (entry.spawnLocationId === player.locationId) {
        entry.respawnAt = now + WORLD_TICK_INTERVAL;
        continue;
      }
      toProcess.push(i);
    }
  }

  // Process in reverse order to safely splice
  for (let i = toProcess.length - 1; i >= 0; i--) {
    const idx = toProcess[i]!;
    const entry = world.respawnQueue[idx]!;

    const template = CREATURE_TEMPLATES[entry.templateId];
    if (!template) {
      world.respawnQueue.splice(idx, 1);
      continue;
    }

    // Create new creature
    const creatureId = `creature_${entry.templateId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hp = template.baseHp + (entry.level - template.baseLevel) * 5;
    const rng = createRng(`respawn-${creatureId}`);
    const idleDesc = template.descriptions.idle[Math.floor(rng.next() * template.descriptions.idle.length)] ?? '';

    const creature: Creature = {
      id: creatureId,
      templateId: entry.templateId,
      name: template.name,
      level: entry.level,
      behavior: template.behavior,
      mobility: template.mobility,
      currentHp: hp,
      maxHp: hp,
      locationId: entry.spawnLocationId,
      homeLocationId: entry.spawnLocationId,
      spawnLocationId: entry.spawnLocationId,
      inCombat: false,
      description: idleDesc,
    };

    world.creatures[creatureId] = creature;

    const location = world.locations[entry.spawnLocationId];
    if (location) {
      location.creatures.push(creatureId);
    }

    world.respawnQueue.splice(idx, 1);

    // Notify player if in adjacent room (ambient hint)
    if (socket) {
      const distance = getDistanceFromPlayer(world, player.locationId, entry.spawnLocationId);
      if (distance === 1) {
        sendNotification(socket, {
          text: `You sense movement nearby.`,
          style: 'normal',
        });
      }
    }
  }
}

/**
 * Process active hunting - predators seek prey in adjacent locations.
 */
function processHunting(session: GameSession): void {
  const { world } = session;

  // Get all predators (aggressive/territorial, alive, not in combat)
  const predators = Object.values(world.creatures).filter(
    (c) =>
      c.behavior !== 'passive' &&
      c.currentHp > 0 &&
      !c.inCombat &&
      c.mobility === 'roaming'
  );

  for (const predator of predators) {
    const template = CREATURE_TEMPLATES[predator.templateId];
    if (!template) continue;

    const preyLocations = findPreyInAdjacentLocations(world, predator, template.tier);

    if (preyLocations.length === 0) continue;

    // Pick closest level match (easiest prey)
    let bestPrey: { locationId: string; creature: Creature } | null = null;
    let bestLevelDiff = Infinity;

    for (const { locationId, creatures } of preyLocations) {
      for (const prey of creatures) {
        const diff = predator.level - prey.level;
        if (diff >= 2 && diff < bestLevelDiff) {
          bestLevelDiff = diff;
          bestPrey = { locationId, creature: prey };
        }
      }
    }

    if (!bestPrey) continue;

    // Move predator to prey location
    const oldLocationId = predator.locationId;
    moveCreature(session, predator, oldLocationId, bestPrey.locationId);

    // Resolve combat between predator and prey
    const prey = bestPrey.creature;

    // Mark both as in combat temporarily
    predator.inCombat = true;
    prey.inCombat = true;

    // Instant kill for hunting (predator is 2+ levels higher)
    // Handle prey death
    handleCreatureDeath(world, prey, 'creature', template.tier, []);

    // Clear combat state for predator
    predator.inCombat = false;

    // Notify player if they witness the hunt
    const socket = getSocketForSession(session);
    if (socket && bestPrey.locationId === session.player.locationId) {
      sendNotification(socket, {
        text: `A ${predator.name} catches and kills a ${prey.name}!`,
        style: 'combat',
      });
    }
  }
}

/**
 * Process creature movement for a session's world.
 */
function processCreatureMovement(session: GameSession): void {
  const { world } = session;
  const rng = createRng(`creature-move-${Date.now()}`);

  // Get all roaming creatures
  const roamingCreatures = Object.values(world.creatures).filter(
    (c) => c.mobility === 'roaming' && c.currentHp > 0 && !c.inCombat
  );

  for (const creature of roamingCreatures) {
    // Random chance to move
    if (rng.next() > ROAM_CHANCE) {
      continue;
    }

    // Get adjacent locations
    const exitIds = world.adjacency[creature.locationId] ?? [];
    const validExits = exitIds
      .map((id) => world.exits[id])
      .filter((e) => e && e.type !== 'locked');

    if (validExits.length === 0) {
      continue;
    }

    // Pick a random exit
    const exitIndex = Math.floor(rng.next() * validExits.length);
    const chosenExit = validExits[exitIndex];
    if (!chosenExit) continue;

    const oldLocationId = creature.locationId;
    const newLocationId = chosenExit.to;

    // Move creature
    moveCreature(session, creature, oldLocationId, newLocationId);
  }
}

/**
 * Move a creature between locations and notify players.
 */
function moveCreature(
  session: GameSession,
  creature: Creature,
  fromLocationId: string,
  toLocationId: string
): void {
  const { world, player } = session;

  // Get location data
  const fromLocation = world.locations[fromLocationId];
  const toLocation = world.locations[toLocationId];

  if (!fromLocation || !toLocation) return;

  // Remove from old location
  const oldIndex = fromLocation.creatures.indexOf(creature.id);
  if (oldIndex !== -1) {
    fromLocation.creatures.splice(oldIndex, 1);
  }

  // Add to new location
  toLocation.creatures.push(creature.id);
  creature.locationId = toLocationId;

  // Notify player if they're in either location
  const socket = getSocketForSession(session);
  if (!socket) return;

  if (player.locationId === fromLocationId) {
    // Player sees creature leaving
    const direction = getExitDirection(world, fromLocationId, toLocationId);
    const leaveMessage = getLeaveMessage(creature, direction);
    sendNotification(socket, leaveMessage);
  } else if (player.locationId === toLocationId) {
    // Player sees creature arriving
    const direction = getExitDirection(world, toLocationId, fromLocationId);
    const arriveMessage = getArriveMessage(creature, direction);
    sendNotification(socket, arriveMessage);

    // Aggressive creatures attack on sight
    if (creature.behavior === 'aggressive' && !player.inCombat) {
      initiateCreatureAggro(session, creature, socket);
    }
  }

  // After creature arrives, check for flee response
  if (creature.behavior !== 'passive') {
    triggerFleeResponse(session, creature, toLocationId);
  }
}

/**
 * Get the direction label for an exit between two locations.
 */
function getExitDirection(
  world: GameSession['world'],
  fromId: string,
  toId: string
): string {
  const exitIds = world.adjacency[fromId] ?? [];
  for (const exitId of exitIds) {
    const exit = world.exits[exitId];
    if (exit && exit.to === toId) {
      return exit.label;
    }
  }
  return 'somewhere';
}

/**
 * Generate a leave message for a creature.
 */
function getLeaveMessage(creature: Creature, direction: string): OutputLine {
  const verb = getMovementVerb(creature);
  return {
    text: `A ${creature.name} ${verb} ${direction}.`,
    style: 'normal',
  };
}

/**
 * Generate an arrive message for a creature.
 */
function getArriveMessage(creature: Creature, fromDirection: string): OutputLine {
  const verb = getMovementVerb(creature);
  const directionPhrase =
    fromDirection === 'somewhere' ? '' : ` from the ${fromDirection}`;
  return {
    text: `A ${creature.name} ${verb} in${directionPhrase}.`,
    style: creature.behavior === 'aggressive' ? 'combat' : 'normal',
  };
}

/**
 * Get an appropriate movement verb for a creature.
 */
function getMovementVerb(creature: Creature): string {
  const name = creature.name.toLowerCase();

  // Flying creatures
  if (name.includes('raven') || name.includes('hawk') || name.includes('bat')) {
    return Math.random() < 0.5 ? 'flies' : 'swoops';
  }

  // Sneaky creatures
  if (name.includes('wolf') || name.includes('fox') || name.includes('cat')) {
    return Math.random() < 0.5 ? 'prowls' : 'slinks';
  }

  // Spiders and bugs
  if (name.includes('spider') || name.includes('scorpion') || name.includes('beetle')) {
    return Math.random() < 0.5 ? 'scuttles' : 'creeps';
  }

  // Large creatures
  if (name.includes('bear') || name.includes('boar') || name.includes('troll')) {
    return Math.random() < 0.5 ? 'lumbers' : 'stomps';
  }

  // Snakes
  if (name.includes('snake') || name.includes('serpent')) {
    return Math.random() < 0.5 ? 'slithers' : 'glides';
  }

  // Default
  const defaultVerbs = ['wanders', 'moves', 'walks', 'ambles'];
  return defaultVerbs[Math.floor(Math.random() * defaultVerbs.length)]!;
}

/**
 * Get the socket for a session.
 */
function getSocketForSession(session: GameSession): Socket | null {
  if (!ioServer) return null;

  const sockets = ioServer.sockets.sockets;
  return sockets.get(session.id) ?? null;
}

/**
 * Send a notification to a socket.
 */
function sendNotification(socket: Socket, line: OutputLine): void {
  socket.emit('output', {
    type: 'output',
    lines: [line],
  });
}

/**
 * Send multiple notification lines to a socket.
 */
function sendNotifications(socket: Socket, lines: OutputLine[]): void {
  socket.emit('output', {
    type: 'output',
    lines,
  });
}

/**
 * When a predator arrives at a location, prey may flee.
 */
function triggerFleeResponse(
  session: GameSession,
  predator: Creature,
  locationId: string
): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);
  const location = world.locations[locationId];
  if (!location) return;

  const template = CREATURE_TEMPLATES[predator.templateId];
  if (!template) return;

  // Find prey that should flee
  const preyToFlee = location.creatures
    .map((id) => world.creatures[id])
    .filter((c): c is Creature => {
      if (!c || c.id === predator.id || c.currentHp <= 0 || c.inCombat) return false;
      return c.behavior === 'passive' && canHunt(predator, c, template.tier);
    });

  for (const prey of preyToFlee) {
    // Prey flees to random adjacent room
    const fleeOptions = getAdjacentLocations(world, locationId);
    if (fleeOptions.length === 0) {
      // Trapped - combat begins
      initiateCreatureCombat(session, predator, prey);
      continue;
    }

    const rng = createRng(`flee-${prey.id}-${Date.now()}`);
    const fleeToId = fleeOptions[Math.floor(rng.next() * fleeOptions.length)]!;

    // Notify player
    if (socket && player.locationId === locationId) {
      sendNotification(socket, {
        text: `The ${prey.name} bolts away in fear!`,
        style: 'normal',
      });
    }

    // Move prey
    moveCreatureInternal(world, prey, locationId, fleeToId);

    // 50% chance predator gives chase
    if (rng.next() < CHASE_CHANCE) {
      moveCreatureInternal(world, predator, locationId, fleeToId);

      if (socket && player.locationId === locationId) {
        sendNotification(socket, {
          text: `The ${predator.name} gives chase!`,
          style: 'combat',
        });
      }
    }
  }
}

/**
 * Internal creature movement without notifications (for chase sequences).
 */
function moveCreatureInternal(
  world: World,
  creature: Creature,
  fromId: string,
  toId: string
): void {
  const fromLocation = world.locations[fromId];
  const toLocation = world.locations[toId];

  if (!fromLocation || !toLocation) return;

  const idx = fromLocation.creatures.indexOf(creature.id);
  if (idx !== -1) fromLocation.creatures.splice(idx, 1);

  toLocation.creatures.push(creature.id);
  creature.locationId = toId;
}

/**
 * Initiate combat between two creatures.
 */
function initiateCreatureCombat(
  session: GameSession,
  attacker: Creature,
  defender: Creature
): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  const distance = getDistanceFromPlayer(world, player.locationId, attacker.locationId);
  const attackerTemplate = CREATURE_TEMPLATES[attacker.templateId];
  const defenderTemplate = CREATURE_TEMPLATES[defender.templateId];

  if (!attackerTemplate || !defenderTemplate) return;

  const levelDiff = Math.abs(attacker.level - defender.level);
  const isEvenlyMatched = levelDiff < EVENLY_MATCHED_THRESHOLD;

  // Determine if defender is in territory
  const defenderInTerritory =
    defender.behavior === 'territorial' &&
    isInTerritory(world, defender, defender.locationId);

  if (distance === 0 && isEvenlyMatched) {
    // Same room, evenly matched - tick-based combat
    attacker.inCombat = true;
    attacker.targetId = defender.id;
    defender.inCombat = true;
    defender.targetId = attacker.id;

    if (socket) {
      sendNotification(socket, {
        text: `The ${attacker.name} attacks the ${defender.name}!`,
        style: 'combat',
      });
    }
    // Combat will resolve in combatTick
  } else {
    // Instant resolution
    const rng = createRng(`combat-${attacker.id}-${defender.id}-${Date.now()}`);
    const { winner, loser } = resolveInstantCombat(
      attacker,
      defender,
      defenderInTerritory,
      rng
    );

    // Kill the loser
    loser.currentHp = 0;
    const loserTemplate = CREATURE_TEMPLATES[loser.templateId];
    handleCreatureDeath(world, loser, 'creature', loserTemplate?.tier ?? 'common');

    // Notify based on distance
    if (socket) {
      if (distance === 0) {
        sendNotification(socket, {
          text: `The ${winner.name} kills the ${loser.name}!`,
          style: 'combat',
        });
      } else if (distance === 1) {
        sendNotification(socket, {
          text: `You hear sounds of a brief struggle nearby.`,
          style: 'normal',
        });
      } else if (distance <= 3) {
        sendNotification(socket, {
          text: `A distant cry echoes through the area.`,
          style: 'normal',
        });
      }
    }
  }
}

/**
 * Initiate combat when an aggressive creature enters a player's location.
 */
function initiateCreatureAggro(
  session: GameSession,
  creature: Creature,
  socket: Socket
): void {
  const { player, combatStats } = session;
  const rng = createRng(`aggro-tick-${Date.now()}`);

  const output: OutputLine[] = [];

  output.push({
    text: `The ${creature.name} snarls and attacks you!`,
    style: 'combat',
  });

  // Mark both as in combat
  player.inCombat = true;
  player.targetId = creature.id;
  creature.inCombat = true;
  creature.targetId = player.id;

  // Creature ambush attack
  const creatureHitChance = 0.8;
  const creatureHits = rng.next() < creatureHitChance;

  if (!creatureHits) {
    output.push({
      text: `The ${creature.name} lunges at you but misses!`,
      style: 'combat',
    });
  } else {
    const minDmg = Math.max(1, creature.level);
    const maxDmg = Math.max(2, creature.level * 2 + 2);
    let damage = minDmg + Math.floor(rng.next() * (maxDmg - minDmg + 1));

    // Apply defense reduction
    const defenseReduction = Math.floor(combatStats.defense / 20);
    damage = Math.max(1, damage - defenseReduction);

    player.currentHp -= damage;

    output.push({
      text: `The ${creature.name} hits you for ${damage} damage!`,
      style: 'combat',
    });

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

  sendNotifications(socket, output);
}
