/**
 * Game session management - tracks connected players and their game state.
 */

import type { Player, World, CombatStats } from '@solo-mud/shared';
import { generateWorld } from '../world/generate';

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
  createSession(socketId: string, playerName: string): GameSession {
    // Generate a new world for this player
    const seed = `${socketId}-${Date.now()}`;
    const world = generateWorld({
      seed,
      nodeCount: 18,
      extraEdges: 5,
      lockedEdges: 2,
    });

    // Create initial player state
    const player = createInitialPlayer(socketId, playerName, world.startId);
    const combatStats = calculateCombatStats(player);

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

/**
 * Create initial player state.
 */
function createInitialPlayer(id: string, name: string, startLocationId: string): Player {
  return {
    id,
    name,
    class: 'warrior', // Default class for now
    level: 1,
    xp: 0,
    xpToNextLevel: 100,

    baseStats: { str: 14, dex: 10, con: 12, int: 8, wis: 8 },
    currentHp: 50,
    maxHp: 50,
    currentMp: 10,
    maxMp: 10,

    subclass: undefined,
    talentPointsAvailable: 0,

    equipment: {},
    inventory: [],
    inventorySlots: 20,
    carryWeight: 0,
    maxCarryWeight: 100,

    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],

    locationId: startLocationId,
    boundTownId: startLocationId,

    inCombat: false,
    autoAttack: false,
    targetId: undefined,
    globalCooldown: 0,
    abilityCooldowns: {},

    gold: 0,

    corpseLocationId: undefined,
    corpseItems: undefined,
  };
}

/**
 * Calculate combat stats from player state.
 */
function calculateCombatStats(player: Player): CombatStats {
  const { baseStats } = player;

  return {
    attackPower: baseStats.str * 2,
    spellPower: baseStats.int * 2,
    defense: baseStats.con + 5,
    magicResist: baseStats.wis + 5,
    hitChance: 0.9 + baseStats.dex * 0.005,
    dodgeChance: 0.05 + baseStats.dex * 0.003,
    critChance: 0.05 + baseStats.dex * 0.002,
    critDamage: 1.5,
    attackSpeed: 2000, // ms between attacks
  };
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export helper functions for use elsewhere
export { createInitialPlayer, calculateCombatStats };
