/**
 * SQLite database connection and initialization.
 * Uses better-sqlite3 for synchronous, high-performance SQLite access.
 */

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes, randomInt, randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database file location - configurable via environment variable
const DB_PATH = process.env['SOLO_MUD_DB_PATH'] ?? join(__dirname, '../../data/solo-mud.db');

let db: Database.Database | null = null;

/**
 * Get the database instance, initializing if needed.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

/**
 * Initialize the database connection and schema.
 */
function initializeDatabase(): Database.Database {
  // Ensure data directory exists
  const dataDir = dirname(DB_PATH);
  mkdirSync(dataDir, { recursive: true });

  // Create database connection
  const database = new Database(DB_PATH);

  // Enable foreign keys
  database.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrent access
  database.pragma('journal_mode = WAL');

  // Run schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  database.exec(schema);

  // Run migrations for existing databases
  runMigrations(database);

  console.log(`Database initialized at ${DB_PATH}`);

  return database;
}

/**
 * Run migrations for existing databases.
 * Adds new columns that weren't in the original schema.
 */
function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check which columns exist in characters table
  const columns = database.prepare(`PRAGMA table_info(characters)`).all() as { name: string }[];
  const columnNames = new Set(columns.map(col => col.name));

  // Migration: Add owned_items column
  if (!columnNames.has('owned_items')) {
    database.exec(`ALTER TABLE characters ADD COLUMN owned_items TEXT DEFAULT '{}'`);
    console.log('Migration: Added owned_items column to characters table');
  }

  // Migration: Add copper and silver columns for multi-tier currency
  if (!columnNames.has('copper')) {
    database.exec(`ALTER TABLE characters ADD COLUMN copper INTEGER DEFAULT 0`);
    // Migrate existing gold to copper (economy reset: gold becomes copper)
    database.exec(`UPDATE characters SET copper = gold WHERE copper = 0 AND gold > 0`);
    console.log('Migration: Added copper column and migrated gold → copper');
  }

  if (!columnNames.has('silver')) {
    database.exec(`ALTER TABLE characters ADD COLUMN silver INTEGER DEFAULT 0`);
    console.log('Migration: Added silver column to characters table');
  }

  // Migration: Add known_spells column for spell system
  if (!columnNames.has('known_spells')) {
    database.exec(`ALTER TABLE characters ADD COLUMN known_spells TEXT DEFAULT '[]'`);
    console.log('Migration: Added known_spells column to characters table');
  }

  // Migration: Add keyring column for key storage
  if (!columnNames.has('keyring')) {
    database.exec(`ALTER TABLE characters ADD COLUMN keyring TEXT DEFAULT '[]'`);
    console.log('Migration: Added keyring column to characters table');
  }

  // Migration: Create bank_storage table
  const tables = database.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='bank_storage'`).all();
  if (tables.length === 0) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS bank_storage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT NOT NULL,
        character_id TEXT,
        slot INTEGER NOT NULL,
        item_data TEXT NOT NULL,
        tab TEXT NOT NULL DEFAULT 'personal',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, character_id, slot, tab)
      );
      CREATE INDEX IF NOT EXISTS idx_bank_account ON bank_storage(account_id);
      CREATE INDEX IF NOT EXISTS idx_bank_character ON bank_storage(character_id);
    `);
    console.log('Migration: Created bank_storage table');
  }

  // Migration: Create world_snapshot table (shared-world persistence)
  const snapshotTables = database.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='world_snapshot'`).all();
  if (snapshotTables.length === 0) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS world_snapshot (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        seed TEXT NOT NULL,
        data TEXT NOT NULL,
        saved_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migration: Created world_snapshot table');
  }

  database.prepare(`
    INSERT OR IGNORE INTO schema_migrations (id) VALUES (?)
  `).run('001_sqlite_baseline');
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Generate a unique ID (UUID v4 style).
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Generate a player recovery code like "BRAVE-WOLF-A1B2C3D4".
 */
export function generatePlayerCode(): string {
  const adjectives = [
    'BRAVE', 'SWIFT', 'DARK', 'WILD', 'IRON', 'GOLD', 'STORM', 'FROST',
    'FIRE', 'SHADOW', 'NOBLE', 'SILENT', 'BOLD', 'KEEN', 'TRUE', 'WISE'
  ];
  const nouns = [
    'WOLF', 'HAWK', 'BEAR', 'LION', 'RAVEN', 'DRAGON', 'KNIGHT', 'SAGE',
    'HERO', 'BLADE', 'SHIELD', 'CROWN', 'FLAME', 'STORM', 'STAR', 'MOON'
  ];

  const adj = adjectives[randomInt(adjectives.length)]!;
  const noun = nouns[randomInt(nouns.length)]!;
  const suffix = randomBytes(4).toString('hex').toUpperCase();

  return `${adj}-${noun}-${suffix}`;
}
