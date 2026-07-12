import type { Item, Player, World } from '@solo-mud/shared';

const STACKABLE_TAGS = new Set([
  'consumable', 'potion', 'food', 'drink', 'beverage',
  'material', 'crafting', 'currency', 'junk', 'trophy',
  'healing', 'container',
]);

const NON_STACKABLE_TAGS = new Set([
  'weapon', 'armor', 'unique', 'key', 'quest',
  'head', 'chest', 'legs', 'feet', 'hands', 'ring', 'neck',
]);

export function isStackable(item: Item): boolean {
  if (item.tags.some(tag => NON_STACKABLE_TAGS.has(tag.toLowerCase()))) {
    return false;
  }
  return item.tags.some(tag => STACKABLE_TAGS.has(tag.toLowerCase()));
}

export function addToInventory(player: Player, world: World, itemId: string): boolean {
  const item = world.items[itemId];
  if (!item) return false;

  if (item.tags.includes('key')) {
    const alreadyHasKey = player.keyring.some(keyId =>
      world.items[keyId]?.baseId === item.baseId
    );
    if (alreadyHasKey) return false;
    player.keyring.push(itemId);
    return true;
  }

  if (isStackable(item)) {
    const existingSlot = player.inventory.find(slot =>
      world.items[slot.itemId]?.baseId === item.baseId
    );
    if (existingSlot) {
      existingSlot.quantity += 1;
      return true;
    }
  }

  if (player.inventory.length >= player.inventorySlots) return false;
  player.inventory.push({ itemId, quantity: 1 });
  return true;
}
