/**
 * Tests for bot factory.
 */

import { describe, it, expect } from 'vitest';
import { createBotPlayer, createBotSession, createDefaultPersonality, createDefaultMemory } from './bot-factory';

describe('createDefaultPersonality', () => {
  it('should create personality with all traits in valid range', () => {
    const personality = createDefaultPersonality();

    expect(personality.bravery).toBeGreaterThanOrEqual(0);
    expect(personality.bravery).toBeLessThanOrEqual(100);
    expect(personality.greed).toBeGreaterThanOrEqual(0);
    expect(personality.greed).toBeLessThanOrEqual(100);
    expect(personality.sociability).toBeGreaterThanOrEqual(0);
    expect(personality.sociability).toBeLessThanOrEqual(100);
    expect(personality.patience).toBeGreaterThanOrEqual(0);
    expect(personality.patience).toBeLessThanOrEqual(100);
    expect(personality.aggression).toBeGreaterThanOrEqual(0);
    expect(personality.aggression).toBeLessThanOrEqual(100);
  });

  it('should have default arrays populated', () => {
    const personality = createDefaultPersonality();

    expect(personality.preferredActivities.length).toBeGreaterThan(0);
    expect(personality.preferredZones.length).toBeGreaterThan(0);
    expect(personality.quirks).toBeDefined();
    expect(personality.catchphrases.length).toBeGreaterThan(0);
  });
});

describe('createDefaultMemory', () => {
  it('should create empty memory state', () => {
    const memory = createDefaultMemory();

    expect(memory.knownLocations).toEqual([]);
    expect(memory.knownPaths).toEqual({});
    expect(memory.knownCreatures).toEqual({});
    expect(memory.knownShops).toEqual({});
    expect(memory.activeQuests).toEqual([]);
    expect(memory.completedQuests).toEqual([]);
    expect(memory.deaths).toEqual([]);
    expect(memory.victories).toEqual([]);
    expect(memory.recentEvents).toEqual([]);
  });
});

describe('createBotPlayer', () => {
  it('should create a bot player with isBot flag', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    expect(bot.isBot).toBe(true);
    expect(bot.name).toBe('TestBot');
    expect(bot.class).toBe('warrior');
    expect(bot.locationId).toBe('town_inn');
  });

  it('should create bot profile with personality', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'mage',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    expect(bot.botProfile).toBeDefined();
    expect(bot.botProfile.personality).toBeDefined();
    expect(bot.botProfile.personality.bravery).toBeGreaterThanOrEqual(0);
  });

  it('should use provided personality for named bots', () => {
    const customPersonality = createDefaultPersonality();
    customPersonality.bravery = 95;
    customPersonality.catchphrases = ['For glory!'];

    const bot = createBotPlayer({
      id: 'bot-aldric',
      name: 'Aldric',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: true,
      personality: customPersonality,
      backstory: 'A brave warrior.',
    });

    expect(bot.botProfile.isNamed).toBe(true);
    expect(bot.botProfile.personality.bravery).toBe(95);
    expect(bot.botProfile.personality.catchphrases).toContain('For glory!');
    expect(bot.botProfile.backstory).toBe('A brave warrior.');
  });

  it('should set starting level correctly', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'rogue',
      startLocationId: 'town_inn',
      isNamed: false,
      level: 5,
    });

    expect(bot.level).toBe(5);
  });
});

describe('createBotSession', () => {
  it('should create a bot session with isBot flag', () => {
    const bot = createBotPlayer({
      id: 'bot-test',
      name: 'TestBot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    const session = createBotSession(bot);

    expect(session.isBot).toBe(true);
    expect(session.player).toBe(bot);
    expect(session.id).toBe('bot-test');
  });
});
