import type { NPC, SimulationMessage, ReactionTrigger } from '@solo-mud/shared';
import { selectWeightedAction } from './ambient';

interface PlayerContext {
  level: number;
  hp?: number;
  maxHp?: number;
  previousLocation?: string;
  visits?: number;
}

export function evaluateCondition(
  condition: string | undefined,
  context: PlayerContext
): boolean {
  if (!condition) return true;

  // Simple condition parser for common patterns
  // Supports: player.level < N, player.level > N, player.level >= N, player.level <= N
  const levelMatch = condition.match(/player\.level\s*(>=|<=|>|<)\s*(\d+)/);
  if (levelMatch) {
    const [, operator, valueStr] = levelMatch;
    const value = parseInt(valueStr, 10);
    switch (operator) {
      case '<': return context.level < value;
      case '>': return context.level > value;
      case '<=': return context.level <= value;
      case '>=': return context.level >= value;
    }
  }

  // HP conditions
  const hpMatch = condition.match(/player\.hp\s*<\s*player\.maxHp\s*\*\s*([\d.]+)/);
  if (hpMatch && context.hp !== undefined && context.maxHp !== undefined) {
    const threshold = parseFloat(hpMatch[1]);
    return context.hp < context.maxHp * threshold;
  }

  // Visit conditions
  const visitsMatch = condition.match(/player\.visits\s*>\s*(\d+)/);
  if (visitsMatch && context.visits !== undefined) {
    return context.visits > parseInt(visitsMatch[1], 10);
  }

  // Previous location conditions
  if (condition.includes('player.previousLocation')) {
    const startsWithMatch = condition.match(/player\.previousLocation\.startsWith\(['"]([^'"]+)['"]\)/);
    if (startsWithMatch && context.previousLocation) {
      return context.previousLocation.startsWith(startsWithMatch[1]);
    }
  }

  // Unknown condition - default to true
  return true;
}

export function generateReaction(
  npc: NPC,
  trigger: ReactionTrigger,
  context: PlayerContext
): SimulationMessage | null {
  const reactions = npc.simulation?.reactions?.[trigger];
  if (!reactions?.length) return null;

  // Filter reactions by condition
  const validReactions = reactions.filter(r => evaluateCondition(r.condition, context));
  if (validReactions.length === 0) return null;

  const selected = selectWeightedAction(validReactions);
  if (!selected) return null;

  const isPlayerTrigger = trigger.startsWith('player_');

  return {
    type: 'simulation',
    subtype: isPlayerTrigger ? 'reaction_to_player' : 'reaction_to_world',
    npc: npc.id,
    npcName: npc.name,
    action: selected.action,
    says: selected.says,
  };
}

export function selectReactingNPCs(
  npcs: NPC[],
  trigger: ReactionTrigger,
  maxReactors: number = 2
): NPC[] {
  // Filter to NPCs that have reactions for this trigger
  const reactingNPCs = npcs.filter(npc => {
    const reactions = npc.simulation?.reactions?.[trigger];
    return reactions && reactions.length > 0;
  });

  // Randomly select up to maxReactors
  const shuffled = [...reactingNPCs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, maxReactors);
}
