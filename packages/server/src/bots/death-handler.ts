/**
 * Bot death handling - penalties, memory effects, and respawn tracking.
 *
 * ## Death Penalty System
 *
 * When a bot dies, it suffers penalties and gains memories that affect future behavior.
 *
 * ### Resource Penalties
 *
 * | Penalty     | Amount | Reasoning                                     |
 * |-------------|--------|-----------------------------------------------|
 * | XP Loss     | 5%     | Meaningful but not devastating                |
 * | Gold Loss   | 10%    | Encourages banking/spending before risky areas|
 *
 * These values are intentionally mild because:
 * 1. Bots can't make strategic decisions about risk like players
 * 2. Harsh penalties would make bots avoid all combat (boring)
 * 3. We want bots to model "normal" adventuring, not optimal play
 *
 * ### Memory Effects
 *
 * Based on bravery trait, bots react differently to death:
 *
 * | Bravery | Memory Effect   | Behavioral Impact                         |
 * |---------|-----------------|-------------------------------------------|
 * | 0-29    | fears_killer    | Avoids killer, flees more readily         |
 * | 30-70   | gains_caution   | Slightly more careful, no major changes   |
 * | 71-100  | seeks_revenge   | Actively hunts killer, more aggressive    |
 *
 * ### Relationship Impact
 *
 * Opinion of killer decreases by 30-50 based on aggression:
 * - Low aggression (peaceful): -50 (very upset about being killed)
 * - High aggression (combat-focused): -30 (accepts combat losses)
 *
 * ### Adjusting Penalties
 *
 * To make death more punishing:
 * - Increase XP loss to 10-15%
 * - Increase gold loss to 20-30%
 *
 * To make death less punishing:
 * - Decrease XP loss to 1-2%
 * - Decrease gold loss to 5%
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
 *
 * Penalty values (tunable constants):
 * - XP_LOSS_PERCENT = 0.05 (5%) - Change to adjust XP penalty severity
 * - GOLD_LOSS_PERCENT = 0.10 (10%) - Change to adjust gold penalty severity
 *
 * Bravery thresholds for memory effects:
 * - FEAR_THRESHOLD = 30 - Below this, bot fears the killer
 * - REVENGE_THRESHOLD = 70 - Above this, bot seeks revenge
 */
export function calculateDeathPenalties(bot: BotPlayer, _info: BotDeathInfo): BotDeathPenalties {
  // Tunable constants
  const XP_LOSS_PERCENT = 0.05; // 5% - increase for harsher death penalty
  const GOLD_LOSS_PERCENT = 0.10; // 10% - increase for harsher death penalty

  // Calculate XP loss
  const xpLost = Math.floor(bot.xp * XP_LOSS_PERCENT);

  // Calculate total currency in copper (10c = 1s, 100c = 1g)
  const totalCopper =
    bot.currency.copper +
    bot.currency.silver * 10 +
    bot.currency.gold * 100;

  // Gold loss as percentage of total currency
  const goldLost = Math.floor(totalCopper * GOLD_LOSS_PERCENT);

  // Bravery thresholds for memory effects (tunable)
  const FEAR_THRESHOLD = 30; // Below this: fears_killer
  const REVENGE_THRESHOLD = 70; // Above this: seeks_revenge

  // Determine memory effect based on bravery
  const bravery = bot.botProfile.personality.bravery;
  let memoryEffect: BotDeathPenalties['memoryEffect'];

  if (bravery < FEAR_THRESHOLD) {
    memoryEffect = 'fears_killer';
  } else if (bravery > REVENGE_THRESHOLD) {
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
