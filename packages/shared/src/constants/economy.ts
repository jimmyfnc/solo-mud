import type { MerchantRecipe, ResourceNode } from '../types';

export interface MerchantEconomyConfig {
  merchantId: string;
  startingCash: number;
  startingMaterials: Record<string, number>;
}

export const MERCHANT_ECONOMY_CONFIGS: Record<string, MerchantEconomyConfig> = {
  npc_mira: {
    merchantId: 'npc_mira',
    startingCash: 500,
    startingMaterials: { grain: 12, fresh_water: 12, dairy: 8, dried_meat: 6, timber: 4, cloth: 4, berries: 4, leather: 2 },
  },
  npc_thom: {
    merchantId: 'npc_thom',
    startingCash: 800,
    startingMaterials: { timber: 10, cloth: 10, plant_fiber: 12, grain: 8, dried_meat: 6, glass: 6, iron_ore: 3 },
  },
  npc_kira: {
    merchantId: 'npc_kira',
    startingCash: 1500,
    startingMaterials: { iron_ore: 18, coal: 12, timber: 10, leather: 10 },
  },
  npc_elwin: {
    merchantId: 'npc_elwin',
    startingCash: 1000,
    startingMaterials: { medicinal_herb: 16, arcane_bloom: 10, marsh_herb: 10, bitterroot: 10, glass: 12, fresh_water: 12 },
  },
};

