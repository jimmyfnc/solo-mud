# NPC Simulation System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Easthollow feel alive with NPCs that perform ambient actions, have emergent conversations, and react to players and world events.

**Architecture:** Event-driven simulation with a dedicated tick running every 45 seconds. NPCs have topics of interest that drive emergent conversations. An event bus captures game events and creates temporary "hot topics" that spread through town gossip. Messages are styled contextually - subtle for ambience, prominent for player-directed reactions.

**Tech Stack:** TypeScript, Socket.io for message delivery, existing game loop infrastructure.

---

## Phase 1: Foundation

### Task 1: Create Simulation Types

**Files:**
- Create: `packages/shared/src/types/simulation.ts`
- Modify: `packages/shared/src/types/index.ts`

**Step 1: Write the type definitions**

Create `packages/shared/src/types/simulation.ts`:

```typescript
import type { TimeOfDay } from './world';

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
```

**Step 2: Export from index**

Add to `packages/shared/src/types/index.ts`:

```typescript
export * from './simulation';
```

**Step 3: Build shared package**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add packages/shared/src/types/simulation.ts packages/shared/src/types/index.ts
git commit -m "feat(shared): add simulation system types"
```

---

### Task 2: Create Topics Data

**Files:**
- Create: `packages/shared/src/data/topics.ts`
- Modify: `packages/shared/src/data/index.ts` (if exists, otherwise skip)

**Step 1: Create topics data file**

Create `packages/shared/src/data/topics.ts`:

```typescript
import type { NPCTopic } from '../types/simulation';

export const TOPICS: Record<string, NPCTopic> = {
  weather: {
    id: 'weather',
    category: 'small_talk',
    opinions: [
      "Looks like rain again...",
      "Fine day, isn't it?",
      "Cold wind from the north today.",
      "Sky's been grey for days now.",
      "At least it's not snowing.",
    ],
    responses: [
      "Aye, that it is.",
      "Could be worse.",
      "I've seen worse.",
      "True enough.",
    ],
  },

  rat_problem: {
    id: 'rat_problem',
    category: 'town_concern',
    opinions: [
      "The rats are getting bolder.",
      "Something's stirring them up in the sewers.",
      "Saw one big as a dog near the alley.",
      "They chewed through my grain sack last night.",
      "Captain should send guards down there.",
    ],
    responses: [
      "Keep 'em out of my shop, that's all I ask.",
      "Someone ought to do something about it.",
      "It's worse than last year, I reckon.",
      "I heard there's something bigger down there...",
    ],
  },

  adventurers: {
    id: 'adventurers',
    category: 'gossip',
    opinions: [
      "Another adventurer came through today.",
      "They never stay long, do they?",
      "Brave folk. Or foolish. Hard to tell.",
      "Good for business, at least.",
      "Wonder what they're looking for down in those sewers.",
    ],
    responses: [
      "As long as they pay their tab.",
      "Someone's got to deal with the rats.",
      "Better them than us.",
      "They come, they go. Always the same.",
    ],
  },

  trade: {
    id: 'trade',
    category: 'commerce',
    opinions: [
      "Supplies are running low.",
      "Caravan's late this week.",
      "Prices keep going up...",
      "Hard to get good steel these days.",
      "Business has been slow.",
    ],
    responses: [
      "Tell me about it.",
      "Same here.",
      "Everyone's feeling it.",
      "We make do.",
    ],
  },

  security: {
    id: 'security',
    category: 'town_concern',
    opinions: [
      "Guard patrols seem lighter lately.",
      "Did you hear about the trouble at the gate?",
      "Town walls could use some repairs.",
      "At least we're safer than the villages outside.",
    ],
    responses: [
      "The guards do their best.",
      "Could always be worse.",
      "I sleep with one eye open.",
      "That's what the walls are for.",
    ],
  },

  gossip: {
    id: 'gossip',
    category: 'gossip',
    opinions: [
      "Did you hear about what happened at the inn?",
      "Someone said they saw something strange near the temple.",
      "I heard the blacksmith's been working late every night.",
      "They say the alchemist talks to himself.",
    ],
    responses: [
      "Do tell...",
      "I hadn't heard that.",
      "People talk too much.",
      "Interesting...",
    ],
  },

  sewer_rumors: {
    id: 'sewer_rumors',
    category: 'town_concern',
    opinions: [
      "They say there's a king down there. A rat king.",
      "I heard screaming from the alley last night.",
      "Nobody who goes deep comes back the same.",
      "There's treasure down there, they say. If you're brave enough.",
    ],
    responses: [
      "Just old stories to scare children.",
      "I believe it.",
      "I'm not going to find out.",
      "Sounds like nonsense to me.",
    ],
  },

  harvest: {
    id: 'harvest',
    category: 'commerce',
    opinions: [
      "Harvest wasn't great this year.",
      "At least the fields are planted.",
      "Hoping for better weather next season.",
      "The soil's been good to us.",
    ],
    responses: [
      "We'll make it through.",
      "Always next year.",
      "Could be worse.",
      "That's farming for you.",
    ],
  },

  old_times: {
    id: 'old_times',
    category: 'nostalgia',
    opinions: [
      "Back in my day, things were different.",
      "I remember when this was all fields.",
      "The old mayor, now there was a leader.",
      "Things change. Not always for the better.",
    ],
    responses: [
      "Times change.",
      "I've heard the stories.",
      "Before my time.",
      "Some things never change though.",
    ],
  },

  festival: {
    id: 'festival',
    category: 'events',
    opinions: [
      "Festival's coming up soon.",
      "Remember last year's festival? What a night.",
      "I hope they have the fire dancers again.",
      "Best time of the year, festival week.",
    ],
    responses: [
      "Can't wait.",
      "I'll drink to that.",
      "Looking forward to it.",
      "Should be a good one.",
    ],
  },
};

