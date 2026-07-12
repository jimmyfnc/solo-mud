# Living World Design Proposal

Goal: evolve Solo MUD from "per-player sandbox with simulated flavor" into a
**fully simulated living world** that one or more real players inhabit together
with bots, NPCs, and creatures.

## Where the current design fights the goal

### 1. Every session has its own private universe (the keystone problem)

- `sessionManager.createSession()` calls `generateWorld()` per player
  (`packages/server/src/game/session.ts:52`); the seed is stored per character.
- Every bot **also** generates its own private world
  (`packages/server/src/bots/bot-factory.ts:234`).
- The game loop ticks each session's world independently — creatures move,
  hunt, respawn, and incursions fire separately in each player's copy.
- Bots and other players appear in your room only by string-comparing
  `locationId` across *different world instances*. That works in town (shared
  static IDs) and silently breaks in the wilderness (`loc_*` graphs differ per
  world — a bot at `loc_3` of *its* world shows up at `loc_3` of *yours*,
  which is a different place with different exits).

Nothing can be genuinely shared this way: no shared combat, corpses, loot,
economy, or events. A living world requires **one authoritative world**.

### 2. Wilderness procgen is an abstract graph, not a place

`world/generate.ts` builds a random spanning tree + extra edges, then assigns
compass labels arbitrarily. Consequences (the "funkiness"):

- Directions are meaningless — "north" is an edge name, not geometry. Loops
  teleport you in ways a mental map can't survive.
- Biomes are assigned by BFS depth, so plains/swamp/desert can be adjacent
  with no transition.
- Names are drawn from a 20-item list with repeats (two "Hollows" one room
  apart).
- Label-conflict edges are silently skipped, risking disconnected pockets.

Meanwhile the **hand-authored zones already work**: the Sewer and Whispering
Woods have coherent layouts, themed sub-dungeons, depth ramps, bosses, and
keys/puzzles. The evidence in this repo says authored skeletons win.

### 3. The simulation is a Potemkin village

`SimulationEngine` only runs for locations where a player is standing, and it
generates *messages*, not state changes. NPCs don't do anything when unobserved;
nothing that happens off-screen persists. Ecology (hunting/fleeing/respawn) is
real state, but it runs per-session copy, so it isn't a shared history.

## Proposed direction

### Phase 1 — One shared world ✅ IMPLEMENTED (2026-07-07)

Status: done. `WorldManager` (`packages/server/src/world/world-manager.ts`)
owns the single world (seed from `WORLD_SEED` env, default
`easthollow-prime`). Sessions, restores, and bots all join it; the game loop
ticks world-scoped systems (creature movement, ecology, respawns, corpses,
containers, incursions, town defense) exactly once per tick and broadcasts
notifications to every player in range. The shared world clock now advances
(5 game minutes per 30s tick), so light sources, infamy decay, and container
respawns actually work. Known Phase-1 compromises (follow-ups below):

- `Location.visitState` (familiarity) is still world-level, i.e. shared.
- Per-character world modifications (removed/dropped items, visits,
  unlocked exits in `WorldStateRepository`) are no longer applied on load;
  world state is shared but in-memory only — it resets on server restart.
  Global world persistence is the next step.
- Sewer puzzle gate state mutates the shared world (first solver opens it).

Original plan:

Replace per-session worlds with a server-owned `WorldManager` holding a single
`World` instance:

- Server startup generates (or restores via `WorldStateRepository`) **the**
  world from a server-level seed. Sessions hold a reference, not a copy.
- Bots join the same world — `createBotSession(bot, existingWorld)` already
  supports this; pass the shared world and delete the per-bot `generateWorld`
  fallback.
- Game loop changes from "for each session, tick its world" to "tick the world
  once, then fan out notifications to sessions by location".
- Split player-scoped state out of `World`/`Location`:
  - `Location.visitState` (familiarity) → per-player map on `Player`.
  - Sewer valve puzzle / gate state → already on the session; keep per-player.
  - Containers/corpses/loot → shared (competition is a living-world feature),
    but keep per-player quest items via the existing `removed_items` tracking.
- Persistence: characters stop storing `world_seed`; world state (creature
  populations, containers, dropped items, time, weather) saves globally.

Payoff: players and bots genuinely coexist — shared fights, shared corpses,
a bot can buy the sword you sold, world events are facts rather than per-copy
accidents. This is also the prerequisite for real multiplayer.

