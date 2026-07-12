import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { getDatabase } from './database';

const PORTABLE_TABLES = [
  'players',
  'characters',
  'visited_locations',
  'unlocked_exits',
  'removed_items',
  'dropped_items',
  'killed_creatures',
  'bank_storage',
  'world_snapshot',
] as const;

export interface PortableDatabaseBackup {
  format: 'solo-mud-portable-backup';
  version: 1;
  exportedAt: string;
  tables: Record<(typeof PORTABLE_TABLES)[number], Record<string, unknown>[]>;
}

export function createPortableBackup(): PortableDatabaseBackup {
  const database = getDatabase();
  const tables = Object.fromEntries(
    PORTABLE_TABLES.map(table => [table, database.prepare(`SELECT * FROM ${table}`).all()])
  ) as PortableDatabaseBackup['tables'];

  return {
    format: 'solo-mud-portable-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function writePortableBackup(destination: string): string {
  const outputPath = resolve(destination);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(createPortableBackup(), null, 2)}\n`, 'utf8');
  return outputPath;
}
