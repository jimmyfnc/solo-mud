import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOpinion,
  modifyOpinion,
  getRelationshipStatus,
  recordRelationshipEvent,
  getRelationship,
  blockEntity,
  isBlocked
} from './relationships';
import { createBotPlayer } from '../bot-factory';
import type { BotPlayer } from '../bot-player';

describe('Relationship System', () => {
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

  describe('getRelationshipStatus', () => {
    it('should return enemy for very negative opinion', () => {
      expect(getRelationshipStatus(-75)).toBe('enemy');
    });

    it('should return disliked for moderately negative opinion', () => {
      expect(getRelationshipStatus(-25)).toBe('disliked');
    });

    it('should return neutral for near-zero opinion', () => {
      expect(getRelationshipStatus(0)).toBe('neutral');
      expect(getRelationshipStatus(5)).toBe('neutral');
      expect(getRelationshipStatus(-5)).toBe('neutral');
    });

    it('should return friendly for moderately positive opinion', () => {
      expect(getRelationshipStatus(25)).toBe('friendly');
    });

    it('should return ally for very positive opinion', () => {
      expect(getRelationshipStatus(75)).toBe('ally');
    });

    it('should return best_friend for maximum positive opinion', () => {
      expect(getRelationshipStatus(95)).toBe('best_friend');
    });
  });

  describe('getOpinion', () => {
    it('should return 0 for unknown entity', () => {
      expect(getOpinion(bot, 'unknown_player')).toBe(0);
    });

    it('should return stored opinion', () => {
      modifyOpinion(bot, 'player_1', 'Player One', true, 25);
      expect(getOpinion(bot, 'player_1')).toBe(25);
    });
  });

  describe('modifyOpinion', () => {
    it('should create relationship if not exists', () => {
      modifyOpinion(bot, 'player_1', 'Player One', true, 10);

      const rel = getRelationship(bot, 'player_1');
      expect(rel).toBeDefined();
      expect(rel?.entityName).toBe('Player One');
      expect(rel?.isPlayer).toBe(true);
    });

    it('should add to existing opinion', () => {
      modifyOpinion(bot, 'player_1', 'Player One', true, 20);
      modifyOpinion(bot, 'player_1', 'Player One', true, 15);

      expect(getOpinion(bot, 'player_1')).toBe(35);
    });

    it('should clamp opinion to -100', () => {
      modifyOpinion(bot, 'player_1', 'Player One', true, -150);

      expect(getOpinion(bot, 'player_1')).toBe(-100);
    });

    it('should clamp opinion to +100', () => {
      modifyOpinion(bot, 'player_1', 'Player One', true, 150);

      expect(getOpinion(bot, 'player_1')).toBe(100);
    });
  });

  describe('recordRelationshipEvent', () => {
    it('should add event to history', () => {
      recordRelationshipEvent(bot, 'player_1', 'Player One', true, 'helped_in_combat', 10);

      const rel = getRelationship(bot, 'player_1');
      expect(rel?.history.length).toBe(1);
      expect(rel?.history[0].type).toBe('helped_in_combat');
      expect(rel?.history[0].opinionChange).toBe(10);
    });

    it('should update opinion based on event', () => {
      recordRelationshipEvent(bot, 'player_1', 'Player One', true, 'saved_my_life', 25);

      expect(getOpinion(bot, 'player_1')).toBe(25);
    });

    it('should track negative events', () => {
      recordRelationshipEvent(bot, 'player_1', 'Player One', true, 'abandoned_me', -30);

      expect(getOpinion(bot, 'player_1')).toBe(-30);
      const rel = getRelationship(bot, 'player_1');
      expect(rel?.history[0].type).toBe('abandoned_me');
    });
  });

  describe('blockEntity', () => {
    it('should add entity to blocked list', () => {
      blockEntity(bot, 'bad_player');

      expect(isBlocked(bot, 'bad_player')).toBe(true);
    });

    it('should not duplicate blocked entities', () => {
      blockEntity(bot, 'bad_player');
      blockEntity(bot, 'bad_player');

      expect(bot.botProfile.relationships.blocked.filter(id => id === 'bad_player').length).toBe(1);
    });
  });

  describe('isBlocked', () => {
    it('should return false for non-blocked entity', () => {
      expect(isBlocked(bot, 'good_player')).toBe(false);
    });
  });
});
