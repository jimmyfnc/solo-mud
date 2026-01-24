# Character Persistence Design

## Overview

Add character saving/loading so players can resume their game across sessions. Uses SQLite for storage with a clean repository pattern that allows swapping to PostgreSQL/MongoDB later if needed.

## Player Identification

### Hybrid Approach: Browser UUID + Player Code

**Primary:** Browser localStorage stores a UUID (auto-generated on first visit)
**Backup:** Player code (e.g., "HERO-SUNSET-4829") for cross-device access

```
First visit → Generate UUID + Player Code → Store UUID in localStorage
Return visit → Read UUID → Fetch that player's characters
New device → Enter player code → Link to existing player
```

### Why This Approach
- Zero friction for casual play (automatic UUID)
- Player code available for device switching
- No passwords to manage
- Can layer proper auth on top later for hosted servers

---

## Database Schema

### Players Table
```sql
CREATE TABLE players (
  id            TEXT PRIMARY KEY,     -- UUID (stored in localStorage)
  player_code   TEXT NOT NULL UNIQUE, -- "HERO-SUNSET-4829"
  created_at    INTEGER NOT NULL
);
```

### Characters Table
```sql
CREATE TABLE characters (
  id            TEXT PRIMARY KEY,
  player_id     TEXT NOT NULL,        -- Links to players table
  name          TEXT NOT NULL,
  class         TEXT NOT NULL,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  gold          INTEGER DEFAULT 0,

  base_stats    TEXT NOT NULL,        -- JSON: {str, dex, con, int, wis}
  current_hp    INTEGER NOT NULL,
  max_hp        INTEGER NOT NULL,
  current_mp    INTEGER NOT NULL,
  max_mp        INTEGER NOT NULL,

  world_seed    TEXT NOT NULL,        -- Recreate same world
  location_id   TEXT NOT NULL,        -- Current room
  game_time     INTEGER NOT NULL,     -- In-game timestamp

  equipment     TEXT DEFAULT '{}',    -- JSON
  inventory     TEXT DEFAULT '[]',    -- JSON

  created_at    INTEGER NOT NULL,
  last_played   INTEGER NOT NULL,

  UNIQUE(player_id, name),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
```

