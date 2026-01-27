import type { NPC, SimulationMessage, HotTopic } from '@solo-mud/shared';
import { TOPICS, ZONE_ACTIVITY } from '@solo-mud/shared';
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
