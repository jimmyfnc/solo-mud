/**
 * BotManager - manages bot population and lifecycle.
 */

import type { BotSpawnConfig, BotZonePopulation, ClassName } from '@solo-mud/shared';
import type { BotSession } from './bot-session';
import { createBotPlayer, createBotSession, createNamedBot } from './bot-factory';
import { NAMED_BOTS } from './roster/named-bots';
import { BotExecutor } from './bot-executor';

/** Command handler type for executing bot commands */
export type CommandHandler = (session: BotSession, command: string) => Promise<void>;

/** Regular human names for generic bots (red shirts) */
const FIRST_NAMES = [
  'Bob', 'Janet', 'Steve', 'Carol', 'Dave', 'Linda', 'Mike', 'Susan',
  'Tom', 'Nancy', 'Jim', 'Betty', 'Frank', 'Helen', 'Gary', 'Debbie',
  'Ron', 'Barbara', 'Dan', 'Sharon', 'Bill', 'Karen', 'Joe', 'Donna',
  'Rick', 'Patricia', 'Larry', 'Diane', 'Jeff', 'Margaret',
];

/** Classes for random selection */
const CLASSES: ClassName[] = ['warrior', 'rogue', 'mage', 'cleric', 'ranger'];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Respawn queue entry for named bots awaiting respawn */
interface RespawnQueueEntry {
  namedBotId: string;
  respawnAt: number; // game time in minutes
}

export class BotManager {
  private config: BotSpawnConfig;
  private bots: Map<string, BotSession> = new Map();
  private namedBots: Map<string, BotSession> = new Map();
  private respawnQueue: Map<string, RespawnQueueEntry> = new Map();
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

  /** Which hub each generic bot belongs to */
  private botZones: Map<string, string> = new Map();

  /** Remove a bot by ID */
  removeBot(botId: string): boolean {
    this.botZones.delete(botId);
    return this.bots.delete(botId);
  }

  /**
   * The population zones in effect. When config.zones is absent, the legacy
   * top-level fields act as a single default zone.
   */
  getZones(): BotZonePopulation[] {
    if (this.config.zones && this.config.zones.length > 0) {
      return this.config.zones;
    }
    return [{
      id: 'default',
      spawnLocations: this.config.spawnLocations,
      minPopulation: this.config.minPopulation,
      maxPopulation: this.config.maxPopulation,
      levelRange: this.config.levelRange,
    }];
  }

  /** Generic bots currently assigned to a hub */
  private botsInZone(zoneId: string): BotSession[] {
    return Array.from(this.bots.values())
      .filter(session => this.botZones.get(session.id) === zoneId);
  }

  /** Spawn a generic bot (into a specific hub, or the first configured one) */
  spawnGenericBot(zone?: BotZonePopulation): BotSession {
    const z = zone ?? this.getZones()[0]!;
    const id = `bot_generic_${this.nextBotId++}`;
    const name = pickRandom(FIRST_NAMES);
    const className = pickRandom(CLASSES);
    const level = randomInRange(z.levelRange[0], z.levelRange[1]);
    const startLocation = pickRandom(z.spawnLocations);

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
    this.botZones.set(id, z.id);

    return session;
  }

  /** Check if generic bot count exceeds max population */
  isOverPopulated(): boolean {
    return this.getZones().some(z => this.botsInZone(z.id).length > z.maxPopulation);
  }

  /** Get idle generic bots sorted by idle time (longest idle first) */
  private getIdleBots(zoneId?: string): BotSession[] {
    const pool = zoneId ? this.botsInZone(zoneId) : Array.from(this.bots.values());
    return pool
      .filter(bot => !bot.player.inCombat)
      .sort((a, b) => a.lastActivity - b.lastActivity);
  }

  /**
   * Maintain population per hub: small wilderness towns stay scarce, big
   * hubs stay busy — each within its own [min, max] band.
   */
  maintainPopulation(): void {
    for (const zone of this.getZones()) {
      // Spawn until this hub reaches its minimum
      while (this.botsInZone(zone.id).length < zone.minPopulation) {
        this.spawnGenericBot(zone);
      }

      // Despawn idle bots if this hub is over its maximum
      while (this.botsInZone(zone.id).length > zone.maxPopulation) {
        const idleBots = this.getIdleBots(zone.id);
        if (idleBots.length === 0) {
          // All in combat, can't despawn any
          break;
        }
        const botToRemove = idleBots[0]!;
        this.bots.delete(botToRemove.id);
        this.botZones.delete(botToRemove.id);
      }
    }
  }

  /** Queue a named bot for respawn after the configured delay */
  queueForRespawn(namedBotId: string, gameTime: number): void {
    const session = this.namedBots.get(namedBotId);
    if (!session) return;

    // Calculate respawn time
    const respawnAt = gameTime + this.config.namedBotRespawnDelay;

    // Add to respawn queue
    this.respawnQueue.set(namedBotId, {
      namedBotId,
      respawnAt,
    });

    // Set HP to 0 (they're "dead" until respawn)
    session.player.currentHp = 0;
  }

  /** Process the respawn queue and respawn bots whose time has come */
  processRespawnQueue(gameTime: number): string[] {
    const respawnedNames: string[] = [];

    for (const [botId, entry] of this.respawnQueue) {
      if (gameTime >= entry.respawnAt) {
        const session = this.namedBots.get(botId);
        if (session) {
          // Restore HP and MP to max
          session.player.currentHp = session.player.maxHp;
          session.player.currentMp = session.player.maxMp;

          // Move to a spawn location
          session.player.locationId = pickRandom(this.config.spawnLocations);

          respawnedNames.push(session.player.name);
        }

        // Remove from respawn queue
        this.respawnQueue.delete(botId);
      }
    }

    return respawnedNames;
  }

  /** Check if a named bot is awaiting respawn */
  isAwaitingRespawn(namedBotId: string): boolean {
    return this.respawnQueue.has(namedBotId);
  }

  /** Handle bot death - removes generic bots, marks named bots for respawn */
  handleBotDeath(botId: string): { wasNamed: boolean; botName: string } {
    // Check if it's a generic bot
    const genericBot = this.bots.get(botId);
    if (genericBot) {
      const botName = genericBot.player.name;
      this.bots.delete(botId);
      return { wasNamed: false, botName };
    }

    // Check if it's a named bot
    const namedBot = this.namedBots.get(botId);
    if (namedBot) {
      // Don't remove named bots, just return info for respawn handling
      return { wasNamed: true, botName: namedBot.player.name };
    }

    // Unknown bot ID
    return { wasNamed: false, botName: '' };
  }

  /** Run AI tick for all bots (both named and generic) */
  async tick(gameTime: number): Promise<void> {
    // Process respawn queue first
    this.processRespawnQueue(gameTime);

    // Iterate over all bots (named + generic)
    for (const session of this.getAllBots()) {
      // Skip if awaiting respawn (dead)
      if (this.isAwaitingRespawn(session.id)) {
        continue;
      }

      // Skip if in combat (combat tick handles this)
      if (session.player.inCombat) {
        continue;
      }

      // Check if bot should tick
      if (!this.executor.shouldTick(session)) {
        continue;
      }

      // Economy labor takes precedence for suitable bots while work is available.
      const command = this.executor.getEconomyCommand(session) ?? this.executor.getNextCommand(session);
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
