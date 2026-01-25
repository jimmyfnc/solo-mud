# Living Ecosystem Design

**Date:** 2026-01-25
**Status:** Draft - Pending Implementation

## Overview

Transform the world from player-centric to creature-centric. Every creature evaluates its surroundings and acts based on survival instincts — hunting, fleeing, defending territory — whether the player is present or not.

### Core Principles

1. **Real-time tick-based** — No turns. World ticks (30s) drive movement and hunting. Combat ticks (5s) drive fights.
2. **Level-of-detail simulation** — Full fidelity near the player, instant resolution far away. Keeps performance manageable.
3. **Emergent behavior** — Simple rules create complex outcomes. A wolf hunts a deer, the deer flees, the chase crosses paths with the player, the player intervenes, the wolf turns on them.

### Future Vision

This design is the foundation for a fully operational fantasy simulation where:
- Creatures interact with the ecosystem like in real life
- Predators hunt prey, prey flees from threats
- Territorial creatures defend their domain
- Eventually: wandering NPCs that interact with everything meaningfully

---

## Creature Tiers

Creatures are categorized by ecological role, separate from their combat level:

| Tier | Creatures | Respawn Time | Intimidation Gap |
|------|-----------|--------------|------------------|
| `ambient` | Sheep, rabbit, squirrel, frog, raven, deer, goat | 2 minutes | 3+ levels |
| `common` | Wolf, goblin, snake | 5 minutes | 5+ levels |
| `dangerous` | Spider, bandit, bear | 10 minutes | 8+ levels |
| `apex` | Troll | 15 minutes | 12+ levels |

**Combat level vs tier:**
- **Level** — Scales with world depth, affects damage/HP, used for combat calculations
- **Tier** — Fixed per creature type, represents ecological rarity, used for respawn and intimidation

---

## Creature Behaviors

| Behavior | Hunts | Flees | Defends Territory |
|----------|-------|-------|-------------------|
| `passive` | No | Yes | No |
| `aggressive` | Yes | From stronger | No |
| `territorial` | Yes | From stronger | Yes (spawn + adjacent) |

---

## Predator/Prey Relationships

### Level-Based Food Chain

Creatures interact based on relative levels:

- **Hunt threshold:** Aggressive/territorial creatures will hunt anything **2+ levels below** them
- **Intimidation threshold:** Creatures won't attack something **significantly above** them (gap varies by tier)

### Tier-Based Intimidation

| Tier | Won't attack if target is... |
|------|------------------------------|
| `ambient` | 3+ levels higher |
| `common` | 5+ levels higher |
| `dangerous` | 8+ levels higher |
| `apex` | 12+ levels higher |

### Example Interactions

- Level 10 Wolf (`common`) vs Level 14 Player → attacks (only 4 level gap, needs 5+)
- Level 10 Wolf (`common`) vs Level 16 Player → intimidated (6 level gap >= 5)
- Level 15 Troll (`apex`) vs Level 25 Player → attacks (only 10 level gap, needs 12+)
- Level 15 Troll (`apex`) vs Level 28 Player → intimidated (13 level gap >= 12)

### Active Hunting Behavior

Each world tick, predators (aggressive/territorial) check adjacent rooms for prey:

1. Scan adjacent locations for valid prey (2+ levels below, not intimidating)
2. If prey found, move toward it (overrides random roaming)
3. If multiple prey, prefer the closest level match (easier fight)
4. If no prey detected, roam randomly as normal

---

## Territory System

### What is Territory

Territorial creatures (bears, trolls, snakes) claim a region around their spawn point:

- **Home:** The location where they spawned (`spawnLocationId`)
- **Territory radius:** Home + all adjacent locations

### Territorial Behavior

When a territorial creature is **within its territory**, it attacks any intruder regardless of level-based hunting rules — with one exception: it still respects intimidation thresholds.

| Situation | Response |
|-----------|----------|
| Intruder enters territory, weaker than defender | Attack immediately |
| Intruder enters territory, stronger but within intimidation range | Attack (defending home) |
| Intruder enters territory, far stronger (exceeds intimidation threshold) | Growl/warn but don't attack |
| Territorial creature outside its territory | Acts like normal aggressive (hunts prey, avoids stronger) |

### Territory vs Hunting

- **Inside territory:** Attack anything that enters (defense mode)
- **Outside territory:** Only hunt prey 2+ levels below (hunting mode)

---

## Flee & Chase Mechanics

### Prey Flight Response

