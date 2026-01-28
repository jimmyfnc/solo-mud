/**
 * Game loop - handles periodic game updates like creature movement,
 * respawns, and time-based events.
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import type { Creature, NPC, OutputLine, World, Player } from '@solo-mud/shared';
import { createRng, CREATURE_TEMPLATES, CHASE_CHANCE, EVENLY_MATCHED_THRESHOLD, ZONE_ACTIVITY, getWeaponDamage, xpForLevel, CLASSES, type Item, addCopper, formatPrice, getTotalCopper, currencyFromCopper } from '@solo-mud/shared';
import { generateSewerLoot, SEWER_LOOT_TABLES } from '../loot/sewer-loot';
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
import { tickIncursion, createIncursionState } from './incursion';

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

/** Track tick count for incursion timing */
let tickCount = 0;

/**
 * World tick - handles creature movement, respawns, etc.
 */
function worldTick(): void {
  const sessions = sessionManager.getAllSessions();
  tickCount++;

  for (const session of sessions) {
    processCorpses(session);
    processRespawns(session);
    processHunting(session);
    processCreatureMovement(session);
    processIncursions(session, tickCount);
    processRegeneration(session);
    processLightSources(session);
    processContainerRespawns(session);
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
    processCooldowns(session);
    processTrappedCreatures(session);
    processPlayerCombat(session);
    processCreatureVsCreatureCombat(session);
  }
}

/**
 * Process ability cooldowns and GCD for a session.
 * Decrements all active cooldowns by the combat tick interval.
 */
function processCooldowns(session: GameSession): void {
  const { player } = session;
  const deltaMs = COMBAT_TICK_INTERVAL;

  // Decrement GCD
  if (player.globalCooldown > 0) {
    player.globalCooldown = Math.max(0, player.globalCooldown - deltaMs);
  }

  // Decrement ability cooldowns
  for (const spellId of Object.keys(player.abilityCooldowns)) {
    const remaining = player.abilityCooldowns[spellId] ?? 0;
    if (remaining > 0) {
      const newRemaining = Math.max(0, remaining - deltaMs);
      if (newRemaining > 0) {
        player.abilityCooldowns[spellId] = newRemaining;
      } else {
        delete player.abilityCooldowns[spellId];
      }
    }
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
 * Process trapped creatures - DOT damage and break attempts.
 */
function processTrappedCreatures(session: GameSession): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);
  if (!socket) return;

  const now = Date.now();

  // Check all creatures in the world for trapped state
  for (const creature of Object.values(world.creatures)) {
    if (!creature.trapped) continue;

    const trapped = creature.trapped;

    // Check if trap effect has expired
    if (now >= trapped.expiresAt) {
      const output: OutputLine[] = [{
        text: `The ${creature.name} breaks free from the trap!`,
        style: 'combat',
      }];
      creature.trapped = undefined;
      sendNotifications(socket, output);
      continue;
    }

    const output: OutputLine[] = [];

    // Apply DOT damage
    if (now >= trapped.nextDotTick) {
      creature.currentHp -= trapped.dotDamage;
      output.push({
        text: `The trap deals ${trapped.dotDamage} damage to the ${creature.name}! (HP: ${creature.currentHp}/${creature.maxHp})`,
        style: 'combat',
      });
      trapped.nextDotTick = now + 5000; // DOT every 5 seconds

      // Check if creature died
      if (creature.currentHp <= 0) {
        output.push({
          text: `The ${creature.name} dies from trap damage!`,
          style: 'success',
        });
        creature.trapped = undefined;

        // Grant XP to player
        const xpGain = creature.level * 15;
        player.xp += xpGain;
        output.push({ text: `You gain ${xpGain} XP.`, style: 'success' });

        // Check for level up
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

        // Handle creature death
        const template = CREATURE_TEMPLATES[creature.templateId];
        const tier = template?.tier ?? 'common';
        handleCreatureDeath(world, creature, 'player', tier, []);

        // Exit combat if this was target
        if (player.targetId === creature.id) {
          player.inCombat = false;
          player.autoAttack = false;
          player.targetId = undefined;
        }

        sendNotifications(socket, output);
        continue;
      }
    }

    // Attempt to break free
    if (now >= trapped.nextBreakAttempt) {
      const levelDiff = creature.level - trapped.rangerLevel;

      // Base 10% break chance, +10% per level above ranger
      let breakChance = 0.10 + Math.max(0, levelDiff * 0.10);
      breakChance = Math.min(breakChance, 0.50); // Cap at 50%

      if (Math.random() < breakChance) {
        output.push({
          text: `The ${creature.name} strains and breaks free from the trap!`,
          style: 'combat',
        });
        creature.trapped = undefined;
      } else {
        output.push({
          text: `The ${creature.name} struggles against the trap but cannot escape.`,
          style: 'normal',
        });
        // More frequent attempts for higher level creatures
        const nextAttemptDelay = levelDiff >= 2 ? 5000 : 10000;
        trapped.nextBreakAttempt = now + nextAttemptDelay;
      }
    }

    if (output.length > 0) {
      sendNotifications(socket, output);
    }
  }
}

