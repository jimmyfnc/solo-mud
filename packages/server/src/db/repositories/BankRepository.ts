/**
 * Repository for bank storage operations.
 */

import { getDatabase } from '../database';
import type { Item } from '@solo-mud/shared';

export interface BankSlot {
  slot: number;
  item: Item;
}

const PERSONAL_CAPACITY = 30;
const SHARED_CAPACITY = 20;

export class BankRepository {
  /**
   * Get all items in a character's personal bank.
   */
  getPersonalStorage(characterId: string): BankSlot[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT slot, item_data FROM bank_storage
      WHERE character_id = ? AND tab = 'personal'
      ORDER BY slot
    `).all(characterId) as { slot: number; item_data: string }[];

    return rows.map(row => ({
      slot: row.slot,
      item: JSON.parse(row.item_data) as Item,
    }));
  }

  /**
   * Get all items in the account's shared bank.
   */
  getSharedStorage(accountId: string): BankSlot[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT slot, item_data FROM bank_storage
      WHERE account_id = ? AND tab = 'shared'
      ORDER BY slot
    `).all(accountId) as { slot: number; item_data: string }[];

    return rows.map(row => ({
      slot: row.slot,
      item: JSON.parse(row.item_data) as Item,
    }));
  }

  /**
   * Deposit an item to personal bank. Returns slot number or -1 if full.
   */
  depositPersonal(characterId: string, accountId: string, item: Item): number {
    const db = getDatabase();

    // Find next available slot
    const existing = this.getPersonalStorage(characterId);
    const usedSlots = new Set(existing.map(e => e.slot));

    let slot = -1;
    for (let i = 0; i < PERSONAL_CAPACITY; i++) {
      if (!usedSlots.has(i)) {
        slot = i;
        break;
      }
    }

    if (slot === -1) return -1; // Bank full

    db.prepare(`
      INSERT INTO bank_storage (account_id, character_id, slot, item_data, tab)
      VALUES (?, ?, ?, ?, 'personal')
    `).run(accountId, characterId, slot, JSON.stringify(item));

    return slot;
  }

  /**
   * Deposit an item to shared bank. Returns slot number or -1 if full.
   */
  depositShared(accountId: string, item: Item): number {
    const db = getDatabase();

    // Find next available slot
    const existing = this.getSharedStorage(accountId);
    const usedSlots = new Set(existing.map(e => e.slot));

    let slot = -1;
    for (let i = 0; i < SHARED_CAPACITY; i++) {
      if (!usedSlots.has(i)) {
        slot = i;
        break;
      }
    }

    if (slot === -1) return -1; // Bank full

    db.prepare(`
      INSERT INTO bank_storage (account_id, character_id, slot, item_data, tab)
      VALUES (?, NULL, ?, ?, 'shared')
    `).run(accountId, slot, JSON.stringify(item));

    return slot;
  }

  /**
   * Withdraw an item from personal bank. Returns the item or null.
   */
  withdrawPersonal(characterId: string, slot: number): Item | null {
    const db = getDatabase();

    const row = db.prepare(`
      SELECT item_data FROM bank_storage
      WHERE character_id = ? AND slot = ? AND tab = 'personal'
    `).get(characterId, slot) as { item_data: string } | undefined;

    if (!row) return null;

    db.prepare(`
      DELETE FROM bank_storage
      WHERE character_id = ? AND slot = ? AND tab = 'personal'
    `).run(characterId, slot);

    return JSON.parse(row.item_data) as Item;
  }

  /**
   * Withdraw an item from shared bank. Returns the item or null.
   */
  withdrawShared(accountId: string, slot: number): Item | null {
    const db = getDatabase();

    const row = db.prepare(`
      SELECT item_data FROM bank_storage
      WHERE account_id = ? AND slot = ? AND tab = 'shared'
    `).get(accountId, slot) as { item_data: string } | undefined;

    if (!row) return null;

    db.prepare(`
      DELETE FROM bank_storage
      WHERE account_id = ? AND slot = ? AND tab = 'shared'
    `).run(accountId, slot);

    return JSON.parse(row.item_data) as Item;
  }

  /**
   * Get bank capacity info.
   */
  getCapacity(): { personal: number; shared: number } {
    return { personal: PERSONAL_CAPACITY, shared: SHARED_CAPACITY };
  }
}

// Singleton instance
export const bankRepository = new BankRepository();
