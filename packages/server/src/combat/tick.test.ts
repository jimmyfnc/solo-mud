/**
 * Tests for combat tick system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CombatTicker, type TickContext, type TickResult } from './tick';

describe('CombatTicker', () => {
  let ticker: CombatTicker;

  beforeEach(() => {
    vi.useFakeTimers();
    ticker = new CombatTicker();
  });

  afterEach(() => {
    ticker.stop();
    vi.useRealTimers();
  });

  describe('start/stop', () => {
    it('should start the ticker', () => {
      expect(ticker.isRunning()).toBe(false);
      ticker.start();
      expect(ticker.isRunning()).toBe(true);
    });

    it('should stop the ticker', () => {
      ticker.start();
      ticker.stop();
      expect(ticker.isRunning()).toBe(false);
    });

    it('should not start if already running', () => {
      ticker.start();
      ticker.start(); // Should not throw or create duplicate intervals
      expect(ticker.isRunning()).toBe(true);
    });
  });

  describe('tick processing', () => {
    it('should call tick handler at regular intervals', () => {
      const handler = vi.fn();
      ticker.onTick(handler);
      ticker.start();

      // Advance time by one tick interval (100ms default)
      vi.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(1);

      // Advance another tick
      vi.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should pass tick context to handler', () => {
      const handler = vi.fn();
      ticker.onTick(handler);
      ticker.start();

      vi.advanceTimersByTime(100);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          tickNumber: expect.any(Number),
          deltaMs: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should increment tick number each tick', () => {
      const tickNumbers: number[] = [];
      ticker.onTick((ctx) => {
        tickNumbers.push(ctx.tickNumber);
      });
      ticker.start();

      vi.advanceTimersByTime(500);

      expect(tickNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('should provide accurate delta time', () => {
      const deltas: number[] = [];
      ticker.onTick((ctx) => {
        deltas.push(ctx.deltaMs);
      });
      ticker.start();

      vi.advanceTimersByTime(300);

      // Each delta should be approximately the tick interval
      deltas.forEach((delta) => {
        expect(delta).toBeGreaterThanOrEqual(95);
        expect(delta).toBeLessThanOrEqual(105);
      });
    });

    it('should not tick when stopped', () => {
      const handler = vi.fn();
      ticker.onTick(handler);
      ticker.start();

      vi.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(1);

      ticker.stop();
      vi.advanceTimersByTime(500);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple handlers', () => {
    it('should call multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      ticker.onTick(handler1);
      ticker.onTick(handler2);
      ticker.start();

      vi.advanceTimersByTime(100);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should allow removing handlers', () => {
      const handler = vi.fn();
      const unsubscribe = ticker.onTick(handler);
      ticker.start();

      vi.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      vi.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom tick interval', () => {
    it('should use custom tick interval', () => {
      const customTicker = new CombatTicker({ tickIntervalMs: 50 });
      const handler = vi.fn();

      customTicker.onTick(handler);
      customTicker.start();

      vi.advanceTimersByTime(100);
      expect(handler).toHaveBeenCalledTimes(2);

      customTicker.stop();
    });
  });
});

describe('TickResult', () => {
  it('should aggregate combat events from handlers', () => {
    const ticker = new CombatTicker();
    vi.useFakeTimers();

    const results: TickResult[] = [];

    ticker.onTick(() => ({
      events: [
        {
          eventType: 'attack',
          sourceId: 'player-1',
          sourceName: 'Hero',
          targetId: 'enemy-1',
          targetName: 'Goblin',
          value: 10,
        },
      ],
    }));

    ticker.onTickComplete((result) => {
      results.push(result);
    });

    ticker.start();
    vi.advanceTimersByTime(100);

    expect(results).toHaveLength(1);
    expect(results[0]!.events).toHaveLength(1);
    expect(results[0]!.events[0]!.eventType).toBe('attack');

    ticker.stop();
    vi.useRealTimers();
  });
});
