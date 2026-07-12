import { beforeEach, describe, expect, it } from 'vitest';
import { MERCHANT_ECONOMY_CONFIGS, MERCHANT_RECIPES, RESOURCE_NODE_TEMPLATES, type World } from '@solo-mud/shared';
import { createPlayer } from '../character';
import { generateWorld } from '../world/generate';
import {
  fulfillWorkOrder,
  gatherResource,
  getOpenWorkOrders,
  processEconomyTick,
  ensureEconomyState,
} from './economy-manager';

describe('merchant economy', () => {
  let world: World;

  beforeEach(() => {
    world = generateWorld({ seed: 'economy-test', nodeCount: 1, extraEdges: 0, lockedEdges: 0 });
  });

  it('initializes cash, materials, and recipes for every merchant category', () => {
    expect(Object.keys(MERCHANT_ECONOMY_CONFIGS)).toEqual([
      'npc_mira',
      'npc_thom',
      'npc_kira',
      'npc_elwin',
    ]);

    for (const merchantId of Object.keys(MERCHANT_ECONOMY_CONFIGS)) {
      const shop = world.npcs[merchantId]?.shop;
      expect(shop?.cash).toBeGreaterThan(0);
      expect(Object.keys(shop?.materials ?? {}).length).toBeGreaterThan(0);
      expect(MERCHANT_RECIPES.some(recipe => recipe.merchantId === merchantId)).toBe(true);
    }

    const gatherableMaterials = new Set(RESOURCE_NODE_TEMPLATES.map(node => node.materialBaseId));
    for (const recipe of MERCHANT_RECIPES) {
      for (const input of recipe.inputs) {
        expect(gatherableMaterials.has(input.baseId), `${input.baseId} should have a resource node`).toBe(true);
      }
    }
  });

  it('upgrades pre-economy snapshots without resetting depleted stock', () => {
    const shop = world.npcs['npc_thom']!.shop!;
    shop.items = shop.items.filter(item => item.baseId !== 'mining_pick');
    shop.items.find(item => item.baseId === 'torch')!.stock = undefined;
    shop.items.find(item => item.baseId === 'rations')!.stock = 0;
    world.economy = undefined;

    ensureEconomyState(world);

    expect(shop.items.find(item => item.baseId === 'mining_pick')?.stock).toBe(3);
    expect(shop.items.find(item => item.baseId === 'torch')?.stock).toBe(10);
    expect(shop.items.find(item => item.baseId === 'rations')?.stock).toBe(0);
  });

  it('consumes merchant materials to replenish depleted stock', () => {
    const shop = world.npcs['npc_kira']!.shop!;
    const sword = shop.items.find(item => item.baseId === 'iron_sword')!;
    sword.stock = 0;
    shop.materials = { ...shop.materials, iron_ore: 3, coal: 1 };

    processEconomyTick(world);
    world.time.totalMinutes += 90;
    const events = processEconomyTick(world);

    expect(sword.stock).toBe(1);
    expect(shop.materials['iron_ore']).toBe(0);
    expect(shop.materials['coal']).toBe(0);
    expect(events).toContainEqual({
      type: 'restocked',
      merchantId: 'npc_kira',
      baseId: 'iron_sword',
      quantity: 1,
    });
  });

  it('posts a work order when a merchant lacks production inputs', () => {
    const shop = world.npcs['npc_elwin']!.shop!;
    shop.items.find(item => item.baseId === 'health_potion')!.stock = 0;
    shop.materials = { ...shop.materials, medicinal_herb: 0 };

    processEconomyTick(world);

    const order = getOpenWorkOrders(world).find(candidate =>
      candidate.merchantId === 'npc_elwin' && candidate.materialBaseId === 'medicinal_herb'
    );
    expect(order?.quantityRemaining).toBeGreaterThan(0);
  });

  it('requires tools for mining and depletes shared resource nodes', () => {
    const player = createPlayer({ id: 'miner', name: 'Miner', className: 'warrior', startLocationId: 'wild_foothills' });
    expect(gatherResource(world, player, 'iron ore').success).toBe(false);

    world.items['test_pick'] = {
      id: 'test_pick',
      baseId: 'mining_pick',
      name: 'Mining Pick',
      tags: ['tool', 'pickaxe'],
      rarity: 'common',
      affixes: [],
    };
    player.inventory.push({ itemId: 'test_pick', quantity: 1 });

    const result = gatherResource(world, player, 'iron ore');
    expect(result.success).toBe(true);
    expect(result.quantity).toBe(2);
    expect(world.economy?.resourceNodes['node_iron_foothills']?.quantity).toBe(6);
  });

  it('pays players for work-order deliveries and transfers materials', () => {
    const shop = world.npcs['npc_kira']!.shop!;
    shop.items.find(item => item.baseId === 'iron_sword')!.stock = 0;
    shop.materials = { ...shop.materials, iron_ore: 0 };
    processEconomyTick(world);

    const player = createPlayer({ id: 'supplier', name: 'Supplier', className: 'warrior', startLocationId: 'town_blacksmith' });
    world.items['delivery_ore'] = {
      id: 'delivery_ore',
      baseId: 'iron_ore',
      name: 'Iron Ore',
      tags: ['material', 'ore'],
      rarity: 'common',
      affixes: [],
    };
    player.inventory.push({ itemId: 'delivery_ore', quantity: 3 });
    const cashBefore = shop.cash!;

    const result = fulfillWorkOrder(world, player, 'npc_kira', 'iron ore', 3);

    expect(result.success).toBe(true);
    expect(result.quantity).toBe(3);
    expect(shop.materials['iron_ore']).toBe(3);
    expect(shop.cash).toBe(cashBefore - result.payment);
    expect(player.currency.copper + player.currency.silver * 10 + player.currency.gold * 100).toBe(result.payment);
  });
});
