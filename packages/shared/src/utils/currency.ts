/**
 * Currency utility functions.
 * Exchange rates: 10 copper = 1 silver, 10 silver = 1 gold
 */

import type { Currency } from '../types/character';

export const COPPER_PER_SILVER = 10;
export const SILVER_PER_GOLD = 10;
export const COPPER_PER_GOLD = COPPER_PER_SILVER * SILVER_PER_GOLD; // 100

/**
 * Format currency for display.
 * Omits zero values for cleaner output.
 * Examples: "2g 5s 10c", "5s 10c", "15c"
 */
export function formatCurrency(currency: Currency): string {
  const parts: string[] = [];

  if (currency.gold > 0) {
    parts.push(`${currency.gold}g`);
  }
  if (currency.silver > 0) {
    parts.push(`${currency.silver}s`);
  }
  if (currency.copper > 0 || parts.length === 0) {
    parts.push(`${currency.copper}c`);
  }

  return parts.join(' ');
}

/**
 * Format a price (in copper) for display.
 * Converts to highest denominations.
 * Examples: 150 -> "1g 5s", 25 -> "2s 5c", 8 -> "8c"
 */
export function formatPrice(copperAmount: number): string {
  const gold = Math.floor(copperAmount / COPPER_PER_GOLD);
  const remaining = copperAmount % COPPER_PER_GOLD;
  const silver = Math.floor(remaining / COPPER_PER_SILVER);
  const copper = remaining % COPPER_PER_SILVER;

  return formatCurrency({ gold, silver, copper });
}

/**
 * Get total value in copper.
 */
export function getTotalCopper(currency: Currency): number {
  return (
    currency.copper +
    currency.silver * COPPER_PER_SILVER +
    currency.gold * COPPER_PER_GOLD
  );
}

/**
 * Check if player can afford a price (in copper).
 */
export function canAfford(currency: Currency, priceInCopper: number): boolean {
  return getTotalCopper(currency) >= priceInCopper;
}

/**
 * Spend currency with auto-conversion.
 * Returns new currency state after deduction.
 * Spends lowest denomination first, breaks higher coins when needed.
 */
export function spendCurrency(currency: Currency, priceInCopper: number): Currency {
  const total = getTotalCopper(currency);
  if (total < priceInCopper) {
    throw new Error('Insufficient funds');
  }

  const remaining = total - priceInCopper;

  // Convert remaining back to denominations
  // Simple approach: convert everything to copper, subtract, then rebuild
  // This naturally handles the "breaking" of higher coins
  const newGold = Math.floor(remaining / COPPER_PER_GOLD);
  const afterGold = remaining % COPPER_PER_GOLD;
  const newSilver = Math.floor(afterGold / COPPER_PER_SILVER);
  const newCopper = afterGold % COPPER_PER_SILVER;

  return {
    gold: newGold,
    silver: newSilver,
    copper: newCopper,
  };
}

/**
 * Add currency (for selling items or receiving payment).
 * Amount is in copper, distributed to appropriate denominations.
 * Does NOT auto-convert up (keeps the denomination it was given as).
 */
export function addCopper(currency: Currency, copperAmount: number): Currency {
  return {
    ...currency,
    copper: currency.copper + copperAmount,
  };
}

/**
 * Add silver directly.
 */
export function addSilver(currency: Currency, silverAmount: number): Currency {
  return {
    ...currency,
    silver: currency.silver + silverAmount,
  };
}

/**
 * Add gold directly.
 */
export function addGold(currency: Currency, goldAmount: number): Currency {
  return {
    ...currency,
    gold: currency.gold + goldAmount,
  };
}

/**
 * Create an empty currency object.
 */
export function emptyCurrency(): Currency {
  return { copper: 0, silver: 0, gold: 0 };
}

/**
 * Create currency from copper amount (for migration).
 * Keeps it all as copper, no conversion.
 */
export function currencyFromCopper(copper: number): Currency {
  return { copper, silver: 0, gold: 0 };
}
