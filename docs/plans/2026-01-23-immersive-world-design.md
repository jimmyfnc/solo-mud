# Immersive World Design

## Overview

Improve game immersion by replacing mechanical displays with natural prose and populating the world with interactable creatures and items.

## Room Description System

### Two-Tier Display

**Tier 1: Room Entry (brief, immersive)**

When entering a room, show natural prose without tactical breakdowns:

```
[ Hollow ]
The wind sweeps across the golden plains. Morning light illuminates the landscape.
A grazing sheep pays you no mind. A wolf watches from the treeline.
From here you can see a cliff down below and a valley through the old door.
```

**Tier 2: Explicit "look" (detailed)**

When player types "look", append tactical information:

```
[ Hollow ]
The wind sweeps across the golden plains. Morning light illuminates the landscape.
A grazing sheep pays you no mind. A wolf watches from the treeline.
From here you can see a cliff down below and a valley through the old door.

Items: health potion, rusty key
Creatures: sheep (passive), wolf (hostile)
Exits: down (Cliff), door (Valley)
```

### Exit Prose Generation

Replace `south -> Camp` format with natural descriptions.

**Exit templates by type:**
- Cardinal directions: "a camp to the south", "ruins to the east"
- Vertical: "a cliff down below", "a ledge above"
- Named passages: "a valley through the old door", "darkness beyond the tunnel"

**Sentence structure:**
> "From here you can see [exit1], [exit2], and [exit3]."
> "From here you can see a camp to the south and ruins to the east. A dark tunnel opens nearby."

### Changes Required

1. Remove `(loc_X)` debug IDs from room names
2. Generate exit prose from direction + label + destination
3. Weave creatures into description prose
4. "look" command reveals structured Items/Creatures/Exits lines
5. Room entry shows brief version (no tactical lines)

---

## Creature System

### Static Creatures (ambient)

- Spawn during world generation based on biome
- Stay in assigned room permanently
- Mostly passive - flee or ignore player
- Examples: sheep, rabbits, deer, fish, birds, squirrels

### Roaming Creatures (threats)

- Spawn with a "home" room
- Patrol territory of 2-3 connected rooms
- Move every 2-3 minutes (game time)
- Return home if straying beyond leash range
- Examples: wolves, bandits, bears, spiders, goblins

### Behavior Types

- **Aggressive**: Attack player on sight
- **Territorial**: Attack if player lingers or approaches
- **Passive**: Only fight if provoked (most static creatures)

### Biome Creature Tables

| Biome | Static | Roaming |
|-------|--------|---------|
| Plains | sheep, rabbits | wolves, bandits |
| Forest | deer, squirrels | wolves, bears, spiders |
| Hills | goats, eagles | bandits, trolls |
| Swamp | frogs, snakes | giant spiders, goblins |
| Mountains | goats, ravens | bears, trolls, wyverns |

### Creature Prose Templates

Static creatures:
- "A grazing sheep pays you no mind."
- "Rabbits scatter at your approach."
- "A deer watches cautiously from the treeline."

Roaming/hostile creatures:
- "A wolf watches you from the shadows."
- "A bandit blocks the path ahead."
- "Something moves in the darkness."

---

## Item System

### World Generation Placement

- 1-3 items placed per location during generation
- Rarity scales with location depth:
  - Depth 0-2: Common (basic potions, rusty weapons)
  - Depth 3-5: Uncommon
  - Depth 6-8: Rare
  - Depth 9+: Epic/Legendary possible

### Creature Loot Drops

- Passive creatures: minimal (pelts, meat, feathers)
- Hostile creatures: weapons, gold, consumables
- Stronger creatures = better loot tables

### Item Categories

- **Weapons**: swords, axes, bows, daggers
- **Armor**: helmets, chest pieces, boots, gloves
- **Consumables**: health potions, food, antidotes
- **Keys**: unlock specific exits
- **Materials**: crafting components, sellable junk

### Item Prose Templates

- "You notice a health potion among the rocks."
- "A glint of metal catches your eye - an old sword lies half-buried."
- "Something glimmers in the grass."

---

## Implementation Phases

### Phase 1: Immersive Exits
- Generate exit prose from templates
- Remove debug IDs from room names
- Update look command for two-tier display

### Phase 2: Creature Spawning
- Define creature templates with biome associations
- Spawn static creatures during world generation
- Display creatures in room prose

### Phase 3: Roaming Creatures
- Implement creature movement tick
- Territory and leash range logic
- Aggressive creature auto-attack

### Phase 4: Item Population
- Place items during world generation
- Depth-based rarity scaling
- Item prose templates
- Creature loot drops on death

---

## Files to Modify

- `packages/server/src/commands/handlers.ts` - look command, room display
- `packages/server/src/world/generate.ts` - creature/item spawning
- `packages/server/src/descriptions/templates.ts` - exit/creature/item prose
- `packages/shared/src/types/world.ts` - creature type definitions (if needed)
- New: `packages/server/src/creatures/spawner.ts` - creature generation
- New: `packages/server/src/creatures/roaming.ts` - movement tick logic
