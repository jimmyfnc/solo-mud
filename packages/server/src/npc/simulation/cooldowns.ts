// Cooldown durations in milliseconds
const NPC_CONVERSATION_COOLDOWN = 3 * 60 * 1000; // 3 minutes (was 10)
const TOPIC_COOLDOWN = 2 * 60 * 1000; // 2 minutes (was 5)
const PLAYER_SEEN_COOLDOWN = 5 * 60 * 1000; // 5 minutes (was 10)

export class CooldownTracker {
  // Key: sorted NPC IDs joined by '-', Value: timestamp when cooldown expires
  private npcConversations: Map<string, number> = new Map();

  // Key: locationId:topicId, Value: timestamp when cooldown expires
  private topicDiscussions: Map<string, number> = new Map();

  // Key: playerId, Value: Set of message hashes with expiry times
  private playerSeen: Map<string, Map<string, number>> = new Map();

  private getNPCPairKey(npc1: string, npc2: string): string {
    return [npc1, npc2].sort().join('-');
  }

  canNPCsConverse(npc1: string, npc2: string): boolean {
    const key = this.getNPCPairKey(npc1, npc2);
    const expiry = this.npcConversations.get(key);
    if (!expiry) return true;
    if (Date.now() >= expiry) {
      this.npcConversations.delete(key);
      return true;
    }
    return false;
  }

  recordConversation(npc1: string, npc2: string): void {
    const key = this.getNPCPairKey(npc1, npc2);
    this.npcConversations.set(key, Date.now() + NPC_CONVERSATION_COOLDOWN);
  }

  canDiscussTopic(locationId: string, topicId: string): boolean {
    const key = `${locationId}:${topicId}`;
    const expiry = this.topicDiscussions.get(key);
    if (!expiry) return true;
    if (Date.now() >= expiry) {
      this.topicDiscussions.delete(key);
      return true;
    }
    return false;
  }

  recordTopicDiscussion(locationId: string, topicId: string): void {
    const key = `${locationId}:${topicId}`;
    this.topicDiscussions.set(key, Date.now() + TOPIC_COOLDOWN);
  }

  hasPlayerSeen(playerId: string, messageHash: string): boolean {
    const playerMessages = this.playerSeen.get(playerId);
    if (!playerMessages) return false;

    const expiry = playerMessages.get(messageHash);
    if (!expiry) return false;
    if (Date.now() >= expiry) {
      playerMessages.delete(messageHash);
      return false;
    }
    return true;
  }

  recordPlayerSeen(playerId: string, messageHash: string): void {
    if (!this.playerSeen.has(playerId)) {
      this.playerSeen.set(playerId, new Map());
    }
    this.playerSeen.get(playerId)!.set(messageHash, Date.now() + PLAYER_SEEN_COOLDOWN);
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();

    for (const [key, expiry] of this.npcConversations) {
      if (now >= expiry) this.npcConversations.delete(key);
    }

    for (const [key, expiry] of this.topicDiscussions) {
      if (now >= expiry) this.topicDiscussions.delete(key);
    }

    for (const [playerId, messages] of this.playerSeen) {
      for (const [hash, expiry] of messages) {
        if (now >= expiry) messages.delete(hash);
      }
      if (messages.size === 0) this.playerSeen.delete(playerId);
    }
  }
}

// Global instance
export const cooldownTracker = new CooldownTracker();
