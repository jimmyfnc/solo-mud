# Solo MUD - Design Document

**Date:** 2026-01-23
**Status:** Draft - Pending Implementation

## Overview

A procedurally generated text adventure MUD designed for single-player with future multiplayer potential. Combines classic MUD real-time combat with roguelite procedural generation, ensuring all generated content is validated and solvable.

---

## Core Design Pillars

1. **Validated Procedural Generation** — All generated content passes validation; no dead ends or impossible states
2. **Progression Through Exploration** — World knowledge is earned, not given
3. **Real-Time MUD Combat** — Classic tick-based combat with cooldowns and auto-attack
4. **Multiplayer-Ready Architecture** — Single-player first, but designed for future MUD multiplayer

---

## World Structure

### Geographic Model

**Persistent overworld + procedural instances:**

| Area Type | Persistence | Procedural? |
|-----------|-------------|-------------|
| Towns | Permanent | No — hand-crafted |
| Main overworld zones | Persistent, respawning enemies | Static layout |
| Dungeon interiors | Resets on exit | Fully procedural |
| Wilderness pockets | Resets on exit | Procedural outdoor areas |
| Zone edges | Resets periodically | Procedural fringe areas |

### Biome System

**6 MVP biomes with tag-based blending:**

| Biome | Typical Features | Typical Enemies |
|-------|------------------|-----------------|
| Plains | Grasslands, farms, roads | Bandits, wolves, boars |
| Forest | Woods, clearings, streams | Goblins, spiders, bears |
| Hills | Rocky terrain, caves, outcrops | Orcs, trolls, harpies |
| Swamp | Bogs, dead trees, ruins | Undead, lizardfolk, insects |
| Mountains | Cliffs, mines, peaks | Giants, wyverns, golems |
| Desert | Dunes, oases, tombs | Scorpions, mummies, nomads |

**Tag mixing:** Zones have weighted biome tags (e.g., `[plains: 0.6, swamp: 0.3, forest: 0.1]`). Generation pulls from combined weighted pools for terrain, creatures, and loot. Weights shift as players move through the world, creating natural transition areas.

### Tier Structure

**MVP: 3 tiers (levels 1-30), expandable to level 50 base, 100 eventual cap**

| Tier | Level Range | Town | Content |
|------|-------------|------|---------|
| 1 | 1-10 | Starter Town | Beginner zones, tutorials |
| 2 | 11-20 | Mid-tier Town | Intermediate challenge |
| 3 | 21-30 | Advanced Town | Challenging content |
| 4-5 | 31-50 | Future expansion | — |
| 6+ | 51-100 | Future expansion | — |

---

## Character System

### Base Stats

Classic MUD stats affecting all combat calculations:

- **STR** — Melee damage, carry capacity
- **DEX** — Hit chance, dodge, crit chance, attack speed
- **CON** — HP pool, physical resistance
- **INT** — Spell damage, mana pool
- **WIS** — Spell resistance, mana regen, awareness

### Classes (5 Base)

| Class | Primary Stats | Role | Subclass Examples |
|-------|---------------|------|-------------------|
| **Warrior** | STR, CON | Melee tank/damage | Berserker, Knight, Vanguard |
| **Rogue** | DEX, STR | Fast melee, crits, stealth | Assassin, Duelist, Shadow |
| **Mage** | INT, WIS | Ranged spells, AoE | Pyromancer, Cryomancer, Arcanist |
| **Cleric** | WIS, CON | Heals, buffs, smite undead | Priest, Paladin, Inquisitor |
| **Ranger** | DEX, WIS | Ranged physical, tracking, pets | Archer, Beastmaster, Trapper |

### Subclass System

**Talent tree progression:**

```
Level 1-9:    Base class (e.g., Warrior)
Level 10:    Pick Tier 1 subclass → Berserker or Knight or Vanguard
Level 11-29: Earn specialization points in your subclass tree
Level 30:    Unlock Tier 2 branch → Berserker splits into Bloodrager / Warlord
Level 31-49: More points in Tier 2 branch
Level 50:    Tier 3 unlocks...
```

**Subclass tiers unlock at:** 10, 30, 50, 70, 90

**Talent points:** 1 per level + bonus points at tier unlock levels

