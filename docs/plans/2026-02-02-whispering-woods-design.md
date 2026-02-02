# Whispering Woods Zone Design

**Date:** 2026-02-02
**Status:** Approved
**Level Range:** 7-20
**Theme:** Fey/Dark Fairy Tale (Corrupted Forest)

## Overview

A new mid-level zone east of Easthollow featuring a hub-based dark forest with 5 distinct sub-zones, each with its own mini-boss. The zone culminates in a level 20 boss fight against the Corrupted Dryad Matriarch. Introduces set pieces, jewelry drops, and a bank system.

## Zone Layout

### Travel Path (Town → Woods)

```
[Eastern Road] ─east─> [Farmhouse] ─east─> [Fields] ─east─> [East Guard Gate]
     (town)              (safe)            (safe)         (guards warn you)
                                                                  │
                                                                east
                                                                  │
                                                          [Old Farm Road]
                                                                  │
                                                          (5-6 transitional rooms)
                                                                  │
                                                        [Whispering Clearing]
                                                            (Central Hub)
                                                         /    |    |    \    \
                                                        N    NW    E    SE    S
                                                        │     │    │     │    │
                                                   [Pixie] [Fen] [Stones] [Spider] [Thorn]
                                                    Dell         Hollow   Maze
```

### Room Counts

| Area | Rooms |
|------|-------|
| Transition zone (farms → gate → old road) | 8-10 |
| Central hub | 1 |
| Sub-zones (5 × ~8 rooms) | ~40 |
| Matriarch's area | 3 |
| **Total** | **~50-55** |

### Transition Zone

1. **Farmhouse** - Peaceful farm, NPC farmer with rumors about the woods
2. **Fields** - Crops, scarecrows, pastoral - last safe area
3. **East Guard Gate** - Two guards, open passage with warning dialogue
4. **Old Farm Road** (5-6 rooms) - Gradually shifts from pastoral to eerie: overgrown fields, abandoned carts, fog rolling in, dead crops, the treeline looming

### Guard Gate Mechanic

- **No level requirement** - guards warn but allow passage
- Dialogue: "The Whispering Woods are no place for the inexperienced. Proceed at your own risk."

---

## Sub-Zones

### Structure

Each sub-zone has 7-8 rooms leading to a mini-boss chamber. Creature levels tier up as you go deeper.

### Pixie Dell (Levels 7-10) - North from Hub

**Atmosphere:** Deceptively pretty, bioluminescent flowers, giggling sounds, trap-laden

**Rooms:** Entrance → Glade → Flower Maze (3 rooms) → Trapped Grove → Trickster's Court

| Creature | Level | Location |
|----------|-------|----------|
| Mischievous Sprite | 7 | Entrance, Glade |
| Quickling | 8 | Flower Maze |
| Hostile Pixie | 9 | Trapped Grove |
| **Sprite Trickster** | **10** | **Trickster's Court** |

**Fragment Drop:** *Fragment of Innocence*

---

### Murky Fen (Levels 9-12) - Northwest from Hub

**Atmosphere:** Swampy, foggy, twisted roots, stagnant pools

**Rooms:** Entrance → Bog Path → Sunken Ruins (2 rooms) → Redcap Camp → Chieftain's Mound

| Creature | Level | Location |
|----------|-------|----------|
| Shadow Hound | 9 | Entrance, Bog Path |
| Redcap | 10 | Sunken Ruins |
| Bog Lurker | 11 | Redcap Camp |
| **Redcap Chieftain** | **12** | **Chieftain's Mound** |

**Fragment Drop:** *Fragment of Fury*

---

### Standing Stones (Levels 11-14) - East from Hub

**Atmosphere:** Ancient megaliths, ritual circles, ghostly whispers

**Rooms:** Entrance → Old Path → Stone Circle → Ritual Ground (2 rooms) → Shaman's Altar

| Creature | Level | Location |
|----------|-------|----------|
| Will-o-wisp | 11 | Entrance, Old Path |
| Dark Satyr | 12 | Stone Circle |
| Corrupted Druid | 13 | Ritual Ground |
| **Satyr Shaman** | **14** | **Shaman's Altar** |

**Fragment Drop:** *Fragment of Spirit*

---

### Spider Hollow (Levels 13-16) - Southeast from Hub

**Atmosphere:** Webbed trees, cocoons, darkness, skittering sounds

**Rooms:** Entrance → Webbed Trail → Cocoon Chamber → Nest Tunnels (3 rooms) → Queen's Lair

