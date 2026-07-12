/**
 * Player Infamy System
 * Tracks consequences for attacking/killing NPCs in towns.
 */

import type { Player, InfamyLevel, PlayerInfamy } from '@solo-mud/shared';

/** Infamy thresholds (in bounty copper) */
export const INFAMY_THRESHOLDS = {
  suspect: 50,      // 5 silver
  criminal: 500,    // 50 silver
  murderer: 5000,   // 5 gold
} as const;

/** Bounty values for different NPC actions */
export const BOUNTY_VALUES = {
  /** Assault (attacking but not killing) */
  assault: 500,     // 50 silver
  /** Murder base value */
  murderBase: 5000, // 5 gold
  /** Murder bonus per victim level */
  murderPerLevel: 200, // 20 silver per level
} as const;

/** Decay times in game minutes */
export const INFAMY_DECAY_TIMES = {
  /** Time to decay from murderer to criminal */
  murderer: 60 * 24,    // 1 game day
  /** Time to decay from criminal to suspect */
  criminal: 60 * 12,    // 12 game hours
  /** Time to decay from suspect to none */
  suspect: 60 * 6,      // 6 game hours
} as const;

/**
 * Get infamy level from bounty amount
 */
export function getInfamyLevel(bounty: number): InfamyLevel {
  if (bounty >= INFAMY_THRESHOLDS.murderer) return 'murderer';
  if (bounty >= INFAMY_THRESHOLDS.criminal) return 'criminal';
  if (bounty >= INFAMY_THRESHOLDS.suspect) return 'suspect';
  return 'none';
}

/**
 * Create initial infamy state
 */
export function createInfamy(townId: string): PlayerInfamy {
  return {
    level: 'none',
    townId,
    bounty: 0,
  };
}

/**
 * Add bounty for assaulting an NPC (attacking but not killing)
 */
export function addAssaultBounty(
  player: Player,
  townId: string,
  currentGameTime: number
): PlayerInfamy {
  const infamy = player.infamy ?? createInfamy(townId);

  // Only track infamy for the current town
  if (infamy.townId !== townId) {
    return {
      ...infamy,
      townId,
      bounty: BOUNTY_VALUES.assault,
      level: getInfamyLevel(BOUNTY_VALUES.assault),
      decayAt: currentGameTime + INFAMY_DECAY_TIMES.suspect,
    };
  }

  const newBounty = infamy.bounty + BOUNTY_VALUES.assault;
  const newLevel = getInfamyLevel(newBounty);

  return {
    ...infamy,
    bounty: newBounty,
    level: newLevel,
    decayAt: currentGameTime + getDecayTime(newLevel),
  };
}

/**
 * Add bounty for murdering an NPC
 */
export function addMurderBounty(
  player: Player,
  townId: string,
  victimLevel: number,
  currentGameTime: number
): PlayerInfamy {
  const infamy = player.infamy ?? createInfamy(townId);
  const murderBounty = BOUNTY_VALUES.murderBase + (victimLevel * BOUNTY_VALUES.murderPerLevel);

  // Reset to this town if different
  if (infamy.townId !== townId) {
    const newLevel = getInfamyLevel(murderBounty);
    return {
      townId,
      bounty: murderBounty,
      level: newLevel,
      decayAt: currentGameTime + getDecayTime(newLevel),
    };
  }

  const newBounty = infamy.bounty + murderBounty;
  const newLevel = getInfamyLevel(newBounty);

  return {
    ...infamy,
    bounty: newBounty,
    level: newLevel,
    decayAt: currentGameTime + getDecayTime(newLevel),
  };
}

/**
 * Get decay time for an infamy level
 */
function getDecayTime(level: InfamyLevel): number {
  switch (level) {
    case 'murderer': return INFAMY_DECAY_TIMES.murderer;
    case 'criminal': return INFAMY_DECAY_TIMES.criminal;
    case 'suspect': return INFAMY_DECAY_TIMES.suspect;
    default: return 0;
  }
}

/**
 * Process infamy decay over time
 */
export function tickInfamyDecay(
  player: Player,
  currentGameTime: number
): PlayerInfamy | undefined {
  const infamy = player.infamy;
  if (!infamy || infamy.level === 'none') return undefined;
  if (!infamy.decayAt || currentGameTime < infamy.decayAt) return infamy;

  // Decay to next lower tier
  let newBounty: number;
  let newLevel: InfamyLevel;

  switch (infamy.level) {
    case 'murderer':
      newBounty = INFAMY_THRESHOLDS.criminal - 1;
      newLevel = 'criminal';
      break;
    case 'criminal':
      newBounty = INFAMY_THRESHOLDS.suspect - 1;
      newLevel = 'suspect';
      break;
    case 'suspect':
      newBounty = 0;
      newLevel = 'none';
      break;
    default:
      return undefined;
  }

  if (newLevel === 'none') {
    return undefined; // Clear infamy entirely
  }

  return {
    ...infamy,
    bounty: newBounty,
    level: newLevel,
    decayAt: currentGameTime + getDecayTime(newLevel),
  };
}

/**
 * Check if guards should attack player on sight
 */
export function shouldGuardsAttack(player: Player, townId: string): boolean {
  const infamy = player.infamy;
  if (!infamy) return false;
  if (infamy.townId !== townId) return false;

  // Guards attack criminals and murderers
  return infamy.level === 'criminal' || infamy.level === 'murderer';
}

/**
 * Check if NPCs will refuse to interact with player
 */
export function willNpcRefuseService(player: Player, townId: string): boolean {
  const infamy = player.infamy;
  if (!infamy) return false;
  if (infamy.townId !== townId) return false;

  // NPCs refuse service to murderers
  return infamy.level === 'murderer';
}

/**
 * Get infamy display text for player status
 */
export function getInfamyDisplay(infamy: PlayerInfamy | undefined): string | null {
  if (!infamy || infamy.level === 'none') return null;

  const bountyGold = Math.floor(infamy.bounty / 100);
  const bountySilver = Math.floor((infamy.bounty % 100) / 10);
  const bountyCopper = infamy.bounty % 10;

  let bountyStr = '';
  if (bountyGold > 0) bountyStr += `${bountyGold}g `;
  if (bountySilver > 0) bountyStr += `${bountySilver}s `;
  if (bountyCopper > 0) bountyStr += `${bountyCopper}c`;
  bountyStr = bountyStr.trim();

  switch (infamy.level) {
    case 'suspect':
      return `Suspect in ${infamy.townId} (${bountyStr} bounty)`;
    case 'criminal':
      return `Criminal in ${infamy.townId} (${bountyStr} bounty) - Guards hostile!`;
    case 'murderer':
      return `Murderer in ${infamy.townId} (${bountyStr} bounty) - Guards hostile! NPCs refuse service!`;
    default:
      return null;
  }
}

/**
 * Clear all infamy (for death penalty, paying bounty, etc.)
 */
export function clearInfamy(): undefined {
  return undefined;
}
