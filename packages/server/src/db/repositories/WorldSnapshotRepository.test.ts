/**
 * Tests for shared-world snapshot persistence.
 *
 * Uses a temp database file: SOLO_MUD_DB_PATH must be set before the
 * database module is evaluated, hence the dynamic imports.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const tmpDir = mkdtempSync(join(tmpdir(), 'solo-mud-snapshot-test-'));
process.env['SOLO_MUD_DB_PATH'] = join(tmpDir, 'test.db');

const { saveWorldSnapshot, loadWorldSnapshot, deleteWorldSnapshot } =
  await import('./WorldSnapshotRepository');
const { closeDatabase } = await import('../database');
const { generateWorld } = await import('../../world/generate');

afterAll(() => {
  closeDatabase();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('WorldSnapshotRepository', () => {
  it('should round-trip a world through save/load', () => {
    const world = generateWorld({ seed: 'snapshot-test', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });

    // Mutate some state that must survive the round trip
    world.time.totalMinutes = 1234;
    world.time.day = 2;
    const firstCreatureId = Object.keys(world.creatures)[0];
    if (firstCreatureId) {
      world.creatures[firstCreatureId]!.currentHp = 1;
    }

    saveWorldSnapshot(world);
    const loaded = loadWorldSnapshot();

    expect(loaded).not.toBeNull();
    expect(loaded!.seed).toBe('snapshot-test');
    expect(loaded!.time.totalMinutes).toBe(1234);
    expect(loaded!.time.day).toBe(2);
    expect(Object.keys(loaded!.locations).length).toBe(Object.keys(world.locations).length);
    if (firstCreatureId) {
      expect(loaded!.creatures[firstCreatureId]!.currentHp).toBe(1);
    }
  });

  it('should overwrite the previous snapshot (single row)', () => {
    const world = generateWorld({ seed: 'snapshot-test-2', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });
    saveWorldSnapshot(world);

    const loaded = loadWorldSnapshot();
    expect(loaded!.seed).toBe('snapshot-test-2');
  });

  it('should return null after deletion', () => {
    deleteWorldSnapshot();
    expect(loadWorldSnapshot()).toBeNull();
  });
});
