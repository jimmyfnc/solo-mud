/**
 * Repository for player data (accounts, not characters).
 */

import { getDatabase, generateId, generatePlayerCode } from '../database';

export interface PlayerRecord {
  id: string;
  playerCode: string;
  createdAt: number;
}

/**
 * Create a new player record.
 */
export function createPlayer(): PlayerRecord {
  const db = getDatabase();
  const id = generateId();
  const createdAt = Date.now();
  let playerCode = generatePlayerCode();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const collision = db.prepare(`SELECT 1 FROM players WHERE player_code = ?`).get(playerCode);
    if (!collision) break;
    playerCode = generatePlayerCode();
  }

  db.prepare(`
    INSERT INTO players (id, player_code, created_at)
    VALUES (?, ?, ?)
  `).run(id, playerCode, createdAt);

  return { id, playerCode, createdAt };
}

/**
 * Find a player by ID.
 */
export function findPlayerById(id: string): PlayerRecord | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, player_code as playerCode, created_at as createdAt
    FROM players WHERE id = ?
  `).get(id) as PlayerRecord | undefined;

  return row ?? null;
}

/**
 * Find a player by their player code.
 */
export function findPlayerByCode(playerCode: string): PlayerRecord | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, player_code as playerCode, created_at as createdAt
    FROM players WHERE player_code = ?
  `).get(playerCode.toUpperCase()) as PlayerRecord | undefined;

  return row ?? null;
}

/**
 * Get or create a player by ID.
 * Used when a client connects with a stored UUID.
 */
export function getOrCreatePlayer(playerId: string | null): PlayerRecord {
  if (playerId) {
    const existing = findPlayerById(playerId);
    if (existing) {
      return existing;
    }
  }
  return createPlayer();
}
