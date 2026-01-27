import type { NPC, NPCTopic, SimulationMessage } from '@solo-mud/shared';

export function findSharedTopics(npc1: NPC, npc2: NPC): string[] {
  if (!npc1.simulation?.topics || !npc2.simulation?.topics) return [];

  const topics1 = new Set(npc1.simulation.topics);
  return npc2.simulation.topics.filter(t => topics1.has(t));
}

export function scoreConversation(npc1: NPC, npc2: NPC, topicId: string): number {
  const interest1 = npc1.simulation?.topicInterest?.[topicId] ?? 0;
  const interest2 = npc2.simulation?.topicInterest?.[topicId] ?? 0;
  return interest1 + interest2;
}

export function generateConversation(
  initiator: NPC,
  responder: NPC,
  topicId: string,
  topics: Record<string, NPCTopic>
): SimulationMessage | null {
  const topic = topics[topicId];
  if (!topic?.opinions?.length || !topic?.responses?.length) return null;

  const opinion = topic.opinions[Math.floor(Math.random() * topic.opinions.length)];
  const response = topic.responses[Math.floor(Math.random() * topic.responses.length)];

  return {
    type: 'simulation',
    subtype: 'npc_conversation',
    lines: [
      { npc: initiator.id, npcName: initiator.name, says: opinion },
      { npc: responder.id, npcName: responder.name, says: response },
    ],
  };
}

export function tryGenerateConversation(
  npcs: NPC[],
  topics: Record<string, NPCTopic>,
  canConverse: (npc1: string, npc2: string) => boolean,
  canDiscussTopic: (locationId: string, topicId: string) => boolean,
  locationId: string
): { message: SimulationMessage; npc1: string; npc2: string; topic: string } | null {
  if (npcs.length < 2) return null;

  // Find all possible conversation pairs and topics
  const candidates: Array<{ npc1: NPC; npc2: NPC; topic: string; score: number }> = [];

  for (let i = 0; i < npcs.length; i++) {
    for (let j = i + 1; j < npcs.length; j++) {
      const npc1 = npcs[i];
      const npc2 = npcs[j];

      if (!canConverse(npc1.id, npc2.id)) continue;

      const sharedTopics = findSharedTopics(npc1, npc2);
      for (const topicId of sharedTopics) {
        if (!canDiscussTopic(locationId, topicId)) continue;

        const score = scoreConversation(npc1, npc2, topicId);
        candidates.push({ npc1, npc2, topic: topicId, score });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Weight selection by score
  const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
  let random = Math.random() * totalScore;

  for (const candidate of candidates) {
    random -= candidate.score;
    if (random <= 0) {
      const message = generateConversation(candidate.npc1, candidate.npc2, candidate.topic, topics);
      if (message) {
        return {
          message,
          npc1: candidate.npc1.id,
          npc2: candidate.npc2.id,
          topic: candidate.topic,
        };
      }
    }
  }

  return null;
}
