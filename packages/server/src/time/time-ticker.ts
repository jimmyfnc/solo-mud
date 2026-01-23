/**
 * Time tick system for advancing game time.
 * Manages day/night cycles, time-of-day transitions, and time-based events.
 */

import type { GameTime, TimeOfDay } from '@solo-mud/shared';

/** Callback when time of day changes */
export type TimeChangeCallback = (newTime: TimeOfDay, oldTime: TimeOfDay) => void;

/** Callback when a new day starts */
export type DayChangeCallback = (newDay: number) => void;

/** Time ticker interface */
export interface TimeTicker {
  /** Get current game time */
  getTime(): GameTime;

  /** Advance time by a number of minutes */
  tick(minutes: number): void;

  /** Set time directly (for loading saves, etc.) */
  setTime(totalMinutes: number, day: number): void;

  /** Start auto-ticking at interval */
  start(intervalMs: number, minutesPerTick: number): void;

  /** Stop auto-ticking */
  stop(): void;

  /** Register callback for time-of-day changes */
  onTimeChange(callback: TimeChangeCallback): () => void;

  /** Register callback for new day */
  onDayChange(callback: DayChangeCallback): () => void;
}

/** Minutes in a game day */
const MINUTES_PER_DAY = 1440;

/**
 * Time boundaries for each period (start minute of day).
 * Dawn: 5:00-7:59, Morning: 8:00-11:59, Noon: 12:00-13:59,
 * Afternoon: 14:00-17:59, Evening: 18:00-20:59, Night: 21:00-4:59
 */
const TIME_BOUNDARIES: Array<{ start: number; period: TimeOfDay }> = [
  { start: 0, period: 'night' },
  { start: 300, period: 'dawn' }, // 5:00
  { start: 480, period: 'morning' }, // 8:00
  { start: 720, period: 'noon' }, // 12:00
  { start: 840, period: 'afternoon' }, // 14:00
  { start: 1080, period: 'evening' }, // 18:00
  { start: 1260, period: 'night' }, // 21:00
];

/**
 * Get the time of day for a given minute of the day.
 */
export function getTimeOfDay(minuteOfDay: number): TimeOfDay {
  const normalizedMinute = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  // Find the period by checking boundaries in reverse
  for (let i = TIME_BOUNDARIES.length - 1; i >= 0; i--) {
    if (normalizedMinute >= TIME_BOUNDARIES[i]!.start) {
      return TIME_BOUNDARIES[i]!.period;
    }
  }

  return 'night';
}

/**
 * Format game time as HH:MM string.
 */
export function formatGameTime(totalMinutes: number): string {
  const minuteOfDay = totalMinutes % MINUTES_PER_DAY;
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Create a time ticker for managing game time.
 */
export function createTimeTicker(initialTime: GameTime): TimeTicker {
  let time: GameTime = { ...initialTime };
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const timeChangeCallbacks: Set<TimeChangeCallback> = new Set();
  const dayChangeCallbacks: Set<DayChangeCallback> = new Set();

  function tick(minutes: number): void {
    const oldTimeOfDay = time.timeOfDay;
    const oldDay = time.day;

    // Add minutes
    let newTotalMinutes = time.totalMinutes + minutes;
    let newDay = time.day;

    // Handle day rollover
    while (newTotalMinutes >= MINUTES_PER_DAY) {
      newTotalMinutes -= MINUTES_PER_DAY;
      newDay++;
    }

    const newTimeOfDay = getTimeOfDay(newTotalMinutes);

    time = {
      totalMinutes: newTotalMinutes,
      timeOfDay: newTimeOfDay,
      day: newDay,
    };

    // Fire callbacks if time of day changed
    if (newTimeOfDay !== oldTimeOfDay) {
      for (const callback of timeChangeCallbacks) {
        callback(newTimeOfDay, oldTimeOfDay);
      }
    }

    // Fire callbacks if day changed
    if (newDay !== oldDay) {
      for (const callback of dayChangeCallbacks) {
        callback(newDay);
      }
    }
  }

  function setTime(totalMinutes: number, day: number): void {
    const normalizedMinutes = totalMinutes % MINUTES_PER_DAY;
    time = {
      totalMinutes: normalizedMinutes,
      timeOfDay: getTimeOfDay(normalizedMinutes),
      day,
    };
  }

  function start(intervalMs: number, minutesPerTick: number): void {
    if (intervalId !== null) {
      stop();
    }
    intervalId = setInterval(() => tick(minutesPerTick), intervalMs);
  }

  function stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function onTimeChange(callback: TimeChangeCallback): () => void {
    timeChangeCallbacks.add(callback);
    return () => {
      timeChangeCallbacks.delete(callback);
    };
  }

  function onDayChange(callback: DayChangeCallback): () => void {
    dayChangeCallbacks.add(callback);
    return () => {
      dayChangeCallbacks.delete(callback);
    };
  }

  return {
    getTime: () => ({ ...time }),
    tick,
    setTime,
    start,
    stop,
    onTimeChange,
    onDayChange,
  };
}
