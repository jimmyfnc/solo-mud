import { randomUUID } from 'crypto';
import {
  MERCHANT_ECONOMY_CONFIGS,
  MERCHANT_RECIPES,
  RESOURCE_NODE_TEMPLATES,
  SHOP_ITEM_TEMPLATES,
  EASTHOLLOW_NPCS,
  addCopper,
  type Item,
  type Player,
  type ResourceNode,
  type WorkOrder,
  type World,
} from '@solo-mud/shared';
import { addToInventory } from '../game/inventory';

const ORDER_LIFETIME_MINUTES = 2 * 24 * 60;
const MATERIAL_BASE_IDS = new Set(
  MERCHANT_RECIPES.flatMap(recipe => recipe.inputs.map(input => input.baseId))
);

export interface EconomyTickEvent {
  type: 'shortage' | 'restocked';
  merchantId: string;
  baseId: string;
  quantity: number;
}

export interface FulfillmentResult {
  success: boolean;
  message: string;
  quantity: number;
  payment: number;
}

export function getItemDisplayName(baseId: string): string {
  return SHOP_ITEM_TEMPLATES[baseId]?.name ?? baseId.replaceAll('_', ' ');
}

export function ensureEconomyState(world: World): void {
  if (!world.economy) {
    world.economy = {
      workOrders: [],
      resourceNodes: Object.fromEntries(
        RESOURCE_NODE_TEMPLATES.map(node => [node.id, { ...node }])
      ),
      nextWorkOrderId: 1,
      lastProcessedAt: world.time.totalMinutes,
    };
  }

  for (const template of RESOURCE_NODE_TEMPLATES) {
    if (!world.economy.resourceNodes[template.id]) {
      world.economy.resourceNodes[template.id] = { ...template };
    }
  }

  for (const config of Object.values(MERCHANT_ECONOMY_CONFIGS)) {
    const shop = world.npcs[config.merchantId]?.shop;
    if (!shop) continue;
    const authoredShop = EASTHOLLOW_NPCS[config.merchantId]?.shop;
    for (const authoredItem of authoredShop?.items ?? []) {
      const existing = shop.items.find(item => item.baseId === authoredItem.baseId);
      if (existing) {
        existing.stock ??= authoredItem.stock;
      } else {
        shop.items.push({ ...authoredItem });
      }
    }
    shop.cash ??= config.startingCash;
    shop.materials ??= { ...config.startingMaterials };
    shop.productionReadyAt ??= {};
  }
}

function createWorkOrder(
  world: World,
  merchantId: string,
  materialBaseId: string,
  quantity: number
): WorkOrder | null {
  ensureEconomyState(world);
  const economy = world.economy!;
  const existing = economy.workOrders.find(order =>
    order.status === 'open' &&
    order.merchantId === merchantId &&
    order.materialBaseId === materialBaseId
  );
  if (existing) return null;

  const sellValue = SHOP_ITEM_TEMPLATES[materialBaseId]?.sellValue ?? 2;
  const order: WorkOrder = {
    id: `order_${economy.nextWorkOrderId++}`,
    merchantId,
    materialBaseId,
    quantityRequested: quantity,
    quantityRemaining: quantity,
    unitPrice: Math.max(1, Math.ceil(sellValue * 1.5)),
    createdAt: world.time.totalMinutes,
    expiresAt: world.time.totalMinutes + ORDER_LIFETIME_MINUTES,
    status: 'open',
  };
  economy.workOrders.push(order);
  return order;
}

