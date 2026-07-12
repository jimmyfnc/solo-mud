/** Prop interaction tier - determines reward complexity */
export type PropTier = 'signature' | 'interactive' | 'flavor';

/** Reward granted by a prop interaction */
export interface PropReward {
  /** XP amount (small, usually 1-5) */
  xp?: number;
  /** Buff to apply */
  buff?: {
    id: string;
    duration: number; // minutes
  };
  /** Item base ID to give player */
  item?: string;
  /** Copper amount to give */
  currency?: number;
  /** Lore text to display (separate from interaction text) */
  lore?: string;
  /** Quest flag to set on player */
  unlock?: string;
  /** Remove an item from player inventory */
  consumeItem?: string;
}

/** A single interaction definition */
export interface PropInteraction {
  /** Response message(s) - randomly selected if array */
  text: string | string[];
  /** Cooldown in minutes until this interaction can be used again */
  cooldown?: number;
  /** Rewards granted */
  rewards?: PropReward;
  /** Required item in inventory (not consumed unless in rewards.consumeItem) */
  requiresItem?: string;
  /** Condition function name for special checks */
  condition?: string;
}

/** Tag-based item interaction */
export interface TagInteraction {
  /** Item tags that trigger this interaction */
  itemTags: string[];
  /** Verb that triggers this (optional, defaults to 'use') */
  verb?: string;
  /** Response text (supports ${item} and ${prop} placeholders) */
  text: string;
  /** Result item to give (supports ${item.baseId} placeholder) */
  resultItem?: string;
  /** Effect to apply */
  effect?: string;
  /** Consume the item used */
  consumeItem?: boolean;
}

/** Complete prop definition */
export interface PropDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Interaction tier */
  tier: PropTier;
  /** Verbs that work on this prop */
  verbs: string[];
  /** Tags for item matching (e.g., 'water_source', 'fire') */
  tags?: string[];
  /** Specific item interactions (keyed by item baseId) */
  itemInteractions?: Record<string, PropInteraction>;
  /** Default interaction when no item used */
  defaultInteraction: PropInteraction;
  /** Text for 'examine' command - always available */
  examineText: string[];
  /** If true, prop is hidden until discovered */
  hidden?: boolean;
  /** How to discover hidden prop (e.g., 'search', 'examine wall') */
  discoverVerb?: string;
}
