/**
 * Tests for template conversation system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BotPlayer } from '../bot-player';
import type { BotSpeechStyle } from '@solo-mud/shared';
import {
  GREETING_TEMPLATES,
  COMBAT_BARK_TEMPLATES,
  VICTORY_TEMPLATES,
  LOW_HP_TEMPLATES,
  DEATH_TEMPLATES,
  IDLE_CHAT_TEMPLATES,
  generateSpeech,
  generateGreeting,
  generateCombatBark,
  generateVictory,
  generateLowHpCall,
  generateIdleChat,
  modifyByRelationship,
} from './templates';

/** All speech styles that should be supported */
const ALL_SPEECH_STYLES: BotSpeechStyle[] = [
  'formal',
  'casual',
  'gruff',
  'cheerful',
  'mysterious',
];

/** Create a mock BotPlayer for testing */
function createMockBotPlayer(overrides: Partial<BotPlayer> = {}): BotPlayer {
  return {
    id: 'bot_test',
    name: 'TestBot',
    isBot: true,
    botProfile: {
      isNamed: false,
      personality: {
        bravery: 50,
        greed: 50,
        sociability: 50,
        patience: 50,
        aggression: 50,
        preferredActivities: ['combat'],
        preferredZones: ['town'],
        dislikedCreatures: [],
        quirks: [],
        speechStyle: 'casual',
        catchphrases: ['My catchphrase!', 'Another catchphrase!'],
      },
      relationships: {
        opinions: {},
        blocked: [],
      },
      memory: {
        knownLocations: [],
        knownPaths: {},
        knownCreatures: {},
        knownShops: {},
        activeQuests: [],
        completedQuests: [],
        aspirationProgress: {},
        deaths: [],
        victories: [],
        friendsMade: [],
        placesExplored: 0,
        recentEvents: [],
        lastCombat: 0,
        lastSocialInteraction: 0,
      },
      aspirations: [],
    },
    lastAiTick: 0,
    ...overrides,
  } as BotPlayer;
}

describe('Template Collections', () => {
  describe('GREETING_TEMPLATES', () => {
    it('should have all 5 speech styles', () => {
      for (const style of ALL_SPEECH_STYLES) {
        expect(GREETING_TEMPLATES[style]).toBeDefined();
        expect(Array.isArray(GREETING_TEMPLATES[style])).toBe(true);
        expect(GREETING_TEMPLATES[style].length).toBeGreaterThan(0);
      }
    });
  });

  describe('COMBAT_BARK_TEMPLATES', () => {
    it('should have all 5 speech styles', () => {
      for (const style of ALL_SPEECH_STYLES) {
        expect(COMBAT_BARK_TEMPLATES[style]).toBeDefined();
        expect(Array.isArray(COMBAT_BARK_TEMPLATES[style])).toBe(true);
        expect(COMBAT_BARK_TEMPLATES[style].length).toBeGreaterThan(0);
      }
    });
  });

  describe('VICTORY_TEMPLATES', () => {
    it('should have all 5 speech styles', () => {
      for (const style of ALL_SPEECH_STYLES) {
        expect(VICTORY_TEMPLATES[style]).toBeDefined();
        expect(Array.isArray(VICTORY_TEMPLATES[style])).toBe(true);
        expect(VICTORY_TEMPLATES[style].length).toBeGreaterThan(0);
      }
    });
  });

  describe('LOW_HP_TEMPLATES', () => {
    it('should have all 5 speech styles', () => {
      for (const style of ALL_SPEECH_STYLES) {
        expect(LOW_HP_TEMPLATES[style]).toBeDefined();
        expect(Array.isArray(LOW_HP_TEMPLATES[style])).toBe(true);
        expect(LOW_HP_TEMPLATES[style].length).toBeGreaterThan(0);
      }
    });
  });

  describe('DEATH_TEMPLATES', () => {
    it('should have all 5 speech styles', () => {
      for (const style of ALL_SPEECH_STYLES) {
        expect(DEATH_TEMPLATES[style]).toBeDefined();
        expect(Array.isArray(DEATH_TEMPLATES[style])).toBe(true);
        expect(DEATH_TEMPLATES[style].length).toBeGreaterThan(0);
      }
    });
  });

  describe('IDLE_CHAT_TEMPLATES', () => {
    it('should have all 5 speech styles', () => {
      for (const style of ALL_SPEECH_STYLES) {
        expect(IDLE_CHAT_TEMPLATES[style]).toBeDefined();
        expect(Array.isArray(IDLE_CHAT_TEMPLATES[style])).toBe(true);
        expect(IDLE_CHAT_TEMPLATES[style].length).toBeGreaterThan(0);
      }
    });
  });
});

describe('generateSpeech', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should pick a template from the given style', () => {
    const result = generateSpeech('formal', GREETING_TEMPLATES);
    expect(GREETING_TEMPLATES.formal).toContain(result);
  });

  it('should replace {variable} placeholders with provided values', () => {
    // Create a simple test template collection
    const testTemplates: Record<BotSpeechStyle, string[]> = {
      formal: ['Hello {name}, welcome to {place}.'],
      casual: ['Hey {name}!'],
      gruff: ['{name}.'],
      cheerful: ['Hi {name}!'],
      mysterious: ['{name}...'],
    };

    const result = generateSpeech('formal', testTemplates, {
      name: 'Alice',
      place: 'Easthollow',
    });

    expect(result).toBe('Hello Alice, welcome to Easthollow.');
  });

  it('should handle templates without variables', () => {
    const testTemplates: Record<BotSpeechStyle, string[]> = {
      formal: ['Good day.'],
      casual: ['Hey!'],
      gruff: ['Hmph.'],
      cheerful: ['Hello!'],
      mysterious: ['...'],
    };

    const result = generateSpeech('casual', testTemplates);
    expect(result).toBe('Hey!');
  });

  it('should handle missing variable values gracefully', () => {
    const testTemplates: Record<BotSpeechStyle, string[]> = {
      formal: ['Hello {name}.'],
      casual: ['Hey!'],
      gruff: ['Hmph.'],
      cheerful: ['Hello!'],
      mysterious: ['...'],
    };

    // Without providing the name variable
    const result = generateSpeech('formal', testTemplates);
    expect(result).toBe('Hello {name}.');
  });
});

