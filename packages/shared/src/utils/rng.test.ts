import { describe, it, expect } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
  it('should produce deterministic sequence for same seed', () => {
    const rng1 = createRng('test-seed');
    const rng2 = createRng('test-seed');

    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it('should produce different sequence for different seeds', () => {
    const rng1 = createRng('seed-a');
    const rng2 = createRng('seed-b');

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('should produce values between 0 and 1', () => {
    const rng = createRng('bounds-test');

    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should handle numeric seeds', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);

    expect(rng1.next()).toEqual(rng2.next());
  });

  it('nextInt should return integers in range [min, max]', () => {
    const rng = createRng('int-test');

    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('pick should select a random element from array', () => {
    const rng = createRng('pick-test');
    const items = ['a', 'b', 'c', 'd'];

    const picked = rng.pick(items);
    expect(items).toContain(picked);
  });

  it('shuffle should return shuffled array without modifying original', () => {
    const rng = createRng('shuffle-test');
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];

    const shuffled = rng.shuffle(copy);

    expect(copy).toEqual(original); // Original unchanged
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort()); // Same elements
  });

  it('shuffle should be deterministic for same seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const rng1 = createRng('shuffle-deterministic');
    const rng2 = createRng('shuffle-deterministic');

    const shuffled1 = rng1.shuffle([...items]);
    const shuffled2 = rng2.shuffle([...items]);

    expect(shuffled1).toEqual(shuffled2);
  });

  it('weightedPick should respect weights', () => {
    const rng = createRng('weighted-test');
    const items = [
      { value: 'common', weight: 100 },
      { value: 'rare', weight: 1 },
    ];

    // With such skewed weights, most picks should be 'common'
    let commonCount = 0;
    for (let i = 0; i < 100; i++) {
      const picked = rng.weightedPick(items);
      if (picked.value === 'common') commonCount++;
    }

    expect(commonCount).toBeGreaterThan(90);
  });
});