/**
 * Process player combat for a session.
 * Both player and creatures auto-attack each other.
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
    player.autoAttack = false;
    player.targetId = undefined;
    return;
  }

  const rng = createRng(`combat-tick-${Date.now()}`);
  const output: OutputLine[] = [];

  // === PLAYER AUTO-ATTACK ===
  if (player.autoAttack && creature.currentHp > 0) {
    // Get player's weapon
    const weaponId = player.equipment.weapon;
    const weapon = weaponId ? world.items[weaponId] : undefined;
    const weaponName = weapon?.name ?? 'bare hands';

    // Calculate player damage
    const weaponDamage = weapon ? getWeaponDamage(weapon) : { min: 1, max: 2 };

    // Roll to hit (85% base + DEX bonus)
    const hitChance = 0.85 + (combatStats.hitChance / 100) * 0.15;
    const playerHits = rng.next() < hitChance;

    if (!playerHits) {
      output.push({
        text: `You swing your ${weaponName} at the ${creature.name} but miss!`,
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
      creature.currentHp -= damage;

      if (isCrit) {
        output.push({
          text: `CRITICAL! You hit the ${creature.name} for ${damage} damage!`,
          style: 'combat',
        });
      } else {
        output.push({
          text: `You hit the ${creature.name} for ${damage} damage.`,
          style: 'combat',
        });
      }

      // Check if creature died
      if (creature.currentHp <= 0) {
        output.push({
          text: `The ${creature.name} collapses and dies!`,
          style: 'success',
        });

        // Get template for tier and XP
        const template = CREATURE_TEMPLATES[creature.templateId];
        const tier = template?.tier ?? 'common';

        // Generate loot
        let lootItems: Item[] = [];
        if (SEWER_LOOT_TABLES[creature.templateId]) {
          lootItems = generateSewerLoot(creature.templateId, creature.level, rng);
        }

        // Add loot to world
        const loot: string[] = [];
        for (const item of lootItems) {
          world.items[item.id] = item;
          loot.push(item.id);
        }

        // Handle creature death
        handleCreatureDeath(world, creature, 'player', tier, loot);

        // Calculate XP reward
        const tierMultiplier = tier === 'apex' ? 3.0 : tier === 'dangerous' ? 2.0 : tier === 'common' ? 1.5 : 1.0;
        const behaviorMultiplier = creature.behavior === 'aggressive' ? 1.2 :
                                    creature.behavior === 'territorial' ? 1.1 : 0.5;
        const baseXp = creature.level * 10;
        const xpReward = Math.floor(baseXp * tierMultiplier * behaviorMultiplier);

        // Copper reward (no coins from passive creatures)
        const copperReward = creature.behavior === 'passive' ? 0 : Math.floor(creature.level * (2 + rng.next() * 3));

        player.xp += xpReward;
        if (copperReward > 0) {
          player.currency = addCopper(player.currency, copperReward);
        }

        output.push({
          text: `You gain ${xpReward} XP${copperReward > 0 ? ` and ${formatPrice(copperReward)}` : ''}.`,
          style: 'success',
        });

        // Check for level up (can level multiple times if XP is high)
        while (player.xp >= player.xpToNextLevel) {
          player.level++;
          player.xpToNextLevel = xpForLevel(player.level + 1);

          // Get class definition for stat increases
          const classDef = CLASSES[player.class];
          const hpGain = classDef.hpPerLevel;
          const mpGain = classDef.mpPerLevel;

          // Increase max HP/MP
          player.maxHp += hpGain;
          player.maxMp += mpGain;

          // Heal to full on level up (reward!)
          player.currentHp = player.maxHp;
          player.currentMp = player.maxMp;

          // Calculate carry weight increase
          player.maxCarryWeight = 50 + (player.baseStats.str * 5);

          output.push({ text: '', style: 'normal' });
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
        }

        output.push({
          text: `Use "loot ${creature.name.toLowerCase()}" to check the corpse.`,
          style: 'system',
        });

        // End combat
        player.inCombat = false;
        player.autoAttack = false;
        player.targetId = undefined;

        sendNotifications(socket, output);
        sendPlayerUpdate(socket, session); // Immediate UI update for XP/level changes
        return;
      } else {
        // Show creature HP
        const creatureHpPercent = Math.floor((creature.currentHp / creature.maxHp) * 100);
        output.push({
          text: `${creature.name}: ${creature.currentHp}/${creature.maxHp} HP (${creatureHpPercent}%)`,
          style: 'system',
        });
      }
    }
  }

  // === CREATURE ATTACKS PLAYER ===
  // Passive creatures don't attack - they just wait to die
  if (creature.behavior !== 'passive' && creature.currentHp > 0) {
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
        // Handle player death and respawn
        const deathOutput = handlePlayerDeath(session);
        output.push(...deathOutput);

        // Clear creature's combat state too
        creature.inCombat = false;
        creature.targetId = undefined;
      }
    }
  }

  sendNotifications(socket, output);
  sendPlayerUpdate(socket, session);
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

  // Get all roaming creatures (trapped creatures can't move)
  const roamingCreatures = Object.values(world.creatures).filter(
    (c) => c.mobility === 'roaming' && c.currentHp > 0 && !c.inCombat && !c.trapped
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
 * Send player update to refresh HP/MP bars on client.
 */