describe('generateGreeting', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should use the bot's speech style", () => {
    const formalBot = createMockBotPlayer({
      botProfile: {
        ...createMockBotPlayer().botProfile,
        personality: {
          ...createMockBotPlayer().botProfile.personality,
          speechStyle: 'formal',
        },
      },
    });

    const result = generateGreeting(formalBot, 'PlayerName');
    // Should be one of the formal greetings with {name} replaced
    expect(
      GREETING_TEMPLATES.formal.some((t) => result.includes(t.replace('{name}', 'PlayerName')))
    ).toBe(true);
  });

  it('should sometimes add a catchphrase (30% chance)', () => {
    // First call returns 0 for template selection
    // Second call returns 0.2 (< 0.3) to trigger catchphrase
    // Third call returns 0 for catchphrase selection
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 0; // Template selection
      if (callCount === 2) return 0.2; // Catchphrase chance (< 0.3, so yes)
      return 0; // Catchphrase selection
    });

    const bot = createMockBotPlayer();
    const result = generateGreeting(bot, 'Player');

    expect(result).toContain('My catchphrase!');
  });

  it('should not add catchphrase when random > 0.3', () => {
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 0; // Template selection
      return 0.5; // Catchphrase chance (> 0.3, so no)
    });

    const bot = createMockBotPlayer();
    const result = generateGreeting(bot, 'Player');

    expect(result).not.toContain('My catchphrase!');
  });

  it('should return non-empty string', () => {
    const bot = createMockBotPlayer();
    const result = generateGreeting(bot, 'Player');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('generateCombatBark', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a non-empty string', () => {
    const bot = createMockBotPlayer();
    const result = generateCombatBark(bot);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should use the bot's speech style", () => {
    const gruffBot = createMockBotPlayer({
      botProfile: {
        ...createMockBotPlayer().botProfile,
        personality: {
          ...createMockBotPlayer().botProfile.personality,
          speechStyle: 'gruff',
        },
      },
    });

    const result = generateCombatBark(gruffBot);
    expect(COMBAT_BARK_TEMPLATES.gruff).toContain(result);
  });
});

describe('generateVictory', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a non-empty string', () => {
    const bot = createMockBotPlayer();
    const result = generateVictory(bot);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should use the bot's speech style", () => {
    const cheerfulBot = createMockBotPlayer({
      botProfile: {
        ...createMockBotPlayer().botProfile,
        personality: {
          ...createMockBotPlayer().botProfile.personality,
          speechStyle: 'cheerful',
        },
      },
    });

    const result = generateVictory(cheerfulBot);
    expect(VICTORY_TEMPLATES.cheerful).toContain(result);
  });
});

describe('generateLowHpCall', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a non-empty string', () => {
    const bot = createMockBotPlayer();
    const result = generateLowHpCall(bot);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should use the bot's speech style", () => {
    const mysteriousBot = createMockBotPlayer({
      botProfile: {
        ...createMockBotPlayer().botProfile,
        personality: {
          ...createMockBotPlayer().botProfile.personality,
          speechStyle: 'mysterious',
        },
      },
    });

    const result = generateLowHpCall(mysteriousBot);
    expect(LOW_HP_TEMPLATES.mysterious).toContain(result);
  });
});

describe('generateIdleChat', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a non-empty string', () => {
    const bot = createMockBotPlayer();
    const result = generateIdleChat(bot);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should use the bot's speech style", () => {
    const formalBot = createMockBotPlayer({
      botProfile: {
        ...createMockBotPlayer().botProfile,
        personality: {
          ...createMockBotPlayer().botProfile.personality,
          speechStyle: 'formal',
        },
      },
    });

    const result = generateIdleChat(formalBot);
    expect(IDLE_CHAT_TEMPLATES.formal).toContain(result);
  });
});

describe('modifyByRelationship', () => {
  it('should add friendly modifier when opinion > 50', () => {
    const result = modifyByRelationship('Hello there.', 75);
    expect(result).toMatch(/friend|ally|companion/i);
  });

  it('should add hostile modifier when opinion < -30', () => {
    const result = modifyByRelationship('Hello there.', -50);
    expect(result).toMatch(/cur|fool|wretch/i);
  });

  it('should return unchanged when opinion is neutral', () => {
    const result = modifyByRelationship('Hello there.', 0);
    expect(result).toBe('Hello there.');
  });

  it('should return unchanged at boundary -30', () => {
    const result = modifyByRelationship('Hello there.', -30);
    expect(result).toBe('Hello there.');
  });

  it('should return unchanged at boundary 50', () => {
    const result = modifyByRelationship('Hello there.', 50);
    expect(result).toBe('Hello there.');
  });

  it('should add hostile modifier just below -30', () => {
    const result = modifyByRelationship('Hello there.', -31);
    expect(result).toMatch(/cur|fool|wretch/i);
  });

  it('should add friendly modifier just above 50', () => {
    const result = modifyByRelationship('Hello there.', 51);
    expect(result).toMatch(/friend|ally|companion/i);
  });
});