When a predator enters a location containing passive creatures:

1. **Trigger:** Predator arrives that could hunt them (2+ levels above prey)
2. **Response:** Prey immediately flees to a random adjacent room
3. **Chase:** 50% chance the predator follows
4. **Repeat:** If predator follows, prey flees again (if able)
5. **Max chase:** 3 rooms to prevent infinite loops

### Chase Resolution

- **Prey escapes** — Prey reaches a dead end the predator can't enter (locked door), or predator gives up after 3 rooms
- **Predator catches** — Prey has no valid exits, or bad luck on flee attempts

### Flee Destination Priority

1. Unlocked exits only (prey can't unlock doors)
2. Prefer exits away from predator's origin (if known)
3. Random if multiple equal options

### Example Scenario

```
Tick 1: Wolf enters Clearing, Deer is here
        -> Deer flees North to Forest Edge
        -> Wolf follows (50% roll succeeded)
Tick 2: Wolf arrives at Forest Edge
        -> Deer flees East to Riverbank
        -> Wolf follows again
Tick 3: Wolf arrives at Riverbank
        -> Deer flees South to Rocky Outcrop
        -> Wolf gives up (max chase reached) OR catches deer
```

---

## Combat Resolution

### Level of Detail (LOD) System

Simulating every creature fight tick-by-tick across the whole world is wasteful when the player can't see most of it.

| Player Distance | Combat Type | Resolution |
|-----------------|-------------|------------|
| Same room | Evenly matched | Tick-based (5s ticks) |
| Same room | Mismatched (3+ level gap) | Instant |
| Adjacent room | Any | Instant (with summary notification) |
| 2+ rooms | Any | Instant (with ambient notification) |

**"Evenly matched" definition:** Less than 3 levels apart. These fights could go either way and are worth watching.

### Instant Resolution Formula

```
attacker_power = level * base_hp * (behavior_bonus)
defender_power = level * base_hp * (territorial_bonus if home)

winner = higher power (with small random variance +/-10%)
```

Territorial creatures get a +20% bonus when defending home.

### Tick-Based Combat (Player Watching)

Same as current player combat system:
- 5-second combat ticks
- Hit chance, damage rolls, defense reduction
- Creatures can flee if losing badly (passive always try, aggressive at <25% HP)

### Player Intervention

If player attacks a creature mid-fight:
- Target switches to player (player is the bigger threat)
- Other creature may flee (passive) or continue fighting (aggressive)

**Intervention consequences:**
- Attack a predator -> it switches target to you
- Attack prey while predator watches -> predator may see you as competition (territorial response)
- Help kill something -> you get the loot/credit, but drew attention

---

## Player Notifications

### Distance-Based Awareness

The player experiences the living world differently based on proximity:

**Same room — Full detail:**
```
A wolf prowls in from the north.
The wolf spots a deer and snarls!
The deer bolts toward the eastern path!
The wolf gives chase!
```

```
A wolf lunges at the deer, tearing into its flank!
The deer staggers, bleeding heavily.
The wolf finishes off the deer with a vicious bite.
The wolf begins feeding on the carcass.
```

**Adjacent room — Summaries:**
```
You hear snarling and panicked bleating to the north.
```
```
The sounds of struggle fade. An eerie silence follows.
```
```
A blood-spattered wolf trots in from the north.
```

**2+ rooms away — Ambient hints:**
```
A distant howl echoes through the forest.
Birds scatter from the trees to the north.
You catch a faint scent of blood on the wind.
```

**Aftermath discovery:**
```
A deer carcass lies here, still warm. Something fed recently.
Claw marks and blood stain the ground - signs of a struggle.
```

**Notification priority:** Combat notifications take precedence but don't spam. Max 2-3 ambient messages per world tick.

---

## Corpses & Respawn

### Corpse Lifecycle

When a creature dies (to player, predator, or anything else):

1. **Death:** Creature removed from active creatures, corpse created
2. **Corpse visible:** Duration varies by who killed it
3. **Corpse fades:** "The deer carcass has been picked clean by scavengers."
4. **Respawn timer starts:** Creature queued to respawn at original spawn location

### Corpse Duration

| Killed By | Duration | Reasoning |
|-----------|----------|-----------|
| Another creature | 60 seconds | Predator "fed," natural cleanup |
| Player | 3 minutes | Player needs time to loot |
| Player (looted) | 30 seconds | Picked clean, fades quickly |

### Looting Commands

| Command | Action |
|---------|--------|
| `loot corpse` / `loot bandit` | Shows numbered list of items |
| `take dagger from corpse` | Take by item name |
| `take 1 from corpse` | Take by number from list |
| `take all from corpse` | Take everything |

**Example flow:**
```
> loot bandit
The bandit's corpse contains:
  1. Rusty Dagger
  2. 12 Gold Coins
  3. Leather Scraps

> take dagger from corpse
You take the Rusty Dagger.

> take all from corpse
You take 12 Gold Coins and Leather Scraps.

> loot bandit
The bandit's corpse has nothing left of value.
```

**Edge cases:**
- `loot` with no target defaults to corpse in room (if only one)
- Multiple corpses: `loot deer`, `loot wolf` — must specify
- Creature-killed corpses have reduced/no loot (predator ate the good stuff)

### Scaled Respawn Timers

| Tier | Respawn Time | Examples |
|------|--------------|----------|
| `ambient` | 2 minutes | Sheep, rabbit, frog |
| `common` | 5 minutes | Wolf, goblin, snake |
| `dangerous` | 10 minutes | Spider, bandit, bear |
| `apex` | 15 minutes | Troll |

### Respawn Rules

- Creatures respawn at their **original spawn location** (`spawnLocationId`)
- If spawn location is occupied by player, delay respawn by 1 tick
- Respawned creature has full HP and fresh state

### Ecosystem Balance

Prey respawns faster than predators. This naturally sustains the food chain — if wolves kill all the deer, deer will repopulate before wolves can overhunt.

---

## Implementation Summary

### New Creature Template Properties

```typescript
interface CreatureTemplate {
  // ... existing properties ...
  tier: 'ambient' | 'common' | 'dangerous' | 'apex';
}
```

### New Creature Instance Properties

```typescript
interface Creature {
  // ... existing properties ...
  spawnLocationId: string;    // For territory & respawn
  lastKillTime?: number;      // Future: hunger system
}
```

### New World State

```typescript
interface World {
  // ... existing properties ...
  corpses: Record<string, Corpse>;
  respawnQueue: RespawnEntry[];
}

interface Corpse {
  id: string;
  creatureId: string;
  name: string;
  locationId: string;
  createdAt: number;
  killedBy: 'creature' | 'player';
  looted: boolean;
  loot: Item[];
}

interface RespawnEntry {
  templateId: string;
  spawnLocationId: string;
  respawnAt: number;
}
```

### Modified Game Loop Functions

| Function | Purpose |
|----------|---------|
| `worldTick()` | Add: prey flee checks, active hunting, corpse cleanup, respawn processing |
| `combatTick()` | Add: creature-vs-creature combat resolution |
| `processCreatureMovement()` | Modify: prioritize hunting over random roaming |
| `moveCreature()` | Add: trigger flee response when predator arrives |

### New Game Loop Functions

| Function | Purpose |
|----------|---------|
| `processHunting()` | Predators scan for prey, move toward targets |
| `processFleeResponse()` | Prey react to predator arrivals |
| `resolveCreatureCombat()` | Handle creature-vs-creature fights (instant or tick-based) |
| `processCorpses()` | Fade old corpses, notify players |
| `processRespawns()` | Spawn creatures whose timer has elapsed |
| `getCreatureNotification()` | Distance-based message generation |

### Constants

```typescript
const TIER_CONFIG = {
  ambient:   { respawnMs: 120_000,  intimidationGap: 3  },
  common:    { respawnMs: 300_000,  intimidationGap: 5  },
  dangerous: { respawnMs: 600_000,  intimidationGap: 8  },
  apex:      { respawnMs: 900_000,  intimidationGap: 12 },
};

const CORPSE_DURATION = {
  creature_kill: 60_000,   // 1 minute
  player_kill: 180_000,    // 3 minutes
  looted: 30_000,          // 30 seconds after looting
};

const MAX_CHASE_DISTANCE = 3;
const CHASE_CHANCE = 0.5;
```

---

## Future Enhancements

These features are noted for future implementation once the core ecosystem is stable:

- **Pack behavior** — Wolves hunt together, goblins raid in groups
- **Hunger system** — Creatures have needs that drive behavior (hungry wolf hunts, full wolf rests)
- **Wandering NPCs** — NPCs that interact with the ecosystem meaningfully
- **Creature reproduction** — Long-term population dynamics
- **Seasonal behavior** — Migration, hibernation, breeding seasons
- **Food web complexity** — Omnivores, scavengers, apex competition