function sendPlayerUpdate(socket: Socket, session: GameSession): void {
  socket.emit('player_update', {
    type: 'player_update',
    player: session.player,
    combatStats: session.combatStats,
  });
}

/**
 * Process HP and MP regeneration for a session.
 * HP regeneration is based on CON stat and only occurs out of combat.
 * MP regeneration is based on WIS stat and occurs always (slower in combat).
 */
function processRegeneration(session: GameSession): void {
  const { player, world } = session;
  const socket = getSocketForSession(session);

  // Don't regenerate if already at full
  if (player.currentHp >= player.maxHp && player.currentMp >= player.maxMp) {
    return;
  }

  // Base regeneration values (per tick = 30 seconds)
  // Formula: base + (stat / 10), capped at reasonable values
  // At level 1 with 10 CON: 1 + 1 = 2 HP per tick
  // At level 10 with 20 CON: 1 + 2 = 3 HP per tick

  // HP Regeneration (only out of combat)
  let hpRegen = 0;
  if (!player.inCombat && player.currentHp < player.maxHp) {
    const baseHpRegen = 1;
    const conBonus = Math.floor(player.baseStats.con / 10);
    hpRegen = baseHpRegen + conBonus;

    // Safe zone bonus: double regeneration
    const location = world.locations[player.locationId];
    if (location?.isSafeZone) {
      hpRegen *= 2;
    }

    // Cap regeneration to not exceed max
    hpRegen = Math.min(hpRegen, player.maxHp - player.currentHp);
    player.currentHp += hpRegen;
  }

  // MP Regeneration (always, but slower in combat)
  let mpRegen = 0;
  if (player.currentMp < player.maxMp) {
    const baseMpRegen = 2;
    const wisBonus = Math.floor(player.baseStats.wis / 8);
    mpRegen = baseMpRegen + wisBonus;

    // Combat penalty: half regeneration
    if (player.inCombat) {
      mpRegen = Math.floor(mpRegen / 2);
    }

    // Safe zone bonus: 50% extra
    const location = world.locations[player.locationId];
    if (location?.isSafeZone) {
      mpRegen = Math.floor(mpRegen * 1.5);
    }

    // Cap regeneration to not exceed max
    mpRegen = Math.min(mpRegen, player.maxMp - player.currentMp);
    player.currentMp += mpRegen;
  }

  // Notify player if significant regeneration occurred
  if (socket && (hpRegen > 0 || mpRegen > 0)) {
    const parts: string[] = [];
    if (hpRegen > 0) parts.push(`+${hpRegen} HP`);
    if (mpRegen > 0) parts.push(`+${mpRegen} MP`);

    // Only show message if not at full to avoid spam when nearly topped off
    if (player.currentHp < player.maxHp || player.currentMp < player.maxMp) {
      sendNotification(socket, {
        text: `You recover ${parts.join(', ')}. (${player.currentHp}/${player.maxHp} HP, ${player.currentMp}/${player.maxMp} MP)`,
        style: 'system',
      });
    }

    // Update HP/MP bars on client
    sendPlayerUpdate(socket, session);
  }
}

