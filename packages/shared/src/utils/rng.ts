/**
 * Seeded pseudo-random number generator using mulberry32 algorithm.
 * Produces deterministic sequences for reproducible world generation.
 */

export interface Rng {
  /** Returns a float in [0, 1) */
  next(): number;

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;

  /** Returns a random element from the array */
  pick<T>(array: readonly T[]): T;

  /** Returns a shuffled copy of the array (Fisher-Yates) */
  shuffle<T>(array: readonly T[]): T[];

  /** Returns a weighted random pick */
  weightedPick<T extends { weight: number }>(items: readonly T[]): T;

  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean;
}

/**
 * Hash a string to a 32-bit integer using djb2 algorithm
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Create a seeded RNG instance.
 * Same seed always produces same sequence.
 */
export function createRng(seed: string | number): Rng {
  // Convert seed to number if string
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0;

  // Ensure non-zero state
  if (state === 0) state = 1;

  // Mulberry32 algorithm - fast and good distribution
  function next(): number {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[nextInt(0, array.length - 1)]!;
  }

  function shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  function weightedPick<T extends { weight: number }>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = next() * totalWeight;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }

    // Fallback (shouldn't happen with valid weights)
    return items[items.length - 1]!;
  }

  function chance(probability: number): boolean {
    return next() < probability;
  }

  return { next, nextInt, pick, shuffle, weightedPick, chance };
}
