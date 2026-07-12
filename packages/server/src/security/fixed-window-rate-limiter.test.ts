import { describe, expect, it } from 'vitest';
import { FixedWindowRateLimiter } from './fixed-window-rate-limiter';

describe('FixedWindowRateLimiter', () => {
  it('rejects attempts over the limit until the window resets', () => {
    const limiter = new FixedWindowRateLimiter(2, 1000);

    expect(limiter.consume('client', 0)).toBe(true);
    expect(limiter.consume('client', 1)).toBe(true);
    expect(limiter.consume('client', 2)).toBe(false);
    expect(limiter.consume('client', 1000)).toBe(true);
  });
});
