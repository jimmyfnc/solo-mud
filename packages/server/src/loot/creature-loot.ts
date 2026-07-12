/**
 * Creature loot registry.
 *
 * One place that maps a creature templateId to its loot source, replacing the
 * old scattered `if (SEWER_LOOT_TABLES[...]) else if (WILDERNESS...)` checks.
 * New zones register their tables (one entry) and every kill site — combat
 * ticks, traps, town defense, incursions — picks them up automatically.
 */

import type { Item, Rng } from '@solo-mud/shared';
import type { LootTable, ItemTemplate } from './item-generator';
import { generateLootDrop } from './item-generator';
import { SEWER_LOOT_TABLES, generateSewerLoot } from './sewer-loot';
import { WILDERNESS_LOOT_TABLES, generateWildernessLoot } from './wilderness-loot';
import { WOODS_LOOT_TABLES, WOODS_ITEM_TEMPLATES } from './woods-loot';

/** A zone's contribution to creature loot */
export interface LootSource {
  /** Loot tables keyed by creature templateId */
  tables: Record<string, LootTable>;
  /** Generates loot for a templateId this source owns */
  generate: (templateId: string, level: number, rng: Rng) => Item[];
}

/** Woods bosses always drop (fragments + a shot at their unique) */
const WOODS_GUARANTEED = [
  'sprite_trickster', 'redcap_chieftain', 'satyr_shaman',
  'spider_queen', 'thornlord', 'corrupted_dryad_matriarch',
];

/** Registered loot sources, checked in order */
const LOOT_SOURCES: LootSource[] = [
  { tables: SEWER_LOOT_TABLES, generate: generateSewerLoot },
  { tables: WILDERNESS_LOOT_TABLES, generate: generateWildernessLoot },
  makeLootSource(WOODS_LOOT_TABLES, WOODS_ITEM_TEMPLATES, WOODS_GUARANTEED),
];

/**
 * Build a LootSource from plain zone data (what generated zone files export).
 * @param guaranteeFor templateIds whose drops are guaranteed (bosses)
 */
export function makeLootSource(
  tables: Record<string, LootTable>,
  templates: Record<string, ItemTemplate>,
  guaranteeFor: string[] = []
): LootSource {
  return {
    tables,
    generate: (templateId, level, rng) => {
      const lootTable = tables[templateId];
      if (!lootTable) return [];
      return generateLootDrop({
        lootTable,
        level,
        rng,
        guaranteeDrop: guaranteeFor.includes(templateId),
        templates,
      });
    },
  };
}

/** Register a new zone's loot source (generated zone files call this out in their header). */
export function registerLootSource(source: LootSource): void {
  LOOT_SOURCES.push(source);
}

/** Whether any registered source has a loot table for this creature. */
export function hasCreatureLoot(templateId: string): boolean {
  return LOOT_SOURCES.some((s) => s.tables[templateId] !== undefined);
}

/**
 * Generate loot for a killed creature from whichever source owns its table.
 * Returns [] if no source has a table for this templateId.
 */
export function generateCreatureLoot(templateId: string, level: number, rng: Rng): Item[] {
  for (const source of LOOT_SOURCES) {
    if (source.tables[templateId]) {
      return source.generate(templateId, level, rng);
    }
  }
  return [];
}
