# NPC Combat System & Spell Expansion Design

## Overview

Transform Easthollow NPCs from immortal background characters into dangerous level 30+ combatants who use class spells, create corpses when killed, and respond to player crimes with a tiered infamy system.

## Goals

1. Incursion raiders drop loot (quick fix)
2. All NPCs can die and create corpses with role-based loot
3. Easthollow NPCs are level 30+ with full combat stats
4. NPCs use class spells with reactive AI
5. Expand all classes to 10-12 spells (up to level 30)
6. Player infamy system for attacking NPCs

---

## 1. Player Infamy System

### Data Structure

Add to Player type:

```typescript
infamy?: {
  level: 'none' | 'suspect' | 'criminal' | 'murderer';
  townId: string;
  decayAt?: number;  // Game time when infamy drops one level
  bounty: number;    // Gold owed to clear name
}
```

### Infamy Levels

| Level | Trigger | NPC Behavior | Decay |
|-------|---------|--------------|-------|
| None | Default | Normal interactions | - |
| Suspect | Attack NPC, flee | Refuse trade, hostile dialogue | 10 min away from town |
| Criminal | Wound NPC | Guards warn to leave | 30 min OR pay bounty |
| Murderer | Kill NPC | Guards attack, civilians flee | Pay bounty OR die |

### Bounty Calculation

- Assault: 50 gold per incident
- Murder: 500 gold + (victim level × 20)

---

## 2. Enhanced NPC Combat System

### Updated Combat Interface

```typescript
combat: {
  level: number;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  class: ClassName;
  knownSpells: string[];
  abilityCooldowns: Record<string, number>;
  activeBuffs: StatusEffect[];
  aiPriority: 'defensive' | 'aggressive' | 'support';
}
```

### Easthollow NPC Combat Roles

| NPC | Class | Level | AI | Combat? |
|-----|-------|-------|-----|---------|
| Guard Marcus | warrior | 30 | aggressive | Yes |
| Guard Theron | warrior | 30 | aggressive | Yes |
| Priestess Lyanna | cleric | 30 | defensive | Yes |
| Trainer Aldric | warrior | 35 | aggressive | Yes |
| Innkeeper Mira | - | - | - | No (flees) |
| Shopkeeper Gareth | - | - | - | No (flees) |
| Alchemist Vera | - | - | - | No (flees) |
| Merchant Orlen | - | - | - | No (flees) |

### Fleeing Behavior

Non-combat NPCs run to the nearest guard location when threatened. Guards then move to investigate.

---

## 3. NPC Combat AI

### Decision Tree (per combat tick)

```
1. HP < 30%? → Use emergency ability (heal, vanish, etc.)
2. Ally HP < 50%? → Heal ally (defensive AI)
3. Enemy missing debuff? → Apply debuff
4. Enemy casting? → Use interrupt
5. Default → Damage rotation (execute if low HP > nuke > filler)
```

### Per-Class Priorities

| Class | Emergency | Primary | Secondary |
|-------|-----------|---------|-----------|
| Warrior | Second Wind | Shield Bash casters | Damage rotation |
| Cleric | Greater Heal | Heal wounded allies | Smite |
| Mage | Ice Barrier, Blink | Counterspell | Pyroblast |
| Rogue | Vanish | Kick casters | Backstab |
| Ranger | Feign Death | Slow fleeing targets | Aimed Shot |

### NPC vs Creature Combat

Combat NPCs auto-engage aggressive creatures entering their location (extends existing incursion system).

---

## 4. Spell Expansion (55 total spells)

### Warrior (10 spells)

| Lvl | Spell | Type |
|-----|-------|------|
| 1 | Battle Shout | buff |
| 2 | Heroic Strike | damage |
| 4 | Shield Bash | damage+stun |
| 8 | Rend | DoT |
| 12 | Intimidating Roar | debuff |
| 16 | Charge | damage |
| 20 | Second Wind | heal |
| 24 | Execute | damage |
| 28 | Berserker Rage | buff |
| 30 | Last Stand | buff |

### Cleric (11 spells)

