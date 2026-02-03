/**
 * Town, NPC, and shop type definitions.
 */

import type { NodeId, TimeOfDay } from './world';
import type { NPCSimulation } from './simulation';
import type { ClassName, StatusEffect } from './character';

/** AI priority for NPC combat behavior */
export type NpcAiPriority = 'defensive' | 'aggressive' | 'support';

/** Full NPC combat stats (for combat-capable NPCs like guards, trainers) */
export interface NpcCombatStats {
  level: number;
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  damage: number; // Base damage for auto-attacks
  class: ClassName;
  knownSpells: string[];
  abilityCooldowns: Record<string, number>;
  activeBuffs: StatusEffect[];
  aiPriority: NpcAiPriority;
}

/** Special action that a dialogue option can trigger */
export type DialogueAction = 'heal' | 'train' | 'rest' | 'teach_track' | 'teach_trap' | 'skills_list';

/** A dialogue topic an NPC can discuss */
export interface DialogueTopic {
  id: string;
  prompt: string;
  response: string;
  /** If set, completing this topic marks a tutorial step done */
  teachesCommand?: string;
  /** Special action to trigger when this option is selected */
  action?: DialogueAction;
  /** For teach actions: the spell ID to teach */
  teachSpell?: string;
  /** For teach actions: minimum level required */
  teachLevel?: number;
  /** Response shown to matching class below required level */
  rangerResponse?: string;
  /** Response shown to matching class at/above required level */
  rangerReadyResponse?: string;
}

/** Shop item with price and optional stock limit */
export interface ShopItem {
  baseId: string;
  basePrice: number;
  /** undefined = unlimited stock */
  stock?: number;
}

/** Shop inventory for merchant NPCs */
export interface ShopInventory {
  items: ShopItem[];
  buyMultiplier: number;
  sellMultiplier: number;
}

/** Schedule entry for time-based NPC location */
export interface NpcScheduleEntry {
  locationId: NodeId;
  activity: string;
}

/** Full NPC schedule mapping time periods to locations */
export type NpcSchedule = Record<TimeOfDay, NpcScheduleEntry>;

/** NPC role types for behavior */
export type NpcRole = 'shopkeeper' | 'guard' | 'trainer' | 'innkeeper' | 'citizen' | 'priest';

/** An NPC in the game world */
export interface NPC {
  id: string;
  name: string;
  title?: string;
  /** Static location (used if no schedule) */
  locationId: NodeId;
  dialogue: DialogueTopic[];
  shop?: ShopInventory;
  /** Tutorial topics this NPC can teach */
  tutorialTopics?: string[];
  /** Simulation data for ambient behaviors and reactions */
  simulation?: NPCSimulation;
  /** NPC role for behavior (guards fight, shopkeepers sell) */
  role?: NpcRole;
  /** Time-based schedule (overrides locationId if present) */
  schedule?: NpcSchedule;
  /** Full combat stats for combat-capable NPCs (guards, trainers, priests) */
  combat?: NpcCombatStats;
  /** Class this NPC can train (for trainers) */
  trainsClass?: string;
}

/** Tutorial progress tracker */
export interface TutorialProgress {
  /** Whether player chose to skip tutorial */
  skipped: boolean;
  /** Whether tutorial is complete (all steps done or skipped) */
  complete: boolean;
  /** Completed tutorial steps */
  completedSteps: string[];
}

/** Tutorial step definition */
export interface TutorialStep {
  id: string;
  description: string;
}

/** All tutorial steps */
export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'talk_mira', description: 'Speak with Innkeeper Mira' },
  { id: 'class_training', description: 'Complete class training' },
  { id: 'hit_dummy', description: 'Practice on Training Dummy' },
  { id: 'visit_shop', description: 'Visit a shop' },
  { id: 'leave_town', description: 'Leave through Town Gate' },
];
