/**
 * Combat tick system - the heartbeat of the combat engine.
 * Processes combat actions at regular intervals.
 */

import type { CombatEvent } from '@solo-mud/shared';

/** Context passed to tick handlers */
export interface TickContext {
  /** Current tick number (starts at 1) */
  tickNumber: number;
  /** Time in ms since last tick */
  deltaMs: number;
  /** Current timestamp */
  timestamp: number;
}

/** Result from a tick handler */
export interface TickHandlerResult {
  /** Combat events generated this tick */
  events?: CombatEvent[];
}

/** Aggregated result from all tick handlers */
export interface TickResult {
  /** All combat events from this tick */
  events: CombatEvent[];
  /** Tick context */
  context: TickContext;
}

/** Tick handler function */
export type TickHandler = (context: TickContext) => TickHandlerResult | void;

/** Tick complete callback */
export type TickCompleteHandler = (result: TickResult) => void;

export interface CombatTickerOptions {
  /** Tick interval in milliseconds (default: 100ms) */
  tickIntervalMs?: number;
}

/**
 * Combat ticker - manages the game's combat loop.
 */
export class CombatTicker {
  private readonly tickIntervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickNumber = 0;
  private lastTickTime = 0;
  private handlers: TickHandler[] = [];
  private completeHandlers: TickCompleteHandler[] = [];

  constructor(options: CombatTickerOptions = {}) {
    this.tickIntervalMs = options.tickIntervalMs ?? 100;
  }

  /**
   * Check if the ticker is currently running.
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Start the combat ticker.
   */
  start(): void {
    if (this.isRunning()) {
      return;
    }

    this.lastTickTime = Date.now();
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  /**
   * Stop the combat ticker.
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Register a tick handler. Returns unsubscribe function.
   */
  onTick(handler: TickHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a tick complete handler. Called after all handlers process.
   */
  onTickComplete(handler: TickCompleteHandler): () => void {
    this.completeHandlers.push(handler);
    return () => {
      const index = this.completeHandlers.indexOf(handler);
      if (index !== -1) {
        this.completeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Process a single tick.
   */
  private tick(): void {
    const now = Date.now();
    const deltaMs = now - this.lastTickTime;
    this.lastTickTime = now;
    this.tickNumber++;

    const context: TickContext = {
      tickNumber: this.tickNumber,
      deltaMs,
      timestamp: now,
    };

    // Collect events from all handlers
    const allEvents: CombatEvent[] = [];

    for (const handler of this.handlers) {
      const result = handler(context);
      if (result?.events) {
        allEvents.push(...result.events);
      }
    }

    // Notify complete handlers
    const tickResult: TickResult = {
      events: allEvents,
      context,
    };

    for (const handler of this.completeHandlers) {
      handler(tickResult);
    }
  }

  /**
   * Get current tick number.
   */
  getTickNumber(): number {
    return this.tickNumber;
  }

  /**
   * Reset ticker state (for testing).
   */
  reset(): void {
    this.stop();
    this.tickNumber = 0;
    this.lastTickTime = 0;
  }
}