| Lvl | Spell | Type |
|-----|-------|------|
| 1 | Light Heal | heal |
| 2 | Smite | damage |
| 3 | Blessing | buff |
| 4 | Heal | heal |
| 8 | Purify | utility |
| 12 | Holy Shield | buff |
| 16 | Consecrate | damage+DoT |
| 20 | Greater Heal | heal |
| 24 | Resurrection | utility |
| 28 | Divine Wrath | damage |
| 30 | Guardian Angel | buff |

### Mage (12 spells)

| Lvl | Spell | Type |
|-----|-------|------|
| 1 | Fire Bolt | damage |
| 2 | Frost Bolt | damage+slow |
| 3 | Arcane Missile | damage |
| 4 | Fireball | damage |
| 8 | Ice Barrier | buff |
| 12 | Blizzard | damage+DoT |
| 16 | Polymorph | CC |
| 20 | Blink | utility |
| 24 | Pyroblast | damage |
| 28 | Counterspell | utility |
| 30 | Time Warp | buff |

### Rogue (10 spells)

| Lvl | Spell | Type |
|-----|-------|------|
| 1 | Backstab | damage |
| 2 | Poison Blade | DoT |
| 4 | Evasion | buff |
| 8 | Kick | utility |
| 12 | Cheap Shot | damage+stun |
| 16 | Vanish | utility |
| 20 | Blade Flurry | buff |
| 24 | Expose Armor | debuff |
| 28 | Shadow Step | utility |
| 30 | Death's Embrace | damage |

### Ranger (12 spells)

| Lvl | Spell | Type |
|-----|-------|------|
| 1 | Hunter's Mark | debuff |
| 2 | Serpent Sting | DoT |
| 3 | Rapid Shot | damage |
| 5 | Track | utility |
| 10 | Set Trap | utility |
| 12 | Concussive Shot | damage+slow |
| 16 | Feign Death | utility |
| 20 | Aimed Shot | damage |
| 24 | Explosive Trap | damage |
| 28 | Aspect of Cheetah | buff |
| 30 | Kill Shot | damage |

---

## 5. NPC Loot & Death

### Role-Based Loot Tables

| Role | Gold | Items |
|------|------|-------|
| Guard | 50-150 | Guard's Longsword, Shield, Helm |
| Priest | 30-80 | Holy Symbol, Healing Potion |
| Shopkeeper | 100-300 | 1-3 items from shop inventory |
| Innkeeper | 50-100 | Room Key, Ale, Food |
| Trainer | 80-200 | Training Manual, Class weapon |

### NPC Corpse Type

```typescript
interface NPCCorpse {
  id: string;
  npcId: string;
  name: string;
  locationId: NodeId;
  createdAt: number;
  loot: ItemId[];
  looted: boolean;
  respawnAt: number;
}
```

### Respawn

- NPCs respawn after 30 minutes (game time)
- Shop/services unavailable during respawn

### Incursion Raider Loot (Quick Fix)

Use existing wilderness loot tables for goblin/wolf/bandit. Change `incursion.ts:289` to generate loot instead of passing `[]`.

---

## Implementation Order

1. **Quick fix: Incursion raider loot** - 10 min
2. **Spell expansion** - Add 36 new spells to spells.ts
3. **NPC combat interface** - Expand NPC type with full combat data
4. **Update Easthollow NPCs** - Add combat stats to all NPCs
5. **NPC AI system** - Create AI decision engine
6. **Infamy system** - Player state + NPC reactions
7. **NPC death/corpse** - Loot tables + corpse handling
8. **NPC vs creature combat** - Extend incursion system

---

## Files to Modify

| File | Changes |
|------|---------|
| `packages/shared/src/types/player.ts` | Add infamy field |
| `packages/shared/src/types/town.ts` | Expand NPC combat interface |
| `packages/shared/src/constants/spells.ts` | Add 36 new spells |
| `packages/shared/src/data/easthollow.ts` | Update NPC combat stats |
| `packages/server/src/game/incursion.ts` | Add loot generation |
| `packages/server/src/game/npc-combat.ts` | **NEW** - NPC AI engine |
| `packages/server/src/game/infamy.ts` | **NEW** - Infamy system |
| `packages/server/src/loot/npc-loot.ts` | **NEW** - NPC loot tables |
| `packages/server/src/commands/handlers.ts` | Allow attacking NPCs |
| `packages/server/src/game/game-loop.ts` | NPC combat tick |