**Switching rules:**
- Base class is permanent (chosen at character creation)
- Subclass can be switched
- Switching resets subclass-specific progress
- Returning to a previously-used subclass grants 10-15% XP boost to recover faster

---

## Combat System

### Real-Time with Cooldowns

**Hybrid tick system:**
- Global tick (2s) for auto-attacks and enemy AI
- Individual cooldowns for abilities layered on top
- Global Cooldown (GCD) of 1-1.5s prevents action spam

### Auto-Attack

**Configurable toggle:**
- When enabled: attacks every tick automatically
- Using abilities pauses auto-attack
- Can't auto-attack and cast simultaneously

```
[Auto-attack ON] → Attacks every tick
[Use ability]    → Auto-attack pauses, ability cooldown starts
[Ability done]   → Auto-attack resumes
```

### Interrupts

- Getting hit while casting can interrupt the spell (chance-based)
- Some classes/subclasses gain interrupt resistance
- Details to be fleshed out during implementation

---

## Equipment System

### Slots (11 total)

Weapon, Off-hand/Shield, Head, Chest, Hands, Legs, Feet, Ring x2, Necklace, Cloak

**Class-restricted:** Mages wear cloth, Warriors wear plate, etc.

### Rarity Tiers (6 levels)

| Rarity | Color | Affixes | Notes |
|--------|-------|---------|-------|
| Junk | Gray | 0 | Broken/degraded, vendor trash |
| Common | White | 0 | Fixed stats |
| Uncommon | Green | 1 | One random affix |
| Rare | Blue | 2 | Two affixes |
| Epic | Purple | 3 | Three affixes |
| Legendary | Orange | 3-4 + unique | Special proc or ability |

### Affix System

**Prefix/suffix generation:**
- Base item has fixed stats
- Affixes add variety: "Blazing Iron Sword of the Bear"
- Number of affixes determined by rarity
- Affix pools are data-driven tables, easily expandable

---

## Enemy System

### Tiered Variants

| Type | Example | Notes |
|------|---------|-------|
| Base | Goblin | Fodder, low threat |
| Veteran | Goblin Warrior | Tougher, tier 1-2 zones |
| Champion | Goblin Champion | Dangerous, guards key areas |
| **Named** | Gob the Skullcrusher | Unique, special loot, extra abilities |

### Named Elite Spawning

**Hybrid system:**
- Some named mobs have fixed lairs (predictable hunting)
- Others roam or spawn randomly (surprise encounters)
- Named mobs have: guaranteed rare+ drop, unique abilities, possible respawn timers

---

## Town Services

### Service Availability by Tier

| Service | Starter Town | Mid Town | Advanced Town |
|---------|--------------|----------|---------------|
| General shop | Basic gear | Better gear | Best gear |
| Inn/rest | Yes | Yes | Yes |
| Trainer | Levels 1-10 | Levels 11-20 | Levels 21-30 |
| Blacksmith | Repairs only | Repairs + upgrades | Masterwork crafting |
| Enchanter | "Come back later" | Basic enchants | Rare enchants |
| Bank/storage | Small vault | Larger vault | Full vault |
| Quest board | Tier 1 quests | Tier 2 quests | Tier 3 quests |

**Services visible but gated:** Players can see the enchanter in starter town, but can't use services until they meet requirements.

---

## NPC System

### Dialogue

**Full dialogue trees:**
- Conversations with choices
- Lore and world-building
- Hints about locations, quests, secrets

### Schedules

**NPCs follow time-of-day schedules:**
- Most shops close at night
- Essential services (inn, general store basics) available 24/7
- Night-exclusive content: shady merchants, black market, thieves guild

---

## Time & Weather

### Time System

**Real-time mapped with acceleration:**
- Default: 1 real minute = 10-15 game minutes
- Full day/night cycle in ~2 hours real time
- Configurable per server/session

**Day/night split:** Day is longer than night (roughly 16-18 hours day, 6-8 hours night)

### Weather System

**Simulated weather:**
- Weather changes over time
- Moves across regions (storm rolls in from mountains)
- Affects descriptions, possibly gameplay (visibility, movement)

---

## Description System

### Layered + Dynamic

**Three levels of detail:**
1. **Entry (auto)** — Short atmospheric line on entering a location
2. **Look** — Fuller description with exits, items, NPCs
3. **Examine** — Detailed inspection of specific objects

