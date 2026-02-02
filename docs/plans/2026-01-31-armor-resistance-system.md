# Armor & Resistance System Design

## Overview

Implement a full damage type and resistance system with physical defense from armor and elemental resistances from affixes.

## Damage Types

Five damage types:
- **Physical** - Melee attacks, arrows
- **Fire** - Fire spells, fire creatures
- **Ice** - Ice spells, frost creatures
- **Lightning** - Lightning spells, storm creatures
- **Poison** - Poison spells, snakes, spiders

## Resistance Formula

```
damage_taken = base_damage * (1 - resistance / 100)
```

- 10 resistance = 10% damage reduction
- Cap at 75% reduction (75 resist max effective)
- Minimum 1 damage always dealt

## Resistance Sources

- **Defense**: `CON + 5 + sum(armor base defense)`
- **Elemental resists**: `floor(WIS / 3) + sum(resist affixes)`

## Armor Base Defense

| Slot | Defense Range | Notes |
|------|---------------|-------|
| Head | 2-8 | Helms, hoods |
| Chest | 5-15 | Largest contribution |
| Hands | 1-4 | Gloves |
| Legs | 3-10 | Pants, greaves |
| Feet | 2-6 | Boots |
| Cloak | 1-5 | Light protection |
| Shield | 5-12 | Offhand |

**Defense scaling by rarity:**
- Junk: 50%
- Common: 100%
- Uncommon: 125%
- Rare: 150%
- Epic: 200%

**Jewelry (rings, necklace):** No base defense, elemental resists from affixes only.

## New Affixes

### Elemental Resistance Affixes (Suffix)

| Affix | Bonus | Rarity |
|-------|-------|--------|
| Fireproof | +5-15 fire resist | Any |
| Flameward | +10-25 fire resist | Rare+ |
| Insulated | +5-15 lightning resist | Any |
| Stormward | +10-25 lightning resist | Rare+ |
| Frostproof | +5-15 ice resist | Any |
| Frostward | +10-25 ice resist | Rare+ |
| Venomproof | +5-15 poison resist | Any |
| Venomward | +10-25 poison resist | Rare+ |

### Jewelry Affixes (Prefix)

| Affix | Bonus | Allowed On |
|-------|-------|------------|
| Healthy | +10-30 max HP | Rings, Amulets |
| Vigorous | +20-50 max HP | Rare+ amulets |
| Mystical | +5-15 max MP | Rings, Amulets |
| Arcane | +10-30 max MP | Rare+ amulets |
| Warrior's | +1-3 STR | Rings |
| Scholar's | +1-3 INT | Rings |
| Sage's | +1-3 WIS | Rings |
| Nimble | +1-3 DEX | Rings |
| Hardy | +1-3 CON | Rings |

## Affix Counts by Rarity

| Rarity | Affix Count |
|--------|-------------|
| Junk | 0 |
| Common | 0-1 (50% for 1) |
| Uncommon | 1 |
| Rare | 1-2 (guaranteed 1, 50% for 2nd) |
| Epic | 2-3 (guaranteed 2, 50% for 3rd) |

Epic items can have 2 prefixes OR 2 suffixes (breaks normal 1/1 rule).

## Creature Damage Types

| Creature | Damage Type |
|----------|-------------|
| Rat | Physical |
| Large Rat | Physical |
| King Rat | Poison |

Future creatures will use appropriate elemental types.

## Implementation Order

1. Types (DamageType, CombatStats resistances)
2. Item changes (baseDefense, new affixes)
3. Stats calculation (resistances from gear)
4. Combat integration (damage formulas)
5. Update creatures with damageType

## Files Modified

- `packages/shared/src/types/character.ts` - DamageType, CombatStats resistances
- `packages/shared/src/types/item.ts` - baseDefense on Item
- `packages/server/src/loot/item-generator.ts` - Resistance affixes, multi-affix, base defense
- `packages/server/src/character/stats.ts` - Calculate resistances
- `packages/server/src/combat/auto-attack.ts` - Damage type + resistances
- `packages/server/src/game/game-loop.ts` - Creature damage with resistances
- `packages/shared/src/data/creatures.ts` - damageType on templates
- `packages/server/src/commands/handlers.ts` - Spell damage with resistances

## Out of Scope

- Armor weight class restrictions
- Set bonuses
- Creature resistances