### Visited Locations
```sql
CREATE TABLE visited_locations (
  character_id  TEXT NOT NULL,
  location_id   TEXT NOT NULL,
  visit_count   INTEGER DEFAULT 1,
  first_visit   INTEGER NOT NULL,
  last_visit    INTEGER NOT NULL,
  PRIMARY KEY (character_id, location_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### Unlocked Exits
```sql
CREATE TABLE unlocked_exits (
  character_id  TEXT NOT NULL,
  exit_id       TEXT NOT NULL,
  unlocked_at   INTEGER NOT NULL,
  PRIMARY KEY (character_id, exit_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### Removed Items (picked up from world)
```sql
CREATE TABLE removed_items (
  character_id  TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  removed_at    INTEGER NOT NULL,
  PRIMARY KEY (character_id, item_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### Dropped Items (added to world by player)
```sql
CREATE TABLE dropped_items (
  id            TEXT PRIMARY KEY,
  character_id  TEXT NOT NULL,
  item_data     TEXT NOT NULL,        -- Full item JSON
  location_id   TEXT NOT NULL,
  dropped_at    INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

### Killed Creatures
```sql
CREATE TABLE killed_creatures (
  character_id  TEXT NOT NULL,
  creature_id   TEXT NOT NULL,
  killed_at     INTEGER NOT NULL,
  respawn_at    INTEGER,              -- NULL = never respawn
  PRIMARY KEY (character_id, creature_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
```

---

## Menu Flow

### Welcome Screen (No Saved Characters)

```
┌─────────────────────────────────────────────────┐
│                   Solo MUD                      │
│                                                 │
│     Welcome to Solo MUD!                        │
│     Create your character to begin              │
│     your adventure.                             │
│                                                 │
│     ┌─────────────────────────────┐             │
│     │   Create New Character      │             │
│     └─────────────────────────────┘             │
│                                                 │
│     Your player code: HERO-SUNSET-4829          │
│     Save this to access characters elsewhere!   │
│                                                 │
│     [Have a player code? Click here]            │
└─────────────────────────────────────────────────┘
```

### Welcome Screen (Has Saved Characters)

```
┌─────────────────────────────────────────────────┐
│                   Solo MUD                      │
│                                                 │
│     Welcome to Solo MUD!                        │
│     Create your character to begin your         │
│     adventure, or pick from a saved character.  │
│                                                 │
│     ┌─────────────────────────────┐             │
│     │   Create New Character      │             │
│     └─────────────────────────────┘             │
│                                                 │
│     ─────── Saved Characters ───────            │
│                                                 │
│     ┌─────────────────────────────┐             │
│     │ Aragorn                     │             │
│     │ Level 5 Warrior             │             │
│     │ Last played: 2 hours ago    │             │
│     │ [Play]           [Delete]   │             │
│     └─────────────────────────────┘             │
│                                                 │
│     ┌─────────────────────────────┐             │
│     │ Gandalf                     │             │
│     │ Level 12 Mage               │             │
│     │ Last played: 3 days ago     │             │
│     │ [Play]           [Delete]   │             │
│     └─────────────────────────────┘             │
│                                                 │
│     Player code: HERO-SUNSET-4829               │
└─────────────────────────────────────────────────┘
```

### Delete Confirmation

```
┌─────────────────────────────────────┐
│ Delete Aragorn?                     │
│                                     │
│ This cannot be undone!              │
│ Type "Aragorn" to confirm:          │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]            [Delete]        │
└─────────────────────────────────────┘
```

---

## Character Limits

- Maximum 10 characters per player
- Players can delete characters to make room
- Delete requires typing character name to confirm

---

## Auto-Save Events

| Event | What's Saved |
|-------|--------------|
| Player moves to new room | `location_id`, add to `visited_locations` |
| Player picks up item | Add to `inventory`, add to `removed_items` |
| Player drops item | Remove from `inventory`, add to `dropped_items` |
| Player unlocks door | Add to `unlocked_exits` |
| Player equips/unequips | Update `equipment` |
| Player gains XP/levels | Update `xp`, `level`, stats |
| Player takes damage/heals | Update `current_hp`, `current_mp` |
| Creature killed | Add to `killed_creatures` |
| Every 60 seconds | Full state backup |
| Disconnect | Full state save |

No manual save command needed - auto-save handles everything.

---

## World Restoration Flow

```
Player selects character
       ↓
Load character from DB
       ↓
Regenerate world from stored seed (identical layout)
       ↓
Apply modifications from DB:
  • Load visit counts from visited_locations
  • Mark exits from unlocked_exits as open
  • Remove items listed in removed_items
  • Add items from dropped_items to their locations
  • Remove creatures from killed_creatures (or respawn if respawn_at passed)
       ↓
Set game time from character.game_time
       ↓
Place player at character.location_id
       ↓
Send SYNC to client → Game resumes!
```

---

## Socket Events

### Server → Client

```typescript
// Sent on connection with player's saved characters
WELCOME: {
  playerId: string;
  playerCode: string;
  characters: Array<{
    id: string;
    name: string;
    class: string;
    level: number;
    lastPlayed: number;
  }>;
  maxCharacters: number;  // 10
}
```

### Client → Server

```typescript
// Load existing character
LOAD_CHARACTER: { characterId: string }

// Create new character (existing event, now saves to DB)
CREATE_CHARACTER: { name: string, className: string }

// Delete a character
DELETE_CHARACTER: { characterId: string, confirmName: string }

// Link player code from another device
LINK_PLAYER_CODE: { code: string }
```

---

## File Structure

### Server
```
packages/server/src/
├── db/
│   ├── database.ts              # SQLite connection, init, migrations
│   ├── schema.sql               # Table definitions
│   └── repositories/
│       ├── PlayerRepository.ts      # Player CRUD
│       ├── CharacterRepository.ts   # Character CRUD
│       └── WorldStateRepository.ts  # Visits, unlocks, items, kills
├── game/
│   ├── session.ts               # Modified: integrate save/load
│   └── restore.ts               # Rebuild world state from DB
```

### Client
```
packages/client/src/
├── components/
│   ├── WelcomeScreen.tsx        # Main menu with character list
│   ├── CharacterCard.tsx        # Saved character display
│   ├── CharacterCreation.tsx    # Existing (minor tweaks)
│   └── DeleteConfirmModal.tsx   # Confirm character deletion
├── store/
│   └── gameStore.ts             # Add: playerId, playerCode, savedCharacters
└── utils/
    └── playerStorage.ts         # localStorage UUID management
```

---

## Future Considerations

### Authentication Upgrade Path
When ready for hosted multi-player servers:
1. Add `password_hash` column to players table
2. Add login/register UI
3. Player code becomes optional recovery method
4. UUID becomes session token instead of identity

### Database Scaling Path
| Users | Solution |
|-------|----------|
| 1-500 | SQLite (current) |
| 500-5000 | PostgreSQL (swap repository implementations) |
| 5000+ | PostgreSQL + read replicas, Redis caching |

The repository pattern makes swapping databases a contained change.
