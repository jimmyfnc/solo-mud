/**
 * BotSession - a session for bot players (no socket connection).
 */

import type { World, CombatStats } from '@solo-mud/shared';
import type { BotPlayer } from './bot-player';
import type { IncursionState } from '../game/incursion';

/** Bot session mimics GameSession but without socket */
export interface BotSession {
  id: string;
  playerId: string;
  player: BotPlayer;
  combatStats: CombatStats;
  world: World;
  createdAt: number;
  lastActivity: number;

  /** Flag indicating this is a bot session */
  isBot: true;

  /** Database character ID for persistence */
  characterId?: string;

  /** World seed used for this session */
  worldSeed?: string;

  /** Incursion state (shared with all sessions) */
  incursionState?: IncursionState;

  /** Valve puzzle state: tracks which valves have been turned in sequence */
  valveSequence?: string[];

  /** Current puzzle solution (randomized each attempt) */
  puzzleSolution?: string[];

  /** Whether the sewer gate is currently open (resets when leaving area) */
  sewerGateOpen?: boolean;
}

/** Type guard to check if a session is a BotSession */
export function isBotSession(session: unknown): session is BotSession {
  return (
    typeof session === 'object' &&
    session !== null &&
    'isBot' in session &&
    (session as BotSession).isBot === true
  );
}
