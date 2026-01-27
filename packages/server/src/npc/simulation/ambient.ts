import type { NPC, SimulationMessage } from '@solo-mud/shared';

export function selectWeightedAction<T extends { weight: number }>(
  actions: T[]
): T | null {
  if (actions.length === 0) return null;

  const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * totalWeight;

  for (const action of actions) {
    random -= action.weight;
    if (random <= 0) return action;
  }

  return actions[actions.length - 1] ?? null;
}

export function generateAmbientAction(npc: NPC): SimulationMessage | null {
  if (!npc.simulation?.ambientActions?.length) return null;

  const action = selectWeightedAction(npc.simulation.ambientActions);
  if (!action) return null;

  return {
    type: 'simulation',
    subtype: 'ambient_action',
    npc: npc.id,
    npcName: npc.name,
    action: action.text,
  };
}

export function generateAmbientSpeech(
  npc: NPC,
  topics: Record<string, { opinions: string[] }>
): SimulationMessage | null {
  if (!npc.simulation?.topics?.length) return null;

  // Pick a random topic the NPC cares about
  const topicId = npc.simulation.topics[Math.floor(Math.random() * npc.simulation.topics.length)];
  if (!topicId) return null;
  const topic = topics[topicId];
  if (!topic?.opinions?.length) return null;

  const opinion = topic.opinions[Math.floor(Math.random() * topic.opinions.length)];

  return {
    type: 'simulation',
    subtype: 'ambient_speech',
    npc: npc.id,
    npcName: npc.name,
    says: opinion,
  };
}
