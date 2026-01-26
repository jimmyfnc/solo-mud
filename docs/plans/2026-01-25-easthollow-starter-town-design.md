# Easthollow Starter Town & Tutorial System Design

## Overview

**Easthollow** is a hand-crafted static starter town where all new players spawn. It provides a safe environment to learn game mechanics through NPC-guided tutorials before venturing into the procedurally generated wilderness.

**Design Goals:**
- Welcoming first experience for new players
- Class-specific training for Warriors, Mages, and Rogues
- Optional tutorial with rewards for both completion and skipping
- Natural flow from safe town to dangerous wilderness

## Town Architecture

### Layout (7 Locations)

```
                         [Training Yard]
                               |
[Town Gate] -- [Town Square] -- [The Rusty Blade Inn]
                    |
              [Market Street]
              /            \
      [Blacksmith]    [Alchemist]
              \            /
            [General Store]
```

### Location Details

| ID | Name | Description | NPCs |
|----|------|-------------|------|
| `town_inn` | The Rusty Blade Inn | Cozy tavern, player spawn point | Innkeeper Mira |
| `town_square` | Town Square | Central hub with a well and notice board | — |
| `town_training` | Training Yard | Open yard with training equipment | Captain Holt, Apprentice Sera, Shadow |
| `town_market` | Market Street | Cobblestone street lined with shops | — |
| `town_blacksmith` | The Iron Anvil | Hot forge with weapons on display | Forge Master Kira |
| `town_alchemist` | Elwin's Remedies | Cluttered shop with bubbling potions | Sage Elwin |
| `town_general` | Thom's Supplies | Well-stocked general store | Merchant Thom |
| `town_gate` | Town Gate | Guarded archway to the wilderness | — |

### Technical Implementation

- Town locations use `town_` prefix to distinguish from procedural `loc_` locations
- All town rooms have `isSafeZone: true` (no combat, no creature spawns)
- Town Gate connects to `loc_0` (first wilderness node)
- Town is templated into each player's world instance (not shared)
- Player spawns at `town_inn` instead of `loc_0`

## NPCs

### NPC Data Structure

```typescript
interface NPC {
  id: string;
  name: string;
  title?: string;
  locationId: string;
  dialogue: DialogueTopic[];
  shop?: ShopInventory;
  tutorialTopics?: string[];
}

interface DialogueTopic {
  id: string;
  prompt: string;        // What player sees as option
  response: string;      // NPC's response
  teachesCommand?: string; // Marks tutorial step complete
}
```

### NPC Roster

| NPC | Title | Location | Role |
|-----|-------|----------|------|
| **Mira** | Innkeeper | The Rusty Blade Inn | Tutorial guide, rest, game overview |
| **Captain Holt** | Guard Captain | Training Yard | Warrior combat training |
| **Apprentice Sera** | Mage Trainer | Training Yard | Mage spell training |
| **Shadow** | Rogue Trainer | Training Yard | Rogue stealth training |
| **Thom** | Merchant | General Store | Basic supplies vendor |
| **Kira** | Forge Master | Blacksmith | Weapons/armor vendor |
| **Elwin** | Sage | Alchemist | Potions vendor |

## Dialogue System

### Commands

- `talk <npc>` or `talk to <npc>` - Start conversation
- `say <number>` or just `<number>` - Select dialogue option
- `buy <item>` / `sell <item>` - Shop interactions
- `list` or `browse` - See shop inventory

### Dialogue Flow

NPCs use topic-based dialogue. Example with Mira:

```
> talk mira

Innkeeper Mira smiles warmly. "Welcome to the Rusty Blade, traveler! What would you like to know?"
  1. How do I look around?
  2. How do I pick things up?
  3. Where should I go first?
  4. Nothing right now, thanks.

> 1

Mira nods. "Just type 'look' to see your surroundings. You can also 'look' at specific things, like 'look sword' or 'look mira' to examine them more closely."
```

## Tutorial System

### Tutorial Checklist

New players have a tutorial progress tracker:

```
Tutorial Progress:
[ ] Speak with Innkeeper Mira
[ ] Complete class training
[ ] Practice on Training Dummy
[ ] Visit a shop
[ ] Leave through Town Gate
```

Players can check progress with `tutorial` command.

### Skip Option

On first spawn, Mira offers a choice:

```
Innkeeper Mira looks up as you enter. "Ah, a new face! Welcome to Easthollow.
Would you like me to show you around, or are you an experienced adventurer?"

  1. Show me around (start tutorial)
  2. I know what I'm doing (skip tutorial)
```

### Tutorial Rewards

| Path | Rewards |
|------|---------|
| **Complete Tutorial** | Traveler's Pack: 5 rations, 3 torches, 1 health potion |
| **Skip Tutorial** | Adventurer's Satchel: 10 rations, 5 torches, 3 health potions, 50 gold, class bonus item |

**Class Bonus Items (skip reward):**
- **Warrior**: Steel Whetstone (+5% damage for 10 fights)
- **Mage**: Mana Crystal (restores 50 mana, 1 use)
- **Rogue**: Smoke Bomb (guaranteed flee, 1 use)

### Class-Specific Training

The Training Yard adapts based on player class:

| Class | Trainer | Training Content |
|-------|---------|------------------|
| **Warrior** | Captain Holt | Melee combat, attack command, flee mechanics |
| **Mage** | Apprentice Sera | Spell casting, mana management, cast command |
| **Rogue** | Shadow | Sneak attacks, stealth, backstab mechanics |

Captain Holt directs players to the appropriate trainer:
> "Ah, a mage! Sera over there can teach you about channeling your power."

### Training Dummy

A special entity in the Training Yard:
- Can be attacked but never dies (HP resets)
- Deals no damage to player
- Provides feedback on combat mechanics
- Class-specific variants:
  - **Training Dummy** (melee) - for Warriors
  - **Target Dummy** (ranged/spell) - for Mages
  - **Shadow Target** (stealth practice) - for Rogues

## Shop System

### Shop Inventory Structure

```typescript
interface ShopInventory {
  items: ShopItem[];
  buyMultiplier: number;   // Price multiplier when buying (e.g., 1.0)
  sellMultiplier: number;  // Price multiplier when selling (e.g., 0.5)
}

interface ShopItem {
  itemId: string;
  basePrice: number;
  stock?: number;          // undefined = unlimited
}
```

### Shop Inventories

**General Store (Thom):**
- Torch (5g) - unlimited
- Rations (3g) - unlimited
- Rope (10g) - unlimited
- Empty Flask (5g) - unlimited
- Basic Bandage (8g) - unlimited

**Blacksmith (Kira):**
- Iron Sword (50g) - 3 stock
- Iron Axe (55g) - 2 stock
- Wooden Shield (30g) - 5 stock
- Leather Armor (40g) - 3 stock
- Chain Mail (120g) - 1 stock

**Alchemist (Elwin):**
- Health Potion (25g) - 10 stock
- Mana Potion (25g) - 10 stock
- Antidote (15g) - 5 stock
- Stamina Tonic (20g) - 5 stock

## Connection to Wilderness

### Town Gate Behavior

When player goes through Town Gate:
1. If tutorial incomplete: "Are you sure? The wilderness is dangerous. (yes/no)"
2. If tutorial complete or skipped: Direct passage to `loc_0`
3. First exit triggers tutorial completion reward if earned

### Wilderness Entry Point

`loc_0` (first procedural location) is designed as a transition zone:
- Lower danger level (ambient/common creatures only)
- Clear path back to town visible
- Biome matches "plains" or "forest edge" for gentle introduction

## Data Files

### Town Locations File

Create `packages/shared/src/data/easthollow.ts`:
- Static location definitions
- NPC definitions with dialogue trees
- Shop inventories
- Tutorial checklist items

### Integration Points

1. **Session creation** (`session.ts`):
   - Set `startId` to `town_inn` instead of `loc_0`
   - Initialize tutorial progress state

2. **World generation** (`generate.ts`):
   - Merge town locations into world before procedural generation
   - Connect `town_gate` to `loc_0`

3. **Command handlers** (`handlers.ts`):
   - Add `talk` command handler
   - Add `buy`/`sell` command handlers
   - Add `tutorial` command to check progress

4. **Safe zone logic**:
   - Skip combat initiation in safe zones
   - Prevent creature spawning in town

## Future Considerations

- Multiple towns in larger worlds
- Town events (merchants visiting, festivals)
- Reputation system with town NPCs
- Player housing in town
- Town notice board for quests