**Dynamic state tracking:**
- Visit state (first time, repeat, frequent)
- Time of day (morning, noon, evening, night)
- Weather conditions
- Enemy/item state (alive, dead, looted)
- Player actions (area modified by player)

**Example:**
```
[First visit, morning, enemies present]
> (auto on entry)
"A forest clearing. Sunlight filters through the canopy. A goblin snarls at you."

[Return visit, evening, enemies dead]
> (auto on entry)
"The familiar clearing. Goblin corpses lie where they fell. Shadows lengthen."
```

---

## Navigation & Maps

### Discovery-Based Automap

**Map knowledge is earned:**
- Exploration reveals visited locations
- Map items reveal regions ("Weathered Map of the Eastern Hills")
- NPC conversations can mark points of interest
- Cartographers sell regional maps (expensive)

**Starting state:** Player knows only the starter town

### Map Command

```
> map

       [?]
        |
  [?]--[*]--[Cave]
        |
     [Town]

[*] = Current location
[?] = Unexplored
```

---

## Fast Travel

### Gated Progression

| Method | Availability | Cost |
|--------|--------------|------|
| Walking | Always | Free, time + danger |
| Stagecoach | Between visited towns, level gated | Gold (scales with distance) |
| Teleporter | Higher tiers, quest unlock | More gold |
| Scroll of Recall | Consumable, bought/looted | One-way to bound town |
| Scroll of Teleport | Consumable, rare | To specific known location |

**Early game:** Players must walk and learn the world.
**Mid/late game:** Fast travel becomes affordable and convenient.

---

## Death & Respawn

### Scaling Penalty System

**Two options on death:**

1. **Corpse Run** — Free, but risky. Return to your corpse to retrieve gear.
2. **Paid Respawn** — Respawn with all gear, but costs scale with level.

| Level Range | Corpse Run | Paid Respawn Cost |
|-------------|------------|-------------------|
| 1-10 | Available | Free (new player protection) |
| 11-20 | Available | Moderate gold |
| 21-30 | Available | Significant gold |
| 31-50 | Available | Gold + minor XP loss |
| 50+ | Available | Heavy gold + XP loss |

---

## Inventory & Storage

### Hybrid Inventory

**Weight + slot limits:**
- Carry capacity based on STR
- Also limited by number of slots
- Heavy armor takes weight, but 500 potions also not allowed

### Tiered Storage

**Per-town vaults with global visibility:**
- Starter town: Small personal chest
- Later towns: Larger vaults
- Can view all vault contents from anywhere
- Can only withdraw from current town

```
> bank
Your storage:
  [Millbrook] (12/20 slots): Iron Sword, 3x Health Potion...
  [Grimhold] (5/40 slots): Rare Orcish Axe...
  [Current: Millbrook]
```

---

## CLI Interface

### Command Structure

**Hybrid: Full commands + shortcuts**

| Full Command | Shortcut | Action |
|--------------|----------|--------|
| `look` | `l` | View current location |
| `north/south/east/west` | `n/s/e/w` | Movement |
| `inventory` | `i` | View inventory |
| `attack goblin` | `k goblin` | Attack target |
| `take sword` | `get sword` | Pick up item |

### Smart Disambiguation

```
> use potion
You have multiple potions:
  1. Health Potion (x3)
  2. Mana Potion (x2)
  3. Antidote (x1)
Select (1-3):
```

### Quick Slots

**Separate bars for items and abilities:**

| Slots | Purpose | Access |
|-------|---------|--------|
| q1-q4 | Consumables (potions, scrolls) | `q1`, `q2`, etc. |
| a1-a4 | Abilities/Spells | `a1`, `a2`, etc. |

```
> quickslot 1 health potion
> q1
You drink a Health Potion. HP restored!

> a1
You cast Fireball! The goblin burns for 25 damage.
```

---

## Validation System

### Strict with Fallback Fixes

**Pipeline:**
```
Generate World
     ↓
Run Validation
     ↓
Issues Found? ──No──→ ✓ World Ready
     ↓ Yes
Attempt Fixes:
  - Key behind its lock? → Move key earlier
  - Enemy too high level? → Downscale or swap
  - Dead-end room? → Add exit to nearest node
  - Biome weights invalid? → Normalize weights
     ↓
Re-validate
     ↓
Still Broken? ──No──→ ✓ World Ready
     ↓ Yes
Retry with seed+1 (up to N attempts)
     ↓
Still Failing? → Error + log for debugging
```

