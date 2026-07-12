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
[Western Reaches] <─w─ [Outside Walls] <─e─ [Town Gate] <─e─ [TOWN SQUARE] ─e─> [Eastern Road] ─e─> [Whispering Woods]
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

## The Western Reaches (Authored Wilderness, Levels 3-10)

Authored "outdoor dungeon" west of Outside Walls (`packages/shared/src/data/western-reaches.ts`).
Fixed compass-consistent skeleton; creatures/descriptions/weather are procedural. Depths in parens.

```
                                       [Wolf Den(7)]★Packleader
                                            │w
                                      [Howling Ridge(6)]
                                            │
                                      [Rolling Foothills(5)]
                                            │
          [Pine Slope(5)]────e────[Windswept Meadow(4)]
                 │s                         │
[Watchtower(9)]─[Ruined Gate(8)]─[Overgrown Rd(7)]─[Bandit Camp(6)]─[Darkpine Depths(5)]─[Darkpine Edge(4)]─[Crossroads(3)]─[Milestone(2)]─[Old W Rd(1)]─[Outside Walls]
 ★Elder Troll                                                                                    │s                │s
                                                                            [Silverbrook Ford(4)]────e────[Silverbrook Bank(4)]
                                                                                                 │s
                                                                                        [Bramble Thicket(5)]
                                                                                                 │s
                                                                                          [Marsh Edge(6)]
                                                                                                 │s
                                        [Sunken Hut(8)]────e────[Sunken Marsh(7)]
```

- Boss anchors (`WILD_BOSS_ANCHORS`): Packleader + 2 wolves at Wolf Den, Elder Troll at Watchtower (world goal)
- Procedural creature spawns are biome+depth driven (`world/creatures.ts`); safe zones and boss rooms excluded
- 🧩 Rune-gate puzzle at Ruined Gate seals the way to the Watchtower (`WILD_PUZZLES`, solve with `use sun/moon/star rune`)

## Whispering Woods Treasure & Fragment Quest

- All six woods bosses spawn via `WOODS_BOSS_ANCHORS` (Trickster, Chieftain, Shaman, Spider Queen, Thornlord, Matriarch + 2 handmaidens)
- Loot: `packages/server/src/loot/woods-loot.ts` — each sub-dungeon boss **always** drops its key fragment (`alwaysDrop`) + ~45% chance at its class-themed epic unique (Flickerblade, Bloodcap Cleaver, Totem of the Wild Spirit, Venomweave Wand, Bramblewood Bow; Matriarch drops the Heartwood Amulet); common fey drop materials
- Quest chain: collect 5 fragments → `use altar` at the Blighted Altar forges the **Dryad's Heart Key** (goes to keyring) → root gate south opens → Matriarch
- Quest-gated exits (`requirement.kind === 'quest'`) also accept a carried item token whose baseId matches the flag (persists across sessions)
- Creature loot lives in a registry (`loot/creature-loot.ts`): all kill paths use `generateCreatureLoot`; new zones register with `registerLootSource(makeLootSource(...))`
- Item proc effects (`combat/item-effects.ts`): `ItemEffect` on items — on_hit/on_crit/on_kill/passive triggers (bonus_damage, poison_burst, root_target, heal_self, healing_boost). Uniques have real mechanics (Cleaver heals on kill, Bow roots, etc.)
- Boss respawns: anchors (`isBossAnchor`) respawn on a slow clock (45 min ±25% jitter, `BOSS_RESPAWN_MS`), keep their name/static post; respawn defers while a player stands in the room

## Bot Population & Social Life

- Per-hub population bands via `BotSpawnConfig.zones` (`BotZonePopulation`): hamlet 2-4 (scarce) → castle 15-25 (busy). Easthollow: 5-10.
- Bots fight/level/die for real through the shared combat pipeline; deaths and boss kills emit `simulationEventBus` events → NPC hot-topic gossip
- Carouse goal: bots at the inn buy ale with real copper and get drunk
- Roadmap for flirting/romance/marriage/families/Bob-at-the-castle: `docs/design/bot-social-life.md`

## Combat Balance & Simulation

- `balance/combat-sim.ts` — fight simulator using the real formulas; `combat-sim.test.ts` enforces
  playable bands in CI (at-level trash ≥90% win, bosses potion-dependent, Matriarch counters with resist gear)
- Buffs are real: statusEffects fold into `computePlayerCombatStats` (see `character/buffs.ts`);
  Ice Barrier/Holy Shield absorb via `magnitude`; buffs expire on real timestamps
- Creature DOTs: Rend/Serpent Sting/Blizzard/Consecrate tick via `creature.dots` (kill credit to applier)
- Spell power = `combatStats.spellPower` (level + gear); heals scale on effective WIS
- One XP formula: `calculateXpGain(playerLevel, level, tier, behavior)` — includes gray-mob penalty
- Creature damage slope: `level*1.6+2` max; exotic damage types (nature/holy/shadow/arcane) map to
  kin resists at 75% (nature→poison etc.) so resist gear counters themed bosses
- **Bots fight for real**: bot sessions run through the same combat/regen ticks (null-socket safe)

## Puzzle System (data-driven)

`SequencePuzzle` (shared types) + `game/puzzles.ts` runtime: activate elements in order via `use <element>`;
solving opens exits gated with `requirement: { kind: 'puzzle', value: <puzzleId> }`. Progress/solved state
is per-player (session), so puzzles work in the shared world. `resetOnLeavePrefix` makes them repeatable
(sewer-style). The old sewer valve puzzle is still bespoke code (`handleValvePuzzle`) — candidate for
migration to this system. Puzzles are authorable in the Cartographer (zone panel → Puzzles).

