/**
 * BotManager - manages bot population and lifecycle.
 */

import type { BotSpawnConfig, ClassName } from '@solo-mud/shared';
import type { BotSession } from './bot-session';
import { createBotPlayer, createBotSession } from './bot-factory';

/** Random bot names for generic bots */
const BOT_NAMES = [
  'Wanderer', 'Traveler', 'Adventurer', 'Seeker', 'Explorer',
  'Drifter', 'Nomad', 'Pilgrim', 'Wayfarer', 'Rover',
  'Scout', 'Hunter', 'Tracker', 'Ranger', 'Guardian',
  'Sentinel', 'Watcher', 'Keeper', 'Defender', 'Protector',
];

/** Classes for random selection */
const CLASSES: ClassName[] = ['warrior', 'rogue', 'mage', 'cleric', 'ranger'];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class BotManager {
  private config: BotSpawnConfig;
  private bots: Map<string, BotSession> = new Map();
  private nextBotId = 1;

  constructor(config: BotSpawnConfig) {
    this.config = config;
  }

  /** Get current configuration */
  getConfig(): BotSpawnConfig {
    return this.config;
  }

  /** Get current bot count */
  getBotCount(): number {
    return this.bots.size;
  }

  /** Get all bot sessions */
  getAllBotSessions(): BotSession[] {
    return Array.from(this.bots.values());
  }

  /** Get a specific bot session by ID */
  getBotSession(botId: string): BotSession | undefined {
    return this.bots.get(botId);
  }

  /** Remove a bot by ID */
  removeBot(botId: string): boolean {
    return this.bots.delete(botId);
  }

  /** Spawn a generic bot */
  spawnGenericBot(): BotSession {
    const id = `bot_generic_${this.nextBotId++}`;
    const name = `${pickRandom(BOT_NAMES)} #${this.nextBotId}`;
    const className = pickRandom(CLASSES);
    const level = randomInRange(this.config.levelRange[0], this.config.levelRange[1]);
    const startLocation = pickRandom(this.config.spawnLocations);

    const bot = createBotPlayer({
      id,
      name,
      className,
      startLocationId: startLocation,
      isNamed: false,
      level,
    });

    const session = createBotSession(bot);
    this.bots.set(id, session);

    return session;
  }

  /** Maintain population at configured levels */
  maintainPopulation(): void {
    // Spawn bots until we reach minimum
    while (this.bots.size < this.config.minPopulation) {
      this.spawnGenericBot();
    }
  }

  /** Run AI tick for all bots (placeholder for now) */
  async tick(_gameTime: number): Promise<void> {
    // TODO: Implement GOAP planning and action execution
    // For now, this is a placeholder
  }
}