| Creature | Level | Location |
|----------|-------|----------|
| Giant Spider | 13 | Entrance, Webbed Trail |
| Ettercap | 14 | Cocoon Chamber |
| Broodmother Spider | 15 | Nest Tunnels |
| **Spider Queen** | **16** | **Queen's Lair** |

**Fragment Drop:** *Fragment of Hunger*

---

### Thornwood Maze (Levels 16-18) - South from Hub

**Atmosphere:** Dense brambles, confusing paths, bleeding thorns

**Rooms:** Entrance → Bramble Path → Dead End loops (3 rooms) → Thorn Garden → Thornlord's Den

| Creature | Level | Location |
|----------|-------|----------|
| Thorn Crawler | 16 | Entrance, Bramble Path |
| Bramble Beast | 17 | Dead End loops |
| Twisted Treant | 17 | Thorn Garden |
| **Thornlord** | **18** | **Thornlord's Den** |

**Fragment Drop:** *Fragment of Growth*

---

### Matriarch's Sanctum (Levels 18-20) - Unlocked after collecting all fragments

**Rooms:** Blighted Altar (key assembly) → Blighted Grove → Sanctum Approach → Heart of the Grove

| Creature | Level | Location |
|----------|-------|----------|
| Corrupted Dryad | 18 | Blighted Grove |
| Matriarch's Handmaiden | 19 | Sanctum Approach |
| **Corrupted Dryad Matriarch** | **20** | **Heart of the Grove** |

---

## Dryad's Heart Key

Players must collect 5 fragments from mini-bosses to access the Matriarch:

| Fragment | Source |
|----------|--------|
| Fragment of Innocence | Sprite Trickster |
| Fragment of Fury | Redcap Chieftain |
| Fragment of Spirit | Satyr Shaman |
| Fragment of Hunger | Spider Queen |
| Fragment of Growth | Thornlord |

