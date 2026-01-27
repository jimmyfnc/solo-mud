# NPC Simulation System Design

**Date:** 2026-01-27
**Status:** Approved
**Goal:** Make Easthollow feel alive with NPCs that talk, act, and react to the world around them

---

## Overview

Add a simulation layer that brings NPCs to life through:
- **Ambient actions** - NPCs doing role-appropriate activities
- **NPC-to-NPC conversations** - Emergent topic-based chatter
- **Reactive commentary** - NPCs notice and respond to players and world events
- **World event system** - Dynamic "hot topics" from significant game events
- **Humor and personality** - Character quirks, running gags, and rare funny moments

---

## Architecture

```
+----------------------------------------------------------+
|                    NPC Simulation Engine                 |
+----------------------------------------------------------+
|  +-----------+  +-------------+  +------------------+    |
|  |  Ambient  |  |    NPC      |  |    Reactive      |    |
|  |  Actions  |  | Conversations|  |   Commentary     |    |
|  +-----+-----+  +------+------+  +---------+--------+    |
|        |               |                   |             |
|        +---------------+-------------------+             |
|                        v                                 |
|             +---------------------+                      |
|             |  Activity Scheduler |                      |
|             | (frequency by zone) |                      |
|             +---------------------+                      |
|                        |                                 |
|                        v                                 |
|             +---------------------+                      |
|             |  Message Formatter  |                      |
|             | (contextual styling)|                      |
|             +---------------------+                      |
+----------------------------------------------------------+
```

### Zone Activity Rates

| Zone Type | Examples | Tick Interval |
|-----------|----------|---------------|
| Social | Inn, Market, Square | 30-60 seconds |
| Transitional | Streets, Gate | 90-120 seconds |
| Quiet | Temple, Alleys | 3-5 minutes |
| Dungeons/Wilderness | Sewers, Forest | Disabled |

---

## NPC Data Model

### Extended NPC Interface

```typescript
interface NPCSimulation {
  // Personality affects tone of all outputs
  personality: 'friendly' | 'gruff' | 'nervous' | 'wise' | 'cheerful' | 'stern';

  // Topics this NPC cares about and might discuss
  topics: string[];
  topicInterest: Record<string, number>;  // 1-10 interest level

  // Ambient actions this NPC performs
  ambientActions: AmbientAction[];

  // What triggers reactions from this NPC
  reactions: Record<ReactionTrigger, WeightedReaction[]>;
}

interface AmbientAction {
  text: string;       // "hammers rhythmically at the anvil"
  weight: number;     // Higher = more likely
  condition?: string; // Optional condition
}

interface WeightedReaction {
  weight: number;
  action?: string;    // *emote text*
  says?: string;      // Spoken dialogue
  condition?: string; // e.g., "player.level < 3"
}
```

### NPCTopic Structure

```typescript
interface NPCTopic {
  id: string;              // e.g., 'rat_problem', 'weather'
  category: string;        // 'small_talk', 'town_concern', 'gossip'
  opinions: string[];      // Things NPCs might say about this
  responses: string[];     // How NPCs respond when others mention it
}
```

---

## Shared Topics

Initial topic set for all NPCs to potentially discuss:

| Topic ID | Category | Description |
|----------|----------|-------------|
| `weather` | small_talk | Weather observations |
| `rat_problem` | town_concern | The rat infestation in sewers |
| `adventurers` | gossip | Comments about adventurers |
| `trade` | commerce | Supply, caravans, prices |
| `security` | town_concern | Guard-related topics |
| `gossip` | gossip | General town rumors |
| `sewer_rumors` | town_concern | What lurks down in the sewers |
| `harvest` | commerce | Farming and food |
| `old_times` | nostalgia | Reminiscing about the past |
| `festival` | events | Upcoming or past celebrations |

---

## NPC-to-NPC Conversations

### Matching Algorithm

```
Every simulation tick, for each location with 2+ NPCs:

1. Find topic overlap between present NPCs
2. Score each potential conversation:
   - Base score = sum of both NPCs' interest levels
   - Bonus if topic is "hot" (recent world event)
   - Bonus if NPCs have not talked recently
   - Penalty if this topic was discussed recently here
3. Random chance based on score (higher = more likely)
4. If triggered, run a 2-4 line exchange
```

### Conversation Template