### Validation Checks

| System | What Could Break | Validation |
|--------|------------------|------------|
| World graph | Unreachable areas | BFS reachability from start |
| Lock/key placement | Key behind its lock | Inventory simulation |
| Dungeon generation | Dead-end rooms | Graph connectivity |
| Enemy placement | Wrong level enemies | Level range per zone tier |
| Loot tables | Critical items missing | Guaranteed spawns |
| Biome blending | Invalid weights | Sum to 1.0, minimum thresholds |

---

## Deferred Features

The following are noted for future implementation:

- **Crafting system** — Professions, material gathering, gear creation
- **Quest system** — World-state driven dynamic quests
- **Multiplayer** — Shared world, parties, PvP considerations
- **Expanded subclass tiers** — Levels 50-100 content
- **Additional biomes** — Tundra, volcanic, coastal, underground
- **Expandable quick slots** — Via equipment (belts, pouches)
- **Class-unrestricted gear** — With penalties for non-preferred types

---

## Technical Requirements

### Stack

- **Language:** TypeScript (Node 20+)
- **Runtime:** CLI app (terminal)
- **Tooling:** pnpm or npm, ts-node (or tsx), vitest for tests
- **Seeded generation:** Same seed → same world (deterministic PRNG)

### Data Model (Core Interfaces)

```typescript
type NodeId = string;
type EdgeId = string;
type ItemId = string;

type EdgeType = "open" | "locked" | "hidden" | "hazard";

interface Requirement {
  kind: "item" | "level" | "quest";
  value: string | number;
}

interface Exit {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  label: string;
  type: EdgeType;
  requirement?: Requirement;
}

interface Item {
  id: ItemId;
  name: string;
  tags: string[];
  rarity: "junk" | "common" | "uncommon" | "rare" | "epic" | "legendary";
  affixes?: Affix[];
}

interface Location {
  id: NodeId;
  name: string;
  tags: string[];          // biome tags with weights
  props: string[];         // "altar", "broken statue"
  items: ItemId[];
  enemies: EnemyId[];
  visitState: VisitState;
}

interface World {
  seed: string;
  startId: NodeId;
  goalId: NodeId;
  locations: Record<NodeId, Location>;
  exits: Record<EdgeId, Exit>;
  adjacency: Record<NodeId, EdgeId[]>;
  items: Record<ItemId, Item>;
  time: GameTime;
  weather: WeatherState;
}
```

### Project Structure

```
solo-mud/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts                 # CLI entry
    engine/
      commands.ts            # parse + execute commands
      render.ts              # render room/combat text
      state.ts               # player state
      combat.ts              # combat tick system
      time.ts                # time + weather simulation
    world/
      rng.ts                 # seeded PRNG
      graph.ts               # graph helpers (BFS, paths)
      generate.ts            # world generation pipeline
      validate.ts            # reachability + validation
      biomes.ts              # biome definitions + blending
      tables.ts              # data tables (enemies, loot, affixes)
      serialize.ts           # stable stringify for determinism
    entities/
      character.ts           # player character model
      classes.ts             # class definitions
      subclasses.ts          # subclass trees
      enemies.ts             # enemy definitions
      npcs.ts                # NPC dialogue + schedules
      items.ts               # item generation
    data/
      biomes/                # biome content tables
      classes/               # class/subclass definitions
      enemies/               # enemy templates
      items/                 # item templates, affixes
      descriptions/          # description templates
  test/
    generate.test.ts
    validate.test.ts
    combat.test.ts
    biomes.test.ts
```

---

## Next Steps

1. **Review and approve** this design document
2. **Set up project** — Initialize repo, dependencies, tsconfig
3. **Implement core systems** in order:
   - Seeded RNG + data tables
   - World graph generation + validation
   - Basic CLI loop + commands
   - Character + stats
   - Combat system
   - Equipment + loot
   - Descriptions
   - Time + weather
   - Towns + NPCs
4. **Iterate** — Playtest, adjust, expand
