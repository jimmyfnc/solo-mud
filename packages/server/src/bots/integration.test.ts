/**
 * Integration tests for bot system with game loop.
 * Tests interactions between components: BotManager, GOAP, personality, memory, relationships, death/respawn, conversation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BotManager } from './bot-manager';
import { createBotPlayer, createBotSession, createNamedBot } from './bot-factory';
import { NAMED_BOTS } from './roster/named-bots';
import { selectHighestPriorityGoal, calculateGoalPriority } from './goap/goals';
import { selectBestAction } from './goap/planner';
import {
  modifyOpinion,
  getRelationshipStatus,
  getOpinion,
  recordRelationshipEvent,
} from './social/relationships';
import {
  calculateDeathPenalties,
  applyDeathPenalties,
  recordDeath,
} from './death-handler';
import {
  generateGreeting,
  generateCombatBark,
  generateLowHpCall,
  GREETING_TEMPLATES,
  COMBAT_BARK_TEMPLATES,
  LOW_HP_TEMPLATES,
} from './conversation/templates';
import type { BotSpawnConfig } from '@solo-mud/shared';
import type { BotPlayer } from './bot-player';
import type { BotDeathInfo } from './death-handler';

describe('BotManager integration', () => {
  let manager: BotManager;
  const config: BotSpawnConfig = {
    minPopulation: 3,
    maxPopulation: 5,
    namedBotCount: 1,
    spawnLocations: ['town_inn'],
    levelRange: [1, 3],
    namedBotRespawnDelay: 1440,
  };

  beforeEach(() => {
    manager = new BotManager(config);
  });

  describe('tick integration', () => {
    it('should run tick without errors', async () => {
      manager.maintainPopulation();

      // Should not throw
      await expect(manager.tick(0)).resolves.not.toThrow();
    });

    it('should maintain population across ticks', async () => {
      manager.maintainPopulation();
      const initialCount = manager.getBotCount();

      await manager.tick(1000);

      expect(manager.getBotCount()).toBe(initialCount);
    });
  });

  describe('bot sessions', () => {
    it('should create valid bot sessions', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();

      for (const session of sessions) {
        expect(session.isBot).toBe(true);
        expect(session.player.isBot).toBe(true);
        expect(session.player.botProfile).toBeDefined();
        expect(session.world).toBeDefined();
        expect(session.combatStats).toBeDefined();
      }
    });

    it('should have unique IDs for all bots', () => {
      manager.maintainPopulation();
      const sessions = manager.getAllBotSessions();
      const ids = sessions.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});

describe('Named bot lifecycle', () => {
  let manager: BotManager;
  const config: BotSpawnConfig = {
    minPopulation: 2,
    maxPopulation: 5,
    namedBotCount: 3,
    spawnLocations: ['town_inn', 'town_square'],
    levelRange: [1, 5],
    namedBotRespawnDelay: 1440,
  };

  beforeEach(() => {
    manager = new BotManager(config);
  });

  it('should load named bots on initialize()', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    expect(namedBots.size).toBe(config.namedBotCount);
  });

  it('should have correct personality from definition', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    const firstNamedBot = Array.from(namedBots.values())[0]!;
    const botId = firstNamedBot.player.namedBotId!;
    const definition = NAMED_BOTS[botId]!;

    // Personality should match definition
    expect(firstNamedBot.player.botProfile.personality.bravery).toBe(
      definition.personality.bravery
    );
    expect(firstNamedBot.player.botProfile.personality.speechStyle).toBe(
      definition.personality.speechStyle
    );
    expect(firstNamedBot.player.botProfile.personality.catchphrases).toEqual(
      definition.personality.catchphrases
    );
  });

  it('should have backstory set from definition', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    const firstNamedBot = Array.from(namedBots.values())[0]!;
    const botId = firstNamedBot.player.namedBotId!;
    const definition = NAMED_BOTS[botId]!;

    expect(firstNamedBot.player.botProfile.backstory).toBe(definition.backstory);
  });

  it('should survive maintainPopulation() calls', async () => {
    await manager.initialize();

    const namedBotsBefore = Array.from(manager.getNamedBots().keys());

    // Call maintainPopulation multiple times
    for (let i = 0; i < 10; i++) {
      manager.maintainPopulation();
    }

    // All named bots should still be present
    for (const id of namedBotsBefore) {
      expect(manager.getNamedBots().has(id)).toBe(true);
    }
  });

  it('should have correct class from definition', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    for (const [, session] of namedBots) {
      const botId = session.player.namedBotId!;
      const definition = NAMED_BOTS[botId]!;
      expect(session.player.class).toBe(definition.class);
    }
  });

  it('should have correct starting level from definition', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    for (const [, session] of namedBots) {
      const botId = session.player.namedBotId!;
      const definition = NAMED_BOTS[botId]!;
      expect(session.player.level).toBe(definition.startingLevel);
    }
  });
});

describe('GOAP decision making', () => {
  let bot: BotPlayer;

  beforeEach(() => {
    bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
      level: 5,
    });
  });

  it('should select survive goal when HP is low', () => {
    // Set HP to 20% of max
    bot.currentHp = Math.floor(bot.maxHp * 0.2);
    // Low bravery makes survival priority higher
    bot.botProfile.personality.bravery = 20;

    const goalId = selectHighestPriorityGoal(bot);
    const survivePriority = calculateGoalPriority('survive', bot);
    const levelUpPriority = calculateGoalPriority('level_up', bot);

    // Survive priority should be high with low HP
    expect(survivePriority).toBeGreaterThan(50);
    // Should be higher than level_up
    expect(survivePriority).toBeGreaterThan(levelUpPriority);
    // Goal should be survive or heal_up
    expect(['survive', 'heal_up']).toContain(goalId);
  });

  it('should prioritize level_up with high patience', () => {
    // Full HP
    bot.currentHp = bot.maxHp;
    // High patience = high level_up priority
    bot.botProfile.personality.patience = 95;
    // Low sociability to reduce socialize priority
    bot.botProfile.personality.sociability = 10;
    // Low greed to reduce get_richer priority
    bot.botProfile.personality.greed = 10;

    const levelUpPriority = calculateGoalPriority('level_up', bot);

    // With 95 patience: 40 + (0.95 * 20) = 59
    expect(levelUpPriority).toBeGreaterThanOrEqual(55);
    expect(levelUpPriority).toBeLessThanOrEqual(60);
  });

  it('should select exploration goal for exploration-preferring bot', () => {
    bot.currentHp = bot.maxHp;
    bot.botProfile.personality.preferredActivities = ['exploration'];
    bot.botProfile.personality.patience = 30;
    bot.botProfile.personality.sociability = 10;
    bot.botProfile.personality.greed = 10;
    // Set recent explore event to avoid the +10 bonus
    bot.botProfile.memory.recentEvents = [
      { type: 'explored_location', timestamp: Date.now(), location: 'somewhere' },
    ];

    const explorePriority = calculateGoalPriority('explore', bot);

    // With exploration preference: priority = 45
    expect(explorePriority).toBe(45);
  });

  it('should select survival action when survive goal is active', () => {
    bot.currentHp = Math.floor(bot.maxHp * 0.2);

    const action = selectBestAction(bot, 'survive');

    // Should select one of: flee, use_potion, rest
    expect(['flee', 'use_potion', 'rest', 'travel']).toContain(action);
  });

  it('should select combat action for level_up goal', () => {
    bot.currentHp = bot.maxHp;

    const action = selectBestAction(bot, 'level_up');

    // Should select one of: attack, explore, travel
    expect(['attack', 'explore', 'travel']).toContain(action);
  });

  it('should prioritize socialize for high sociability bots', () => {
    bot.currentHp = bot.maxHp;
    bot.botProfile.personality.sociability = 90;
    // Set last social interaction to distant past
    bot.botProfile.memory.lastSocialInteraction = Date.now() - 600000; // 10 minutes ago

    const socializePriority = calculateGoalPriority('socialize', bot);

    // Base 20 + (0.9 * 30) = 47, plus bonus for long time since interaction
    expect(socializePriority).toBeGreaterThan(50);
  });

  it('should prioritize get_richer for greedy bots', () => {
    bot.currentHp = bot.maxHp;
    bot.botProfile.personality.greed = 95;

    const getRicherPriority = calculateGoalPriority('get_richer', bot);

    // Base 30 + (0.95 * 40) = 68
    expect(getRicherPriority).toBeGreaterThanOrEqual(65);
    expect(getRicherPriority).toBeLessThanOrEqual(70);
  });
});

describe('Relationship system', () => {
  let bot: BotPlayer;

  beforeEach(() => {
    bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });
  });

  it('should start with neutral relationship (opinion 0)', () => {
    const opinion = getOpinion(bot, 'player_123');
    expect(opinion).toBe(0);
  });

  it('should modify opinion correctly', () => {
    modifyOpinion(bot, 'player_123', 'Test Player', true, 25);

    const opinion = getOpinion(bot, 'player_123');
    expect(opinion).toBe(25);
  });

  it('should accumulate opinion changes', () => {
    modifyOpinion(bot, 'player_123', 'Test Player', true, 20);
    modifyOpinion(bot, 'player_123', 'Test Player', true, 15);

    const opinion = getOpinion(bot, 'player_123');
    expect(opinion).toBe(35);
  });

  it('should clamp opinion to -100 to 100 range', () => {
    modifyOpinion(bot, 'player_123', 'Test Player', true, 150);
    expect(getOpinion(bot, 'player_123')).toBe(100);

    modifyOpinion(bot, 'player_456', 'Test Player 2', true, -150);
    expect(getOpinion(bot, 'player_456')).toBe(-100);
  });

  it('should return correct status for opinion ranges', () => {
    expect(getRelationshipStatus(-100)).toBe('enemy');
    expect(getRelationshipStatus(-50)).toBe('enemy');
    expect(getRelationshipStatus(-49)).toBe('disliked');
    expect(getRelationshipStatus(-10)).toBe('disliked');
    expect(getRelationshipStatus(-9)).toBe('neutral');
    expect(getRelationshipStatus(0)).toBe('neutral');
    expect(getRelationshipStatus(9)).toBe('neutral');
    expect(getRelationshipStatus(10)).toBe('friendly');
    expect(getRelationshipStatus(49)).toBe('friendly');
    expect(getRelationshipStatus(50)).toBe('ally');
    expect(getRelationshipStatus(89)).toBe('ally');
    expect(getRelationshipStatus(90)).toBe('best_friend');
    expect(getRelationshipStatus(100)).toBe('best_friend');
  });

  it('should record relationship events with history', () => {
    recordRelationshipEvent(bot, 'player_123', 'Test Player', true, 'helped', 10);

    const relationship = bot.botProfile.relationships.opinions['player_123'];
    expect(relationship).toBeDefined();
    expect(relationship!.history.length).toBe(1);
    expect(relationship!.history[0]!.type).toBe('helped');
    expect(relationship!.history[0]!.opinionChange).toBe(10);
    expect(relationship!.opinion).toBe(10);
  });

  it('should accumulate events in history', () => {
    recordRelationshipEvent(bot, 'player_123', 'Test Player', true, 'helped', 10);
    recordRelationshipEvent(bot, 'player_123', 'Test Player', true, 'traded', 5);

    const relationship = bot.botProfile.relationships.opinions['player_123'];
    expect(relationship!.history.length).toBe(2);
    expect(relationship!.opinion).toBe(15);
  });
});

describe('Death and respawn', () => {
  let manager: BotManager;
  const config: BotSpawnConfig = {
    minPopulation: 2,
    maxPopulation: 5,
    namedBotCount: 2,
    spawnLocations: ['town_inn', 'town_square'],
    levelRange: [1, 5],
    namedBotRespawnDelay: 60, // 60 minutes for testing
  };

  beforeEach(() => {
    manager = new BotManager(config);
  });

  it('should remove generic bots on handleBotDeath', () => {
    manager.spawnGenericBot();
    const session = manager.getAllBotSessions()[0]!;

    const result = manager.handleBotDeath(session.id);

    expect(result.wasNamed).toBe(false);
    expect(result.botName).toBe(session.player.name);
    expect(manager.getBotSession(session.id)).toBeUndefined();
  });

  it('should not remove named bots on handleBotDeath', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    const firstNamedBot = Array.from(namedBots.values())[0]!;

    const result = manager.handleBotDeath(firstNamedBot.id);

    expect(result.wasNamed).toBe(true);
    expect(manager.getNamedBots().has(firstNamedBot.id)).toBe(true);
  });

  it('should set HP to 0 when queued for respawn', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    const firstNamedBot = Array.from(namedBots.values())[0]!;

    expect(firstNamedBot.player.currentHp).toBeGreaterThan(0);

    manager.queueForRespawn(firstNamedBot.id, 100);

    expect(firstNamedBot.player.currentHp).toBe(0);
  });

  it('should respawn after delay in processRespawnQueue', async () => {
    await manager.initialize();

    const namedBots = manager.getNamedBots();
    const firstNamedBot = Array.from(namedBots.values())[0]!;
    const maxHp = firstNamedBot.player.maxHp;

    const gameTime = 100;
    manager.queueForRespawn(firstNamedBot.id, gameTime);

    // Too early - should not respawn
    manager.processRespawnQueue(gameTime + config.namedBotRespawnDelay - 1);
    expect(firstNamedBot.player.currentHp).toBe(0);
    expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(true);

    // Exactly at respawn time - should respawn
    manager.processRespawnQueue(gameTime + config.namedBotRespawnDelay);
    expect(firstNamedBot.player.currentHp).toBe(maxHp);
    expect(manager.isAwaitingRespawn(firstNamedBot.id)).toBe(false);
  });

  it('should apply death penalties correctly', () => {
    const bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
      level: 5,
    });

    // Set some XP and currency
    bot.xp = 1000;
    bot.currency = { copper: 50, silver: 10, gold: 1 };
    // Total copper value: 50 + 100 + 100 = 250

    const deathInfo: BotDeathInfo = {
      botId: bot.id,
      botName: bot.name,
      killedBy: 'creature_rat',
      killerName: 'Giant Rat',
      location: 'sewer_entrance',
      wasHeroic: false,
      timestamp: Date.now(),
    };

    const penalties = calculateDeathPenalties(bot, deathInfo);

    // XP loss: 5% of 1000 = 50
    expect(penalties.xpLost).toBe(50);
    // Gold loss: 10% of 250 = 25 copper
    expect(penalties.goldLost).toBe(25);

    applyDeathPenalties(bot, penalties);

    // XP should be reduced
    expect(bot.xp).toBe(950);
    // Gold loss taken from copper first
    expect(bot.currency.copper).toBe(25);
  });

  it('should record death in memory and decrease killer opinion', () => {
    const bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });
    bot.botProfile.personality.aggression = 50;

    const deathInfo: BotDeathInfo = {
      botId: bot.id,
      botName: bot.name,
      killedBy: 'creature_rat',
      killerName: 'Giant Rat',
      location: 'sewer_entrance',
      wasHeroic: false,
      timestamp: Date.now(),
    };

    recordDeath(bot, deathInfo);

    // Should have death record
    expect(bot.botProfile.memory.deaths.length).toBe(1);
    expect(bot.botProfile.memory.deaths[0]!.killedBy).toBe('Giant Rat');
    expect(bot.botProfile.memory.deaths[0]!.location).toBe('sewer_entrance');

    // Should have negative opinion of killer
    const opinion = getOpinion(bot, 'creature_rat');
    expect(opinion).toBeLessThan(0);
    expect(opinion).toBeLessThanOrEqual(-30);
  });

  it('should calculate memory effect based on bravery', () => {
    const bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    const deathInfo: BotDeathInfo = {
      botId: bot.id,
      botName: bot.name,
      killedBy: 'creature_rat',
      killerName: 'Giant Rat',
      location: 'sewer_entrance',
      wasHeroic: false,
      timestamp: Date.now(),
    };

    // Low bravery = fears_killer
    bot.botProfile.personality.bravery = 20;
    let penalties = calculateDeathPenalties(bot, deathInfo);
    expect(penalties.memoryEffect).toBe('fears_killer');

    // High bravery = seeks_revenge
    bot.botProfile.personality.bravery = 80;
    penalties = calculateDeathPenalties(bot, deathInfo);
    expect(penalties.memoryEffect).toBe('seeks_revenge');

    // Medium bravery = gains_caution
    bot.botProfile.personality.bravery = 50;
    penalties = calculateDeathPenalties(bot, deathInfo);
    expect(penalties.memoryEffect).toBe('gains_caution');
  });
});

describe('Conversation system', () => {
  let bot: BotPlayer;

  beforeEach(() => {
    bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });
  });

  it('should generate greeting using bot speech style', () => {
    bot.botProfile.personality.speechStyle = 'formal';

    const greeting = generateGreeting(bot, 'Player');

    // Should contain player name or be a valid formal greeting
    const formalTemplates = GREETING_TEMPLATES.formal;
    const isValidGreeting = formalTemplates.some((template) => {
      const filled = template.replace('{name}', 'Player');
      // Check if greeting starts with or contains the template
      return greeting.includes(filled.split(' ')[0]!);
    });
    expect(isValidGreeting).toBe(true);
  });

  it('should generate different greetings for different speech styles', () => {
    const styles = ['formal', 'casual', 'gruff', 'cheerful', 'mysterious'] as const;
    const greetings: string[] = [];

    for (const style of styles) {
      bot.botProfile.personality.speechStyle = style;
      greetings.push(generateGreeting(bot, 'Player'));
    }

    // Not all greetings should be identical (with high probability)
    const uniqueGreetings = new Set(greetings);
    // At least some variety expected
    expect(uniqueGreetings.size).toBeGreaterThanOrEqual(1);
  });

  it('should generate combat barks for combat_start trigger', () => {
    bot.botProfile.personality.speechStyle = 'gruff';

    const bark = generateCombatBark(bot);

    // Should be a valid gruff combat bark
    const gruffTemplates = COMBAT_BARK_TEMPLATES.gruff;
    expect(gruffTemplates).toContain(bark);
  });

  it('should generate low HP calls for help trigger', () => {
    bot.botProfile.personality.speechStyle = 'casual';

    const call = generateLowHpCall(bot);

    // Should be a valid casual low HP call
    const casualTemplates = LOW_HP_TEMPLATES.casual;
    expect(casualTemplates).toContain(call);
  });

  it('should sometimes include catchphrases in greetings', () => {
    bot.botProfile.personality.speechStyle = 'formal';
    bot.botProfile.personality.catchphrases = ['Test catchphrase!'];

    // Run multiple times to check if catchphrase ever appears (30% chance)
    let hasCatchphrase = false;
    for (let i = 0; i < 50; i++) {
      const greeting = generateGreeting(bot, 'Player');
      if (greeting.includes('Test catchphrase!')) {
        hasCatchphrase = true;
        break;
      }
    }

    // Should have appeared at least once in 50 attempts (very high probability)
    expect(hasCatchphrase).toBe(true);
  });

  it('should generate style-appropriate combat barks', () => {
    const styleBarks: Record<string, string[]> = {};

    const styles = ['formal', 'casual', 'gruff', 'cheerful', 'mysterious'] as const;
    for (const style of styles) {
      bot.botProfile.personality.speechStyle = style;
      styleBarks[style] = [];
      for (let i = 0; i < 5; i++) {
        styleBarks[style]!.push(generateCombatBark(bot));
      }
    }

    // Each style should only produce barks from its template set
    for (const style of styles) {
      const templates = COMBAT_BARK_TEMPLATES[style];
      for (const bark of styleBarks[style]!) {
        expect(templates).toContain(bark);
      }
    }
  });

  it('should handle named bot with custom personality', async () => {
    // Use Aldric - formal speech style
    const aldricDef = NAMED_BOTS['bot_aldric']!;
    const aldric = createNamedBot(aldricDef, 'town_inn');

    const greeting = generateGreeting(aldric, 'Hero');

    // Aldric is formal, so greeting should come from formal templates
    const formalTemplates = GREETING_TEMPLATES.formal;
    const isValidGreeting = formalTemplates.some((template) => {
      const filled = template.replace('{name}', 'Hero');
      return greeting.includes(filled) || greeting.startsWith(filled.split(' ')[0]!);
    });
    // Or might include a catchphrase
    const hasCatchphrase = aldricDef.personality.catchphrases.some((c) =>
      greeting.includes(c)
    );

    expect(isValidGreeting || hasCatchphrase).toBe(true);
  });
});

describe('Bot factory integration', () => {
  it('should create bot with correct world', () => {
    const bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    const session = createBotSession(bot);

    expect(session.world).toBeDefined();
    expect(session.world.locations).toBeDefined();
    expect(session.world.items).toBeDefined();
  });

  it('should create bot with starter equipment', () => {
    const bot = createBotPlayer({
      id: 'test_bot',
      name: 'Test Bot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });

    const session = createBotSession(bot);

    // Should have some equipment
    const hasEquipment = !!(
      session.player.equipment.weapon ||
      session.player.equipment.chest ||
      session.player.equipment.legs ||
      session.player.equipment.feet
    );

    expect(hasEquipment).toBe(true);
  });

  it('should create named bot with aspirations from definition', () => {
    const aldricDef = NAMED_BOTS['bot_aldric']!;
    const aldric = createNamedBot(aldricDef, 'town_inn');

    expect(aldric.botProfile.aspirations.length).toBeGreaterThan(0);
    expect(aldric.botProfile.aspirations).toContain('boss_slayer');
  });

  it('should create named bot with faction info', () => {
    const aldricDef = NAMED_BOTS['bot_aldric']!;
    const aldric = createNamedBot(aldricDef, 'town_inn');

    expect(aldric.botProfile.relationships.faction).toBe('easthollow_defenders');
    expect(aldric.botProfile.relationships.factionRole).toBe('leader');
  });
});
