/**
 * World restoration - rebuilds game state from saved character data.
 */

import type { Player, World, ClassName, InventorySlot } from '@solo-mud/shared';
import { getStarterSpellId } from '@solo-mud/shared';
import { generateWorld } from '../world/generate';
import { calculateCombatStats } from '../character';
import type { CharacterRecord } from '../db/repositories/CharacterRepository';
import {
  getVisitedLocations,
  getUnlockedExits,
  getRemovedItemIds,
  getDroppedItems,
  cleanupRespawnedCreatures,
} from '../db/repositories/WorldStateRepository';
import type { GameSession } from './session';

/**
 * Restore a game session from a saved character.
 */
export function restoreSession(
  socketId: string,
  character: CharacterRecord
): GameSession {
  // Regenerate the world from the stored seed
  const world = generateWorld({
    seed: character.worldSeed,
    nodeCount: 18,
    extraEdges: 5,
    lockedEdges: 2,
  });

  // Apply world modifications
  applyWorldModifications(world, character.id);

  // Restore player-owned items to the world
  for (const [itemId, item] of Object.entries(character.ownedItems)) {
    world.items[itemId] = item;
  }

  // Rebuild the player object
  const player: Player = {
    id: socketId,
    name: character.name,
    class: character.class as ClassName,
    level: character.level,
    xp: character.xp,
    xpToNextLevel: xpForLevel(character.level + 1),
    baseStats: character.baseStats,
    currentHp: character.currentHp,
    maxHp: character.maxHp,
    currentMp: character.currentMp,
    maxMp: character.maxMp,
    talentPointsAvailable: 0,
    equipment: character.equipment,
    inventory: character.inventory,
    inventorySlots: 20,
    carryWeight: calculateCarryWeight(character.inventory),
    maxCarryWeight: 50 + (character.baseStats.str * 5),
    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],
    locationId: character.locationId,
    boundTownId: world.startId,
    inCombat: false,
    autoAttack: false,
    targetId: undefined,
    globalCooldown: 0,
    abilityCooldowns: {},
    currency: character.currency,
    corpseLocationId: undefined,
    corpseItems: undefined,
    tutorial: {
      skipped: false,
      complete: true,
      completedSteps: ['talk_mira', 'class_training', 'hit_dummy', 'visit_shop', 'leave_town'],
    },
    statusEffects: [],
    questFlags: [], // Will need to be restored from database when quest persistence is added
    spells: {
      known: restoreKnownSpells(character.knownSpells, character.class),
      slots: [null, null, null, null],
    },
  };

  // Restore game time
  world.time.totalMinutes = character.gameTime;
  updateTimeOfDay(world);

  const combatStats = calculateCombatStats(player.baseStats);

  return {
    id: socketId,
    playerId: socketId,
    player,
    combatStats,
    world,
    createdAt: character.createdAt,
    lastActivity: Date.now(),
    characterId: character.id,
  };
}

/**
 * Apply saved world modifications to a regenerated world.
 */
function applyWorldModifications(world: World, characterId: string): void {
  // Clean up respawned creatures first
  cleanupRespawnedCreatures(characterId);

  // Apply visit counts to locations
  const visits = getVisitedLocations(characterId);
  for (const visit of visits) {
    const location = world.locations[visit.locationId];
    if (location) {
      location.visitState.visitCount = visit.visitCount;
      location.visitState.firstVisitTime = visit.firstVisit;
      location.visitState.lastVisitTime = visit.lastVisit;
    }
  }

  // Unlock exits (change from 'locked' to 'open')
  const unlocks = getUnlockedExits(characterId);
  for (const unlock of unlocks) {
    const exit = world.exits[unlock.exitId];
    if (exit && exit.type === 'locked') {
      exit.type = 'open';
    }
  }

  // Remove picked-up items from locations
  const removedItemIds = new Set(getRemovedItemIds(characterId));
  for (const location of Object.values(world.locations)) {
    location.items = location.items.filter(id => !removedItemIds.has(id));
  }
  for (const itemId of removedItemIds) {
    delete world.items[itemId];
  }

  // Add dropped items to locations
  const droppedItems = getDroppedItems(characterId);
  for (const dropped of droppedItems) {
    const location = world.locations[dropped.locationId];
    if (location) {
      const itemId = dropped.itemData.id;
      world.items[itemId] = dropped.itemData;
      if (!location.items.includes(itemId)) {
        location.items.push(itemId);
      }
    }
  }

  // Note: Killed creatures will be applied when creature system is implemented
}

/**
 * Calculate XP required for a level.
 */
function xpForLevel(level: number): number {
  // Simple exponential curve: 100, 200, 400, 800, etc.
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate total carry weight from inventory.
 * InventorySlot doesn't have weight, so we use a default of 1 per slot.
 */
function calculateCarryWeight(inventory: InventorySlot[]): number {
  // Each inventory slot counts as 1 weight unit times quantity
  return inventory.reduce((sum, slot) => sum + slot.quantity, 0);
}

/**
 * Update time of day based on total game minutes.
 */
function updateTimeOfDay(world: World): void {
  const hour = Math.floor(world.time.totalMinutes % (24 * 60) / 60);

  if (hour >= 5 && hour < 7) {
    world.time.timeOfDay = 'dawn';
  } else if (hour >= 7 && hour < 12) {
    world.time.timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 14) {
    world.time.timeOfDay = 'noon';
  } else if (hour >= 14 && hour < 18) {
    world.time.timeOfDay = 'afternoon';
  } else if (hour >= 18 && hour < 21) {
    world.time.timeOfDay = 'evening';
  } else {
    world.time.timeOfDay = 'night';
  }
}

/**
 * Restore known spells from database, granting starter spell if missing.
 */
function restoreKnownSpells(savedSpells: string[], className: string): string[] {
  const knownSpells = [...savedSpells];

  // Ensure starter spell is known (in case character was created before spell persistence)
  const starterSpell = getStarterSpellId(className);
  if (starterSpell && !knownSpells.includes(starterSpell)) {
    knownSpells.unshift(starterSpell);
  }

  return knownSpells;
}