### Phase 2 — Wilderness becomes an authored "outdoor dungeon" ✅ IMPLEMENTED (2026-07-07)

Status: done. The random-graph wilderness is retired. The **Western Reaches**
(`packages/shared/src/data/western-reaches.ts`) is a 20-location authored
zone west of Outside Walls with a compass-consistent layout: the old west
road running to a ruined watchtower (Elder Troll, world goal, depth 9), a
northern hills branch ending at the Wolf Den (Packleader + pack, depth 7),
and a southern branch following the Silverbrook down into a sunken marsh
(depth 8). Two loops connect the branches. `world/generate.ts` is now an
authored-zone assembler: it clones the zone data (no shared-data mutation),
wires adjacency, and layers procedural dressing on top — biome+depth
creature spawning now covers both the Western Reaches *and* the Whispering
Woods (which previously had no ambient creatures at all). Graph utilities
are parked in `world/graph.ts` for future coordinate-grid chunk expansion.

Also done (1b): the shared world persists across restarts via a JSON
snapshot (`world_snapshot` table), saved on the auto-save tick and shutdown;
snapshots from an old seed or pre-Phase-2 layout are discarded.

Original plan:

Retire the random-graph wilderness as the connective tissue and reuse the
pattern that already works:

- Author a bounded wilderness zone west of Outside Walls the way Whispering
  Woods was built: a fixed skeleton of ~20–40 locations with real geography
  (trailheads, a river line, a ridge, landmarks visible from Outside Walls per
  the backlog), depth ramp for difficulty, POIs (camps, ruins, dens), and one
  or two anchor bosses.
- Keep the **procedural layer where it shines** — dressing, not topology:
  creature spawning/ecology, weather, time-of-day description templates, prop
  variation, random encounters/events, resource nodes, rare wandering
  merchants. Same location, different day, different experience.
- If infinite exploration is wanted later, add it as **spatially coherent
  chunks**: generate on a coordinate grid (directions = real geometry, biomes
  = noise regions with transitions), hanging off authored trailheads at the
  zone edge. Never a random abstract graph again.

This deletes the `loc_*` incoherence, the duplicate-name problem, the
label-skip disconnection risk, and makes the bot/wilderness mismatch moot.

### Phase 3 — From flavor simulation to state simulation

Progress (2026-07-10): the economy portion now runs as persistent cold state. Merchant production, finite cash/stock, shared resource regeneration, work orders, shortage events, and bot suppliers continue without players observing the location. General NPC errands and broader off-screen state simulation remain.

Two-tier level-of-detail on the single shared world:

- **Hot (players present):** current message-rich simulation, full combat.
- **Cold (unobserved):** coarse ticks that change *state*, not prose — NPC
  schedules move bodies (already exists), ecology adjusts populations,
  shopkeepers restock, bots keep adventuring. When a player arrives, they see
  the *consequences*.
- **Event bus:** boss kills, incursions, NPC deaths, caravan arrivals publish
  events; subscribers include NPC hot-topics (exists), notice boards, guard
  behavior (infamy already hooks here), and shop prices.
- **Economy loop:** NPC gold pools and shop inventories that drain/restock,
  giving the bank, loot, and infamy systems something to push against.
- **Bots as citizens:** with a shared world, bots become the load-bearing
  "living" part — they fight real creatures, take real loot, really die (feeds
  incursion stakes and NPC gossip).

## Suggested order of work

1. ✅ `WorldManager` + shared world for players and bots (done 2026-07-07).
1b. ✅ Global world persistence via `world_snapshot` (done 2026-07-07).
    Remaining follow-up: move `visitState` familiarity per-player.
2. ✅ Authored wilderness zone (the Western Reaches) replaces the graph
   generator; graph utilities parked (done 2026-07-07).
3. Cold-tick simulation + event bus. Economy slice ✅; general NPC state/errands next.
4. Economy loop and bot-citizen upgrades. Single-town supply loop ✅; caravans require hub #2.

## Open questions

- Death/PvP rules once the world is shared (infamy system generalizes here).
- Instancing: should boss rooms (King Rat, Spider Queen) be per-party
  instances or shared-with-respawn? Shared is simpler and more "living";
  instancing can come later if contention hurts.
- Scale: one world per server process is fine for the target player count;
  sharding is a non-goal for now.
