# Solo MUD Commands Reference

Complete reference for all available commands in Solo MUD.

## Quick Reference

| Command | Aliases | Description |
|---------|---------|-------------|
| `look` | `l` | Examine your surroundings |
| `examine <target>` | `ex`, `exam` | Look at something closely |
| `use <item/object>` | - | Use an item or interact with something |
| `go <direction>` | `move`, `walk` | Move in a direction |
| `north` | `n` | Move north |
| `south` | `s` | Move south |
| `east` | `e` | Move east |
| `west` | `w` | Move west |
| `up` | `u` | Move up |
| `down` | `d` | Move down |
| `take <item>` | `get`, `grab`, `pickup` | Pick up an item |
| `take <item> from <source>` | `get ... from` | Take item from corpse/container |
| `drop <item>` | - | Drop an item |
| `loot <corpse>` | - | Examine a corpse for loot |
| `inventory` | `i`, `inv` | Check your inventory |
| `equipment` | `eq` | View equipped items |
| `equip <item>` | - | Equip an item from inventory |
| `unequip <slot/item>` | - | Remove an equipped item |
| `debug` | - | Show raw game data (dev) |
| `help` | `?` | Show help message |

---

## Movement Commands

### Basic Movement

Move using compass directions:

```
north (n)    - Move north
south (s)    - Move south
east (e)     - Move east
west (w)     - Move west
up (u)       - Move up
down (d)     - Move down
```

### Go Command

The `go` command supports custom exit labels (not just compass directions):

```
go north           - Move north
go passage         - Enter a passage
go door            - Go through a door
go path            - Follow a path
```

### Exit Disambiguation

When multiple exits have the same label, the game will prompt you to specify which one:

```
> go passage
There are multiple ways passage. Specify which one:
  go passage to Hollow
  go passage to Grove

> go passage to Hollow
You go passage.
[ Hollow (loc_123) ]
...
```

**Syntax:** `go <exit> to <destination>`

The destination is matched against location names (partial matches work).

---

## Looking and Examining

### Look

Examine your current surroundings:

```
look
l
```

Shows:
- Location name and description
- Items in the room
- Available exits (with destinations)

### Examine

Look at something specific:

```
examine <target>
ex <target>
exam <target>
```

Can examine:
- Items in the room
- Props (statues, stones, markers)
- Items in your inventory

**Example:**
```
> examine stone
You examine the interesting stone. It looks interesting.

> examine silver key
Silver Key
Rarity: uncommon
Tags: key, small
```

---

## Item Interaction

### Use Command

Interact with items or objects:

```
use <item>
use <object>
```

**Keys:** Using a key near a locked exit tells you if it fits:

```
> use silver key
The Silver Key fits the lock on the passage leading to Dark Cave.
The way is now open! Use "go passage" to proceed.
```

**Consumables:** Uses the item (potions, food, etc.):

```
> use health potion
You use the Health Potion. (Effect not yet implemented)
```

**Props:** Interact with room features:

```
> use well
You peer into the old well. The water below is dark and still.
You could draw some water, but you have nothing to carry it in.

> use obelisk
You touch the ancient obelisk. Ancient runes seem to glow faintly.
It might be significant, but you cannot decipher its meaning yet.
```

### Take / Get

Pick up an item from the room:

```
take <item>
get <item>
grab <item>
pickup <item>
```

**Example:**
```
> take silver key
You pick up the Silver Key.
```

### Drop

Drop an item from your inventory:

```
drop <item>
```

**Example:**
```
> drop torch
You drop the Torch.
```

---

## Looting

### Loot Command

Examine a corpse for items:

```
loot <corpse>
loot                  - Loot the only corpse in the room
loot bandit           - Loot a specific corpse
```

**Example:**
```
> loot bandit
The bandit's corpse contains:
  1. Rusty Dagger
  2. 12 Gold Coins
  3. Leather Scraps
```

