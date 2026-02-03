/**
 * Bot death handling - penalties, memory effects, and respawn tracking.
 */

import type { BotPlayer } from './bot-player';
import { modifyOpinion } from './social/relationships';

/** Information about a bot's death */
export interface BotDeathInfo {
  botId: string;
  botName: string;
  killedBy: string; // Entity ID that killed the bot
  killerName: string; // Display name of killer
  location: string; // Location ID where death occurred
  wasHeroic: boolean; // Died fighting a boss
  timestamp: number;
}

/** Penalties applied on death */
export interface BotDeathPenalties {
  xpLost: number;
  goldLost: number;
  memoryEffect: 'gains_caution' | 'seeks_revenge' | 'fears_killer';
}

/**
 * Calculate death penalties based on bot state and death info.
 * - XP loss: 5% of current XP
 * - Gold loss: 10% of total currency (in copper)
 * - Memory effect based on bravery trait
 */
export function calculateDeathPenalties(bot: BotPlayer, _info: BotDeathInfo): BotDeathPenalties {
  // Calculate XP loss (5% of current XP)
  const xpLost = Math.floor(bot.xp * 0.05);

  // Calculate total currency in copper (10c = 1s, 100c = 1g)
  const totalCopper =
    bot.currency.copper +
    bot.currency.silver * 10 +
    bot.currency.gold * 100;

  // Gold loss is 10% of total currency (in copper)
  const goldLost = Math.floor(totalCopper * 0.1);

  // Determine memory effect based on bravery
  const bravery = bot.botProfile.personality.bravery;
  let memoryEffect: BotDeathPenalties['memoryEffect'];

  if (bravery < 30) {
    memoryEffect = 'fears_killer';
  } else if (bravery > 70) {
    memoryEffect = 'seeks_revenge';
  } else {
    memoryEffect = 'gains_caution';
  }

  return {
    xpLost,
    goldLost,
    memoryEffect,
  };
}

/**
 * Apply death penalties to a bot.
 * - Subtract XP (minimum 0)
 * - Subtract gold from currency (copper first, then silver, then gold)
 */
export function applyDeathPenalties(bot: BotPlayer, penalties: BotDeathPenalties): void {
  // Apply XP loss (minimum 0)
  bot.xp = Math.max(0, bot.xp - penalties.xpLost);

  // Apply gold loss by subtracting from currency
  let remaining = penalties.goldLost;

  // First, try to take from copper
  if (bot.currency.copper >= remaining) {
    bot.currency.copper -= remaining;
    return;
  }

  // Take all copper, need more
  remaining -= bot.currency.copper;
  bot.currency.copper = 0;

  // Convert silver to copper and try to cover
  const silverAsCopper = bot.currency.silver * 10;
  if (silverAsCopper >= remaining) {
    // Use some silver
    const silverNeeded = Math.ceil(remaining / 10);
    bot.currency.silver -= silverNeeded;
    // Give back change as copper
    const change = silverNeeded * 10 - remaining;
    bot.currency.copper = change;
    return;
  }

  // Take all silver, need more
  remaining -= silverAsCopper;
  bot.currency.silver = 0;

  // Convert gold to copper and try to cover
  const goldAsCopper = bot.currency.gold * 100;
  if (goldAsCopper >= remaining) {
    // Use some gold
    const goldNeeded = Math.ceil(remaining / 100);
    bot.currency.gold -= goldNeeded;
    // Give back change as copper
    const change = goldNeeded * 100 - remaining;
    bot.currency.copper = change;
    return;
  }

  // Take all gold - player is broke
  bot.currency.gold = 0;
}

/**
 * Record a death in the bot's memory and update relationship with killer.
 * - Add DeathRecord to memory.deaths
 * - Decrease opinion of killer by 30-50 based on personality
 */
export function recordDeath(bot: BotPlayer, info: BotDeathInfo): void {
  // Add death record to memory
  bot.botProfile.memory.deaths.push({
    timestamp: info.timestamp,
    location: info.location,
    killedBy: info.killerName,
    hadHelp: false, // Solo death for now
    lostItems: [], // No item loss implemented yet
  });

  // Calculate opinion decrease based on aggression
  // Low aggression = bigger decrease (more upset about being killed)
  // High aggression = smaller decrease (accepts combat losses more)
  const aggression = bot.botProfile.personality.aggression;
  // Base decrease is 30-50, inversely related to aggression
  // aggression 0 -> -50, aggression 100 -> -30
  const opinionDecrease = -30 - Math.floor((100 - aggression) / 100 * 20);

  // Update relationship with killer
  modifyOpinion(
    bot,
    info.killedBy,
    info.killerName,
    false, // isPlayer - assume creature for now
    opinionDecrease
  );
}
