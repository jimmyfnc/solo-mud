# Bot Social Life — Design Notes

How the bots go from "wandering NPCs with swords" to characters with lives:
drinking at the tavern, flirting badly, falling in love, and — years of
game-time later — turning up at a castle hub, level 50, with a spouse and
kids. This doc is the roadmap; each stage builds on systems that already
exist.

## What already exists (the foundation)

| System | Where | What it gives us |
|---|---|---|
| GOAP goals/actions | `bots/goap/` | Personality-weighted decision making; add a goal = add a behavior |
| Personality traits | `bots/personality/` | bravery, sociability, greed, patience — drive goal priorities |
| Relationships | `bots/social/relationships.ts` | Per-entity opinion scores, friends/enemies, relationship events |
| Memory | `bots/memory/` | Bots remember deaths, kills, encounters |
| Conversation | `bots/conversation/` | Greetings, barks, idle chat templates |
| Hot topics | `npc/simulation/events.ts` | World events become NPC gossip (bot deaths/boss kills now emit) |
| Carouse goal | `goap/goals.ts` | ✅ Implemented: bots at the inn buy ale, drink, get drunk stacks |
| Zone populations | `BotZonePopulation` | ✅ Implemented: per-hub min/max bands (scarce hamlet vs busy castle) |

## Stage 1 — Tavern life (mostly done, polish remaining)

✅ Bots wander into the inn, buy real ale with real copper, drink it, and
accumulate drunk stacks (the drunk system with stumble text already exists).

Polish to add:
- **Drunk speech**: when a bot has drunk stacks, its `say` lines should pass
  through the existing drunk-slur transform players get.
- **Buying rounds**: high-sociability bots with gold buy ale *for whoever is
  in the room* (`modifyOpinion(+5)` from the recipient — friendships form at
  the bar, which is exactly how it should work).
- **Evening bias**: boost carouse priority when `world.time.timeOfDay` is
  evening/night, so the inn fills up after dark and empties in the morning.
  (Goal getPriority only receives the bot today — pass world time through
  BotProfile or a module-level clock reference.)

## Stage 2 — Flirting & funny interactions

Add a `flirt` goal (sociability-driven, targets present bots/NPCs) and a
`flirt` action whose command is `say <line>` from a new flirt-lines pool.
The comedy comes from the **reaction table**:

- Target is an NPC with `simulation.reactions` → add a `flirted_at` reaction
  category. The priestess ("Sister Maren" type) gets lines like:
  *"Sister Maren looks Bob up and down. 'The Light forgives many things.
  It is even prepared to forgive that.'"* — write 3-5 rejections per NPC
  personality (stern/cheerful/wise), and one rare warm response.
- Target is another bot → roll against both sociability scores and current
  opinion. Success: `modifyOpinion(+10)` both ways and a blush emote.
  Failure: `-5` and a public shootdown line (other bots in the room emit
  amused reactions — the room laughs at Bob).
- Track per-pair flirt cooldowns (the CooldownTracker pattern) so Bob
  doesn't propose hourly.

## Stage 3 — Falling in love

Builds directly on `relationships.ts` opinion scores:

- New relationship statuses above 'friend': `sweetheart` (opinion ≥ 75 +
  N successful flirts) and `partner` (sweetheart for M game-days + a
  proposal event at the temple — the priest NPC officiates, guests emit
  hot-topic gossip: *"Did you hear? Bob and Janet, married at the temple!"*).
- Couples get behavior changes: carouse together (follow-partner goal),
  a `mourn` goal if the partner dies (visits the death location, sad
  barks, temporary -sociability), and shared home location.
- Keep it rare and slow: love should take real days of server uptime so
  players witness it developing.

## Stage 4 — Bob's saga (persistence & progression)

The payoff: meeting Bob at level 50 in a castle, married with kids.

- **Persist bots** the way characters persist: a `bots` table (id, name,
  class, level, xp, personality JSON, relationships JSON, memory JSON,
  homeZone). Save on the auto-save tick; load on boot instead of rerolling.
  Named bots stop being session-scoped; generic bots that survive N days
  get "promoted" to persistent (survivors earn a biography).
- **Migration between hubs**: when a persistent bot out-levels its hub's
  levelRange (e.g. Easthollow 1-5), it "moves" — a farewell line at the
  tavern, then reassignment to the next hub's zone. Players who befriended
  Bob in Easthollow meet him again at the castle, higher level, and his
  memory still knows them.
- **Families**: partners in the same hub for M game-days spawn child NPCs
  (non-combat, schedule-driven, in a `home` location). Children reference
  parents in dialogue: *"Da says he killed the Thornlord. Ma says he ran."*
- **Aging ledger**: a `biography` array on the bot (joined Easthollow day 3,
  married Janet day 20, moved to castle day 34, slain the Wolf Packleader
  day 40...) — surfaced via `ask Bob about his life`, and it doubles as
  the data source for bard songs / notice boards.

## Zone populations (implemented — tuning guide)

`BotSpawnConfig.zones` gives each hub its own band. Suggested bands as the
world grows:

| Hub type | min–max | Feel |
|---|---|---|
| Wilderness hamlet / outpost | 2–4 | scarce, frontier, every face matters |
| Small town (Easthollow) | 5–10 | lived-in but quiet |
| Trade town | 8–15 | bustling market |
| Major castle / city | 15–25 | busy city life, anonymous crowds |

Notes:
- Caps are per-hub, so adding hubs scales population linearly and safely.
  Watch total bot count × combat ticks for perf; ~50 bots total is fine,
  re-profile beyond that.
- Bots currently stay conceptually "assigned" to their spawn hub but can
  wander anywhere; a future `homeZone` leash (return-home goal when too far)
  would keep hamlets from draining into the city.
- Population caps count *living* bots — a hub whose bots keep dying in the
  wilderness naturally feels dangerous and empty until respawns catch up.

## Implementation order (when picking this up)

1. Drunk speech + evening carouse bias (small, funny immediately)
2. Flirt goal + NPC rejection tables (the priestess scene)
3. Sweetheart/partner statuses + marriage event
4. Bot persistence table (unlocks everything long-term)
5. Hub migration + biography ledger
6. Families
