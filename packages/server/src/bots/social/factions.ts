/**
 * Faction system for bot social grouping.
 *
 * Factions provide social structure for bots, affecting their relationships
 * with other bots and players. Members of the same faction get opinion boosts,
 * with additional modifiers based on faction role.
 */

/** Faction definition */
export interface Faction {
  /** Unique identifier (e.g., 'easthollow_defenders') */
  id: string;
  /** Display name */
  name: string;
  /** Description of what the faction is about */
  description: string;
  /** Opinion boost between members (+20 to +40) */
  baseOpinionBoost: number;
}

/** Predefined factions */
export const FACTIONS: Record<string, Faction> = {
  easthollow_defenders: {
    id: 'easthollow_defenders',
    name: 'Easthollow Defenders',
    description: 'Brave warriors dedicated to protecting Easthollow and its citizens from threats.',
    baseOpinionBoost: 30,
  },
  lone_wolves: {
    id: 'lone_wolves',
    name: 'Lone Wolves',
    description: 'Independent adventurers who prefer solitude but respect fellow loners.',
    baseOpinionBoost: 20,
  },
  sewer_dwellers: {
    id: 'sewer_dwellers',
    name: 'Sewer Dwellers',
    description: 'Those who make their living in the dark tunnels beneath the town.',
    baseOpinionBoost: 25,
  },
  merchant_guild: {
    id: 'merchant_guild',
    name: 'Merchant Guild',
    description: 'Traders and craftsmen united by commerce and mutual profit.',
    baseOpinionBoost: 35,
  },
  seekers_of_glory: {
    id: 'seekers_of_glory',
    name: 'Seekers of Glory',
    description: 'Adventurers driven by fame, fortune, and the thrill of battle.',
    baseOpinionBoost: 25,
  },
};

/** Role modifiers - how much extra respect each role gets */
const ROLE_MODIFIERS: Record<'leader' | 'member' | 'recruit', number> = {
  leader: 15,
  member: 10,
  recruit: 5,
};

/**
 * Get a faction by ID.
 *
 * @param factionId - The faction identifier
 * @returns The faction if found, undefined otherwise
 */
export function getFaction(factionId: string): Faction | undefined {
  if (!factionId) return undefined;
  return FACTIONS[factionId];
}

/**
 * Check if two entities belong to the same faction.
 *
 * @param factionId1 - First entity's faction ID
 * @param factionId2 - Second entity's faction ID
 * @returns True if both belong to the same faction
 */
export function areSameFaction(factionId1?: string, factionId2?: string): boolean {
  if (!factionId1 || !factionId2) return false;
  return factionId1 === factionId2;
}

/**
 * Get the opinion modifier for faction membership.
 *
 * @param factionId1 - First entity's faction ID
 * @param factionId2 - Second entity's faction ID
 * @returns The opinion boost if same faction, 0 otherwise
 */
export function getFactionOpinionModifier(factionId1?: string, factionId2?: string): number {
  if (!areSameFaction(factionId1, factionId2)) return 0;

  const faction = getFaction(factionId1!);
  return faction?.baseOpinionBoost ?? 0;
}

/**
 * Get a role-based opinion modifier.
 *
 * Leaders get more respect, recruits get less.
 *
 * @param factionId - The faction ID
 * @param role - The role within the faction
 * @returns The role modifier value
 */
export function getFactionByRole(
  factionId: string,
  role: 'leader' | 'member' | 'recruit'
): number {
  const faction = getFaction(factionId);
  if (!faction) return 0;

  return ROLE_MODIFIERS[role];
}