### Exit Conventions
- **Outdoor-to-outdoor**: Cardinal directions (north, south, east, west)
- **Street-to-building**: Cardinal OR building name (e.g., `north` or `inn`)
- **Building-to-street**: Always `out`

## Active Issues / Bugs

### Missing Commands
- `effects` / `buffs` - View active spell effects, buffs, debuffs (currently shown in `status` command)

### UX Improvements
- Show exits automatically (brief: just directions)
- `look` should expand with more description + detailed exits
- Currently exits show destination names which is verbose

## Future Ideas / Backlog

### Living economy (single-town loop implemented)
All Easthollow merchants now have finite stock, cash reserves, production recipes,
and material inventories. Cold ticks craft replacement goods or post work orders;
players can gather shared resources and deliver them for premium pay, while suitable
bots can travel, gather, and fulfill orders. Shortages become NPC hot topics. See
`docs/design/living-economy.md`; visible merchant errands and inter-town caravans are next.

### "Design your own MUD" engine (big idea)
The Cartographer + data-driven zone architecture (zones, NPCs, shops, trainers, puzzles,
containers, loot tables, custom monsters/items — all visually authorable and exported as data)
is close to a generic MUD-building engine others could use. If pursued: JSON zone loader
(drop-in zone files, no code edits) → theming/config → standalone engine.

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

### Wilderness Expansion
- The Western Reaches (authored zone, `wild_*`) connects from Outside Walls going west
- Future: spatially coherent procedural chunks hanging off zone-edge trailheads (coordinate grid, not random graphs)
- More POIs: traveling merchants at the Crossroads, loot container in the Sunken Hut

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

## Living World Roadmap

See `docs/design/living-world.md` for the architecture plan:
- ✅ **Phase 1 done:** one shared authoritative world (`world/world-manager.ts`) — all players and bots share it; world systems tick once; the world clock advances (5 game min / 30s tick).
- ✅ **Phase 1b done:** shared world persists across restarts (`world_snapshot` table, saved every auto-save tick + shutdown; seed mismatch regenerates).
- ✅ **Phase 2 done:** random-graph wilderness replaced by the authored Western Reaches zone (see map above); `generate.ts` is now an authored-zone assembler with procedural creature dressing.
- Next: upgrading the NPC simulation from player-observed messages to persistent off-screen state changes (cold ticks + event bus); per-player visit familiarity.

## Planned Refactor: Data Organization

Current state: `easthollow.ts` is 2000+ lines mixing locations, NPCs, and shop items. As we add more towns, this won't scale.

### Target Structure
```
packages/shared/src/data/
├── towns/
│   ├── easthollow/
│   │   ├── index.ts          # Re-exports all
│   │   ├── locations.ts      # EASTHOLLOW_LOCATIONS, SEWER_LOCATIONS
│   │   ├── npcs.ts           # EASTHOLLOW_NPCS, conversation templates
│   │   └── shop-items.ts     # Items sold by Easthollow merchants
│   ├── [future-town]/
│   │   └── ...
│   └── shared/
│       └── common-items.ts   # Items sold everywhere (torch, rations, bandage)
├── items/
│   ├── index.ts              # Re-exports, createItemFromTemplate()
│   ├── weapons.ts            # WEAPON_DAMAGE, weapon templates
│   ├── armor.ts              # ARMOR_STATS (TODO), armor templates
│   ├── consumables.ts        # Move from constants/ (already separate)
│   └── starter-gear.ts       # STARTER_CLOTHING, CLASS_STARTER_WEAPONS
└── loot/
    ├── index.ts              # Shared loot types, generateLootDrop()
    ├── sewer-loot.ts         # Sewer templates + tables
    └── [future]-loot.ts      # Other dungeon drops
```

### Benefits
- Each town is self-contained (easy to add new towns)
- Clear separation: locations vs NPCs vs shop inventory
- Shared items don't duplicate across towns
- Weapon/armor stats in dedicated files

### Migration Steps
1. Create `data/towns/easthollow/` directory
2. Extract locations → `locations.ts`
3. Extract NPCs → `npcs.ts`
4. Extract shop items → `shop-items.ts`
5. Update imports across server/client
6. Move weapon damage from `constants/items.ts` → `data/items/weapons.ts`

## Tools

### Cartographer (zone editor + map viewer)
- `tools/zone-editor/index.html` — open directly in a browser (no build/server needed)
- Grid-based visual editor: rooms, compass-true exits (direction derived from grid position), floors (up/down), locked doors with key items, biome/depth/flags, creature anchors (hand-placed spawns)
- **Export TypeScript** produces a ready-to-wire zone file in the western-reaches.ts style (integration steps in the generated header)
- **Library dropdown** views existing zones (Western Reaches, Whispering Woods, town, sewer); red dashed links = compass-inconsistent exits in the source data
- Regenerate the library after zone changes: `cd packages/server && npx tsx ../../tools/export-zones.mjs`

## Code Conventions

### Location IDs
- Town locations: `town_*` (e.g., `town_inn`, `town_square`)
- Sewer locations: `sewer_*` (e.g., `sewer_entrance`, `sewer_kings_lair`)
- Western Reaches: `wild_*` (authored wilderness, e.g., `wild_crossroads`)
- Whispering Woods: `woods_*` (authored zone east of town)
- (`loc_*` was the retired random-graph wilderness; no longer generated)

### Exit IDs
- Format: `exit_<from>_<to>` or `exit_<from>_<to>_named`
- Example: `exit_eastroad_inn`, `exit_eastroad_inn_named`

### NPC IDs
- Format: `npc_<name>` or `npc_<role>_<name>`
- Example: `npc_mira`, `npc_guard_marcus`
