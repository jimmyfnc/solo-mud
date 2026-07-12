/**
 * Bot memory and knowledge management.
 */

import type { BotPlayer } from '../bot-player';
import type {
  CreatureKnowledge,
  DeathRecord,
  VictoryRecord,
  MemoryEvent,
} from '@solo-mud/shared';

/** Maximum number of recent events to keep */
const MAX_RECENT_EVENTS = 20;

/** Learn a new location */
export function learnLocation(bot: BotPlayer, locationId: string): void {
  const memory = bot.botProfile.memory;

  if (!memory.knownLocations.includes(locationId)) {
    memory.knownLocations.push(locationId);
    memory.placesExplored++;
  }
}

/** Check if bot has visited a location */
export function hasVisitedLocation(
  bot: BotPlayer,
  locationId: string
): boolean {
  return bot.botProfile.memory.knownLocations.includes(locationId);
}

/** Get knowledge about a creature type */
export function getCreatureKnowledge(
  bot: BotPlayer,
  creatureType: string
): CreatureKnowledge | undefined {
  return bot.botProfile.memory.knownCreatures[creatureType];
}

/** Calculate difficulty based on win/loss ratio */
function calculateDifficulty(
  timesDefeated: number,
  timesDiedTo: number
): CreatureKnowledge['estimatedDifficulty'] {
  const total = timesDefeated + timesDiedTo;
  if (total === 0) return 'medium';

  const winRate = timesDefeated / total;

  if (timesDiedTo >= 2 && winRate < 0.3) return 'deadly';
  if (timesDiedTo >= 1 && winRate < 0.5) return 'hard';
  if (winRate > 0.8 && timesDefeated >= 3) return 'easy';
  return 'medium';
}

/** Record an encounter with a creature */
export function recordCreatureEncounter(
  bot: BotPlayer,
  creatureType: string,
  won: boolean
): void {
  const memory = bot.botProfile.memory;

  if (!memory.knownCreatures[creatureType]) {
    memory.knownCreatures[creatureType] = {
      creatureType,
      timesDefeated: 0,
      timesDiedTo: 0,
      estimatedDifficulty: 'medium',
      lastEncounter: Date.now(),
    };
  }

  const knowledge = memory.knownCreatures[creatureType];
  if (won) {
    knowledge.timesDefeated++;
  } else {
    knowledge.timesDiedTo++;
  }
  knowledge.lastEncounter = Date.now();
  knowledge.estimatedDifficulty = calculateDifficulty(
    knowledge.timesDefeated,
    knowledge.timesDiedTo
  );
}

/** Record a death */
export function recordDeath(
  bot: BotPlayer,
  killedBy: string,
  location: string,
  hadHelp: boolean,
  lostItems: string[]
): void {
  const death: DeathRecord = {
    timestamp: Date.now(),
    location,
    killedBy,
    hadHelp,
    lostItems,
  };

  bot.botProfile.memory.deaths.push(death);

  // Also record creature encounter as a loss
  recordCreatureEncounter(bot, killedBy, false);
}

/** Record a notable victory */
export function recordVictory(
  bot: BotPlayer,
  creatureType: string,
  location: string,
  wasBoss: boolean
): void {
  const victory: VictoryRecord = {
    timestamp: Date.now(),
    location,
    creatureType,
    wasBoss,
  };

  bot.botProfile.memory.victories.push(victory);

  // Also record creature encounter as a win
  recordCreatureEncounter(bot, creatureType, true);
}

/** Add a recent event to short-term memory */
export function addRecentEvent(
  bot: BotPlayer,
  type: string,
  data: Record<string, unknown>
): void {
  const event: MemoryEvent = {
    type,
    timestamp: Date.now(),
    data,
  };

  bot.botProfile.memory.recentEvents.push(event);

  // Trim to max length, keeping most recent
  if (bot.botProfile.memory.recentEvents.length > MAX_RECENT_EVENTS) {
    bot.botProfile.memory.recentEvents =
      bot.botProfile.memory.recentEvents.slice(-MAX_RECENT_EVENTS);
  }
}

/** Update last combat timestamp */
export function recordCombatTime(bot: BotPlayer): void {
  bot.botProfile.memory.lastCombat = Date.now();
}

/** Update last social interaction timestamp */
export function recordSocialTime(bot: BotPlayer): void {
  bot.botProfile.memory.lastSocialInteraction = Date.now();
}

/** Record a path between locations */
export function learnPath(
  bot: BotPlayer,
  destination: string,
  path: string[]
): void {
  bot.botProfile.memory.knownPaths[destination] = path;
}

/** Get known path to destination */
export function getKnownPath(
  bot: BotPlayer,
  destination: string
): string[] | undefined {
  return bot.botProfile.memory.knownPaths[destination];
}
