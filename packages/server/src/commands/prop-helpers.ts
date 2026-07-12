import type { Item, Player, PropReward } from '@solo-mud/shared';

/**
 * Check if a prop is on cooldown for a player
 */
export function isPropOnCooldown(
  player: Player,
  propId: string,
  gameTime: number
): boolean {
  const cooldownEnd = player.propCooldowns[propId];
  return cooldownEnd !== undefined && gameTime < cooldownEnd;
}

/**
 * Get remaining cooldown time in minutes
 */
export function getRemainingCooldown(
  player: Player,
  propId: string,
  gameTime: number
): number {
  const cooldownEnd = player.propCooldowns[propId];
  if (!cooldownEnd) return 0;
  return Math.max(0, cooldownEnd - gameTime);
}

/**
 * Set a cooldown on a prop for a player
 */
export function setPropCooldown(
  player: Player,
  propId: string,
  gameTime: number,
  durationMinutes: number
): void {
  if (durationMinutes > 0) {
    player.propCooldowns[propId] = gameTime + durationMinutes;
  }
}

/**
 * Format a cooldown message for display
 */
export function formatCooldownMessage(remainingMinutes: number): string {
  if (remainingMinutes < 1) {
    return "You've done that very recently. Try again in a moment.";
  } else if (remainingMinutes === 1) {
    return "You've done that recently. Try again in about a minute.";
  } else if (remainingMinutes < 60) {
    return `You've done that recently. Try again in about ${Math.ceil(remainingMinutes)} minutes.`;
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    return `You've done that recently. Try again in about ${hours} hour${hours > 1 ? 's' : ''}.`;
  }
}

/**
 * Apply prop rewards to a player
 * Returns messages to display
 */
export function applyPropRewards(
  player: Player,
  rewards: PropReward | undefined,
  world: { items: Record<string, Item> }
): string[] {
  if (!rewards) return [];

  const messages: string[] = [];

  // XP reward
  if (rewards.xp && rewards.xp > 0) {
    player.xp += rewards.xp;
    messages.push(`You gain ${rewards.xp} XP.`);
  }

  // Currency reward
  if (rewards.currency && rewards.currency > 0) {
    player.currency.copper += rewards.currency;
    messages.push(`You find ${rewards.currency} copper.`);
  }

  // Buff reward (add status effect)
  if (rewards.buff) {
    // Add or refresh the buff
    const existingBuff = player.statusEffects.find(e => e.id === rewards.buff!.id);
    if (existingBuff) {
      existingBuff.duration = rewards.buff.duration;
    } else {
      player.statusEffects.push({
        id: rewards.buff.id,
        name: rewards.buff.id, // Will be displayed as-is for now
        duration: rewards.buff.duration,
        stacks: 1,
        appliedAt: 0, // Will be set by caller if needed
      });
    }
    messages.push(`You feel ${rewards.buff.id}.`);
  }

  // Item reward
  if (rewards.item) {
    // Add item to player inventory
    const existingSlot = player.inventory.find(s => {
      const item = world.items[s.itemId];
      return item?.baseId === rewards.item;
    });
    if (existingSlot) {
      existingSlot.quantity++;
    } else {
      // Would need to create item - for now just message
      messages.push(`You receive a ${rewards.item}.`);
    }
  }

  // Lore text
  if (rewards.lore) {
    messages.push(rewards.lore);
  }

  // Quest flag unlock
  if (rewards.unlock && !player.questFlags.includes(rewards.unlock)) {
    player.questFlags.push(rewards.unlock);
  }

  // Consume item (handled separately by caller checking inventory)

  return messages;
}

/**
 * Pick a random element from an array or return the single value
 */
export function pickRandomText(text: string | string[]): string {
  if (Array.isArray(text)) {
    if (text.length === 0) return '';
    return text[Math.floor(Math.random() * text.length)]!;
  }
  return text;
}
