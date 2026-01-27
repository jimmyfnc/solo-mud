/**
 * Repository for character data.
 */

import type { Player, Stats, Equipment, InventorySlot, Item, Currency } from '@solo-mud/shared';
import { getDatabase, generateId } from '../database';

export const MAX_CHARACTERS_PER_PLAYER = 10;

export interface CharacterRecord {
  id: string;
  playerId: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  currency: Currency;
  baseStats: Stats;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  worldSeed: string;
  locationId: string;
  gameTime: number;
  equipment: Equipment;
  inventory: InventorySlot[];
  /** Full Item objects owned by this character (equipment + inventory) */
  ownedItems: Record<string, Item>;
  /** Known spell IDs */
  knownSpells: string[];
  createdAt: number;
  lastPlayed: number;
}

export interface CharacterSummary {
  id: string;
  name: string;
  class: string;
  level: number;
  lastPlayed: number;
}

/**
 * Create a new character for a player.
 */
export function createCharacter(
  playerId: string,
  player: Player,
  worldSeed: string,
  gameTime: number,
  ownedItems: Record<string, Item>
): CharacterRecord {
  const db = getDatabase();

  // Check character limit
  const count = getCharacterCount(playerId);
  if (count >= MAX_CHARACTERS_PER_PLAYER) {
    throw new Error(`Maximum ${MAX_CHARACTERS_PER_PLAYER} characters allowed. Delete one to create another.`);
  }

  // Check for duplicate name
  const existing = findCharacterByName(playerId, player.name);
  if (existing) {
    throw new Error(`You already have a character named "${player.name}".`);
  }

  const id = generateId();
  const now = Date.now();

  db.prepare(`
    INSERT INTO characters (
      id, player_id, name, class, level, xp, copper, silver, gold,
      base_stats, current_hp, max_hp, current_mp, max_mp,
      world_seed, location_id, game_time,
      equipment, inventory, owned_items, known_spells, created_at, last_played
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    playerId,
    player.name,
    player.class,
    player.level,
    player.xp,
    player.currency.copper,
    player.currency.silver,
    player.currency.gold,
    JSON.stringify(player.baseStats),
    player.currentHp,
    player.maxHp,
    player.currentMp,
    player.maxMp,
    worldSeed,
    player.locationId,
    gameTime,
    JSON.stringify(player.equipment),
    JSON.stringify(player.inventory),
    JSON.stringify(ownedItems),
    JSON.stringify(player.spells.known),
    now,
    now
  );

  return {
    id,
    playerId,
    name: player.name,
    class: player.class,
    level: player.level,
    xp: player.xp,
    currency: player.currency,
    baseStats: player.baseStats,
    currentHp: player.currentHp,
    maxHp: player.maxHp,
    currentMp: player.currentMp,
    maxMp: player.maxMp,
    worldSeed,
    locationId: player.locationId,
    gameTime,
    equipment: player.equipment,
    inventory: player.inventory,
    ownedItems,
    knownSpells: player.spells.known,
    createdAt: now,
    lastPlayed: now,
  };
}

/**
 * Get all characters for a player (summary only).
 */
export function getCharactersByPlayerId(playerId: string): CharacterSummary[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, name, class, level, last_played as lastPlayed
    FROM characters
    WHERE player_id = ?
    ORDER BY last_played DESC
  `).all(playerId) as CharacterSummary[];

  return rows;
}

/**
 * Get character count for a player.
 */
export function getCharacterCount(playerId: string): number {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM characters WHERE player_id = ?
  `).get(playerId) as { count: number };

  return row.count;
}

/**
 * Find a character by ID.
 */
export function findCharacterById(characterId: string): CharacterRecord | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      id, player_id as playerId, name, class, level, xp,
      copper, silver, gold,
      base_stats as baseStats, current_hp as currentHp, max_hp as maxHp,
      current_mp as currentMp, max_mp as maxMp,
      world_seed as worldSeed, location_id as locationId, game_time as gameTime,
      equipment, inventory, owned_items as ownedItems, known_spells as knownSpells,
      created_at as createdAt, last_played as lastPlayed
    FROM characters WHERE id = ?
  `).get(characterId) as (Omit<CharacterRecord, 'baseStats' | 'equipment' | 'inventory' | 'ownedItems' | 'knownSpells' | 'currency'> & {
    baseStats: string;
    equipment: string;
    inventory: string;
    ownedItems: string | null;
    knownSpells: string | null;
    copper: number;
    silver: number;
    gold: number;
  }) | undefined;

  if (!row) return null;

  const { copper, silver, gold, ...rest } = row;
  return {
    ...rest,
    currency: { copper, silver, gold },
    baseStats: JSON.parse(row.baseStats),
    equipment: JSON.parse(row.equipment),
    inventory: JSON.parse(row.inventory),
    ownedItems: row.ownedItems ? JSON.parse(row.ownedItems) : {},
    knownSpells: row.knownSpells ? JSON.parse(row.knownSpells) : [],
  };
}

