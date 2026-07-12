/**
 * World restoration - rebuilds game state from saved character data.
 */

import type { Player, ClassName, InventorySlot } from '@solo-mud/shared';
import { getStarterSpellId, xpForLevel } from '@solo-mud/shared';
import { worldManager } from '../world/world-manager';
import { computePlayerCombatStats } from '../character';
import type { CharacterRecord } from '../db/repositories/CharacterRepository';
import type { GameSession } from './session';

/**
 * Restore a game session from a saved character.
 *
 * The character joins the shared authoritative world — we no longer
 * regenerate a private world from the character's stored seed, and we do
 * not rewind the shared world clock to the character's saved gameTime.
 * (Per-character world modifications from the solo-world era are not
 * applied; world state is shared. See docs/design/living-world.md.)
 */
export function restoreSession(
  socketId: string,
  character: CharacterRecord
): GameSession {
  const world = worldManager.getWorld();

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
    inventorySlots: 40,
    keyring: character.keyring ?? [],
    carryWeight: calculateCarryWeight(character.inventory),
    maxCarryWeight: 50 + (character.baseStats.str * 5),
    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],
    // Saved location may come from a pre-shared-world seed; fall back to start
    locationId: world.locations[character.locationId] ? character.locationId : world.startId,
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
    propCooldowns: {}, // Will need to be restored from database when prop persistence is added
  };

  // Note: the shared world clock is authoritative — we intentionally do not
  // restore character.gameTime here.

  const combatStats = computePlayerCombatStats(player, world.items);

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
 * Calculate total carry weight from inventory.
 * InventorySlot doesn't have weight, so we use a default of 1 per slot.
 */
function calculateCarryWeight(inventory: InventorySlot[]): number {
  // Each inventory slot counts as 1 weight unit times quantity
  return inventory.reduce((sum, slot) => sum + slot.quantity, 0);
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
