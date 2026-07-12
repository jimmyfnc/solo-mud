/**
 * Ecosystem constants for creature behavior, respawn, and combat.
 */

import type { CreatureTier } from '../types/world';

/** Configuration per creature tier */
export const TIER_CONFIG: Record<CreatureTier, { respawnMs: number; intimidationGap: number }> = {
  ambient: { respawnMs: 120_000, intimidationGap: 3 },    // 2 minutes
  common: { respawnMs: 300_000, intimidationGap: 5 },     // 5 minutes
  dangerous: { respawnMs: 600_000, intimidationGap: 8 },  // 10 minutes
  apex: { respawnMs: 900_000, intimidationGap: 12 },      // 15 minutes
};

/**
 * Boss anchors respawn on their own, slower clock: 45 minutes ±25% jitter
 * so kill windows can't be scheduled to the second.
 */
export const BOSS_RESPAWN_MS = 45 * 60_000;
export const BOSS_RESPAWN_JITTER = 0.25;

/** Corpse duration by cause of death */
export const CORPSE_DURATION = {
  creature_kill: 60_000,   // 1 minute - predator fed
  player_kill: 180_000,    // 3 minutes - player needs time to loot
  looted: 30_000,          // 30 seconds after looting
};

/** Hunting and fleeing constants */
export const HUNT_LEVEL_THRESHOLD = 2;  // Hunt creatures 2+ levels below
export const MAX_CHASE_DISTANCE = 3;    // Max rooms a predator will chase
export const CHASE_CHANCE = 0.5;        // 50% chance to chase fleeing prey

/** Combat constants */
export const EVENLY_MATCHED_THRESHOLD = 3;  // Less than 3 level difference = tick-based combat
export const TERRITORIAL_HOME_BONUS = 0.2;  // 20% power bonus when defending territory
