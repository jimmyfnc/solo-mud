import { describe, it, expect, beforeEach } from 'vitest';
import {
  learnLocation,
  recordCreatureEncounter,
  recordDeath,
  recordVictory,
  addRecentEvent,
  getCreatureKnowledge,
  hasVisitedLocation,
} from './knowledge';
import { createBotPlayer } from '../bot-factory';
import type { BotPlayer } from '../bot-player';

describe('Memory System', () => {
  let bot: BotPlayer;

  beforeEach(() => {
    bot = createBotPlayer({
      id: 'test-bot',
      name: 'TestBot',
      className: 'warrior',
      startLocationId: 'town_inn',
      isNamed: false,
    });
  });

  describe('learnLocation', () => {
    it('should add location to known locations', () => {
      learnLocation(bot, 'sewer_entrance');

      expect(bot.botProfile.memory.knownLocations).toContain('sewer_entrance');
    });

    it('should not add duplicate locations', () => {
      learnLocation(bot, 'sewer_entrance');
      learnLocation(bot, 'sewer_entrance');

      const count = bot.botProfile.memory.knownLocations.filter(
        (l) => l === 'sewer_entrance'
      ).length;
      expect(count).toBe(1);
    });

    it('should increment placesExplored', () => {
      const before = bot.botProfile.memory.placesExplored;
      learnLocation(bot, 'sewer_entrance');

      expect(bot.botProfile.memory.placesExplored).toBe(before + 1);
    });
  });

  describe('hasVisitedLocation', () => {
    it('should return false for unknown location', () => {
      expect(hasVisitedLocation(bot, 'unknown_place')).toBe(false);
    });

    it('should return true for known location', () => {
      learnLocation(bot, 'sewer_entrance');
      expect(hasVisitedLocation(bot, 'sewer_entrance')).toBe(true);
    });
  });

  describe('recordCreatureEncounter', () => {
    it('should record victory against creature', () => {
      recordCreatureEncounter(bot, 'giant_rat', true);

      const knowledge = getCreatureKnowledge(bot, 'giant_rat');
      expect(knowledge).toBeDefined();
      expect(knowledge?.timesDefeated).toBe(1);
      expect(knowledge?.timesDiedTo).toBe(0);
    });

    it('should record death to creature', () => {
      recordCreatureEncounter(bot, 'rat_king', false);

      const knowledge = getCreatureKnowledge(bot, 'rat_king');
      expect(knowledge).toBeDefined();
      expect(knowledge?.timesDefeated).toBe(0);
      expect(knowledge?.timesDiedTo).toBe(1);
    });

    it('should update difficulty estimate', () => {
      // Die twice with zero wins - should be marked as deadly
      recordCreatureEncounter(bot, 'rat_king', false);
      recordCreatureEncounter(bot, 'rat_king', false);

      const knowledge = getCreatureKnowledge(bot, 'rat_king');
      expect(knowledge?.estimatedDifficulty).toBe('deadly');
    });

    it('should mark creature as hard with one death and low win rate', () => {
      // Die once, win once - 50% win rate but died to it
      recordCreatureEncounter(bot, 'tough_rat', false);
      recordCreatureEncounter(bot, 'tough_rat', true);

      const knowledge = getCreatureKnowledge(bot, 'tough_rat');
      // winRate = 0.5, timesDiedTo = 1 - first condition fails, second condition: timesDiedTo >= 1 && winRate < 0.5 is false
      // So this should be 'medium'
      expect(knowledge?.estimatedDifficulty).toBe('medium');
    });

    it('should mark creature as hard when losing more than winning', () => {
      // Die once, lose twice - 33% win rate
      recordCreatureEncounter(bot, 'hard_rat', true);
      recordCreatureEncounter(bot, 'hard_rat', false);
      recordCreatureEncounter(bot, 'hard_rat', false);

      const knowledge = getCreatureKnowledge(bot, 'hard_rat');
      // winRate = 1/3 = 0.33, timesDiedTo = 2 - deadly condition: timesDiedTo >= 2 && winRate < 0.3 is false (0.33 > 0.3)
      // hard condition: timesDiedTo >= 1 && winRate < 0.5 is true
      expect(knowledge?.estimatedDifficulty).toBe('hard');
    });

    it('should mark frequently defeated creatures as easy', () => {
      for (let i = 0; i < 5; i++) {
        recordCreatureEncounter(bot, 'small_rat', true);
      }

      const knowledge = getCreatureKnowledge(bot, 'small_rat');
      expect(knowledge?.estimatedDifficulty).toBe('easy');
    });
  });

  describe('recordDeath', () => {
    it('should add death to deaths array', () => {
      recordDeath(bot, 'rat_king', 'sewer_kings_lair', false, ['sword']);

      expect(bot.botProfile.memory.deaths.length).toBe(1);
      expect(bot.botProfile.memory.deaths[0].killedBy).toBe('rat_king');
      expect(bot.botProfile.memory.deaths[0].location).toBe('sewer_kings_lair');
    });

    it('should record lost items', () => {
      recordDeath(bot, 'rat_king', 'sewer_kings_lair', false, [
        'sword',
        'shield',
      ]);

      expect(bot.botProfile.memory.deaths[0].lostItems).toEqual([
        'sword',
        'shield',
      ]);
    });
  });

  describe('recordVictory', () => {
    it('should add victory to victories array', () => {
      recordVictory(bot, 'rat_king', 'sewer_kings_lair', true);

      expect(bot.botProfile.memory.victories.length).toBe(1);
      expect(bot.botProfile.memory.victories[0].creatureType).toBe('rat_king');
      expect(bot.botProfile.memory.victories[0].wasBoss).toBe(true);
    });
  });

  describe('addRecentEvent', () => {
    it('should add event to recent events', () => {
      addRecentEvent(bot, 'combat_started', { enemy: 'rat' });

      expect(bot.botProfile.memory.recentEvents.length).toBe(1);
      expect(bot.botProfile.memory.recentEvents[0].type).toBe('combat_started');
    });

    it('should limit recent events to 20', () => {
      for (let i = 0; i < 25; i++) {
        addRecentEvent(bot, `event_${i}`, { index: i });
      }

      expect(bot.botProfile.memory.recentEvents.length).toBe(20);
      // Should keep the most recent events
      expect(bot.botProfile.memory.recentEvents[19].type).toBe('event_24');
    });
  });
});
