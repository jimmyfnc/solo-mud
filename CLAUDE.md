# Solo MUD - Development Notes

This file contains persistent notes for Claude Code sessions.

## Project Structure

- `packages/shared` - Shared types, data, utilities
- `packages/server` - Game server (Fastify + Socket.io)
- `packages/client` - Web client (Vite + React)

## Town Layout (Easthollow)

```
                              [Northern Alley] ─down─> SEWER
                                     │
                                   south
                                     │
                              [Training Yard]
                                     │
                                   south
                                     │
[Wilderness] <─w─ [Outside Walls] <─e─ [Town Gate] <─e─ [TOWN SQUARE] ─e─> [Eastern Road]
                                    (guards)                 │                  │
                                                           south           n/  \s
                                                             │            /     \
                                                      [Market Street]   [Inn]  [Temple]
                                                       /    │    \      spawn  respawn
                                                      w     s     e
                                                      │     │     │
                                               [Smith][General][Alchemist]
```

## Sewer Dungeon (Beginner Area, Levels 1-6)

```
                    [Northern Alley]
                           │
                         down
                           │
                    [Sewer Entrance] ─── Rats (L1)
                           │
                         south
                           │
                    [Sewer Junction] ─── Rat (L2)
                     /     │     \
                  west   south   east
                   │       │       │
            [West Tunnel] │  [East Tunnel]
            Rats (L2)     │  Rats (L2) + ★RUSTY KEY
            Large Rat(L3) │  Large Rat (L3)
                          │
                    [Drainage Channel] ─── Rats (L2)
                          │
                        south 🔒 LOCKED (Rusty Key)
                          │
                    [Flooded Chamber] ─── Large Rats (L4)
                          │
                        south
                          │
                    [Rat Warren] ─── Rats (L2) + Large Rats (L4)
                          │
                        south
                          │
                    [Valve Room] 🧩 PUZZLE ─── Large Rat (L4)
                          │
                        south 🔒 GATE (solve puzzle)
                          │
                    [King Rat's Lair] 👑 BOSS (L6)
                                      ★ Drops: Rat King's Fang (unique weapon)
```

**Puzzle:** Valve Room has 3 colored valves (red=blood, blue=sky, green=earth). Cryptic inscription randomizes each attempt (e.g., "Blood before sky, sky before earth"). Gate resets when leaving sewer, making it farmable.
**Loot:** Rusty Key in East Tunnel, Rat King's Fang from boss (repeatable).

### Exit Conventions
- **Outdoor-to-outdoor**: Cardinal directions (north, south, east, west)
- **Street-to-building**: Cardinal OR building name (e.g., `north` or `inn`)
- **Building-to-street**: Always `out`

## Active Issues / Bugs

### Duplicate Procedural Exits (BUG)
- Example: `down (Thicket), down (Hollow)` - two exits with same direction
- Procedural generation should only use each direction ONCE per location
- Directions should be limited to: north, south, east, west, up, down
- Named exits (door, passage) only for special cases

### Missing Commands
- `effects` / `buffs` - View active spell effects, buffs, debuffs (currently shown in `status` command)

### Combat System Issues
- `attack` command does instant damage (should start auto-attack)
- Players can spam `kill` for unlimited damage
- Only creatures use the tick-based auto-attack system
- Need proper MUD-style auto-attack for players

### UX Improvements
- Show exits automatically (brief: just directions)
- `look` should expand with more description + detailed exits
- Currently exits show destination names which is verbose

## Future Ideas / Backlog

### Outside Town Walls Location
- Add traveling merchants who appear randomly
- Caravan events (protect the caravan, trade opportunities)
- Travelers passing through with rumors/quests
- Weather events (storms forcing people inside)
- NPC adventurers heading out or returning wounded

### Town Gate Area
- Guard shift changes at dawn/dusk
- Gate closing at night mechanic
- Wanted posters on the notice board
- Toll or tax system for goods

### General Town Improvements
- Stable location near the gate for horses/mounts
- Town crier announcing events
- Seasonal decorations/festivals
- Day/night ambient descriptions

### Wilderness Connection
- Procedural wilderness connects from Outside Walls going west
- Could add north/south wilderness paths later
- Landmarks visible from Outside Walls (mountains, forest edge)

## NPC Simulation System

The simulation system creates a living world with ambient NPC behaviors.

### Architecture
- `SimulationEngine` - Main orchestrator in `packages/server/src/npc/simulation/`
- Runs on game tick intervals, generates messages for players at each location
- Zone-based activity: social zones (inn, square) are more active than quiet zones (temple)

### Features
- **Ambient Actions**: NPCs perform contextual actions (wipe bar, watch gate, pray)
- **Ambient Speech**: NPCs comment on topics they care about (weather, gossip, threats)
- **NPC Conversations**: Two NPCs with shared topics may converse
- **Player Reactions**: NPCs react when players enter, level up, or die nearby
- **Hot Topics**: World events (boss kills) become temporary conversation topics

### NPC Data Structure
```typescript
simulation: {
  personality: 'cheerful' | 'stern' | 'wise' | 'friendly',
  topics: ['weather', 'gossip', 'threats'],
  topicInterest: { weather: 5, gossip: 9 },
  ambientActions: [{ text: 'wipes the bar', weight: 5 }],
  reactions: {
    player_enter: [{ weight: 5, says: 'Welcome!' }],
    player_levelup: [{ weight: 3, says: 'Congrats!' }],
  }
}
```

### Cooldown System
- Prevents message spam with per-player, per-NPC-pair, and per-topic cooldowns
- Players don't see the same message twice in a session

## Code Conventions

### Location IDs
- Town locations: `town_*` (e.g., `town_inn`, `town_square`)
- Sewer locations: `sewer_*` (e.g., `sewer_entrance`, `sewer_kings_lair`)
- Wilderness locations: `loc_*` (procedurally generated)

### Exit IDs
- Format: `exit_<from>_<to>` or `exit_<from>_<to>_named`
- Example: `exit_eastroad_inn`, `exit_eastroad_inn_named`

### NPC IDs
- Format: `npc_<name>` or `npc_<role>_<name>`
- Example: `npc_mira`, `npc_guard_marcus`
