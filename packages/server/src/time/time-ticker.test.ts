/**
 * Tests for the time tick system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTimeTicker,
  getTimeOfDay,
  formatGameTime,
  type TimeTicker,
} from './time-ticker';
import type { GameTime, TimeOfDay } from '@solo-mud/shared';

describe('getTimeOfDay', () => {
  it('should return dawn for early morning hours', () => {
    // Dawn: 5:00 - 7:59 (minutes 300-479)
    expect(getTimeOfDay(300)).toBe('dawn');
    expect(getTimeOfDay(400)).toBe('dawn');
    expect(getTimeOfDay(479)).toBe('dawn');
  });

  it('should return morning for mid-morning hours', () => {
    // Morning: 8:00 - 11:59 (minutes 480-719)
    expect(getTimeOfDay(480)).toBe('morning');
    expect(getTimeOfDay(600)).toBe('morning');
    expect(getTimeOfDay(719)).toBe('morning');
  });

  it('should return noon for midday hours', () => {
    // Noon: 12:00 - 13:59 (minutes 720-839)
    expect(getTimeOfDay(720)).toBe('noon');
    expect(getTimeOfDay(780)).toBe('noon');
    expect(getTimeOfDay(839)).toBe('noon');
  });

  it('should return afternoon for late day hours', () => {
    // Afternoon: 14:00 - 17:59 (minutes 840-1079)
    expect(getTimeOfDay(840)).toBe('afternoon');
    expect(getTimeOfDay(960)).toBe('afternoon');
    expect(getTimeOfDay(1079)).toBe('afternoon');
  });

  it('should return evening for dusk hours', () => {
    // Evening: 18:00 - 20:59 (minutes 1080-1259)
    expect(getTimeOfDay(1080)).toBe('evening');
    expect(getTimeOfDay(1140)).toBe('evening');
    expect(getTimeOfDay(1259)).toBe('evening');
  });

  it('should return night for dark hours', () => {
    // Night: 21:00 - 4:59 (minutes 1260-299, wrapping around)
    expect(getTimeOfDay(1260)).toBe('night');
    expect(getTimeOfDay(0)).toBe('night');
    expect(getTimeOfDay(150)).toBe('night');
    expect(getTimeOfDay(299)).toBe('night');
  });
});

describe('formatGameTime', () => {
  it('should format time as HH:MM', () => {
    expect(formatGameTime(0)).toBe('00:00');
    expect(formatGameTime(60)).toBe('01:00');
    expect(formatGameTime(720)).toBe('12:00');
    expect(formatGameTime(810)).toBe('13:30');
    expect(formatGameTime(1439)).toBe('23:59');
  });

  it('should handle multi-day times', () => {
    // 1440 minutes = 1 day
    expect(formatGameTime(1440)).toBe('00:00');
    expect(formatGameTime(1500)).toBe('01:00');
  });
});

describe('createTimeTicker', () => {
  let ticker: TimeTicker;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (ticker) {
      ticker.stop();
    }
    vi.useRealTimers();
  });

  it('should create a ticker with initial time', () => {
    const initialTime: GameTime = {
      totalMinutes: 480,
      timeOfDay: 'morning',
      day: 1,
    };

    ticker = createTimeTicker(initialTime);
    expect(ticker.getTime()).toEqual(initialTime);
  });

  it('should advance time when tick is called', () => {
    ticker = createTimeTicker({
      totalMinutes: 0,
      timeOfDay: 'night',
      day: 1,
    });

    ticker.tick(10);
    expect(ticker.getTime().totalMinutes).toBe(10);
  });

  it('should update timeOfDay when crossing boundary', () => {
    ticker = createTimeTicker({
      totalMinutes: 475, // Near end of dawn
      timeOfDay: 'dawn',
      day: 1,
    });

    ticker.tick(10);
    expect(ticker.getTime().timeOfDay).toBe('morning');
  });

  it('should increment day at midnight', () => {
    ticker = createTimeTicker({
      totalMinutes: 1435,
      timeOfDay: 'night',
      day: 1,
    });

    ticker.tick(10);
    expect(ticker.getTime().day).toBe(2);
    expect(ticker.getTime().totalMinutes).toBe(5);
  });

  it('should fire onTimeChange callback', () => {
    const callback = vi.fn();
    ticker = createTimeTicker({
      totalMinutes: 475,
      timeOfDay: 'dawn',
      day: 1,
    });

    ticker.onTimeChange(callback);
    ticker.tick(10);

    expect(callback).toHaveBeenCalledWith('morning', 'dawn');
  });

  it('should not fire callback when time of day stays same', () => {
    const callback = vi.fn();
    ticker = createTimeTicker({
      totalMinutes: 480,
      timeOfDay: 'morning',
      day: 1,
    });

    ticker.onTimeChange(callback);
    ticker.tick(10);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should fire onDayChange callback at midnight', () => {
    const callback = vi.fn();
    ticker = createTimeTicker({
      totalMinutes: 1435,
      timeOfDay: 'night',
      day: 1,
    });

    ticker.onDayChange(callback);
    ticker.tick(10);

    expect(callback).toHaveBeenCalledWith(2);
  });

  it('should auto-tick when started with interval', () => {
    ticker = createTimeTicker({
      totalMinutes: 0,
      timeOfDay: 'night',
      day: 1,
    });

    ticker.start(1000, 1); // 1 second = 1 game minute
    expect(ticker.getTime().totalMinutes).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(ticker.getTime().totalMinutes).toBe(5);
  });

  it('should stop auto-tick when stopped', () => {
    ticker = createTimeTicker({
      totalMinutes: 0,
      timeOfDay: 'night',
      day: 1,
    });

    ticker.start(1000, 1);
    vi.advanceTimersByTime(3000);
    ticker.stop();
    vi.advanceTimersByTime(5000);

    expect(ticker.getTime().totalMinutes).toBe(3);
  });

  it('should allow removing callbacks', () => {
    const callback = vi.fn();
    ticker = createTimeTicker({
      totalMinutes: 475,
      timeOfDay: 'dawn',
      day: 1,
    });

    const unsubscribe = ticker.onTimeChange(callback);
    unsubscribe();
    ticker.tick(10);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should set time directly', () => {
    ticker = createTimeTicker({
      totalMinutes: 0,
      timeOfDay: 'night',
      day: 1,
    });

    ticker.setTime(720, 2);
    const time = ticker.getTime();

    expect(time.totalMinutes).toBe(720);
    expect(time.timeOfDay).toBe('noon');
    expect(time.day).toBe(2);
  });
});