**Assembly:** Combine all 5 fragments at the **Blighted Altar** (room before Matriarch's Sanctum) to form the **Dryad's Heart Key**, which opens the final door.

---

## Loot System

### Class-Specific Unique Drops

Each mini-boss drops a unique item for one class:

| Boss | Level | Class | Item | Slot | Concept |
|------|-------|-------|------|------|---------|
| Sprite Trickster | 10 | Rogue | *Flickerblade* | weapon | Dagger that phases through armor, bonus crit |
| Redcap Chieftain | 12 | Warrior | *Bloodcap Cleaver* | weapon | Brutal axe, lifesteal on kill |
| Satyr Shaman | 14 | Cleric | *Totem of the Wild Spirit* | offhand | Healing boost, mana regen |
| Spider Queen | 16 | Mage | *Venomweave Wand* | weapon | Poison DoT on spells, spell power |
| Thornlord | 18 | Ranger | *Bramblewood Bow* | weapon | Nature damage, root chance on hit |
| Matriarch | 20 | All | *Heartwood Amulet* | necklace | Universal stats (HP, resistances) |

### Set Pieces

**5 class-specific sets, 6 pieces each (30 items total)**

| Boss | Level | Set Slot |
|------|-------|----------|
| Sprite Trickster | 10 | Gloves |
| Redcap Chieftain | 12 | Boots |
| Satyr Shaman | 14 | Belt |
| Spider Queen | 16 | Shoulders |
| Thornlord | 18 | Helm |
| Matriarch | 20 | Chest |

**Drop Mechanic:** Random class drop (may get warrior gloves on your mage). Encourages trading, alts, and using the bank.

### Set Names

| Class | Set Name | Theme |
|-------|----------|-------|
| Warrior | Thornguard Set | Tank/damage |
| Mage | Veilweave Set | Spell power/mana |
| Rogue | Shadowthorn Set | Crit/agility |
| Cleric | Spiritwood Set | Healing/protection |
| Ranger | Wildwood Set | Ranged/nature |

### Set Bonuses

#### Thornguard Set (Warrior)

| Pieces | Bonus |
|--------|-------|
| 2 | +50 Max HP |
| 4 | +10% Physical Resistance |
| 6 | *Thorns Aura* - Attackers take damage when they hit you |

#### Veilweave Set (Mage)

| Pieces | Bonus |
|--------|-------|
| 2 | +30 Max MP |
| 4 | +15% Spell Power |
| 6 | *Veil of Shadows* - 10% chance to avoid damage entirely |

#### Shadowthorn Set (Rogue)

| Pieces | Bonus |
|--------|-------|
| 2 | +10% Crit Chance |
| 4 | +20% Crit Damage |
| 6 | *Fey Step* - First attack after entering combat always crits |

#### Spiritwood Set (Cleric)

| Pieces | Bonus |
|--------|-------|
| 2 | +20% Healing Power |
| 4 | +25 Max MP, +5 MP regen |
| 6 | *Nature's Grace* - Heals have 15% chance to cost no mana |

#### Wildwood Set (Ranger)

| Pieces | Bonus |
|--------|-------|
| 2 | +15% Ranged Damage |
| 4 | +10% Dodge Chance |
| 6 | *Predator's Mark* - Attacks against the same target deal stacking damage |

---

## Bank System

### Location

New building on **Market Street**: **Easthollow Vault**

```
[Market Street]
    /    |    \
   w     s     e
   │     │     │
[Smith][General][Alchemist]
               │
              (new)
               │
        [Easthollow Vault]
```

### Banker NPC

**Thaddeus the Vault Keeper**
- Older, meticulous, slightly paranoid about security
- Dialogue options: Deposit, Withdraw, View Balance

### Storage

| Tab | Capacity | Scope | Purpose |
|-----|----------|-------|---------|
| Personal | 30 slots | Per-character | Character-specific storage |
| Shared | 20 slots | Account-wide | Transfer items between alts |

### Commands

```
bank              - Open bank interface / talk to banker
deposit <item>    - Put item in personal tab
deposit <item> shared - Put item in shared tab
withdraw <item>   - Take from personal tab
withdraw <item> shared - Take from shared tab
bank list         - View all stored items
```

### Future Expansion (not in initial build)

- Purchasable extra slots (gold sink)
- Bank tabs for organization
- Secure trading via bank

---

## New Systems Required

1. **Set Piece Bonus Tracking**
   - Track which set pieces are equipped
   - Calculate and apply 2/4/6 piece bonuses
   - Display active set bonuses in character sheet

2. **Bank Storage**
   - Personal storage per character
   - Shared storage per account
   - Persistence in database

3. **Fragment Collection / Key Assembly**
   - Track collected fragments per character
   - Assembly interaction at Blighted Altar
   - Key unlocks Matriarch's Sanctum

---

## Creature Summary

| Creature | Level | Sub-Zone |
|----------|-------|----------|
| Mischievous Sprite | 7 | Pixie Dell |
| Quickling | 8 | Pixie Dell |
| Hostile Pixie | 9 | Pixie Dell |
| **Sprite Trickster** | **10** | **Pixie Dell (Boss)** |
| Shadow Hound | 9 | Murky Fen |
| Redcap | 10 | Murky Fen |
| Bog Lurker | 11 | Murky Fen |
| **Redcap Chieftain** | **12** | **Murky Fen (Boss)** |
| Will-o-wisp | 11 | Standing Stones |
| Dark Satyr | 12 | Standing Stones |
| Corrupted Druid | 13 | Standing Stones |
| **Satyr Shaman** | **14** | **Standing Stones (Boss)** |
| Giant Spider | 13 | Spider Hollow |
| Ettercap | 14 | Spider Hollow |
| Broodmother Spider | 15 | Spider Hollow |
| **Spider Queen** | **16** | **Spider Hollow (Boss)** |
| Thorn Crawler | 16 | Thornwood Maze |
| Bramble Beast | 17 | Thornwood Maze |
| Twisted Treant | 17 | Thornwood Maze |
| **Thornlord** | **18** | **Thornwood Maze (Boss)** |
| Corrupted Dryad | 18 | Matriarch's Sanctum |
| Matriarch's Handmaiden | 19 | Matriarch's Sanctum |
| **Corrupted Dryad Matriarch** | **20** | **Heart of the Grove (Final Boss)** |

**Total: 22 new creature types (6 bosses, 16 regular)**

---

## Implementation Order (Suggested)

1. **Phase 1: Zone Structure**
   - Transition zone locations (farms, gate, old road)
   - Whispering Clearing hub
   - Sub-zone locations (empty, no creatures)

2. **Phase 2: Creatures**
   - Creature templates for all 22 types
   - Spawn configurations per location
   - Basic loot tables

3. **Phase 3: Set System**
   - Set piece items (30 items)
   - Set bonus calculation
   - UI for displaying set bonuses

4. **Phase 4: Bank System**
   - Bank location and NPC
   - Storage backend (personal + shared)
   - Bank commands

5. **Phase 5: Boss Mechanics & Unique Loot**
   - Boss-specific abilities/mechanics
   - Class unique items
   - Fragment/key system

6. **Phase 6: Polish**
   - Room descriptions and atmosphere
   - NPC dialogue (guards, farmer, banker)
   - Testing and balance
