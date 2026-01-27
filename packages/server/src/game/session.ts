/**
 * Game session management - tracks connected players and their game state.
 */

import type { Player, World, CombatStats, ClassName } from '@solo-mud/shared';
import { generateStarterGear } from '@solo-mud/shared';
import { generateWorld } from '../world/generate';
import { createPlayer, calculateCombatStats } from '../character';
import { createIncursionState, type IncursionState } from './incursion';

export interface GameSession {
  id: string;
  playerId: string;
  player: Player;
  combatStats: CombatStats;
  world: World;
  createdAt: number;
  lastActivity: number;
  /** Database character ID for persistence */
  characterId?: string;
  /** World seed used for this session */
  worldSeed?: string;
  /** Current NPC the player is talking to */
  conversationNpc?: string;
  /** Numbered list of learnable spells from current trainer (for "learn 1" etc.) */
  learnableSpells?: string[];
  /** Town incursion state */
  incursionState?: IncursionState;
  /** Valve puzzle state: tracks which valves have been turned in sequence */
  valveSequence?: string[];
  /** Current puzzle solution (randomized each attempt) */
  puzzleSolution?: string[];
  /** Whether the sewer gate is currently open (resets when leaving area) */
  sewerGateOpen?: boolean;
}

/**
 * Session manager singleton for tracking all active game sessions.
 */
class SessionManager {
  private sessions: Map<string, GameSession> = new Map();

  /**
   * Create a new game session for a socket connection.
   * Returns the session and the world seed for persistence.
   */
  createSession(socketId: string, playerName: string, className: ClassName = 'warrior'): { session: GameSession; worldSeed: string } {
    // Generate a new world for this player
    const worldSeed = `${socketId}-${Date.now()}`;
    const world = generateWorld({
      seed: worldSeed,
      nodeCount: 18,
      extraEdges: 5,
      lockedEdges: 2,
    });

    // Create initial player state using the player factory
    const player = createPlayer({
      id: socketId,
      name: playerName,
      className,
      startLocationId: world.startId,
    });

    // Generate and equip starter gear
    const starterGear = generateStarterGear(className);
    for (const item of starterGear.items) {
      world.items[item.id] = item;
    }
    if (starterGear.equipmentIds.weapon) {
      player.equipment.weapon = starterGear.equipmentIds.weapon;
    }
    if (starterGear.equipmentIds.chest) {
      player.equipment.chest = starterGear.equipmentIds.chest;
    }
    if (starterGear.equipmentIds.legs) {
      player.equipment.legs = starterGear.equipmentIds.legs;
    }
    if (starterGear.equipmentIds.feet) {
      player.equipment.feet = starterGear.equipmentIds.feet;
    }

    const combatStats = calculateCombatStats(player.baseStats);

    const session: GameSession = {
      id: socketId,
      playerId: socketId,
      player,
      combatStats,
      world,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      worldSeed,
      incursionState: createIncursionState(),
    };

    this.sessions.set(socketId, session);
    return { session, worldSeed };
  }

  /**
   * Set a session directly (used when restoring from database).
   */
  setSession(socketId: string, session: GameSession): void {
    this.sessions.set(socketId, session);
  }

  /**
   * Get an existing session by socket ID.
   */
  getSession(socketId: string): GameSession | undefined {
    return this.sessions.get(socketId);
  }

  /**
   * Update session's last activity timestamp.
   */
  touchSession(socketId: string): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * Remove a session when a player disconnects.
   */
  removeSession(socketId: string): boolean {
    return this.sessions.delete(socketId);
  }

  /**
   * Get all active sessions.
   */
  getAllSessions(): GameSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count.
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
