/**
 * Repository for world state modifications (visits, unlocks, items, kills).
 */

import type { Item } from '@solo-mud/shared';
import { getDatabase, generateId } from '../database';

// ---------- Visited Locations ----------

export interface VisitedLocation {
  characterId: string;
  locationId: string;
  visitCount: number;
  firstVisit: number;
  lastVisit: number;
}

/**
 * Record a location visit (or update existing).
 */
export function recordVisit(characterId: string, locationId: string): void {
  const db = getDatabase();
  const now = Date.now();

  db.prepare(`
    INSERT INTO visited_locations (character_id, location_id, visit_count, first_visit, last_visit)
    VALUES (?, ?, 1, ?, ?)
    ON CONFLICT(character_id, location_id) DO UPDATE SET
      visit_count = visit_count + 1,
      last_visit = excluded.last_visit
  `).run(characterId, locationId, now, now);
}

/**
 * Get all visited locations for a character.
 */
export function getVisitedLocations(characterId: string): VisitedLocation[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT
      character_id as characterId,
      location_id as locationId,
      visit_count as visitCount,
      first_visit as firstVisit,
      last_visit as lastVisit
    FROM visited_locations WHERE character_id = ?
  `).all(characterId) as VisitedLocation[];
}

/**
 * Get visit data for a specific location.
 */
export function getVisitData(characterId: string, locationId: string): VisitedLocation | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      character_id as characterId,
      location_id as locationId,
      visit_count as visitCount,
      first_visit as firstVisit,
      last_visit as lastVisit
    FROM visited_locations WHERE character_id = ? AND location_id = ?
  `).get(characterId, locationId) as VisitedLocation | undefined;

  return row ?? null;
}

// ---------- Unlocked Exits ----------

export interface UnlockedExit {
  characterId: string;
  exitId: string;
  unlockedAt: number;
}

/**
 * Record an exit being unlocked.
 */
export function recordUnlock(characterId: string, exitId: string): void {
  const db = getDatabase();
  const now = Date.now();

  db.prepare(`
    INSERT OR IGNORE INTO unlocked_exits (character_id, exit_id, unlocked_at)
    VALUES (?, ?, ?)
  `).run(characterId, exitId, now);
}

/**
 * Get all unlocked exits for a character.
 */
export function getUnlockedExits(characterId: string): UnlockedExit[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT
      character_id as characterId,
      exit_id as exitId,
      unlocked_at as unlockedAt
    FROM unlocked_exits WHERE character_id = ?
  `).all(characterId) as UnlockedExit[];
}

/**
 * Check if an exit is unlocked.
 */
export function isExitUnlocked(characterId: string, exitId: string): boolean {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT 1 FROM unlocked_exits WHERE character_id = ? AND exit_id = ?
  `).get(characterId, exitId);

  return !!row;
}

// ---------- Removed Items ----------

export interface RemovedItem {
  characterId: string;
  itemId: string;
  removedAt: number;
}

/**
 * Record an item being picked up (removed from world).
 */
export function recordItemRemoved(characterId: string, itemId: string): void {
  const db = getDatabase();
  const now = Date.now();

  db.prepare(`
    INSERT OR IGNORE INTO removed_items (character_id, item_id, removed_at)
    VALUES (?, ?, ?)
  `).run(characterId, itemId, now);
}

/**
 * Get all removed item IDs for a character.
 */
export function getRemovedItemIds(characterId: string): string[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT item_id FROM removed_items WHERE character_id = ?
  `).all(characterId) as { item_id: string }[];

  return rows.map(r => r.item_id);
}

// ---------- Dropped Items ----------

export interface DroppedItem {
  id: string;
  characterId: string;
  itemData: Item;
  locationId: string;
  droppedAt: number;
}

/**
 * Record an item being dropped by the player.
 */
export function recordItemDropped(characterId: string, item: Item, locationId: string): string {
  const db = getDatabase();
  const id = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO dropped_items (id, character_id, item_data, location_id, dropped_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, characterId, JSON.stringify(item), locationId, now);

  return id;
}

/**
 * Remove a dropped item (when picked back up).
 */
export function removeDroppedItem(droppedItemId: string): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM dropped_items WHERE id = ?`).run(droppedItemId);
}

/**
 * Get all dropped items for a character.
 */
export function getDroppedItems(characterId: string): DroppedItem[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT
      id,
      character_id as characterId,
      item_data as itemData,
      location_id as locationId,
      dropped_at as droppedAt
    FROM dropped_items WHERE character_id = ?
  `).all(characterId) as (Omit<DroppedItem, 'itemData'> & { itemData: string })[];

  return rows.map(row => ({
    ...row,
    itemData: JSON.parse(row.itemData),
  }));
}

/**
 * Get dropped items at a specific location.
 */
export function getDroppedItemsAtLocation(characterId: string, locationId: string): DroppedItem[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT
      id,
      character_id as characterId,
      item_data as itemData,
      location_id as locationId,
      dropped_at as droppedAt
    FROM dropped_items WHERE character_id = ? AND location_id = ?
  `).all(characterId, locationId) as (Omit<DroppedItem, 'itemData'> & { itemData: string })[];

  return rows.map(row => ({
    ...row,
    itemData: JSON.parse(row.itemData),
  }));
}

// ---------- Killed Creatures ----------

export interface KilledCreature {
  characterId: string;
  creatureId: string;
  killedAt: number;
  respawnAt: number | null;
}

/**
 * Record a creature being killed.
 */
export function recordCreatureKilled(
  characterId: string,
  creatureId: string,
  respawnAfterMs: number | null = null
): void {
  const db = getDatabase();
  const now = Date.now();
  const respawnAt = respawnAfterMs ? now + respawnAfterMs : null;

  db.prepare(`
    INSERT OR REPLACE INTO killed_creatures (character_id, creature_id, killed_at, respawn_at)
    VALUES (?, ?, ?, ?)
  `).run(characterId, creatureId, now, respawnAt);
}

/**
 * Get all killed creature IDs that haven't respawned.
 */
export function getKilledCreatureIds(characterId: string): string[] {
  const db = getDatabase();
  const now = Date.now();

  // Return creatures that are dead and either never respawn or haven't respawned yet
  const rows = db.prepare(`
    SELECT creature_id FROM killed_creatures
    WHERE character_id = ?
      AND (respawn_at IS NULL OR respawn_at > ?)
  `).all(characterId, now) as { creature_id: string }[];

  return rows.map(r => r.creature_id);
}

/**
 * Clean up respawned creatures.
 */
export function cleanupRespawnedCreatures(characterId: string): number {
  const db = getDatabase();
  const now = Date.now();

  const result = db.prepare(`
    DELETE FROM killed_creatures
    WHERE character_id = ? AND respawn_at IS NOT NULL AND respawn_at <= ?
  `).run(characterId, now);

  return result.changes;
}
