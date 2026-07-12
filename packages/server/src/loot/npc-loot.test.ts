/**
 * Tests for NPC loot generation.
 */

import { describe, it, expect } from 'vitest';
import { createRng } from '@solo-mud/shared';
import {
  generateNpcLoot,
  calculateNpcGoldDrop,
  NPC_LOOT_TABLES,
  NPC_ITEM_TEMPLATES,
} from './npc-loot';

describe('NPC Loot System', () => {
  describe('NPC_LOOT_TABLES', () => {
    it('should have loot tables for all NPC roles', () => {
      expect(NPC_LOOT_TABLES.guard).toBeDefined();
      expect(NPC_LOOT_TABLES.shopkeeper).toBeDefined();
      expect(NPC_LOOT_TABLES.innkeeper).toBeDefined();
      expect(NPC_LOOT_TABLES.priest).toBeDefined();
      expect(NPC_LOOT_TABLES.trainer).toBeDefined();
      expect(NPC_LOOT_TABLES.citizen).toBeDefined();
    });

    it('should have appropriate entries for guards', () => {
      const guardTable = NPC_LOOT_TABLES.guard;
      expect(guardTable.dropChance).toBe(1.0); // Guards always drop
      expect(guardTable.entries.length).toBeGreaterThan(0);

      // Guards should drop weapons/armor
      const templateIds = guardTable.entries.map(e => e.templateId);
      expect(templateIds).toContain('guard-sword');
      expect(templateIds).toContain('guard-shield');
    });

    it('should have appropriate entries for shopkeepers', () => {
      const shopTable = NPC_LOOT_TABLES.shopkeeper;
      expect(shopTable.dropChance).toBe(1.0);

      // Shopkeepers should drop gold/trade goods
      const templateIds = shopTable.entries.map(e => e.templateId);
      expect(templateIds).toContain('gold-pouch');
      expect(templateIds).toContain('trade-goods');
    });

    it('should have appropriate entries for priests', () => {
      const priestTable = NPC_LOOT_TABLES.priest;

      // Priests should drop holy items
      const templateIds = priestTable.entries.map(e => e.templateId);
      expect(templateIds).toContain('holy-symbol');
      expect(templateIds).toContain('prayer-beads');
    });
  });

  describe('NPC_ITEM_TEMPLATES', () => {
    it('should have all referenced templates', () => {
      // Check that all templates referenced in loot tables exist
      for (const table of Object.values(NPC_LOOT_TABLES)) {
        for (const entry of table.entries) {
          expect(NPC_ITEM_TEMPLATES[entry.templateId]).toBeDefined();
        }
      }
    });

    it('should have valid item properties', () => {
      for (const [id, template] of Object.entries(NPC_ITEM_TEMPLATES)) {
        expect(template.id).toBe(id);
        expect(template.name).toBeDefined();
        expect(template.baseValue).toBeGreaterThanOrEqual(0);
        expect(template.tags).toBeDefined();
        expect(template.levelRange).toHaveLength(2);
      }
    });
  });

  describe('generateNpcLoot', () => {
    it('should generate loot for guards', () => {
      const rng = createRng('test-guard-loot');
      const loot = generateNpcLoot('guard', 30, rng);

      expect(loot.length).toBeGreaterThan(0);
      for (const item of loot) {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
      }
    });

    it('should generate loot for shopkeepers', () => {
      const rng = createRng('test-shopkeeper-loot');
      const loot = generateNpcLoot('shopkeeper', 25, rng);

      expect(loot.length).toBeGreaterThan(0);
    });

    it('should generate loot for citizens', () => {
      const rng = createRng('test-citizen-loot');
      const loot = generateNpcLoot('citizen', 10, rng);

      // Citizens have 80% drop chance, so they might not always drop
      expect(Array.isArray(loot)).toBe(true);
    });

    it('should be deterministic with same seed', () => {
      const rng1 = createRng('same-seed');
      const rng2 = createRng('same-seed');

      const loot1 = generateNpcLoot('guard', 30, rng1);
      const loot2 = generateNpcLoot('guard', 30, rng2);

      expect(loot1.length).toBe(loot2.length);
      for (let i = 0; i < loot1.length; i++) {
        expect(loot1[i]!.name).toBe(loot2[i]!.name);
      }
    });
  });

  describe('calculateNpcGoldDrop', () => {
    it('should scale with NPC level', () => {
      const rng1 = createRng('gold-test-1');
      const rng2 = createRng('gold-test-1');

      const lowLevelGold = calculateNpcGoldDrop('guard', 10, rng1);
      const highLevelGold = calculateNpcGoldDrop('guard', 30, rng2);

      // Higher level should drop more gold on average
      // Using same seed ensures fair comparison
      expect(highLevelGold).toBeGreaterThan(lowLevelGold);
    });

    it('should vary by role', () => {
      // Shopkeepers should drop more gold than citizens
      const rng1 = createRng('role-test');
      const rng2 = createRng('role-test');

      const shopkeeperGold = calculateNpcGoldDrop('shopkeeper', 20, rng1);
      const citizenGold = calculateNpcGoldDrop('citizen', 20, rng2);

      expect(shopkeeperGold).toBeGreaterThan(citizenGold);
    });

    it('should return positive copper value', () => {
      const rng = createRng('positive-test');
      const gold = calculateNpcGoldDrop('guard', 30, rng);

      expect(gold).toBeGreaterThan(0);
    });

    it('should have some variance', () => {
      // Run multiple times with different seeds
      const results = new Set<number>();
      for (let i = 0; i < 10; i++) {
        const rng = createRng(`variance-test-${i}`);
        results.add(calculateNpcGoldDrop('guard', 20, rng));
      }

      // Should have some variety in drops
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