export const MERCHANT_RECIPES: MerchantRecipe[] = [
  { id: 'mira_ale', merchantId: 'npc_mira', outputBaseId: 'ale', outputQuantity: 3, targetStock: 12, productionMinutes: 30, inputs: [{ baseId: 'grain', quantity: 2 }, { baseId: 'fresh_water', quantity: 1 }] },
  { id: 'mira_wine', merchantId: 'npc_mira', outputBaseId: 'wine', outputQuantity: 2, targetStock: 6, productionMinutes: 60, inputs: [{ baseId: 'berries', quantity: 2 }] },
  { id: 'mira_bread', merchantId: 'npc_mira', outputBaseId: 'bread', outputQuantity: 4, targetStock: 12, productionMinutes: 20, inputs: [{ baseId: 'grain', quantity: 2 }, { baseId: 'fresh_water', quantity: 1 }] },
  { id: 'mira_cheese', merchantId: 'npc_mira', outputBaseId: 'cheese_wedge', outputQuantity: 3, targetStock: 9, productionMinutes: 45, inputs: [{ baseId: 'dairy', quantity: 2 }] },
  { id: 'mira_rations', merchantId: 'npc_mira', outputBaseId: 'rations', outputQuantity: 3, targetStock: 9, productionMinutes: 30, inputs: [{ baseId: 'grain', quantity: 1 }, { baseId: 'dried_meat', quantity: 1 }] },
  { id: 'mira_waterskin', merchantId: 'npc_mira', outputBaseId: 'waterskin', outputQuantity: 1, targetStock: 4, productionMinutes: 45, inputs: [{ baseId: 'leather', quantity: 1 }, { baseId: 'fresh_water', quantity: 1 }] },
  { id: 'mira_torch', merchantId: 'npc_mira', outputBaseId: 'torch', outputQuantity: 2, targetStock: 6, productionMinutes: 20, inputs: [{ baseId: 'timber', quantity: 1 }, { baseId: 'cloth', quantity: 1 }] },

  { id: 'thom_torch', merchantId: 'npc_thom', outputBaseId: 'torch', outputQuantity: 3, targetStock: 10, productionMinutes: 20, inputs: [{ baseId: 'timber', quantity: 1 }, { baseId: 'cloth', quantity: 1 }] },
  { id: 'thom_rations', merchantId: 'npc_thom', outputBaseId: 'rations', outputQuantity: 3, targetStock: 10, productionMinutes: 30, inputs: [{ baseId: 'grain', quantity: 1 }, { baseId: 'dried_meat', quantity: 1 }] },
  { id: 'thom_rope', merchantId: 'npc_thom', outputBaseId: 'rope', outputQuantity: 2, targetStock: 6, productionMinutes: 30, inputs: [{ baseId: 'plant_fiber', quantity: 3 }] },
  { id: 'thom_flask', merchantId: 'npc_thom', outputBaseId: 'empty_flask', outputQuantity: 3, targetStock: 8, productionMinutes: 30, inputs: [{ baseId: 'glass', quantity: 2 }] },
  { id: 'thom_bandage', merchantId: 'npc_thom', outputBaseId: 'bandage', outputQuantity: 3, targetStock: 8, productionMinutes: 20, inputs: [{ baseId: 'cloth', quantity: 2 }] },
  { id: 'thom_pickaxe', merchantId: 'npc_thom', outputBaseId: 'mining_pick', outputQuantity: 1, targetStock: 3, productionMinutes: 90, inputs: [{ baseId: 'iron_ore', quantity: 2 }, { baseId: 'timber', quantity: 1 }] },

  { id: 'kira_sword', merchantId: 'npc_kira', outputBaseId: 'iron_sword', outputQuantity: 1, targetStock: 3, productionMinutes: 90, inputs: [{ baseId: 'iron_ore', quantity: 3 }, { baseId: 'coal', quantity: 1 }] },
  { id: 'kira_axe', merchantId: 'npc_kira', outputBaseId: 'iron_axe', outputQuantity: 1, targetStock: 2, productionMinutes: 90, inputs: [{ baseId: 'iron_ore', quantity: 3 }, { baseId: 'coal', quantity: 1 }, { baseId: 'timber', quantity: 1 }] },
  { id: 'kira_shield', merchantId: 'npc_kira', outputBaseId: 'wooden_shield', outputQuantity: 1, targetStock: 5, productionMinutes: 60, inputs: [{ baseId: 'timber', quantity: 2 }, { baseId: 'leather', quantity: 1 }] },
  { id: 'kira_leather', merchantId: 'npc_kira', outputBaseId: 'leather_armor', outputQuantity: 1, targetStock: 3, productionMinutes: 90, inputs: [{ baseId: 'leather', quantity: 4 }] },
  { id: 'kira_chain', merchantId: 'npc_kira', outputBaseId: 'chain_mail', outputQuantity: 1, targetStock: 1, productionMinutes: 180, inputs: [{ baseId: 'iron_ore', quantity: 6 }, { baseId: 'coal', quantity: 2 }] },

  { id: 'elwin_health', merchantId: 'npc_elwin', outputBaseId: 'health_potion', outputQuantity: 2, targetStock: 10, productionMinutes: 45, inputs: [{ baseId: 'medicinal_herb', quantity: 2 }, { baseId: 'glass', quantity: 1 }, { baseId: 'fresh_water', quantity: 1 }] },
  { id: 'elwin_mana', merchantId: 'npc_elwin', outputBaseId: 'mana_potion', outputQuantity: 2, targetStock: 10, productionMinutes: 60, inputs: [{ baseId: 'arcane_bloom', quantity: 2 }, { baseId: 'glass', quantity: 1 }, { baseId: 'fresh_water', quantity: 1 }] },
  { id: 'elwin_antidote', merchantId: 'npc_elwin', outputBaseId: 'antidote', outputQuantity: 2, targetStock: 5, productionMinutes: 30, inputs: [{ baseId: 'marsh_herb', quantity: 2 }, { baseId: 'glass', quantity: 1 }] },
  { id: 'elwin_stamina', merchantId: 'npc_elwin', outputBaseId: 'stamina_tonic', outputQuantity: 2, targetStock: 5, productionMinutes: 45, inputs: [{ baseId: 'bitterroot', quantity: 2 }, { baseId: 'glass', quantity: 1 }, { baseId: 'fresh_water', quantity: 1 }] },
];

