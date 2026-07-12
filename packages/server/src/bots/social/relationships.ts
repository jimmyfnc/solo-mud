/**
 * Bot relationship tracking.
 */

import type { BotPlayer } from '../bot-player';
import type {
  BotRelationship,
  RelationshipEvent,
  RelationshipEventType,
  RelationshipStatus
} from '@solo-mud/shared';

/** Get relationship status from opinion score */
export function getRelationshipStatus(opinion: number): RelationshipStatus {
  if (opinion <= -50) return 'enemy';
  if (opinion <= -10) return 'disliked';
  if (opinion < 10) return 'neutral';
  if (opinion < 50) return 'friendly';
  if (opinion < 90) return 'ally';
  return 'best_friend';
}

/** Get current opinion of an entity */
export function getOpinion(bot: BotPlayer, entityId: string): number {
  const rel = bot.botProfile.relationships.opinions[entityId];
  return rel?.opinion ?? 0;
}

/** Get full relationship data */
export function getRelationship(bot: BotPlayer, entityId: string): BotRelationship | undefined {
  return bot.botProfile.relationships.opinions[entityId];
}

/** Clamp value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Modify opinion of an entity */
export function modifyOpinion(
  bot: BotPlayer,
  entityId: string,
  entityName: string,
  isPlayer: boolean,
  change: number
): void {
  const opinions = bot.botProfile.relationships.opinions;

  if (!opinions[entityId]) {
    opinions[entityId] = {
      entityId,
      entityName,
      isPlayer,
      opinion: 0,
      history: [],
    };
  }

  opinions[entityId].opinion = clamp(opinions[entityId].opinion + change, -100, 100);
}

/** Record a relationship event */
export function recordRelationshipEvent(
  bot: BotPlayer,
  entityId: string,
  entityName: string,
  isPlayer: boolean,
  eventType: RelationshipEventType,
  opinionChange: number
): void {
  const opinions = bot.botProfile.relationships.opinions;

  if (!opinions[entityId]) {
    opinions[entityId] = {
      entityId,
      entityName,
      isPlayer,
      opinion: 0,
      history: [],
    };
  }

  const event: RelationshipEvent = {
    type: eventType,
    timestamp: Date.now(),
    opinionChange,
  };

  opinions[entityId].history.push(event);
  opinions[entityId].opinion = clamp(opinions[entityId].opinion + opinionChange, -100, 100);
}

/** Block an entity */
export function blockEntity(bot: BotPlayer, entityId: string): void {
  if (!bot.botProfile.relationships.blocked.includes(entityId)) {
    bot.botProfile.relationships.blocked.push(entityId);
  }
}

/** Check if entity is blocked */
export function isBlocked(bot: BotPlayer, entityId: string): boolean {
  return bot.botProfile.relationships.blocked.includes(entityId);
}

/** Get all friendly relationships */
export function getFriends(bot: BotPlayer): BotRelationship[] {
  return Object.values(bot.botProfile.relationships.opinions)
    .filter(rel => rel.opinion >= 10);
}

/** Get all enemy relationships */
export function getEnemies(bot: BotPlayer): BotRelationship[] {
  return Object.values(bot.botProfile.relationships.opinions)
    .filter(rel => rel.opinion <= -10);
}

/** Check if bot considers entity a friend */
export function isFriend(bot: BotPlayer, entityId: string): boolean {
  return getOpinion(bot, entityId) >= 10;
}

/** Check if bot considers entity an enemy */
export function isEnemy(bot: BotPlayer, entityId: string): boolean {
  return getOpinion(bot, entityId) <= -10;
}
