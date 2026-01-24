/**
 * SQLite database connection and initialization.
 * Uses better-sqlite3 for synchronous, high-performance SQLite access.
 */

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

  console.log(`Database initialized at ${DB_PATH}`);

  return database;
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
  return crypto.randomUUID();
}

/**
 * Generate a player code like "BRAVE-WOLF-4829".
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

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);

  return `${adj}-${noun}-${num}`;
}