```typescript
interface ConversationTemplate {
  initiator: NPCRole[] | string[];
  responder: NPCRole[] | string[];
  topic: string;
  lines: ConversationLine[];
}

interface ConversationLine {
  speaker: 'initiator' | 'responder';
  action?: string;
  says: string;
}
```

### Cooldowns

- Same two NPCs: 10 minutes between conversations
- Same topic at same location: 5 minutes
- Player-specific tracking to avoid repeats across sessions

---

## Reactive Commentary

### Trigger Types

| Trigger | Description |
|---------|-------------|
| `player_enter` | Player walks into location |
| `player_leave` | Player exits location |
| `player_combat` | Player starts a fight |
| `player_death` | Player dies in location |
| `player_levelup` | Player gains a level |
| `creature_enter` | Creature appears in location |
| `time_change` | Time of day changes |
| `npc_arrive` | Another NPC arrives |

### Reaction Rules

```typescript
interface ReactionTrigger {
  event: TriggerType;
  conditions?: {
    playerLevel?: { min?: number; max?: number };
    timeOfDay?: TimeOfDay[];
    chance?: number;        // 0-1, default 0.5
    cooldown?: number;      // seconds before can trigger again
  };
  reactions: WeightedReaction[];
}
```

### Priority System

When multiple NPCs could react to the same event, only 1-2 actually respond (random selection weighted by relevance).

---

## World Event System

### Event Bus

```typescript
// Events fired from existing game code
eventBus.emit('creature_killed', { creature, killer, location });
eventBus.emit('player_death', { player, location, cause });
eventBus.emit('player_levelup', { player, newLevel });
eventBus.emit('boss_defeated', { boss, player, location });
eventBus.emit('npc_death', { npc, location, cause });
```

### Hot Topics

Significant events create temporary "hot topics" that NPCs discuss:

```typescript
interface HotTopic {
  id: string;
  headline: string;
  severity: 'minor' | 'moderate' | 'major';
  decay: number;           // Hours until topic fades
  createdAt: number;
  reactions: {
    shocked?: string[];
    angry?: string[];
    sad?: string[];
    curious?: string[];
    amused?: string[];
  };
}
```

**Example - Boss Defeated:**
```typescript
{
  id: 'rat_king_defeated_1706345600',
  headline: "the Rat King's defeat",
  severity: 'major',
  decay: 72,
  reactions: {
    shocked: ["Someone actually killed the Rat King!"],
    curious: ["I heard it was big as a horse..."],
    amused: ["Good riddance to bad rubbish, I say."]
  }
}
```

---

## Message Formatting

### Message Types

```typescript
type SimulationMessageType =
  | 'ambient_action'      // Kira hammers at the anvil
  | 'ambient_speech'      // Giles mutters about the weather
  | 'npc_conversation'    // Two NPCs chatting
  | 'reaction_to_player'  // NPC reacts to something you did
  | 'reaction_to_world'   // NPC reacts to world event
  | 'hot_topic'           // NPC mentions recent major event
```

### Visual Hierarchy

| Priority | Types | Styling |
|----------|-------|---------|
| **Prominent** | `reaction_to_player`, `hot_topic` | Normal/bright text |
| **Medium** | `npc_conversation`, `reaction_to_world` | Slightly dimmed |
| **Subtle** | `ambient_action`, `ambient_speech` | Dimmed, italicized |

### Client CSS

```css
.sim-ambient    { color: #888; font-style: italic; }
.sim-medium     { color: #aaa; }
.sim-prominent  { color: #fff; }
.sim-npc-name   { color: #f0c040; }
```

---

## Humor and Personality

### Tone Balance

- 70% normal/atmospheric
- 25% light humor / character quirks
- 5% genuinely funny moments

### Humor Types

| Type | Example |
|------|---------|
| Dry wit | *Marcus watches a rat scurry past.* "Guess he didn't get the memo about the curfew." |
| Running gags | Pete's endless failed business ventures |
| NPC bickering | Kira and Thom's debt argument (never resolved) |
| Bad puns | *Thom:* "Business is going up. Get it? Axes? ...I'll stop." |
| Overheard absurdity | Guards debating if the Rat King wears a tiny crown |
| Self-aware moments | *Giles:* "Ever feel like someone's watching us? ...Nah." |
| Callback humor | References to player achievements |

### Character-Specific Comedy

