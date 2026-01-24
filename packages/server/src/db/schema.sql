-- Solo MUD Database Schema
-- SQLite database for character persistence

-- Players table (one per browser/device)
CREATE TABLE IF NOT EXISTS players (
  id            TEXT PRIMARY KEY,
  player_code   TEXT NOT NULL UNIQUE,
  created_at    INTEGER NOT NULL
);

-- Characters table (many per player)
CREATE TABLE IF NOT EXISTS characters (
  id            TEXT PRIMARY KEY,
  player_id     TEXT NOT NULL,
  name          TEXT NOT NULL,
  class         TEXT NOT NULL,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  gold          INTEGER DEFAULT 0,

  base_stats    TEXT NOT NULL,
  current_hp    INTEGER NOT NULL,
  max_hp        INTEGER NOT NULL,
  current_mp    INTEGER NOT NULL,
  max_mp        INTEGER NOT NULL,

  world_seed    TEXT NOT NULL,
  location_id   TEXT NOT NULL,
  game_time     INTEGER NOT NULL,

  equipment     TEXT DEFAULT '{}',
  inventory     TEXT DEFAULT '[]',

  created_at    INTEGER NOT NULL,
  last_played   INTEGER NOT NULL,

  UNIQUE(player_id, name),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Track which locations each character has visited
CREATE TABLE IF NOT EXISTS visited_locations (
  character_id  TEXT NOT NULL,
  location_id   TEXT NOT NULL,
  visit_count   INTEGER DEFAULT 1,
  first_visit   INTEGER NOT NULL,
  last_visit    INTEGER NOT NULL,
  PRIMARY KEY (character_id, location_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Track doors/exits the character has unlocked
CREATE TABLE IF NOT EXISTS unlocked_exits (
  character_id  TEXT NOT NULL,
  exit_id       TEXT NOT NULL,
  unlocked_at   INTEGER NOT NULL,
  PRIMARY KEY (character_id, exit_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Items removed from world (picked up or destroyed)
CREATE TABLE IF NOT EXISTS removed_items (
  character_id  TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  removed_at    INTEGER NOT NULL,
  PRIMARY KEY (character_id, item_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Items dropped by player (added to world)
CREATE TABLE IF NOT EXISTS dropped_items (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL,
  item_data     TEXT NOT NULL,
  location_id   TEXT NOT NULL,
  dropped_at    INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Killed creatures
CREATE TABLE IF NOT EXISTS killed_creatures (
  character_id  TEXT NOT NULL,
  creature_id   TEXT NOT NULL,
  killed_at     INTEGER NOT NULL,
  respawn_at    INTEGER,
  PRIMARY KEY (character_id, creature_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_characters_player_id ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_visited_locations_character ON visited_locations(character_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_exits_character ON unlocked_exits(character_id);
CREATE INDEX IF NOT EXISTS idx_removed_items_character ON removed_items(character_id);
CREATE INDEX IF NOT EXISTS idx_dropped_items_character ON dropped_items(character_id);
CREATE INDEX IF NOT EXISTS idx_dropped_items_location ON dropped_items(location_id);
CREATE INDEX IF NOT EXISTS idx_killed_creatures_character ON killed_creatures(character_id);