/**
 * Process light source expiration for a session.
 */
function processLightSources(session: GameSession): void {
  const { player, world } = session;

  if (!player.lightSource) return;

  // Check if light source has expired
  if (world.time.totalMinutes >= player.lightSource.expiresAt) {
    const socket = getSocketForSession(session);
    const lightName = player.lightSource.name;
    player.lightSource = undefined;

    if (socket) {
      sendNotification(socket, {
        text: `Your ${lightName} sputters and goes out. Darkness closes in around you.`,
        style: 'combat',
      });

      // If in a dark location, remind them
      const location = world.locations[player.locationId];
      if (location?.isDark) {
        sendNotification(socket, {
          text: 'You are plunged into darkness. Use another light source to see.',
          style: 'system',
        });
      }
    }
  }
}

/**
 * Process container respawns for a session.
 */
function processContainerRespawns(session: GameSession): void {
  const { world } = session;

  if (!world.containers) return;

  const currentTime = world.time.totalMinutes;

  for (const container of Object.values(world.containers)) {
    // Skip containers that don't respawn
    if (!container.respawns || !container.respawnTime) continue;

    // Skip containers that haven't been looted from
    if (container.lastOpened === undefined) continue;

    // Check if enough time has passed for respawn
    const timeSinceOpened = currentTime - container.lastOpened;
    if (timeSinceOpened >= container.respawnTime) {
      // Restore original contents if we have them
      if (container.originalContents) {
        container.contents = [...container.originalContents];
      }

      // Reset state
      container.opened = false;
      container.lastOpened = undefined;
    }
  }
}

/** Default respawn location if no temple exists */
const DEFAULT_RESPAWN_LOCATION = 'town_temple';
const FALLBACK_RESPAWN_LOCATION = 'town_inn';

/** Gold penalty percentage on death */
const DEATH_GOLD_PENALTY = 0.1; // Lose 10% of gold

/**
 * Handle player death - respawn at temple with penalties.
 * Returns output lines to send to the player.
 */
