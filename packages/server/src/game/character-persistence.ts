import type { Item, Player, World } from '@solo-mud/shared';
import { updateCharacter } from '../db/repositories/CharacterRepository';
import type { GameSession } from './session';

export function getOwnedItems(player: Player, world: World): Record<string, Item> {
  const owned: Record<string, Item> = {};
  const itemIds = [
    ...Object.values(player.equipment),
    ...player.inventory.map(slot => slot.itemId),
    ...(player.keyring ?? []),
  ];

  for (const itemId of itemIds) {
    if (!itemId) continue;
    const item = world.items[itemId];
    if (item) owned[itemId] = item;
  }

  return owned;
}

export function saveCharacterState(session: GameSession): void {
  if (!session.characterId) return;

  updateCharacter(session.characterId, {
    level: session.player.level,
    xp: session.player.xp,
    currency: session.player.currency,
    currentHp: session.player.currentHp,
    maxHp: session.player.maxHp,
    currentMp: session.player.currentMp,
    maxMp: session.player.maxMp,
    locationId: session.player.locationId,
    gameTime: session.world.time.totalMinutes,
    equipment: session.player.equipment,
    inventory: session.player.inventory,
    keyring: session.player.keyring ?? [],
    ownedItems: getOwnedItems(session.player, session.world),
    knownSpells: session.player.spells.known,
  });
}