**Pete the Drunk** - Endless schemes:
- "Rat leather boots"
- "Sewer tours for tourists"
- "A tavern inside the tavern. Tav-ception."
- "Training rats to find treasure"

**Kira and Thom Rivalry:**
```
Kira: "You still owe me for those hinges, Thom."
Thom: "I paid you in vegetables!"
Kira: "That's not currency!"
Thom: "It is if you're hungry enough."
```

### Rare "Golden" Moments (1% chance)

Special events that are rare enough to feel special:
- A chicken sprints through the square, three guards chase it, nobody acknowledges this
- Pete stands up dramatically: "I've figured it out!" Sits back down. "Never mind."
- After player's 100th rat kill: "Somewhere in the sewers, a rat squeaks mournfully."

---

## File Structure

### New Files

```
packages/server/src/npc/simulation/
  index.ts             # Main simulation engine
  ambient.ts           # Ambient action generator
  conversations.ts     # NPC-to-NPC conversation system
  reactions.ts         # Reactive commentary handler
  events.ts            # World event bus and hot topics
  cooldowns.ts         # Track what has been said/seen

packages/shared/src/
  types/simulation.ts  # Simulation type definitions
  data/topics.ts       # Shared topic definitions
```

### Modified Files

| File | Changes |
|------|---------|
| `packages/shared/src/types/town.ts` | Add `NPCSimulation` interface |
| `packages/shared/src/types/messages.ts` | Add simulation message types |
| `packages/server/src/game/game-loop.ts` | Add simulation tick |
| `packages/server/src/game/ecosystem.ts` | Fire events on kills, deaths |
| `packages/client/src/components/` | Style simulation messages |
| `packages/shared/src/data/easthollow.ts` | Add simulation data to NPCs |

---

## Game Loop Integration

```typescript
// New tick added to game-loop.ts

const SIMULATION_TICK_INTERVAL = 45000;  // 45 seconds base

function startSimulationTick() {
  setInterval(() => {
    for (const [locationId, players] of activeLocations) {
      if (players.length > 0 && isSimulationZone(locationId)) {
        runSimulationTick(locationId, players);
      }
    }
  }, SIMULATION_TICK_INTERVAL);
}
```

---

## Content Estimates

| Content Type | Count |
|--------------|-------|
| Shared topics | 10 |
| NPCs with simulation data | 15-20 |
| Ambient actions per NPC | 5-8 |
| Reaction triggers per NPC | 4-6 |
| Conversation templates | 20-30 |
| Hot topic templates | 10 |
| Rare golden moments | 10-15 |
| **Total hand-written lines** | ~600-700 |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create type definitions (`simulation.ts`)
- [ ] Build event bus (`events.ts`)
- [ ] Add simulation tick to game loop
- [ ] Create message types and client styling

### Phase 2: Ambient System
- [ ] Implement ambient action generator
- [ ] Add simulation data to 5-6 key NPCs (Mira, Marcus, Kira, Thom, Pete, Giles)
- [ ] Test ambient actions appearing in-game

### Phase 3: Conversations
- [ ] Build conversation matching system
- [ ] Create 10-15 conversation templates
- [ ] Implement cooldown tracking
- [ ] Test NPC-to-NPC conversations

### Phase 4: Reactions
- [ ] Implement reaction trigger system
- [ ] Add player-focused reactions (enter, leave, combat, death, levelup)
- [ ] Add world-focused reactions (time change, creature enter)
- [ ] Test reactive commentary

### Phase 5: World Events
- [ ] Connect event bus to existing game events
- [ ] Implement hot topic system
- [ ] Add hot topic decay
- [ ] Test dynamic topic generation

### Phase 6: Polish and Content
- [ ] Add simulation data to all remaining NPCs
- [ ] Write full topic content (opinions, responses)
- [ ] Add humor and rare moments
- [ ] Balance frequency and variety
- [ ] Playtest and tune

---

## Success Criteria

- [ ] Players in town see ambient NPC activity every 30-90 seconds
- [ ] NPCs react when players enter/exit locations
- [ ] NPC conversations feel natural, not robotic
- [ ] Major events (boss kills, deaths) create town-wide buzz
- [ ] Humor lands without being overwhelming
- [ ] No message spam or repetitive dialogue
- [ ] Performance: simulation tick under 10ms per location