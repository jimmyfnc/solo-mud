/**
 * Repository for shared-world persistence.
 *
 * The whole mutable World is stored as one JSON snapshot (single row).
 * Saved periodically by the game loop and on shutdown; loaded at startup.
 */

import { getDatabase } from '../database';
import type { World } from '@solo-mud/shared';

/**
 * Save the shared world as a snapshot (upsert, single row).
 */
export function saveWorldSnapshot(world: World): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO world_snapshot (id, seed, data, saved_at)
    VALUES (1, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      seed = excluded.seed,
      data = excluded.data,
      saved_at = excluded.saved_at
  `).run(world.seed, JSON.stringify(world));
}

/**
 * Load the saved world snapshot, or null if none exists or it's unreadable.
 */
export function loadWorldSnapshot(): World | null {
  const db = getDatabase();
  const row = db.prepare(`SELECT data FROM world_snapshot WHERE id = 1`)
    .get() as { data: string } | undefined;

  if (!row) return null;

  try {
    return JSON.parse(row.data) as World;
  } catch (err) {
    console.error('Failed to parse world snapshot, regenerating world:', err);
    return null;
  }
}

/**
 * Delete the saved snapshot (admin reset).
 */
export function deleteWorldSnapshot(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM world_snapshot WHERE id = 1`).run();
}
