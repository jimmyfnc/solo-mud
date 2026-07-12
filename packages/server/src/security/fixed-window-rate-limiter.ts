interface WindowState {
  count: number;
  resetsAt: number;
}

export class FixedWindowRateLimiter {
  private readonly windows = new Map<string, WindowState>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  consume(key: string, now = Date.now()): boolean {
    const current = this.windows.get(key);
    if (!current || current.resetsAt <= now) {
      this.windows.set(key, { count: 1, resetsAt: now + this.windowMs });
      return true;
    }
    if (current.count >= this.limit) {
      return false;
    }
    current.count += 1;
    return true;
  }

  clear(key: string): void {
    this.windows.delete(key);
  }
}
