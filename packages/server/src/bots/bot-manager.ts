/**
 * BotManager - manages bot population and lifecycle.
 */

import type { BotSpawnConfig, ClassName } from '@solo-mud/shared';
import type { BotSession } from './bot-session';
import { createBotPlayer, createBotSession, createNamedBot } from './bot-factory';
import { NAMED_BOTS } from './roster/named-bots';
import { BotExecutor } from './bot-executor';

/** Command handler type for executing bot commands */
export type CommandHandler = (session: BotSession, command: string) => Promise<void>;

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
  private namedBots: Map<string, BotSession> = new Map();
  private nextBotId = 1;
  private executor: BotExecutor;
  private commandHandler?: CommandHandler;

  constructor(config: BotSpawnConfig) {
    this.config = config;
    this.executor = new BotExecutor();
  }

  /** Initialize the bot manager by loading named bots */
  async initialize(): Promise<void> {
    await this.loadNamedBots();
  }

  /** Load named bots from the roster */
  private async loadNamedBots(): Promise<void> {
    const namedBotIds = Object.keys(NAMED_BOTS);
    const botsToLoad = namedBotIds.slice(0, this.config.namedBotCount);

    for (const botId of botsToLoad) {
      const definition = NAMED_BOTS[botId];
      if (!definition) continue;

      // Use first spawn location for named bots
      const startLocation = this.config.spawnLocations[0] ?? 'town_square';

      const bot = createNamedBot(definition, startLocation);
      const session = createBotSession(bot);

      this.namedBots.set(definition.id, session);
    }
  }

  /** Get all named bot sessions */
  getNamedBots(): Map<string, BotSession> {
    return this.namedBots;
  }

  /** Get all bots (both named and generic) */
  getAllBots(): BotSession[] {
    return [...this.namedBots.values(), ...this.bots.values()];
  }

  /** Set command handler for executing bot commands */
  setCommandHandler(handler: CommandHandler): void {
    this.commandHandler = handler;
  }

  /** Get current configuration */
  getConfig(): BotSpawnConfig {
    return this.config;
  }

  /** Get current bot count */
  getBotCount(): number {
    return this.bots.size;
  }

  /** Get all generic bot sessions (excludes named bots) */
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

  /** Run AI tick for all bots (both named and generic) */
  async tick(_gameTime: number): Promise<void> {
    // Iterate over all bots (named + generic)
    for (const session of this.getAllBots()) {
      // Skip if in combat (combat tick handles this)
      if (session.player.inCombat) {
        continue;
      }

      // Check if bot should tick
      if (!this.executor.shouldTick(session)) {
        continue;
      }

      // Get next command
      const command = this.executor.getNextCommand(session);
      if (!command) {
        continue;
      }

      // Execute command if handler is set
      if (this.commandHandler) {
        try {
          await this.commandHandler(session, command);
        } catch (error) {
          // Log but don't crash
          console.error(`Bot ${session.id} command error:`, error);
        }
      }

      // Mark as ticked
      this.executor.markTicked(session);
    }
  }
}