export const RESOURCE_NODE_TEMPLATES: ResourceNode[] = [
  { id: 'node_iron_foothills', name: 'iron vein', locationId: 'wild_foothills', materialBaseId: 'iron_ore', gatherVerb: 'mine', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 180, requiredToolTag: 'pickaxe' },
  { id: 'node_coal_ridge', name: 'coal seam', locationId: 'wild_ridge', materialBaseId: 'coal', gatherVerb: 'mine', quantity: 6, maxQuantity: 6, yieldPerGather: 2, respawnMinutes: 240, requiredToolTag: 'pickaxe' },
  { id: 'node_timber_forest', name: 'fallen timber', locationId: 'wild_forest_1', materialBaseId: 'timber', gatherVerb: 'chop', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 120, requiredToolTag: 'axe' },
  { id: 'node_fiber_meadow', name: 'hemp patch', locationId: 'wild_meadow', materialBaseId: 'plant_fiber', gatherVerb: 'harvest', quantity: 10, maxQuantity: 10, yieldPerGather: 2, respawnMinutes: 90 },
  { id: 'node_grain_fields', name: 'grain field', locationId: 'woods_fields', materialBaseId: 'grain', gatherVerb: 'harvest', quantity: 12, maxQuantity: 12, yieldPerGather: 2, respawnMinutes: 90 },
  { id: 'node_herbs_stream', name: 'medicinal herb patch', locationId: 'wild_stream_bank', materialBaseId: 'medicinal_herb', gatherVerb: 'gather', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 120 },
  { id: 'node_marsh_herbs', name: 'marsh herb patch', locationId: 'wild_marsh_edge', materialBaseId: 'marsh_herb', gatherVerb: 'gather', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 150 },
  { id: 'node_bitterroot', name: 'bitterroot patch', locationId: 'wild_thicket', materialBaseId: 'bitterroot', gatherVerb: 'gather', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 150 },
  { id: 'node_arcane_bloom', name: 'arcane bloom cluster', locationId: 'woods_pixie_glade', materialBaseId: 'arcane_bloom', gatherVerb: 'gather', quantity: 6, maxQuantity: 6, yieldPerGather: 1, respawnMinutes: 240 },
  { id: 'node_berries', name: 'berry thicket', locationId: 'wild_meadow', materialBaseId: 'berries', gatherVerb: 'gather', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 120 },
  { id: 'node_fresh_water', name: 'fresh-water spring', locationId: 'wild_stream_bank', materialBaseId: 'fresh_water', gatherVerb: 'gather', quantity: 12, maxQuantity: 12, yieldPerGather: 3, respawnMinutes: 60 },
  { id: 'node_dairy_farm', name: 'farm dairy stores', locationId: 'woods_farmhouse', materialBaseId: 'dairy', gatherVerb: 'gather', quantity: 8, maxQuantity: 8, yieldPerGather: 2, respawnMinutes: 120 },
  { id: 'node_dried_meat', name: 'smokehouse stores', locationId: 'wild_bandit_camp', materialBaseId: 'dried_meat', gatherVerb: 'gather', quantity: 6, maxQuantity: 6, yieldPerGather: 2, respawnMinutes: 180 },
  { id: 'node_cloth', name: 'abandoned cloth bundles', locationId: 'wild_bandit_camp', materialBaseId: 'cloth', gatherVerb: 'gather', quantity: 6, maxQuantity: 6, yieldPerGather: 2, respawnMinutes: 180 },
  { id: 'node_leather', name: 'curing hides', locationId: 'wild_wolf_den', materialBaseId: 'leather', gatherVerb: 'gather', quantity: 6, maxQuantity: 6, yieldPerGather: 2, respawnMinutes: 240 },
  { id: 'node_glass', name: 'salvageable glass', locationId: 'wild_ruins_gate', materialBaseId: 'glass', gatherVerb: 'gather', quantity: 6, maxQuantity: 6, yieldPerGather: 2, respawnMinutes: 240 },
];
