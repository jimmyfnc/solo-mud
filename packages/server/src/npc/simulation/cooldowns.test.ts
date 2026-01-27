import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CooldownTracker } from './cooldowns';

describe('CooldownTracker', () => {
  let tracker: CooldownTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new CooldownTracker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track NPC conversation cooldowns', () => {
    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(true);

    tracker.recordConversation('mira', 'giles');

    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(false);
    expect(tracker.canNPCsConverse('giles', 'mira')).toBe(false); // Order shouldn't matter
    expect(tracker.canNPCsConverse('mira', 'marcus')).toBe(true); // Different pair is fine
  });

  it('should expire conversation cooldowns', () => {
    tracker.recordConversation('mira', 'giles');
    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(false);

    // Advance time past cooldown (10 minutes)
    vi.advanceTimersByTime(11 * 60 * 1000);

    expect(tracker.canNPCsConverse('mira', 'giles')).toBe(true);
  });

  it('should track topic cooldowns per location', () => {
    expect(tracker.canDiscussTopic('town_square', 'weather')).toBe(true);

    tracker.recordTopicDiscussion('town_square', 'weather');

    expect(tracker.canDiscussTopic('town_square', 'weather')).toBe(false);
    expect(tracker.canDiscussTopic('town_inn', 'weather')).toBe(true); // Different location is fine
  });

  it('should track player-seen messages', () => {
    const messageHash = 'mira_ambient_1';

    expect(tracker.hasPlayerSeen('player_1', messageHash)).toBe(false);

    tracker.recordPlayerSeen('player_1', messageHash);

    expect(tracker.hasPlayerSeen('player_1', messageHash)).toBe(true);
    expect(tracker.hasPlayerSeen('player_2', messageHash)).toBe(false);
  });
});