### Taking from Corpses

Take specific items from a corpse:

```
take <item> from corpse
take 1 from corpse             - Take by number from loot list
take dagger from corpse        - Take by item name
take all from corpse           - Take everything
```

**Example:**
```
> take dagger from corpse
You take the Rusty Dagger.

> take all from corpse
You take 12 Gold Coins and Leather Scraps.

> loot bandit
The bandit's corpse has nothing left of value.
```

### Corpse Duration

- **Creature kills:** Corpses last ~60 seconds (predator fed)
- **Player kills:** Corpses last ~3 minutes (time to loot)
- **After looting:** Corpses fade after ~30 seconds

---

## Inventory & Equipment

### Inventory

View your current inventory:

```
inventory
i
inv
```

Shows:
- Items and quantities
- Gold amount
- Current/max carry weight

### Equipment

View your equipped items:

```
equipment
eq
```

**Equipment Slots:**
- Weapon
- Off-hand
- Head
- Chest
- Hands
- Legs
- Feet
- Ring 1, Ring 2
- Necklace
- Cloak

### Equip

Equip an item from your inventory:

```
equip <item>
```

The item is auto-assigned to the appropriate slot based on its tags. If a slot is occupied, the old item moves to inventory.

**Example:**
```
> equip iron sword
You equip the Iron Sword.

> equip silver ring
You equip the Silver Ring.
(Silver Ring equipped to Ring 1)
```

### Unequip

Remove an equipped item (moves to inventory):

```
unequip <slot>
unequip <item name>
```

**Examples:**
```
> unequip weapon
You unequip the Iron Sword.

> unequip iron sword
You unequip the Iron Sword.

> unequip ring1
You unequip the Silver Ring.
```

---

## Development Commands

### Debug

Show raw game data for testing and development:

```
debug
```

Displays:
- World seed
- Player ID and location ID
- Raw location data (biome weights, props, visit count)
- Exit details (IDs, types, requirements)
- Item details (IDs, tags, rarity)
- Adjacent location summary

**Example output:**
```
=== DEBUG INFO ===

World Seed: 12345
Player ID: player_abc123
Location ID: loc_456

--- LOCATION ---
Name: Misty Clearing
Biome: {"forest":0.7,"swamp":0.3}
Props: ["twisted oak","moss-covered stone"]
Visit Count: 3
Item IDs: ["item_789"]

--- EXITS ---
  exit_1:
    Label: passage | To: loc_101 (Dark Hollow)
    Type: normal | Req: null
  exit_2:
    Label: north | To: loc_102 (Open Field)
    Type: locked | Req: {"kind":"item","value":"item_silver_key"}

--- ROOM ITEMS ---
  item_789: Rusty Dagger
    Rarity: common | Tags: weapon, dagger, small

--- ADJACENT LOCATIONS ---
  loc_101: Dark Hollow
  loc_102: Open Field
```

---

## Help

Show the in-game help message:

```
help
?
```

---

## Locked Exits

Some exits require a key to pass through:

1. Exits show `[LOCKED]` indicator when locked
2. Find the required key (shown when attempting to pass)
3. Either:
   - Use `use <key>` to check if it fits
   - Simply `go <direction>` - the key auto-unlocks if in inventory

```
> look
Exits:
  passage -> Dark Cave [LOCKED]
  north -> Open Field

> go passage
The way passage is locked. You need the Silver Key.

> take silver key
You pick up the Silver Key.

> go passage
You use the Silver Key to unlock the way.
You go passage.
[ Dark Cave ]
...
```

---

## Tips

1. **Tab completion** - Not yet implemented, but planned
2. **Command history** - Use up/down arrows to cycle through previous commands
3. **Partial matches** - Item names can be partial: `take sil` matches "Silver Key"
4. **Case insensitive** - All commands are case-insensitive
5. **Quoted strings** - Use quotes for multi-word targets: `examine "silver key"`
