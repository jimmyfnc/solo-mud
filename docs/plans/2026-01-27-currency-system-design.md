# Currency System Design

## Overview

Replace the single `gold` currency with a tiered copper/silver/gold system that adds depth to the economy while keeping transactions simple.

## Currency Tiers

- **Copper (c)** - Base currency, earned from common monsters
- **Silver (s)** - 10 copper = 1 silver, earned from tougher creatures
- **Gold (g)** - 10 silver = 1 gold (100 copper), rare drops from bosses/quests

Platinum reserved for future endgame content.

## Data Model

```typescript
// Player.currency replaces Player.gold
currency: {
  copper: number;
  silver: number;
  gold: number;
}
```

## Behaviors

### Picking Up Coins
- Coin items (Copper Coin, Silver Coin, Gold Coin) auto-add to wallet
- Do NOT take inventory space
- Message: "You pick up 3 copper coins." (added to currency, not inventory)

### Display
- Inventory shows: `Currency: 2g 5s 10c`
- Omit zero values for cleaner display: `Currency: 5s 10c` (no gold shown)

### Shop Transactions
- Prices stored as copper value internally
- Display formatted: "Health Potion - 15c" or "Fine Sword - 1s 50c"
- Auto-conversion during purchase:
  1. Spend lowest denomination first (copper → silver → gold)
  2. "Break" higher coins only when needed
  3. Return change in appropriate denominations

### Combat Rewards
- Current "You gain 15 gold" becomes "You gain 15 copper"
- Tougher creatures drop silver
- Bosses/rare encounters drop gold

## Migration Strategy

- Existing `gold` column value → `copper` field
- Add `silver` and `gold` columns (default 0)
- No data loss, existing currency becomes copper

## Files to Modify

1. `packages/shared/src/types/character.ts` - Currency type
2. `packages/shared/src/utils/currency.ts` (new) - Helpers
3. `packages/server/src/db/schema.sql` - Add columns
4. `packages/server/src/db/repositories/CharacterRepository.ts` - CRUD
5. `packages/server/src/character/player-factory.ts` - New player currency
6. `packages/server/src/game/restore.ts` - Migration logic
7. `packages/server/src/commands/handlers.ts` - Inventory, buy, sell, loot
8. `packages/server/src/socket.ts` - Save currency
9. Loot tables - Mark coins as currency type

## Utility Functions

```typescript
// Format for display
formatCurrency(copper, silver, gold): string
// "2g 5s 10c" or "5s 10c" if gold is 0

// Get total value in copper
getTotalCopper(copper, silver, gold): number

// Check if player can afford a price (in copper)
canAfford(player, priceInCopper): boolean

// Deduct price with auto-conversion, returns new currency state
spendCurrency(player, priceInCopper): Currency

// Add currency (for selling items)
addCurrency(player, amountInCopper): Currency
```