/**
 * Find a character by name for a specific player.
 */
export function findCharacterByName(playerId: string, name: string): CharacterRecord | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      id, player_id as playerId, name, class, level, xp,
      copper, silver, gold,
      base_stats as baseStats, current_hp as currentHp, max_hp as maxHp,
      current_mp as currentMp, max_mp as maxMp,
      world_seed as worldSeed, location_id as locationId, game_time as gameTime,
      equipment, inventory, owned_items as ownedItems, known_spells as knownSpells,
      created_at as createdAt, last_played as lastPlayed
    FROM characters WHERE player_id = ? AND name = ?
  `).get(playerId, name) as (Omit<CharacterRecord, 'baseStats' | 'equipment' | 'inventory' | 'ownedItems' | 'knownSpells' | 'currency'> & {
    baseStats: string;
    equipment: string;
    inventory: string;
    ownedItems: string | null;
    knownSpells: string | null;
    copper: number;
    silver: number;
    gold: number;
  }) | undefined;

  if (!row) return null;

  const { copper, silver, gold, ...rest } = row;
  return {
    ...rest,
    currency: { copper, silver, gold },
    baseStats: JSON.parse(row.baseStats),
    equipment: JSON.parse(row.equipment),
    inventory: JSON.parse(row.inventory),
    ownedItems: row.ownedItems ? JSON.parse(row.ownedItems) : {},
    knownSpells: row.knownSpells ? JSON.parse(row.knownSpells) : [],
  };
}

/**
 * Update a character's state.
 */
export function updateCharacter(
  characterId: string,
  updates: Partial<{
    level: number;
    xp: number;
    currency: Currency;
    currentHp: number;
    maxHp: number;
    currentMp: number;
    maxMp: number;
    locationId: string;
    gameTime: number;
    equipment: Equipment;
    inventory: InventorySlot[];
    ownedItems: Record<string, Item>;
    knownSpells: string[];
  }>
): void {
  const db = getDatabase();
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.level !== undefined) {
    setClauses.push('level = ?');
    values.push(updates.level);
  }
  if (updates.xp !== undefined) {
    setClauses.push('xp = ?');
    values.push(updates.xp);
  }
  if (updates.currency !== undefined) {
    setClauses.push('copper = ?');
    values.push(updates.currency.copper);
    setClauses.push('silver = ?');
    values.push(updates.currency.silver);
    setClauses.push('gold = ?');
    values.push(updates.currency.gold);
  }
  if (updates.currentHp !== undefined) {
    setClauses.push('current_hp = ?');
    values.push(updates.currentHp);
  }
  if (updates.maxHp !== undefined) {
    setClauses.push('max_hp = ?');
    values.push(updates.maxHp);
  }
  if (updates.currentMp !== undefined) {
    setClauses.push('current_mp = ?');
    values.push(updates.currentMp);
  }
  if (updates.maxMp !== undefined) {
    setClauses.push('max_mp = ?');
    values.push(updates.maxMp);
  }
  if (updates.locationId !== undefined) {
    setClauses.push('location_id = ?');
    values.push(updates.locationId);
  }
  if (updates.gameTime !== undefined) {
    setClauses.push('game_time = ?');
    values.push(updates.gameTime);
  }
  if (updates.equipment !== undefined) {
    setClauses.push('equipment = ?');
    values.push(JSON.stringify(updates.equipment));
  }
  if (updates.inventory !== undefined) {
    setClauses.push('inventory = ?');
    values.push(JSON.stringify(updates.inventory));
  }
  if (updates.ownedItems !== undefined) {
    setClauses.push('owned_items = ?');
    values.push(JSON.stringify(updates.ownedItems));
  }
  if (updates.knownSpells !== undefined) {
    setClauses.push('known_spells = ?');
    values.push(JSON.stringify(updates.knownSpells));
  }

  // Always update last_played
  setClauses.push('last_played = ?');
  values.push(Date.now());

  if (setClauses.length === 0) return;

  values.push(characterId);
  db.prepare(`
    UPDATE characters SET ${setClauses.join(', ')} WHERE id = ?
  `).run(...values);
}

/**
 * Delete a character.
 */
export function deleteCharacter(characterId: string, playerId: string): boolean {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM characters WHERE id = ? AND player_id = ?
  `).run(characterId, playerId);

  return result.changes > 0;
}