export function processEconomyTick(world: World): EconomyTickEvent[] {
  ensureEconomyState(world);
  const economy = world.economy!;
  const now = world.time.totalMinutes;
  const events: EconomyTickEvent[] = [];

  for (const order of economy.workOrders) {
    if (order.status === 'open' && order.expiresAt <= now) {
      order.status = 'expired';
    }
  }

  for (const node of Object.values(economy.resourceNodes)) {
    if (
      node.quantity < node.maxQuantity &&
      node.lastGatheredAt !== undefined &&
      now - node.lastGatheredAt >= node.respawnMinutes
    ) {
      node.quantity = node.maxQuantity;
      node.lastGatheredAt = undefined;
    }
  }

  for (const recipe of MERCHANT_RECIPES) {
    const shop = world.npcs[recipe.merchantId]?.shop;
    if (!shop) continue;
    const stockItem = shop.items.find(item => item.baseId === recipe.outputBaseId);
    if (!stockItem) continue;
    stockItem.stock ??= recipe.targetStock;
    if (stockItem.stock >= recipe.targetStock) continue;

    const missing = recipe.inputs.filter(input =>
      (shop.materials?.[input.baseId] ?? 0) < input.quantity
    );
    if (missing.length > 0) {
      for (const input of missing) {
        const current = shop.materials?.[input.baseId] ?? 0;
        const requested = Math.max(input.quantity * 3 - current, input.quantity);
        const order = createWorkOrder(world, recipe.merchantId, input.baseId, requested);
        if (order) {
          events.push({
            type: 'shortage',
            merchantId: recipe.merchantId,
            baseId: input.baseId,
            quantity: requested,
          });
        }
      }
      continue;
    }

    const readyAt = shop.productionReadyAt?.[recipe.id];
    if (readyAt === undefined) {
      shop.productionReadyAt![recipe.id] = now + recipe.productionMinutes;
      continue;
    }
    if (now < readyAt) continue;

    for (const input of recipe.inputs) {
      shop.materials![input.baseId] = (shop.materials![input.baseId] ?? 0) - input.quantity;
    }
    const produced = Math.min(recipe.outputQuantity, recipe.targetStock - stockItem.stock);
    stockItem.stock += produced;
    shop.productionReadyAt![recipe.id] = now + recipe.productionMinutes;
    events.push({
      type: 'restocked',
      merchantId: recipe.merchantId,
      baseId: recipe.outputBaseId,
      quantity: produced,
    });
  }

  economy.lastProcessedAt = now;
  return events;
}

export function recordMerchantPurchase(world: World, merchantId: string, amount: number): void {
  ensureEconomyState(world);
  const shop = world.npcs[merchantId]?.shop;
  if (shop) shop.cash = (shop.cash ?? 0) + amount;
}

export function canMerchantAfford(world: World, merchantId: string, amount: number): boolean {
  ensureEconomyState(world);
  return (world.npcs[merchantId]?.shop?.cash ?? 0) >= amount;
}

export function recordMerchantAcquisition(
  world: World,
  merchantId: string,
  baseId: string,
  quantity: number,
  amountPaid: number
): void {
  ensureEconomyState(world);
  const shop = world.npcs[merchantId]?.shop;
  if (!shop) return;
  shop.cash = Math.max(0, (shop.cash ?? 0) - amountPaid);

  const merchantUsesMaterial = MATERIAL_BASE_IDS.has(baseId) && MERCHANT_RECIPES.some(recipe =>
    recipe.merchantId === merchantId && recipe.inputs.some(input => input.baseId === baseId)
  );
  if (merchantUsesMaterial) {
    shop.materials![baseId] = (shop.materials![baseId] ?? 0) + quantity;
  }

  const stockItem = shop.items.find(item => item.baseId === baseId);
  if (stockItem?.stock !== undefined) stockItem.stock += quantity;
}

export function getOpenWorkOrders(world: World): WorkOrder[] {
  ensureEconomyState(world);
  return world.economy!.workOrders.filter(order => order.status === 'open');
}

export function getResourceNodesAt(world: World, locationId: string): ResourceNode[] {
  ensureEconomyState(world);
  return Object.values(world.economy!.resourceNodes).filter(node => node.locationId === locationId);
}

function playerHasToolTag(player: Player, world: World, tag: string): boolean {
  const itemIds = [
    ...player.inventory.map(slot => slot.itemId),
    ...Object.values(player.equipment).filter((id): id is string => Boolean(id)),
  ];
  return itemIds.some(itemId => world.items[itemId]?.tags.includes(tag));
}

