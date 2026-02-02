/**
 * Tests for bot factory.
 */

import { describe, it, expect } from 'vitest';
import { createBotPlayer, createBotSession, createDefaultPersonality, createDefaultMemory, createNamedBot } from './bot-factory';
import type { NamedBotDefinition } from '@solo-mud/shared';

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

describe('createNamedBot', () => {
  const testDefinition: NamedBotDefinition = {
    id: 'bot_test_hero',
    name: 'Test Hero',
    class: 'warrior',
    startingLevel: 5,
    personality: {
      bravery: 90,
      greed: 15,
      sociability: 70,
      patience: 50,
      aggression: 60,
      preferredActivities: ['combat', 'socializing'],
      preferredZones: ['sewer', 'wilderness'],
      dislikedCreatures: ['rat'],
      quirks: [{ id: 'brave', description: 'Rushes into danger' }],
      speechStyle: 'formal',
      catchphrases: ['For honor!', 'Stand with me!'],
    },
    aspirations: [
      { id: 'boss_slayer', type: 'kill_bosses', description: 'Defeat all bosses' },
      { id: 'explorer', type: 'explore_all', description: 'Map everything' },
    ],
    backstory: 'A legendary warrior from distant lands.',
  };

  it('should create bot with correct level from definition', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    expect(bot.level).toBe(5);
  });

  it('should use definition personality directly (not random)', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    expect(bot.botProfile.personality.bravery).toBe(90);
    expect(bot.botProfile.personality.greed).toBe(15);
    expect(bot.botProfile.personality.sociability).toBe(70);
    expect(bot.botProfile.personality.patience).toBe(50);
    expect(bot.botProfile.personality.aggression).toBe(60);
    expect(bot.botProfile.personality.speechStyle).toBe('formal');
    expect(bot.botProfile.personality.catchphrases).toContain('For honor!');
  });

  it('should have backstory set from definition', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    expect(bot.botProfile.backstory).toBe('A legendary warrior from distant lands.');
  });

  it('should have aspirations from definition (as IDs)', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    expect(bot.botProfile.aspirations).toContain('boss_slayer');
    expect(bot.botProfile.aspirations).toContain('explorer');
    expect(bot.botProfile.aspirations).toHaveLength(2);
  });

  it('should set faction info when provided', () => {
    const definitionWithFaction: NamedBotDefinition = {
      ...testDefinition,
      faction: 'easthollow_defenders',
      factionRole: 'leader',
    };

    const bot = createNamedBot(definitionWithFaction, 'town_inn');

    expect(bot.botProfile.relationships.faction).toBe('easthollow_defenders');
    expect(bot.botProfile.relationships.factionRole).toBe('leader');
  });

  it('should apply initial relationships when provided', () => {
    const definitionWithRelationships: NamedBotDefinition = {
      ...testDefinition,
      initialRelationships: {
        npc_marcus: 50,
        bot_shadow: -30,
      },
    };

    const bot = createNamedBot(definitionWithRelationships, 'town_inn');

    expect(bot.botProfile.relationships.opinions['npc_marcus']).toBeDefined();
    expect(bot.botProfile.relationships.opinions['npc_marcus']?.opinion).toBe(50);
    expect(bot.botProfile.relationships.opinions['bot_shadow']).toBeDefined();
    expect(bot.botProfile.relationships.opinions['bot_shadow']?.opinion).toBe(-30);
  });

  it('should set namedBotId to definition id', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    expect(bot.namedBotId).toBe('bot_test_hero');
  });

  it('should set isNamed to true in botProfile', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    expect(bot.botProfile.isNamed).toBe(true);
  });

  it('should calculate HP/MP based on level', () => {
    const bot = createNamedBot(testDefinition, 'town_inn');

    // Level 5 warrior should have more HP than level 1
    expect(bot.maxHp).toBeGreaterThan(50); // Warriors start around 40 HP at level 1
    expect(bot.currentHp).toBe(bot.maxHp);
    expect(bot.currentMp).toBe(bot.maxMp);
  });
});
