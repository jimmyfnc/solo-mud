/**
 * Town, NPC, and shop type definitions.
 */

import type { NodeId } from './world';

/** A dialogue topic an NPC can discuss */
export interface DialogueTopic {
  id: string;
  prompt: string;
  response: string;
  /** If set, completing this topic marks a tutorial step done */
  teachesCommand?: string;
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

/** An NPC in the game world */
export interface NPC {
  id: string;
  name: string;
  title?: string;
  locationId: NodeId;
  dialogue: DialogueTopic[];
  shop?: ShopInventory;
  /** Tutorial topics this NPC can teach */
  tutorialTopics?: string[];
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
