// NPC Personality types
export type NPCPersonality = 'friendly' | 'gruff' | 'nervous' | 'wise' | 'cheerful' | 'stern';

// Ambient action an NPC can perform
export interface AmbientAction {
  text: string;
  weight: number;
  condition?: string;
}

// Weighted reaction to events
export interface WeightedReaction {
  weight: number;
  action?: string;
  says?: string;
  condition?: string;
}

// Topic that NPCs can discuss
export interface NPCTopic {
  id: string;
  category: 'small_talk' | 'town_concern' | 'gossip' | 'commerce' | 'events' | 'nostalgia';
  opinions: string[];
  responses: string[];
}

// Simulation data attached to NPCs
export interface NPCSimulation {
  personality: NPCPersonality;
  topics: string[];
  topicInterest: Record<string, number>;
  ambientActions: AmbientAction[];
  reactions: Partial<Record<ReactionTrigger, WeightedReaction[]>>;
}

// Types of events NPCs can react to
export type ReactionTrigger =
  | 'player_enter'
  | 'player_leave'
  | 'player_combat'
  | 'player_death'
  | 'player_levelup'
  | 'creature_enter'
  | 'time_change'
  | 'npc_arrive';

// Line in an NPC conversation
export interface ConversationLine {
  speaker: 'initiator' | 'responder';
  action?: string;
  says: string;
}

// Template for NPC-to-NPC conversations
export interface ConversationTemplate {
  id: string;
  initiatorRoles?: string[];
  initiatorIds?: string[];
  responderRoles?: string[];
  responderIds?: string[];
  topic: string;
  lines: ConversationLine[];
}

// Hot topic from world events
export interface HotTopic {
  id: string;
  headline: string;
  severity: 'minor' | 'moderate' | 'major';
  decayHours: number;
  createdAt: number;
  reactions: {
    shocked?: string[];
    angry?: string[];
    sad?: string[];
    curious?: string[];
    amused?: string[];
  };
}

// Simulation message types for client styling
export type SimulationMessageType =
  | 'ambient_action'
  | 'ambient_speech'
  | 'npc_conversation'
  | 'reaction_to_player'
  | 'reaction_to_world'
  | 'hot_topic';

// Message sent to client
export interface SimulationMessage {
  type: 'simulation';
  subtype: SimulationMessageType;
  npc?: string;
  npcName?: string;
  action?: string;
  says?: string;
  lines?: Array<{ npc: string; npcName: string; action?: string; says?: string }>;
}

// Zone activity configuration
export interface ZoneActivityConfig {
  minInterval: number;
  maxInterval: number;
  enabled: boolean;
}

export const ZONE_ACTIVITY: Record<string, ZoneActivityConfig> = {
  social: { minInterval: 30000, maxInterval: 60000, enabled: true },
  transitional: { minInterval: 90000, maxInterval: 120000, enabled: true },
  quiet: { minInterval: 180000, maxInterval: 300000, enabled: true },
  dungeon: { minInterval: 0, maxInterval: 0, enabled: false },
};
