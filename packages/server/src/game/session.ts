/**
 * Game session management - tracks connected players and their game state.
 */

import type { Player, World, CombatStats, ClassName } from '@solo-mud/shared';
import { generateWorld } from '../world/generate';
import { createPlayer, calculateCombatStats } from '../character';

export interface GameSession {
  id: string;
  playerId: string;
  player: Player;
  combatStats: CombatStats;
  world: World;
  createdAt: number;
  lastActivity: number;
}

/**
 * Session manager singleton for tracking all active game sessions.
 */
class SessionManager {
  private sessions: Map<string, GameSession> = new Map();

  /**
   * Create a new game session for a socket connection.
   */
  createSession(socketId: string, playerName: string, className: ClassName = 'warrior'): GameSession {
    // Generate a new world for this player
    const seed = `${socketId}-${Date.now()}`;
    const world = generateWorld({
      seed,
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
    const combatStats = calculateCombatStats(player.baseStats);

    const session: GameSession = {
      id: socketId,
      playerId: socketId,
      player,
      combatStats,
      world,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.sessions.set(socketId, session);
    return session;
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
