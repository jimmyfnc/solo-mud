# Bot Player System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create AI-controlled player characters (bots) that are indistinguishable from real players - they quest, fight, trade, form relationships, and could theoretically "beat the game."

**Architecture:** GOAP (Goal-Oriented Action Planning) for decision making, tiered persistence (named bots persist, generics are ephemeral), full player interaction with relationship memory, personality-driven behavior.

**Tech Stack:** TypeScript, integrates with existing GameLoop, CommandHandler, and Player systems.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [GOAP Decision System](#goap-decision-system)
4. [Personality System](#personality-system)
5. [Relationships & Social Memory](#relationships--social-memory)
6. [Bot Memory & World Knowledge](#bot-memory--world-knowledge)
7. [Action System](#action-system)
8. [Death, Respawn & Lifecycle](#death-respawn--lifecycle)
9. [Game Integration](#game-integration)
10. [Named Bot Roster](#named-bot-roster)
11. [Conversation System](#conversation-system)
12. [File Structure](#file-structure)
13. [Implementation Tasks](#implementation-tasks)

---

## Overview

### Design Decisions

| Aspect | Decision |
|--------|----------|
| **Purpose** | Full simulation - bots indistinguishable from players |
| **Decision Making** | GOAP (Goal-Oriented Action Planning) |
| **Persistence** | Tiered - named bots persistent, generics ephemeral |
| **Player Interaction** | Full - party, trade, relationships, memory |
| **Personalities** | Full profiles with traits, quirks, speech styles |
| **Social Networks** | Friendships, rivalries, factions between bots |
| **Progression** | Aspirational goals ("defeat all bosses") |
| **Economy** | Bounded participation with limits |
| **Combat Style** | Personality-driven (brave vs cautious) |
| **Death** | Permadeath for generics, delayed respawn for named |
| **Conversations** | Templates now, local LLM upgrade path later |

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BotManager                               │
│  - Maintains target population (e.g., 20-30 bots active)        │
│  - Spawns generic bots when population low                      │
│  - Manages named bot roster (persistent, hand-crafted)          │
│  - Runs bot AI ticks (every 2-5 seconds)                        │
│  - Handles bot death/respawn lifecycle                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│       NamedBot           │    │      GenericBot          │
│  - Persistent (database) │    │  - Ephemeral (memory)    │
│  - Hand-crafted profile  │    │  - Procedural profile    │
│  - Delayed respawn       │    │  - Permadeath            │
│  - Builds history        │    │  - Replaced on death     │
│  - Can become "famous"   │    │  - Population filler     │
└──────────────────────────┘    └──────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BotPlayer                               │
│  - Extends Player type (same stats, inventory, spells, etc.)    │
│  - isBot: true flag                                             │
│  - botProfile: personality, goals, relationships                │
│  - botBrain: GOAP decision system                               │
│  - botMemory: knowledge of world, events, players               │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Bots use the same `Player` type as real players (no separate system)
- `BotManager` controls population and lifecycle
- Named bots are special - they persist, have history, respawn after delay
- Generic bots are disposable - they fill the world, die permanently, get replaced

---

## GOAP Decision System

The "brain" of each bot. Instead of scripted behaviors, bots have **goals** and **actions**, and they plan how to achieve goals using available actions.

### Types

```typescript
// Goals have conditions that make them satisfied
interface BotGoal {
  id: string;                              // 'survive', 'level_up', 'get_rich'
  priority: (bot: BotPlayer) => number;    // Dynamic priority based on state
  isComplete: (bot: BotPlayer) => boolean;

  // Aspirational goals (long-term dreams)
  isAspiration?: boolean;                  // "Defeat every boss"
  progress?: (bot: BotPlayer) => number;   // 0-100%
}

// Actions have preconditions and effects
interface BotAction {
  id: string;                              // 'attack', 'flee', 'buy_potion', 'travel'
  preconditions: (bot: BotPlayer, world: WorldState) => boolean;
  cost: (bot: BotPlayer) => number;        // Lower = preferred
  effects: string[];                       // What world state this changes
  execute: (bot: BotPlayer) => Promise<void>;
}
```

### Goal Examples

| Goal | Priority | Complete When |
|------|----------|---------------|
| `survive` | 100 when HP < 30%, else 10 | HP > 50% |
| `heal_up` | 80 when HP < 70% | HP = max |
| `level_up` | 50 (base, modified by personality) | Just leveled |
| `get_richer` | 30-70 (greedy bots higher) | Never (ongoing) |
| `complete_quest` | 60 when quest active | Quest done |
| `socialize` | 20-50 (social bots higher) | Talked recently |
| `defeat_all_bosses` | 40 (aspiration) | All bosses dead |

### Planning Example

```
Bot state: HP 20%, no potions, in combat
Active goals: survive (priority 100), level_up (priority 50)

Planner evaluates actions:
- attack: preconditions met, but doesn't help survive
- flee: preconditions met, helps survive, cost 10
- use_potion: preconditions FAIL (no potions)
- call_for_help: preconditions met if allies nearby

Selected plan: flee → travel to town → buy potions → heal_up
```

---

## Personality System

Personality modifies how GOAP evaluates goals and actions. Two bots with the same stats will behave very differently based on personality.

### Types

```typescript
interface BotPersonality {
  // Core traits (0-100 scale)
  bravery: number;       // 0=flees early, 100=fights to death
  greed: number;         // 0=generous, 100=hoards everything
  sociability: number;   // 0=loner, 100=always seeks company
  patience: number;      // 0=impulsive, 100=methodical planner
  aggression: number;    // 0=peaceful, 100=attacks on sight

  // Preferences
  preferredActivities: ('combat' | 'exploration' | 'trading' | 'socializing')[];
  preferredZones: string[];        // 'sewer', 'wilderness', 'town'
  dislikedCreatures: string[];     // Will avoid these

  // Quirks (make bots memorable)
  quirks: BotQuirk[];              // 'always_greets', 'hoards_keys', 'fears_rats'

  // Speech style (for future LLM conversations)
  speechStyle: 'formal' | 'casual' | 'gruff' | 'cheerful' | 'mysterious';
  catchphrases: string[];          // "For glory!", "Got any coin?"
}

interface BotQuirk {
  id: string;
  description: string;
  effect: (bot: BotPlayer, context: any) => void;
}
```

### Trait Effects on GOAP

| Trait | Effect on Goals/Actions |
|-------|------------------------|
| High bravery | `survive` goal triggers at 15% HP instead of 30% |
| High greed | `get_richer` priority +30, reluctant to spend gold |
| High sociability | `socialize` priority +20, prefers group actions |
| Low patience | Shorter planning horizon, impulsive choices |
| High aggression | Will attack creatures slightly above level |

### Example: Aldric the Brave

```typescript
{
  bravery: 90,
  greed: 20,
  sociability: 70,
  patience: 50,
  aggression: 60,
  preferredActivities: ['combat', 'socializing'],
  preferredZones: ['sewer', 'wilderness'],
  quirks: [{ id: 'protector', description: 'Rushes to help players in danger' }],
  speechStyle: 'formal',
  catchphrases: ['For Easthollow!', 'Stand behind me!']
}
```

---

## Relationships & Social Memory

Bots remember interactions and form opinions about players and other bots. This affects who they group with, help, or avoid.

### Types

```typescript
interface BotRelationships {
  // Relationship with any entity (player or bot)
  opinions: Record<string, Relationship>;

  // Guild/faction membership
  faction?: string;           // 'easthollow_defenders', 'lone_wolves'
  factionRole?: 'leader' | 'member' | 'recruit';

  // Blocked entities (won't group with)
  blocked: string[];
}

interface Relationship {
  entityId: string;
  entityName: string;
  isPlayer: boolean;

  // Opinion score: -100 (enemy) to +100 (best friend)
  opinion: number;

  // What formed this opinion
  history: RelationshipEvent[];

  // Derived state
  status: 'enemy' | 'disliked' | 'neutral' | 'friendly' | 'ally' | 'best_friend';
}

interface RelationshipEvent {
  type: 'helped_in_combat' | 'healed_me' | 'grouped_together' |
        'abandoned_me' | 'stole_kill' | 'refused_trade' | 'saved_my_life';
  timestamp: number;
  opinionChange: number;      // +10 for heal, -20 for abandon, etc.
}
```

### Opinion Thresholds

| Score | Status | Bot Behavior |
|-------|--------|--------------|
| -100 to -50 | Enemy | Refuses interaction, may attack if aggressive |
| -49 to -10 | Disliked | Reluctant to group, drives hard bargains |
| -9 to +9 | Neutral | Normal interactions |
| +10 to +49 | Friendly | Prefers grouping, offers help |
| +50 to +89 | Ally | Seeks out for groups, defends in combat |
| +90 to +100 | Best Friend | Prioritizes above other goals |

### Opinion Changes

| Event | Change |
|-------|--------|
| Grouped and completed dungeon | +15 |
| Healed me in combat | +10 |
| Saved my life (killed enemy targeting me) | +25 |
| Abandoned party mid-combat | -30 |
| Refused reasonable trade | -5 |
| Killed my friend | -50 |

### Factions

Factions are groups of bots with shared identity:

- Founded by named bot leaders
- Members prefer grouping with each other
- Shared goals (e.g., "Protect town from threats")
- Reputation spreads: helping one member improves opinion with all

**Example: "Easthollow Defenders"**
- Leader: Captain Helena (named bot)
- Members: Aldric, Sister Mira, various generics
- Goal: Protect Easthollow from dungeon threats

---

## Bot Memory & World Knowledge

Bots need to know about the world to make intelligent decisions. Memory is divided into world knowledge, personal history, and current state.

### Types

```typescript
interface BotMemory {
  // World knowledge (what the bot knows about)
  knownLocations: Set<string>;         // Locations they've visited
  knownPaths: Map<string, string[]>;   // Cached routes between locations
  knownCreatures: Map<string, CreatureKnowledge>;  // What they've fought
  knownShops: Map<string, ShopKnowledge>;          // Prices, inventory

  // Quest/goal tracking
  activeQuests: BotQuest[];
  completedQuests: string[];
  aspirationProgress: Map<string, number>;  // 'defeat_all_bosses' → 3/7

  // Personal history
  deaths: DeathRecord[];               // Where, when, what killed them
  victories: VictoryRecord[];          // Notable kills
  friendsMade: string[];               // For social bots
  placesExplored: number;              // Exploration achievement

  // Short-term memory (recent events)
  recentEvents: MemoryEvent[];         // Last ~20 events
  lastCombat: number;                  // Timestamp
  lastSocialInteraction: number;
  lastShopVisit: string;
}

interface CreatureKnowledge {
  creatureType: string;
  timesDefeated: number;
  timesDiedTo: number;
  estimatedDifficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  lastEncounter: number;
}

interface BotQuest {
  id: string;
  name: string;
  objective: string;                   // 'kill_rat_king', 'collect_10_herbs'
  targetLocation?: string;
  progress: number;                    // 0-100
  priority: number;
}

interface DeathRecord {
  timestamp: number;
  location: string;
  killedBy: string;                    // Creature or player name
  hadHelp: boolean;                    // Was in party?
  lostItems: string[];                 // What dropped
}
```

### Memory Effects on Behavior

| Memory | Behavior Change |
|--------|-----------------|
| Died to Rat King twice | Increases estimated difficulty, won't solo |
| Knows shortcut to temple | Uses faster route |
| Remembers shop prices | Compares before buying |
| Friend died at location | Cautious there, seeks revenge if aggressive |
| Explored 50+ locations | Aspiration progress for "explorer" goal |

### Knowledge Acquisition

- Bots start with basic town knowledge
- Learn locations by visiting them
- Learn creature difficulty by fighting (or dying)
- Share knowledge with faction members
- Named bots can start with more pre-loaded knowledge

---

## Action System

The concrete actions bots can execute. Each action maps to game commands and has clear preconditions.

### Types

```typescript
interface BotAction {
  id: string;
  category: 'combat' | 'movement' | 'economy' | 'social' | 'survival' | 'utility';
  preconditions: ActionPrecondition[];
  cost: (bot: BotPlayer, context: ActionContext) => number;
  execute: (bot: BotPlayer, context: ActionContext) => Promise<ActionResult>;
}

type ActionPrecondition =
  | { type: 'has_item', itemId: string }
  | { type: 'has_currency', amount: number }
  | { type: 'in_location', locationId: string }
  | { type: 'in_combat', value: boolean }
  | { type: 'hp_above', percent: number }
  | { type: 'hp_below', percent: number }
  | { type: 'has_target' }
  | { type: 'knows_location', locationId: string }
  | { type: 'has_spell', spellId: string };
```

### Core Actions

| Action | Category | Preconditions | Effect |
|--------|----------|---------------|--------|
| `attack` | combat | in_combat, has_target | Deal damage to target |
| `cast_spell` | combat | has_spell, has_mp | Cast offensive/healing spell |
| `flee` | combat | in_combat | Attempt to escape combat |
| `use_potion` | survival | has_item('potion') | Restore HP/MP |
| `travel_to` | movement | knows_location | Move toward destination |
| `explore` | movement | none | Move to adjacent unexplored room |
| `buy_item` | economy | in_shop, has_currency | Purchase from NPC |
| `sell_item` | economy | in_shop, has_item | Sell to NPC |
| `rest` | survival | not in_combat | Regenerate HP/MP faster |
| `invite_to_party` | social | target_nearby | Send party invite |
| `accept_invite` | social | has_pending_invite | Join party |
| `say` | social | none | Speak in room |
| `emote` | social | none | Perform emote |
| `trade_with` | economy | target_nearby | Initiate trade |
| `equip_item` | utility | has_item | Equip gear |
| `loot_corpse` | utility | corpse_nearby | Pick up loot |

### Action Cost Calculation

Cost influences which action the planner chooses. Lower = preferred.

```typescript
// Example: travel_to cost calculation
function travelCost(bot: BotPlayer, destination: string): number {
  let cost = 10; // Base cost

  // Distance penalty
  const distance = getPathLength(bot.locationId, destination);
  cost += distance * 2;

  // Danger penalty (if passing through dangerous areas)
  if (pathPassesDanger(bot, destination)) {
    cost += 20 * (1 - bot.personality.bravery / 100);
  }

  // Preference bonus
  if (bot.personality.preferredZones.includes(getZone(destination))) {
    cost -= 5;
  }

  return cost;
}
```

---

## Death, Respawn & Lifecycle

How bots are born, die, and (sometimes) return. This creates stakes and memorable moments.

### Types

```typescript
interface BotLifecycle {
  // Generic bot spawning
  spawnGenericBot(): BotPlayer;

  // Named bot management
  respawnNamedBot(botId: string, delay: number): void;

  // Death handling
  handleBotDeath(bot: BotPlayer, killer: string): void;

  // Population management
  maintainPopulation(): void;
}

interface BotSpawnConfig {
  // Population targets
  minPopulation: number;           // Spawn if below (e.g., 15)
  maxPopulation: number;           // Stop spawning at (e.g., 30)
  namedBotCount: number;           // Always try to have X named bots active

  // Spawn settings
  spawnLocations: string[];        // Where new bots appear (inn, town gate)
  levelRange: [number, number];    // Generic bots spawn in this range

  // Respawn delays (in game-minutes)
  namedBotRespawnDelay: number;    // e.g., 1440 (1 game-day)
  namedBotDeathPenalty: DeathPenalty;
}

interface DeathPenalty {
  xpLossPercent: number;           // e.g., 5% of current level XP
  goldLossPercent: number;         // e.g., 10% of carried gold
  reputationLoss: number;          // Opinion drop with witnesses
  memoryEffect: 'gains_caution' | 'seeks_revenge' | 'fears_killer';
}
```

### Generic Bot Lifecycle

```
Spawn (level 1-5) → Adventure → Level up →
  ↓
Die → Permanently removed → New bot spawns to replace
```

### Named Bot Lifecycle

```
Spawn (hand-crafted) → Adventure → Build history →
  ↓
Die → "Aldric has fallen!" announcement →
  ↓
Delayed respawn (1 game-day) → Return with penalties →
  ↓
Remember death, adjust behavior → Continue story
```

### Death Announcements

| Bot Type | Announcement |
|----------|--------------|
| Generic | None (silent replacement) |
| Named (normal) | "Aldric the Brave has fallen in the Sewer!" |
| Named (heroic) | "Aldric died defending Mira from the Rat King!" |
| Named (killed by player) | "Aldric was slain by PlayerName. He will be remembered." |

### Post-Death Behavior Changes

```typescript
function applyDeathMemory(bot: BotPlayer, killer: string): void {
  // Record the death
  bot.memory.deaths.push({ killer, location, timestamp });

  // Personality-driven response
  if (bot.personality.bravery > 70) {
    // Brave bot seeks revenge
    bot.relationships.opinions[killer].opinion -= 50;
    bot.memory.recentEvents.push({ type: 'seeking_revenge', target: killer });
  } else {
    // Cautious bot becomes fearful
    bot.memory.knownCreatures[killer].estimatedDifficulty = 'deadly';
    bot.personality.bravery -= 5; // Permanent small reduction
  }
}
```

---

## Game Integration

How bots plug into the existing game systems - game loop, commands, combat, and messaging.

### BotManager Integration

```typescript
// BotManager integrates with GameLoop
class BotManager {
  private bots: Map<string, BotPlayer> = new Map();
  private namedBotRoster: NamedBotDefinition[];
  private pendingRespawns: Map<string, number> = new Map(); // botId → respawnTime

  constructor(
    private gameLoop: GameLoop,
    private commandHandler: CommandHandler,
    private config: BotSpawnConfig
  ) {}

  // Called every game tick (2-5 seconds)
  async tick(gameTime: number): Promise<void> {
    // 1. Maintain population
    this.maintainPopulation();

    // 2. Check for pending respawns
    this.processRespawns(gameTime);

    // 3. Run AI for each bot
    for (const bot of this.bots.values()) {
      if (!bot.inCombat) {
        await this.runBotAI(bot);
      }
      // Combat actions handled by existing combat tick
    }
  }

  private async runBotAI(bot: BotPlayer): Promise<void> {
    // GOAP planning
    const goal = this.selectHighestPriorityGoal(bot);
    const plan = this.planActions(bot, goal);
    const action = plan[0]; // Next action to execute

    if (action) {
      await this.executeAction(bot, action);
    }
  }

  private async executeAction(bot: BotPlayer, action: BotAction): Promise<void> {
    // Convert bot action to game command
    const command = this.actionToCommand(bot, action);

    // Execute through normal command handler (same as players)
    await this.commandHandler.execute(bot.session, command);
  }
}
```

### Integration Points

| System | How Bots Integrate |
|--------|-------------------|
| **GameLoop** | BotManager.tick() called each game tick |
| **Commands** | Bots execute same commands as players |
| **Combat** | Bots use existing auto-attack and ability system |
| **Inventory** | Same inventory/equipment as players |
| **Messaging** | Bots receive messages (for reactions) but don't have sockets |
| **Persistence** | Named bots save to database via CharacterRepository |
| **NPC Simulation** | Bots appear in SimulationEngine's player list |

### Bot "Session" (No Socket)

```typescript
interface BotSession {
  player: BotPlayer;
  isBot: true;

  // Bots don't have real sockets, but need message handling
  send(message: GameMessage): void {
    // Process message for AI reactions instead of sending
    this.botManager.handleBotMessage(this.player, message);
  }

  // Reference to game systems
  gameLoop: GameLoop;
  world: WorldState;
}
```

### Visibility to Players

Players see bots just like other players:
- In `look` output: "Aldric the Brave is here."
- In `who` list: Shows as online player
- In combat: "Aldric attacks the Rat!"
- In chat: "Aldric says 'For Easthollow!'"

---

## Named Bot Roster

The hand-crafted characters that become server legends. These are defined in data files and loaded at startup.

### Types

```typescript
interface NamedBotDefinition {
  id: string;                      // 'bot_aldric'
  name: string;                    // 'Aldric the Brave'
  class: ClassName;
  startingLevel: number;

  // Full personality profile
  personality: BotPersonality;

  // Long-term aspirations
  aspirations: BotAspiration[];

  // Starting relationships (optional)
  initialRelationships?: Record<string, number>;  // Other bot IDs → opinion

  // Faction
  faction?: string;
  factionRole?: 'leader' | 'member';

  // Backstory (for future LLM conversations)
  backstory: string;

  // Special behaviors
  specialBehaviors?: SpecialBehavior[];
}

interface BotAspiration {
  id: string;
  description: string;             // "Defeat every boss in the realm"
  type: 'kill_bosses' | 'max_wealth' | 'max_level' | 'explore_all' |
        'collect_items' | 'help_newbies' | 'become_famous';
  target?: string | number;        // Specific target if applicable
}

interface SpecialBehavior {
  trigger: 'player_low_health' | 'boss_nearby' | 'faction_member_attacked' |
           'specific_location' | 'time_of_day';
  action: string;                  // What they do
  priority: number;                // Override normal GOAP priority
}
```

### Starter Roster (8 Characters)

| Name | Class | Personality | Aspiration | Quirk |
|------|-------|-------------|------------|-------|
| **Aldric the Brave** | Warrior | Brave, social, protective | Defeat all bosses | Rushes to help players in danger |
| **Sister Mira** | Cleric | Patient, generous, wise | Help 100 adventurers | Heals anyone she sees injured |
| **Shadow** | Rogue | Cautious, greedy, loner | Become richest in realm | Hoards keys, avoids groups |
| **Thornwick** | Mage | Curious, patient, bookish | Explore every location | Studies creatures before fighting |
| **Brutus** | Warrior | Aggressive, impatient, brave | Kill 1000 creatures | Attacks anything near his level |
| **Elena Swift** | Ranger | Independent, observant | Master every hunting ground | Marks dangerous areas for others |
| **Old Gareth** | Cleric | Wise, social, cautious | Reach max level (slowly) | Tells stories, gives advice |
| **The Rat Catcher** | Rogue | Obsessive, aggressive (vs rats) | Clear sewer 100 times | Hunts only in sewer, hates rats |

### Example Definition

```typescript
const ALDRIC: NamedBotDefinition = {
  id: 'bot_aldric',
  name: 'Aldric the Brave',
  class: 'warrior',
  startingLevel: 5,
  personality: {
    bravery: 90,
    greed: 20,
    sociability: 75,
    patience: 50,
    aggression: 60,
    preferredActivities: ['combat', 'socializing'],
    preferredZones: ['sewer', 'wilderness'],
    quirks: [{ id: 'protector', effect: (bot, ctx) => { /* rush to help */ } }],
    speechStyle: 'formal',
    catchphrases: ['For Easthollow!', 'Stand with me, friend!', 'No beast shall harm the innocent!']
  },
  aspirations: [
    { id: 'boss_slayer', type: 'kill_bosses', description: 'Defeat every boss' }
  ],
  faction: 'easthollow_defenders',
  factionRole: 'leader',
  backstory: 'A former town guard who took up adventuring after the sewer rats grew bold.',
  specialBehaviors: [
    { trigger: 'player_low_health', action: 'rush_to_defend', priority: 95 }
  ]
};
```

---

## Conversation System

A placeholder system that starts simple but can be upgraded to local LLM later.

### Interface

```typescript
interface ConversationSystem {
  // Generate bot speech for various situations
  generateGreeting(bot: BotPlayer, target: Player | BotPlayer): string;
  generateCombatBark(bot: BotPlayer, situation: CombatSituation): string;
  generateTradeResponse(bot: BotPlayer, offer: TradeOffer): string;
  generateIdleChat(bot: BotPlayer, context: ChatContext): string;

  // For future LLM integration
  generateFreeResponse(bot: BotPlayer, playerMessage: string): Promise<string>;
}
```

### Phase 1: Template-Based (Ships Immediately)

```typescript
class TemplateConversation implements ConversationSystem {
  generateGreeting(bot: BotPlayer, target: Player | BotPlayer): string {
    const templates = bot.personality.speechStyle === 'formal'
      ? ['Well met, {name}.', 'Greetings, {name}.', 'Hail, adventurer.']
      : ['Hey {name}!', 'Oh hey, {name}.', 'What\'s up?'];

    // Add catchphrase sometimes
    let greeting = pickRandom(templates).replace('{name}', target.name);
    if (Math.random() < 0.3 && bot.botProfile.personality.catchphrases.length) {
      greeting += ' ' + pickRandom(bot.botProfile.personality.catchphrases);
    }

    // Relationship affects tone
    const opinion = bot.botProfile.relationships.opinions[target.id]?.opinion ?? 0;
    if (opinion > 50) {
      greeting = 'Friend! ' + greeting;
    } else if (opinion < -30) {
      greeting = '*coldly* ' + greeting;
    }

    return greeting;
  }
}
```

### Phase 2: Local LLM (Future Upgrade)

```typescript
class LLMConversation implements ConversationSystem {
  private ollama: OllamaClient;  // Or similar local LLM

  async generateFreeResponse(bot: BotPlayer, playerMessage: string): Promise<string> {
    const prompt = `You are ${bot.name}, a ${bot.class} adventurer.
Personality: ${this.describePersonality(bot)}
Backstory: ${bot.botProfile.backstory}
Current mood: ${this.getCurrentMood(bot)}
Relationship with speaker: ${this.getRelationshipDesc(bot, speaker)}

The player says: "${playerMessage}"

Respond in character (1-2 sentences, ${bot.personality.speechStyle} tone):`;

    return await this.ollama.generate(prompt, {
      model: 'mistral',  // or llama3, etc.
      maxTokens: 100
    });
  }
}
```

### Conversation Triggers

| Situation | Response Type | Example |
|-----------|---------------|---------|
| Player enters room | Greeting (30% chance) | "Well met, traveler!" |
| Combat starts | Battle cry | "For Easthollow!" |
| Low health | Call for help | "I could use some healing!" |
| Victory | Celebration | "Another beast slain!" |
| Player helps | Thanks | "I owe you one, friend." |
| Trade offer | Accept/reject | "Fair price. Deal." |
| Idle with friends | Small talk | "Have you explored the sewer depths?" |

### LLM Integration Path

1. **Phase 1 (Now):** Template system with catchphrases and personality-modified responses
2. **Phase 2 (Later):** Add Ollama/local LLM for `generateFreeResponse`
3. **Phase 3 (Optional):** Full LLM for all conversation, with personality injection

---

## File Structure

```
packages/server/src/bots/
├── index.ts                  # Exports
├── bot-manager.ts            # Population, lifecycle, tick orchestration
├── bot-player.ts             # BotPlayer type extending Player
├── goap/
│   ├── index.ts
│   ├── goals.ts              # Goal definitions
│   ├── actions.ts            # Action definitions
│   └── planner.ts            # GOAP planning algorithm
├── personality/
│   ├── index.ts
│   ├── types.ts              # Personality interfaces
│   └── generator.ts          # Random personality for generics
├── memory/
│   ├── index.ts
│   ├── types.ts              # Memory interfaces
│   └── knowledge.ts          # World knowledge tracking
├── social/
│   ├── index.ts
│   ├── relationships.ts      # Opinion tracking
│   └── factions.ts           # Guild/faction system
├── conversation/
│   ├── index.ts
│   ├── templates.ts          # Template-based responses
│   └── llm.ts                # Future LLM integration
└── roster/
    ├── index.ts
    └── named-bots.ts         # Hand-crafted bot definitions

packages/shared/src/types/
└── bot.ts                    # Shared bot types
```

---

## Implementation Tasks

### Phase 1: Foundation (Tasks 1-4)
1. Create shared bot types (`packages/shared/src/types/bot.ts`)
2. Create BotPlayer type extending Player
3. Create BotManager skeleton with population management
4. Integrate BotManager with GameLoop tick

### Phase 2: GOAP Brain (Tasks 5-8)
5. Implement goal system with priority calculation
6. Implement action system with preconditions
7. Implement GOAP planner (simple forward search)
8. Connect planner to command execution

### Phase 3: Personality & Memory (Tasks 9-12)
9. Implement personality system with trait effects
10. Implement memory system for world knowledge
11. Implement relationship tracking
12. Create personality generator for generic bots

### Phase 4: Actions (Tasks 13-16)
13. Implement movement actions (travel, explore)
14. Implement combat actions (attack, flee, use abilities)
15. Implement economy actions (buy, sell, trade)
16. Implement social actions (invite, say, emote)

### Phase 5: Named Bots (Tasks 17-19)
17. Create named bot definition format
18. Implement starter roster (8 characters)
19. Implement faction system

### Phase 6: Lifecycle (Tasks 20-22)
20. Implement generic bot spawning/despawning
21. Implement named bot death and delayed respawn
22. Implement death penalties and memory effects

### Phase 7: Conversation (Tasks 23-24)
23. Implement template-based conversation system
24. Add conversation triggers and context

### Phase 8: Polish (Tasks 25-27)
25. Add bot visibility in player commands (who, look)
26. Write comprehensive tests
27. Balance and tune bot behaviors

---

## Success Metrics

- [ ] 20-30 bots active at any time
- [ ] Bots level up naturally over time
- [ ] Players can party with bots
- [ ] Named bots become recognizable server characters
- [ ] Bots make intelligent combat decisions
- [ ] Economy remains stable with bot participation
- [ ] Server performance remains acceptable with bot load