export function handlePlayerDeath(session: GameSession): OutputLine[] {
  const { world, player } = session;
  const output: OutputLine[] = [];

  // Find respawn location (temple or fallback to inn)
  let respawnLocationId = DEFAULT_RESPAWN_LOCATION;
  if (!world.locations[respawnLocationId]) {
    respawnLocationId = FALLBACK_RESPAWN_LOCATION;
  }
  if (!world.locations[respawnLocationId]) {
    // Fallback to start location if neither exists
    respawnLocationId = world.startId;
  }

  const respawnLocation = world.locations[respawnLocationId];
  const respawnName = respawnLocation?.name ?? 'the temple';

  // Calculate currency penalty (percentage of total wealth)
  const totalCopper = getTotalCopper(player.currency);
  const copperLost = Math.floor(totalCopper * DEATH_GOLD_PENALTY);
  if (copperLost > 0) {
    const remainingCopper = totalCopper - copperLost;
    player.currency = currencyFromCopper(Math.max(0, remainingCopper));
  }

  // Death message
  output.push({ text: '', style: 'normal' });
  output.push({ text: '═══════════════════════════════════════════════════════', style: 'error' });
  output.push({ text: '                    YOU HAVE DIED', style: 'error' });
  output.push({ text: '═══════════════════════════════════════════════════════', style: 'error' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: 'Your vision fades to darkness...', style: 'normal' });
  output.push({ text: '', style: 'normal' });

  // Clear combat state
  player.inCombat = false;
  player.targetId = undefined;

  // Clear any creatures targeting this player
  for (const creature of Object.values(world.creatures)) {
    if (creature.targetId === player.id) {
      creature.inCombat = false;
      creature.targetId = undefined;
    }
  }

  // Move player to respawn location
  player.locationId = respawnLocationId;

  // Remove player from old location's creature list (if tracked)
  // (Players aren't in creature lists, but clear any combat associations)

  // Restore HP to full
  player.currentHp = player.maxHp;

  // Restore MP to full
  if (player.maxMp) {
    player.currentMp = player.maxMp;
  }

  // Respawn message
  output.push({ text: '...and slowly returns.', style: 'normal' });
  output.push({ text: '', style: 'normal' });
  output.push({ text: `You awaken in ${respawnName}.`, style: 'success' });
  output.push({ text: 'The Light has restored your body.', style: 'success' });

  if (copperLost > 0) {
    output.push({ text: `You lost ${formatPrice(copperLost)} as an offering to the spirits.`, style: 'system' });
  }

  output.push({ text: '', style: 'normal' });
  output.push({ text: `HP restored to ${player.currentHp}/${player.maxHp}`, style: 'success' });

  return output;
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

  // Find prey that should flee (trapped creatures cannot flee)
  const preyToFlee = location.creatures
    .map((id) => world.creatures[id])
    .filter((c): c is Creature => {
      if (!c || c.id === predator.id || c.currentHp <= 0 || c.inCombat || c.trapped) return false;
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
 * Trigger a ranger's trap if one is present in the creature's location.
 * Returns trap result with output lines and whether creature was killed.
 */
function triggerTrapIfPresent(
  player: Player,
  creature: Creature,
  rng: { next: () => number }
): { output: OutputLine[]; creatureKilled: boolean } | null {
  // Check if player has a trap in this location
  if (!player.placedTrap || player.placedTrap.locationId !== creature.locationId) {
    return null;
  }

  // Check if trap hasn't expired
  const now = Date.now();
  if (now > player.placedTrap.expiresAt) {
    player.placedTrap = undefined;
    return null;
  }

  const trap = player.placedTrap;
  const output: OutputLine[] = [];

  // Calculate effectiveness based on creature level vs ranger level
  const levelDiff = creature.level - trap.rangerLevel;

  // Size/level effectiveness:
  // - Creature 5+ levels higher: trap destroyed, no effect
  // - Creature 3-4 levels higher: 50% chance trap fails, reduced root if it works
  // - Creature 1-2 levels higher: reduced root duration, creature breaks faster
  // - Creature at or below ranger level: full effect

  if (levelDiff >= 5) {
    // Trap destroyed - creature too powerful
    output.push({
      text: `The ${creature.name} is too powerful - it destroys your trap instantly!`,
      style: 'error',
    });
    player.placedTrap = undefined;
    return { output, creatureKilled: false };
  }

  if (levelDiff >= 3) {
    // 50% chance trap fails entirely
    if (rng.next() < 0.5) {
      output.push({
        text: `The ${creature.name} spots your trap and avoids it!`,
        style: 'error',
      });
      player.placedTrap = undefined;
      return { output, creatureKilled: false };
    }
  }

  // Trap triggers! Calculate modified values
  let effectiveDamage = trap.damage;
  let effectiveRootDuration = trap.rootDuration;

  if (levelDiff > 0) {
    // Reduce effectiveness for higher level creatures
    const reduction = levelDiff * 0.15; // 15% per level above
    effectiveDamage = Math.floor(effectiveDamage * (1 - reduction));
    effectiveRootDuration = Math.floor(effectiveRootDuration * (1 - reduction));
  }

  // Apply initial damage
  creature.currentHp -= effectiveDamage;
  output.push({
    text: `★ Your trap springs! The ${creature.name} takes ${effectiveDamage} damage!`,
    style: 'success',
  });

  // Remove the trap (it's triggered)
  player.placedTrap = undefined;

  // Check if creature died
  if (creature.currentHp <= 0) {
    output.push({
      text: `The ${creature.name} dies instantly in your trap!`,
      style: 'success',
    });
    // Note: XP and death handling should be done by caller
    return { output, creatureKilled: true };
  }

  // Apply root effect
  const rootDurationMs = effectiveRootDuration * 1000;
  const breakAttemptInterval = levelDiff >= 2 ? 5000 : 10000; // Faster breaks for higher level

  creature.trapped = {
    expiresAt: now + rootDurationMs,
    trappedByPlayerId: player.id,
    dotDamage: trap.dotDamage,
    nextDotTick: now + 5000, // DOT every 5 seconds
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

  // Mark both as in combat with auto-attack enabled
  player.inCombat = true;
  player.autoAttack = true;
  player.targetId = creature.id;
  creature.inCombat = true;
  creature.targetId = player.id;

  // Check for ranger trap triggering
  const trapResult = triggerTrapIfPresent(player, creature, rng);
  if (trapResult) {
    output.push(...trapResult.output);
    if (trapResult.creatureKilled) {
      // Creature died to trap, end combat
      player.inCombat = false;
      player.autoAttack = false;
      player.targetId = undefined;
      sendNotifications(socket, output);
      return;
    }
  }

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
      // Handle player death and respawn
      const deathOutput = handlePlayerDeath(session);
      output.push(...deathOutput);
    }
  }

  sendNotifications(socket, output);
}

/**
 * Process town incursions - creatures attacking near the town gate.
 */
function processIncursions(session: GameSession, currentTick: number): void {
  const { world, player } = session;
  const socket = getSocketForSession(session);

  // Initialize incursion state if missing
  if (!session.incursionState) {
    session.incursionState = createIncursionState();
  }

  // Process incursion tick
  const events = tickIncursion(
    world,
    session.incursionState,
    currentTick,
    session.worldSeed ?? 'default'
  );

  // Send events to player if they're in town or nearby
  if (socket && events.length > 0) {
    const playerLocation = player.locationId;
    const isInTown = playerLocation.startsWith('town_');
    const isNearGate = playerLocation === 'town_gate' || playerLocation === 'town_square';

    for (const event of events) {
      // Only send messages if player is in town
      if (isInTown) {
        // Send all messages for gate events, or just alerts for others
        if (isNearGate || event.type === 'guard_attack' || event.type === 'creature_death') {
          sendNotifications(socket, event.messages);
        } else {
          // Distant alert for incursion events player isn't near
          sendNotification(socket, {
            text: 'You hear shouts from the town gate!',
            style: 'combat',
          });
        }
      }
    }
  }
}