export function gatherResource(
  world: World,
  player: Player,
  query: string
): { success: boolean; message: string; quantity: number } {
  const nodes = getResourceNodesAt(world, player.locationId);
  const normalized = query.toLowerCase();
  const node = nodes.find(candidate =>
    candidate.name.includes(normalized) ||
    getItemDisplayName(candidate.materialBaseId).toLowerCase().includes(normalized) ||
    candidate.gatherVerb === normalized
  ) ?? (nodes.length === 1 ? nodes[0] : undefined);

  if (!node) {
    const available = nodes.map(candidate => candidate.name).join(', ');
    return {
      success: false,
      message: available ? `Available resources here: ${available}.` : 'There are no harvestable resources here.',
      quantity: 0,
    };
  }
  if (node.quantity <= 0) {
    return { success: false, message: `The ${node.name} has been depleted.`, quantity: 0 };
  }
  if (node.requiredToolTag && !playerHasToolTag(player, world, node.requiredToolTag)) {
    return {
      success: false,
      message: `You need a tool tagged ${node.requiredToolTag} to work the ${node.name}.`,
      quantity: 0,
    };
  }

  const quantity = Math.min(node.yieldPerGather, node.quantity);
  const itemId = `resource_${node.materialBaseId}_${randomUUID()}`;
  const template = SHOP_ITEM_TEMPLATES[node.materialBaseId];
  const item: Item = {
    id: itemId,
    baseId: node.materialBaseId,
    name: template?.name ?? getItemDisplayName(node.materialBaseId),
    tags: template?.tags ?? ['material'],
    rarity: 'common',
    affixes: [],
  };
  world.items[itemId] = item;
  if (!addToInventory(player, world, itemId)) {
    delete world.items[itemId];
    return { success: false, message: 'Your inventory is full.', quantity: 0 };
  }
  const slot = player.inventory.find(entry => entry.itemId === itemId) ??
    player.inventory.find(entry => world.items[entry.itemId]?.baseId === node.materialBaseId);
  if (slot && quantity > 1) slot.quantity += quantity - 1;

  node.quantity -= quantity;
  node.lastGatheredAt = world.time.totalMinutes;
  return {
    success: true,
    message: `You ${node.gatherVerb} ${quantity} ${getItemDisplayName(node.materialBaseId)}.`,
    quantity,
  };
}

function removePlayerItems(player: Player, world: World, baseId: string, quantity: number): number {
  let remaining = quantity;
  for (let index = player.inventory.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const slot = player.inventory[index]!;
    if (world.items[slot.itemId]?.baseId !== baseId) continue;
    const removed = Math.min(slot.quantity, remaining);
    slot.quantity -= removed;
    remaining -= removed;
    if (slot.quantity <= 0) player.inventory.splice(index, 1);
  }
  return quantity - remaining;
}

export function fulfillWorkOrder(
  world: World,
  player: Player,
  merchantId: string,
  query: string,
  requestedQuantity?: number
): FulfillmentResult {
  ensureEconomyState(world);
  const normalized = query.toLowerCase();
  const order = getOpenWorkOrders(world).find(candidate =>
    candidate.merchantId === merchantId &&
    (candidate.materialBaseId.includes(normalized) ||
      getItemDisplayName(candidate.materialBaseId).toLowerCase().includes(normalized))
  );
  if (!order) {
    return { success: false, message: 'This merchant has no matching open work order.', quantity: 0, payment: 0 };
  }

  const available = player.inventory.reduce((total, slot) =>
    total + (world.items[slot.itemId]?.baseId === order.materialBaseId ? slot.quantity : 0), 0
  );
  const shopCash = world.npcs[merchantId]?.shop?.cash ?? 0;
  const affordable = Math.floor(shopCash / order.unitPrice);
  const quantity = Math.min(
    available,
    order.quantityRemaining,
    requestedQuantity ?? Number.POSITIVE_INFINITY,
    affordable
  );
  if (quantity <= 0) {
    return {
      success: false,
      message: available <= 0
        ? `You do not have any ${getItemDisplayName(order.materialBaseId)}.`
        : 'The merchant cannot currently afford that delivery.',
      quantity: 0,
      payment: 0,
    };
  }

  const removed = removePlayerItems(player, world, order.materialBaseId, quantity);
  const payment = removed * order.unitPrice;
  const shop = world.npcs[merchantId]!.shop!;
  shop.cash = (shop.cash ?? 0) - payment;
  shop.materials![order.materialBaseId] = (shop.materials![order.materialBaseId] ?? 0) + removed;
  player.currency = addCopper(player.currency, payment);
  order.quantityRemaining -= removed;
  if (order.quantityRemaining <= 0) order.status = 'fulfilled';

  return {
    success: true,
    message: `You deliver ${removed} ${getItemDisplayName(order.materialBaseId)} for ${payment} copper.`,
    quantity: removed,
    payment,
  };
}