export const TOPIC_IDS = Object.keys(TOPICS);
```

**Step 2: Build shared package**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/shared/src/data/topics.ts
git commit -m "feat(shared): add NPC conversation topics data"
```

---

### Task 3: Add Message Types

**Files:**
- Modify: `packages/shared/src/types/messages.ts`

**Step 1: Read current messages file**

Check current structure of `packages/shared/src/types/messages.ts`

**Step 2: Add simulation message type**

Add to the ServerMessage union type in `packages/shared/src/types/messages.ts`:

```typescript
import type { SimulationMessage } from './simulation';

// Add to ServerMessage union:
| SimulationMessage
```

**Step 3: Build shared package**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/shared/src/types/messages.ts
git commit -m "feat(shared): add simulation message type to ServerMessage"
```

---

### Task 4: Create Event Bus

**Files:**
- Create: `packages/server/src/npc/simulation/events.ts`

**Step 1: Write the failing test**

Create `packages/server/src/npc/simulation/events.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationEventBus, createHotTopic } from './events';

describe('SimulationEventBus', () => {
  let eventBus: SimulationEventBus;

  beforeEach(() => {
    eventBus = new SimulationEventBus();
  });

  it('should emit and receive events', () => {
    const handler = vi.fn();
    eventBus.on('creature_killed', handler);

    eventBus.emit('creature_killed', { creatureId: 'rat_1', killerId: 'player_1', locationId: 'town_square' });

    expect(handler).toHaveBeenCalledWith({
      creatureId: 'rat_1',
      killerId: 'player_1',
      locationId: 'town_square',
    });
  });

  it('should allow removing listeners', () => {
    const handler = vi.fn();
    eventBus.on('player_death', handler);
    eventBus.off('player_death', handler);

    eventBus.emit('player_death', { playerId: 'player_1', locationId: 'sewer_entrance' });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('createHotTopic', () => {
  it('should create hot topic from boss defeat', () => {
    const topic = createHotTopic('boss_defeated', {
      bossName: 'Rat King',
      playerName: 'Hero',
      locationId: 'sewer_kings_lair',
    });

    expect(topic.headline).toContain('Rat King');
    expect(topic.severity).toBe('major');
    expect(topic.decayHours).toBeGreaterThan(0);
    expect(topic.reactions.shocked).toBeDefined();
  });

  it('should create hot topic from player death', () => {
    const topic = createHotTopic('player_death', {
      playerName: 'Hero',
      locationId: 'sewer_entrance',
    });

    expect(topic.severity).toBe('minor');
    expect(topic.reactions.sad).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/events.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `packages/server/src/npc/simulation/events.ts`:

```typescript
import type { HotTopic } from '@solo-mud/shared';

// Event types the simulation listens for
export type SimulationEventType =
  | 'creature_killed'
  | 'player_death'
  | 'player_levelup'
  | 'boss_defeated'
  | 'npc_death'
  | 'player_enter_location'
  | 'player_leave_location'
  | 'time_changed';

export interface SimulationEventData {
  creature_killed: { creatureId: string; killerId: string; locationId: string };
  player_death: { playerId: string; locationId: string; cause?: string };
  player_levelup: { playerId: string; playerName: string; newLevel: number; locationId: string };
  boss_defeated: { bossName: string; playerName: string; locationId: string };
  npc_death: { npcId: string; npcName: string; locationId: string; cause?: string };
  player_enter_location: { playerId: string; playerName: string; locationId: string; fromLocationId?: string };
  player_leave_location: { playerId: string; playerName: string; locationId: string; toLocationId: string };
  time_changed: { newTime: string; oldTime: string };
}

type EventHandler<T extends SimulationEventType> = (data: SimulationEventData[T]) => void;

export class SimulationEventBus {
  private listeners: Map<SimulationEventType, Set<EventHandler<any>>> = new Map();

  on<T extends SimulationEventType>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<T extends SimulationEventType>(event: T, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<T extends SimulationEventType>(event: T, data: SimulationEventData[T]): void {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }
}

// Hot topic templates for different event types
export function createHotTopic(
  eventType: 'boss_defeated' | 'player_death' | 'npc_death' | 'player_levelup',
  data: Record<string, string | number>
): HotTopic {
  const now = Date.now();
  const id = `${eventType}_${now}`;

  switch (eventType) {
    case 'boss_defeated':
      return {
        id,
        headline: `the defeat of ${data.bossName}`,
        severity: 'major',
        decayHours: 72,
        createdAt: now,
        reactions: {
          shocked: [
            `Someone actually killed ${data.bossName}!`,
            `Did you hear? ${data.bossName} is dead!`,
            `I can't believe it... ${data.bossName}, gone.`,
          ],
          curious: [
            `I heard ${data.bossName} was big as a horse...`,
            `Wonder what treasure it was guarding.`,
            `They say ${data.playerName} did it alone.`,
          ],
          amused: [
            'Good riddance to bad rubbish, I say.',
            'One less monster to worry about.',
            "Maybe now the sewers will be safer. ...Probably not.",
          ],
        },
      };

    case 'player_death':
      return {
        id,
        headline: `the death of an adventurer`,
        severity: 'minor',
        decayHours: 24,
        createdAt: now,
        reactions: {
          sad: [
            'Another adventurer fell... such a shame.',
            "The sewers claim another one.",
            "They tried their best, I'm sure.",
          ],
          curious: [
            'Wonder what got them.',
            'Did anyone see what happened?',
          ],
        },
      };

    case 'npc_death':
      return {
        id,
        headline: `the death of ${data.npcName}`,
        severity: 'major',
        decayHours: 168, // 1 week
        createdAt: now,
        reactions: {
          shocked: [
            `Gods preserve us... ${data.npcName}? Dead?`,
            `I can't believe it...`,
            `${data.npcName} is gone? This can't be real.`,
          ],
          angry: [
            'Who would do such a thing?!',
            'Find whoever did this!',
            "There'll be justice for this.",
          ],
          sad: [
            `${data.npcName} was always so kind...`,
            "The town won't be the same.",
            'I just saw them yesterday...',
          ],
        },
      };

    case 'player_levelup':
      return {
        id,
        headline: `${data.playerName}'s growing strength`,
        severity: 'minor',
        decayHours: 12,
        createdAt: now,
        reactions: {
          curious: [
            `That adventurer ${data.playerName} is getting stronger.`,
            `Level ${data.newLevel} already? Impressive.`,
          ],
          amused: [
            'Another hero in the making, perhaps.',
            "Let's hope they use that strength wisely.",
          ],
        },
      };

    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

// Global event bus instance
export const simulationEventBus = new SimulationEventBus();
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/events.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/npc/simulation/events.ts packages/server/src/npc/simulation/events.test.ts
git commit -m "feat(server): add simulation event bus and hot topic creation"
```

---

### Task 5: Create Cooldown Tracker

**Files:**
- Create: `packages/server/src/npc/simulation/cooldowns.ts`

**Step 1: Write the failing test**

Create `packages/server/src/npc/simulation/cooldowns.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CooldownTracker } from './cooldowns';

describe('CooldownTracker', () => {
  let tracker: CooldownTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new CooldownTracker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track NPC conversation cooldowns', () => {
    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(true);

    tracker.recordConversation('mira', 'giles');

    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(false);
    expect(tracker.canNPCsConverse('giles', 'mira')).toBe(false); // Order shouldn't matter
    expect(tracker.canNPCsConverse('mira', 'marcus')).toBe(true); // Different pair is fine
  });

  it('should expire conversation cooldowns', () => {
    tracker.recordConversation('mira', 'giles');
    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(false);

    // Advance time past cooldown (10 minutes)
    vi.advanceTimersByTime(11 * 60 * 1000);

    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(true);
  });

  it('should track topic cooldowns per location', () => {
    expect(tracker.canDiscussTopic('town_square', 'weather')).toBe(true);

    tracker.recordTopicDiscussion('town_square', 'weather');

    expect(tracker.canDiscussTopic('town_square', 'weather')).toBe(false);
    expect(tracker.canDiscussTopic('town_inn', 'weather')).toBe(true); // Different location is fine
  });

  it('should track player-seen messages', () => {
    const messageHash = 'mira_ambient_1';

    expect(tracker.hasPlayerSeen('player_1', messageHash)).toBe(false);

    tracker.recordPlayerSeen('player_1', messageHash);

    expect(tracker.hasPlayerSeen('player_1', messageHash)).toBe(true);
    expect(tracker.hasPlayerSeen('player_2', messageHash)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/cooldowns.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Create `packages/server/src/npc/simulation/cooldowns.ts`:

```typescript
// Cooldown durations in milliseconds
const NPC_CONVERSATION_COOLDOWN = 10 * 60 * 1000; // 10 minutes
const TOPIC_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const PLAYER_SEEN_COOLDOWN = 10 * 60 * 1000; // 10 minutes

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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/cooldowns.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/npc/simulation/cooldowns.ts packages/server/src/npc/simulation/cooldowns.test.ts
git commit -m "feat(server): add cooldown tracker for simulation messages"
```

---

## Phase 2: Ambient System

### Task 6: Add Simulation Data to NPCs

**Files:**
- Modify: `packages/shared/src/types/town.ts`
- Modify: `packages/shared/src/data/easthollow.ts`

**Step 1: Extend NPC interface**

Add to `packages/shared/src/types/town.ts`:

```typescript
import type { NPCSimulation } from './simulation';

// Add to NPC interface:
simulation?: NPCSimulation;
```

**Step 2: Add simulation data to key NPCs**

Add simulation data to 6 key NPCs in `packages/shared/src/data/easthollow.ts`. Start with Mira:

```typescript
// In the mira NPC definition, add:
simulation: {
  personality: 'cheerful',
  topics: ['weather', 'adventurers', 'gossip', 'trade'],
  topicInterest: { weather: 5, adventurers: 8, gossip: 9, trade: 6 },
  ambientActions: [
    { text: 'wipes down the bar with a worn cloth', weight: 5 },
    { text: 'pours a drink for a patron', weight: 4 },
    { text: 'laughs at something someone said', weight: 3 },
    { text: 'stacks clean mugs behind the counter', weight: 2 },
    { text: 'hums a cheerful tune', weight: 2 },
  ],
  reactions: {
    player_enter: [
      { weight: 5, says: "Welcome, traveler! Sit anywhere you like." },
      { weight: 3, says: "Back again? The usual?", condition: "player.visits > 3" },
    ],
    time_change: [
      { weight: 5, action: 'lights the lanterns', says: "Evening crowd'll be here soon." },
    ],
  },
},
```

Then add for marcus, kira, thom, giles, and pete (similar structure with role-appropriate content).

**Step 3: Build shared package**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/shared/src/types/town.ts packages/shared/src/data/easthollow.ts
git commit -m "feat(shared): add simulation data to key NPCs"
```

---

### Task 7: Create Ambient Action Generator

**Files:**
- Create: `packages/server/src/npc/simulation/ambient.ts`

**Step 1: Write the failing test**

Create `packages/server/src/npc/simulation/ambient.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateAmbientAction, selectWeightedAction } from './ambient';
import type { NPC } from '@solo-mud/shared';

const mockNPC: NPC = {
  id: 'mira',
  name: 'Mira',
  title: 'the Innkeeper',
  locationId: 'town_inn',
  role: 'innkeeper',
  dialogue: [],
  simulation: {
    personality: 'cheerful',
    topics: ['weather'],
    topicInterest: { weather: 5 },
    ambientActions: [
      { text: 'wipes down the bar', weight: 5 },
      { text: 'hums a tune', weight: 2 },
    ],
    reactions: {},
  },
};

describe('selectWeightedAction', () => {
  it('should select from weighted actions', () => {
    const actions = [
      { text: 'action1', weight: 10 },
      { text: 'action2', weight: 1 },
    ];

    // With high weight difference, action1 should be selected most often
    const results = Array.from({ length: 100 }, () => selectWeightedAction(actions));
    const action1Count = results.filter(a => a?.text === 'action1').length;

    expect(action1Count).toBeGreaterThan(70); // Should be heavily weighted
  });

  it('should return null for empty actions', () => {
    expect(selectWeightedAction([])).toBeNull();
  });
});

describe('generateAmbientAction', () => {
  it('should generate ambient action message', () => {
    const message = generateAmbientAction(mockNPC);

    expect(message).not.toBeNull();
    expect(message?.type).toBe('simulation');
    expect(message?.subtype).toBe('ambient_action');
    expect(message?.npc).toBe('mira');
    expect(message?.npcName).toBe('Mira');
  });

  it('should return null for NPC without simulation data', () => {
    const npcWithoutSim: NPC = { ...mockNPC, simulation: undefined };
    expect(generateAmbientAction(npcWithoutSim)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/ambient.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Create `packages/server/src/npc/simulation/ambient.ts`:

```typescript
import type { NPC, SimulationMessage, AmbientAction } from '@solo-mud/shared';

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

  return actions[actions.length - 1];
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/ambient.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/npc/simulation/ambient.ts packages/server/src/npc/simulation/ambient.test.ts
git commit -m "feat(server): add ambient action generator"
```

---

## Phase 3: Conversations

### Task 8: Create Conversation System

**Files:**
- Create: `packages/server/src/npc/simulation/conversations.ts`

**Step 1: Write the failing test**

Create `packages/server/src/npc/simulation/conversations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { findSharedTopics, generateConversation, scoreConversation } from './conversations';
import type { NPC } from '@solo-mud/shared';

const mira: NPC = {
  id: 'mira',
  name: 'Mira',
  title: 'the Innkeeper',
  locationId: 'town_inn',
  role: 'innkeeper',
  dialogue: [],
  simulation: {
    personality: 'cheerful',
    topics: ['weather', 'gossip', 'adventurers'],
    topicInterest: { weather: 5, gossip: 9, adventurers: 8 },
    ambientActions: [],
    reactions: {},
  },
};

const giles: NPC = {
  id: 'giles',
  name: 'Giles',
  title: 'the Farmer',
  locationId: 'town_square',
  role: 'citizen',
  dialogue: [],
  simulation: {
    personality: 'friendly',
    topics: ['weather', 'harvest', 'rat_problem'],
    topicInterest: { weather: 8, harvest: 7, rat_problem: 6 },
    ambientActions: [],
    reactions: {},
  },
};

describe('findSharedTopics', () => {
  it('should find topics both NPCs share', () => {
    const shared = findSharedTopics(mira, giles);
    expect(shared).toContain('weather');
    expect(shared).not.toContain('gossip'); // Only mira has this
    expect(shared).not.toContain('harvest'); // Only giles has this
  });

  it('should return empty array if no shared topics', () => {
    const npc1 = { ...mira, simulation: { ...mira.simulation!, topics: ['gossip'] } };
    const npc2 = { ...giles, simulation: { ...giles.simulation!, topics: ['harvest'] } };
    expect(findSharedTopics(npc1, npc2)).toEqual([]);
  });
});

describe('scoreConversation', () => {
  it('should score based on combined interest', () => {
    // Weather: mira 5 + giles 8 = 13
    const score = scoreConversation(mira, giles, 'weather');
    expect(score).toBe(13);
  });
});

describe('generateConversation', () => {
  it('should generate conversation between NPCs', () => {
    const topics = {
      weather: {
        id: 'weather',
        category: 'small_talk' as const,
        opinions: ['Looks like rain...'],
        responses: ['Aye, that it is.'],
      },
    };

    const conversation = generateConversation(mira, giles, 'weather', topics);

    expect(conversation).not.toBeNull();
    expect(conversation?.type).toBe('simulation');
    expect(conversation?.subtype).toBe('npc_conversation');
    expect(conversation?.lines?.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/conversations.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Create `packages/server/src/npc/simulation/conversations.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/conversations.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/npc/simulation/conversations.ts packages/server/src/npc/simulation/conversations.test.ts
git commit -m "feat(server): add NPC conversation system"
```

---

## Phase 4: Reactions

### Task 9: Create Reaction System

**Files:**
- Create: `packages/server/src/npc/simulation/reactions.ts`

**Step 1: Write the failing test**

Create `packages/server/src/npc/simulation/reactions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateReaction, evaluateCondition } from './reactions';
import type { NPC } from '@solo-mud/shared';

const marcus: NPC = {
  id: 'marcus',
  name: 'Marcus',
  title: 'the Guard',
  locationId: 'town_gate',
  role: 'guard',
  dialogue: [],
  simulation: {
    personality: 'stern',
    topics: ['security'],
    topicInterest: { security: 9 },
    ambientActions: [],
    reactions: {
      player_enter: [
        { weight: 5, says: 'Adventurer.' },
        { weight: 3, says: 'State your business.', condition: 'player.level < 3' },
        { weight: 2, action: 'nods respectfully', condition: 'player.level >= 10' },
      ],
      creature_enter: [
        { weight: 10, action: 'draws his sword', says: 'Creature! Stand back!' },
      ],
    },
  },
};

describe('evaluateCondition', () => {
  it('should evaluate level conditions', () => {
    expect(evaluateCondition('player.level < 3', { level: 1 })).toBe(true);
    expect(evaluateCondition('player.level < 3', { level: 5 })).toBe(false);
    expect(evaluateCondition('player.level >= 10', { level: 10 })).toBe(true);
    expect(evaluateCondition('player.level >= 10', { level: 5 })).toBe(false);
  });

  it('should return true for undefined condition', () => {
    expect(evaluateCondition(undefined, { level: 5 })).toBe(true);
  });
});

describe('generateReaction', () => {
  it('should generate reaction to player entering', () => {
    const reaction = generateReaction(marcus, 'player_enter', { level: 1 });

    expect(reaction).not.toBeNull();
    expect(reaction?.type).toBe('simulation');
    expect(reaction?.subtype).toBe('reaction_to_player');
  });

  it('should filter by condition', () => {
    // High level player should not get "State your business"
    const reactions = Array.from({ length: 50 }, () =>
      generateReaction(marcus, 'player_enter', { level: 15 })
    );

    const stateBusinessCount = reactions.filter(r => r?.says?.includes('State your business')).length;
    expect(stateBusinessCount).toBe(0);
  });

  it('should return null for trigger with no reactions', () => {
    expect(generateReaction(marcus, 'player_death', { level: 5 })).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/reactions.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Create `packages/server/src/npc/simulation/reactions.ts`:

```typescript
import type { NPC, SimulationMessage, ReactionTrigger, WeightedReaction } from '@solo-mud/shared';
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
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/reactions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/npc/simulation/reactions.ts packages/server/src/npc/simulation/reactions.test.ts
git commit -m "feat(server): add NPC reaction system"
```

---

## Phase 5: Main Simulation Engine

### Task 10: Create Simulation Engine

**Files:**
- Create: `packages/server/src/npc/simulation/index.ts`

**Step 1: Write the failing test**

Create `packages/server/src/npc/simulation/simulation.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationEngine, getZoneType } from './index';
import type { NPC } from '@solo-mud/shared';

describe('getZoneType', () => {
  it('should identify social zones', () => {
    expect(getZoneType('town_inn')).toBe('social');
    expect(getZoneType('town_square')).toBe('social');
    expect(getZoneType('town_market')).toBe('social');
  });

  it('should identify quiet zones', () => {
    expect(getZoneType('town_temple')).toBe('quiet');
    expect(getZoneType('town_north_alley')).toBe('quiet');
  });

  it('should identify dungeon zones', () => {
    expect(getZoneType('sewer_entrance')).toBe('dungeon');
    expect(getZoneType('sewer_kings_lair')).toBe('dungeon');
  });

  it('should identify transitional zones', () => {
    expect(getZoneType('town_gate')).toBe('transitional');
    expect(getZoneType('town_east_road')).toBe('transitional');
  });
});

describe('SimulationEngine', () => {
  let engine: SimulationEngine;
  let mockSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSendMessage = vi.fn();
    engine = new SimulationEngine(mockSendMessage);
  });

  it('should be creatable', () => {
    expect(engine).toBeDefined();
  });

  it('should not run tick for dungeon zones', () => {
    const npcs: NPC[] = [];
    const result = engine.runTick('sewer_entrance', npcs, []);
    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/simulation.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

Create `packages/server/src/npc/simulation/index.ts`:

```typescript
import type { NPC, SimulationMessage, HotTopic } from '@solo-mud/shared';
import { TOPICS } from '@solo-mud/shared';
import { ZONE_ACTIVITY } from '@solo-mud/shared';
import { generateAmbientAction, generateAmbientSpeech } from './ambient';
import { tryGenerateConversation } from './conversations';
import { generateReaction, selectReactingNPCs } from './reactions';
import { cooldownTracker, CooldownTracker } from './cooldowns';
import { simulationEventBus, createHotTopic, SimulationEventBus } from './events';

export type ZoneType = 'social' | 'transitional' | 'quiet' | 'dungeon';

export function getZoneType(locationId: string): ZoneType {
  // Dungeon zones
  if (locationId.startsWith('sewer_') || locationId.startsWith('loc_')) {
    return 'dungeon';
  }

  // Social zones - high activity
  if (['town_inn', 'town_square', 'town_market', 'town_general', 'town_blacksmith', 'town_alchemist'].includes(locationId)) {
    return 'social';
  }

  // Quiet zones - low activity
  if (['town_temple', 'town_north_alley', 'town_training'].includes(locationId)) {
    return 'quiet';
  }

  // Transitional zones - medium activity
  return 'transitional';
}

interface PlayerInfo {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

type MessageSender = (playerId: string, message: SimulationMessage) => void;

export class SimulationEngine {
  private sendMessage: MessageSender;
  private cooldowns: CooldownTracker;
  private eventBus: SimulationEventBus;
  private hotTopics: HotTopic[] = [];

  constructor(
    sendMessage: MessageSender,
    cooldowns: CooldownTracker = cooldownTracker,
    eventBus: SimulationEventBus = simulationEventBus
  ) {
    this.sendMessage = sendMessage;
    this.cooldowns = cooldowns;
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('boss_defeated', (data) => {
      const topic = createHotTopic('boss_defeated', data);
      this.hotTopics.push(topic);
    });

    this.eventBus.on('player_death', (data) => {
      const topic = createHotTopic('player_death', { playerName: 'an adventurer', ...data });
      this.hotTopics.push(topic);
    });

    this.eventBus.on('player_levelup', (data) => {
      const topic = createHotTopic('player_levelup', data);
      this.hotTopics.push(topic);
    });
  }

  cleanupHotTopics(): void {
    const now = Date.now();
    this.hotTopics = this.hotTopics.filter(topic => {
      const expiryTime = topic.createdAt + (topic.decayHours * 60 * 60 * 1000);
      return now < expiryTime;
    });
  }

  runTick(
    locationId: string,
    npcsAtLocation: NPC[],
    playersAtLocation: PlayerInfo[]
  ): SimulationMessage[] {
    const zoneType = getZoneType(locationId);
    const config = ZONE_ACTIVITY[zoneType];

    if (!config.enabled || npcsAtLocation.length === 0) {
      return [];
    }

    const messages: SimulationMessage[] = [];
    const npcsWithSim = npcsAtLocation.filter(npc => npc.simulation);

    // 40% chance: Try NPC conversation
    if (Math.random() < 0.4 && npcsWithSim.length >= 2) {
      const result = tryGenerateConversation(
        npcsWithSim,
        TOPICS,
        (npc1, npc2) => this.cooldowns.canNPCsConverse(npc1, npc2),
        (loc, topic) => this.cooldowns.canDiscussTopic(loc, topic),
        locationId
      );

      if (result) {
        this.cooldowns.recordConversation(result.npc1, result.npc2);
        this.cooldowns.recordTopicDiscussion(locationId, result.topic);
        messages.push(result.message);
      }
    }

    // 50% chance: Ambient action from random NPC
    if (Math.random() < 0.5 && npcsWithSim.length > 0) {
      const npc = npcsWithSim[Math.floor(Math.random() * npcsWithSim.length)];

      // 70% action, 30% speech
      const message = Math.random() < 0.7
        ? generateAmbientAction(npc)
        : generateAmbientSpeech(npc, TOPICS);

      if (message) {
        messages.push(message);
      }
    }

    // Send messages to all players at location
    for (const message of messages) {
      for (const player of playersAtLocation) {
        const hash = this.getMessageHash(message);
        if (!this.cooldowns.hasPlayerSeen(player.id, hash)) {
          this.cooldowns.recordPlayerSeen(player.id, hash);
          this.sendMessage(player.id, message);
        }
      }
    }

    return messages;
  }

  handlePlayerEnter(
    locationId: string,
    player: PlayerInfo,
    npcsAtLocation: NPC[]
  ): void {
    const reactors = selectReactingNPCs(npcsAtLocation, 'player_enter', 1);

    for (const npc of reactors) {
      const reaction = generateReaction(npc, 'player_enter', {
        level: player.level,
        hp: player.hp,
        maxHp: player.maxHp,
      });

      if (reaction) {
        this.sendMessage(player.id, reaction);
      }
    }
  }

  private getMessageHash(message: SimulationMessage): string {
    return `${message.subtype}_${message.npc}_${message.says || message.action || ''}`.slice(0, 50);
  }
}

export { simulationEventBus, cooldownTracker };
export { generateAmbientAction } from './ambient';
export { generateReaction } from './reactions';
export { tryGenerateConversation } from './conversations';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/simulation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/server/src/npc/simulation/index.ts packages/server/src/npc/simulation/simulation.test.ts
git commit -m "feat(server): add main simulation engine"
```

---

## Phase 6: Integration

### Task 11: Integrate with Game Loop

**Files:**
- Modify: `packages/server/src/game/game-loop.ts`

**Step 1: Read current game-loop.ts**

Understand the current structure of the game loop.

**Step 2: Add simulation tick**

Add to `packages/server/src/game/game-loop.ts`:

```typescript
import { SimulationEngine, getZoneType, ZONE_ACTIVITY } from '../npc/simulation';

// In the GameLoop class, add:
private simulationEngine: SimulationEngine;
private lastSimulationTick: Map<string, number> = new Map();

// In constructor:
this.simulationEngine = new SimulationEngine((playerId, message) => {
  const session = this.sessions.get(playerId);
  if (session?.socket) {
    session.socket.emit('message', message);
  }
});

// Add new method:
private runSimulationTick(): void {
  const now = Date.now();

  // Group players by location
  const playersByLocation = new Map<string, PlayerInfo[]>();
  for (const [playerId, session] of this.sessions) {
    const locationId = session.player.locationId;
    if (!playersByLocation.has(locationId)) {
      playersByLocation.set(locationId, []);
    }
    playersByLocation.get(locationId)!.push({
      id: playerId,
      name: session.player.name,
      level: session.player.level,
      hp: session.player.hp,
      maxHp: session.player.maxHp,
    });
  }

  // Run simulation for each location with players
  for (const [locationId, players] of playersByLocation) {
    const zoneType = getZoneType(locationId);
    const config = ZONE_ACTIVITY[zoneType];
    if (!config.enabled) continue;

    // Check if enough time has passed for this location
    const lastTick = this.lastSimulationTick.get(locationId) || 0;
    const interval = config.minInterval + Math.random() * (config.maxInterval - config.minInterval);

    if (now - lastTick >= interval) {
      const npcsAtLocation = this.getNpcsAtLocation(locationId);
      this.simulationEngine.runTick(locationId, npcsAtLocation, players);
      this.lastSimulationTick.set(locationId, now);
    }
  }
}

// In the main tick interval, call:
this.runSimulationTick();
```

**Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add packages/server/src/game/game-loop.ts
git commit -m "feat(server): integrate simulation engine with game loop"
```

---

### Task 12: Add Client Styling

**Files:**
- Modify: `packages/client/src/components/GameMessage.tsx` (or equivalent)
- Modify: `packages/client/src/styles/` (if separate CSS)

**Step 1: Read current message component**

Understand how messages are currently rendered.

**Step 2: Add simulation message styling**

Add handling for simulation messages with contextual styling:

```typescript
// In message rendering component:
if (message.type === 'simulation') {
  const styleClass = getSimulationStyle(message.subtype);

  if (message.subtype === 'npc_conversation' && message.lines) {
    return (
      <div className={styleClass}>
        {message.lines.map((line, i) => (
          <div key={i}>
            <span className="npc-name">{line.npcName}</span>
            {line.action && <span className="npc-action"> *{line.action}*</span>}
            {line.says && <span className="npc-speech"> says, "{line.says}"</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styleClass}>
      <span className="npc-name">{message.npcName}</span>
      {message.action && <span className="npc-action"> *{message.action}*</span>}
      {message.says && <span className="npc-speech"> says, "{message.says}"</span>}
    </div>
  );
}

function getSimulationStyle(subtype: string): string {
  switch (subtype) {
    case 'ambient_action':
    case 'ambient_speech':
      return 'sim-ambient';
    case 'npc_conversation':
    case 'reaction_to_world':
      return 'sim-medium';
    case 'reaction_to_player':
    case 'hot_topic':
      return 'sim-prominent';
    default:
      return 'sim-medium';
  }
}
```

**Step 3: Add CSS**

```css
.sim-ambient {
  color: #888;
  font-style: italic;
}

.sim-medium {
  color: #aaa;
}

.sim-prominent {
  color: #fff;
}

.npc-name {
  color: #f0c040;
  font-weight: bold;
}

.npc-action {
  color: #888;
  font-style: italic;
}

.npc-speech {
  color: inherit;
}
```

**Step 4: Build and test client**

Run: `pnpm --filter @solo-mud/client build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/client/src/
git commit -m "feat(client): add simulation message styling"
```

---

### Task 13: Add Remaining NPC Simulation Data

**Files:**
- Modify: `packages/shared/src/data/easthollow.ts`

**Step 1: Add simulation data to remaining NPCs**

Add simulation data to all remaining NPCs (guards, shopkeepers, trainers, citizens). Include:
- Personality
- Topics and interest levels
- 5-8 ambient actions each
- Relevant reaction triggers

**Step 2: Add humor content**

Add Pete's schemes, Kira/Thom rivalry conversations, and rare golden moments.

**Step 3: Build and test**

Run: `pnpm build && pnpm test`
Expected: All pass

**Step 4: Commit**

```bash
git add packages/shared/src/data/easthollow.ts
git commit -m "feat(shared): add simulation data to all NPCs with humor content"
```

---

### Task 14: Add Conversation Templates

**Files:**
- Create: `packages/shared/src/data/conversations.ts`

**Step 1: Create conversation templates file**

Create pre-written conversation templates for specific NPC pairs:

```typescript
import type { ConversationTemplate } from '../types/simulation';

export const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    id: 'kira_thom_debt',
    initiatorIds: ['kira'],
    responderIds: ['thom'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "You still owe me for those hinges, Thom." },
      { speaker: 'responder', says: "I paid you in vegetables!" },
      { speaker: 'initiator', says: "That's not currency!" },
      { speaker: 'responder', says: "It is if you're hungry enough." },
    ],
  },
  // Add 10-15 more templates
];
```

**Step 2: Build**

Run: `pnpm --filter @solo-mud/shared build`

**Step 3: Commit**

```bash
git add packages/shared/src/data/conversations.ts
git commit -m "feat(shared): add NPC conversation templates"
```

---

### Task 15: Final Integration Test

**Files:**
- Create: `packages/server/src/npc/simulation/integration.test.ts`

**Step 1: Write integration test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { SimulationEngine } from './index';
import { EASTHOLLOW_NPCS } from '@solo-mud/shared';

describe('Simulation Integration', () => {
  it('should generate activity for town square', () => {
    const messages: any[] = [];
    const engine = new SimulationEngine((playerId, message) => {
      messages.push({ playerId, message });
    });

    const npcs = Object.values(EASTHOLLOW_NPCS).filter(
      npc => npc.simulation && npc.locationId === 'town_square'
    );

    // Run multiple ticks to ensure we get some output
    for (let i = 0; i < 10; i++) {
      engine.runTick('town_square', npcs, [
        { id: 'player_1', name: 'TestPlayer', level: 5, hp: 100, maxHp: 100 }
      ]);
    }

    expect(messages.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test**

Run: `pnpm --filter @solo-mud/server test -- --run src/npc/simulation/integration.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add packages/server/src/npc/simulation/integration.test.ts
git commit -m "test(server): add simulation integration test"
```

---

## Final Steps

### Task 16: Manual Playtest

**Step 1: Start dev server**

Run: `pnpm dev`

**Step 2: Connect and observe**

- Walk around town locations
- Wait 30-60 seconds in social zones
- Verify NPCs perform ambient actions
- Verify NPCs react when you enter
- Check message styling in client

**Step 3: Document any issues**

Create issues or fix immediately.

---

### Task 17: Final Commit and PR

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: All pass

**Step 2: Build all packages**

Run: `pnpm build`
Expected: Success

**Step 3: Create final commit if needed**

```bash
git add -A
git commit -m "feat: complete NPC simulation system implementation"
```

**Step 4: Push and create PR**

```bash
git push -u origin feature/npc-simulation
gh pr create --title "feat: NPC simulation system" --body "..."
```

---

## Success Criteria Checklist

- [ ] Players in town see ambient NPC activity every 30-90 seconds
- [ ] NPCs react when players enter/exit locations
- [ ] NPC conversations feel natural, not robotic
- [ ] Major events (boss kills, deaths) create town-wide buzz
- [ ] Humor lands without being overwhelming
- [ ] No message spam or repetitive dialogue
- [ ] Performance: simulation tick under 10ms per location
- [ ] All tests passing
- [ ] Client styling works correctly
