/**
 * Tests for enemy AI behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createEnemyAI,
  type Enemy,
  type EnemyAIState,
} from './enemy-ai';
import type { CombatEntity } from './auto-attack';
import type { TickContext } from './tick';

// Helper to create a mock enemy
function createEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'enemy-1',
    name: 'Goblin',
    currentHp: 50,
    maxHp: 50,
    level: 1,
    xpReward: 25,
    combatStats: {
      attackPower: 10,
      spellPower: 5,
      defense: 5,
      fireResist: 5,
      iceResist: 5,
      lightningResist: 5,
      poisonResist: 5,
      hitChance: 0.9,
      dodgeChance: 0.05,
      critChance: 0.05,
      critDamage: 1.5,
      attackSpeed: 2500,
    },
    behavior: 'aggressive',
    aggroRange: 3,
    leashRange: 10,
    ...overrides,
  };
}

// Helper to create a mock player
function createPlayer(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: 'player-1',
    name: 'Hero',
    currentHp: 100,
    maxHp: 100,
    combatStats: {
      attackPower: 20,
      spellPower: 10,
      defense: 10,
      fireResist: 10,
      iceResist: 10,
      lightningResist: 10,
      poisonResist: 10,
      hitChance: 0.95,
      dodgeChance: 0.05,
      critChance: 0.1,
      critDamage: 1.5,
      attackSpeed: 2000,
    },
    ...overrides,
  };
}

// Helper to create tick context
function createTickContext(deltaMs = 100): TickContext {
  return {
    tickNumber: 1,
    deltaMs,
    timestamp: Date.now(),
  };
}

describe('createEnemyAI', () => {
  describe('idle behavior', () => {
    it('should remain idle when no targets in range', () => {
      const enemy = createEnemy();
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'idle',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [],
        resolveTarget: () => null,
      });

      const result = ai.tick(createTickContext());

      expect(result.events).toHaveLength(0);
      expect(state.state).toBe('idle');
    });

    it('should aggro on aggressive enemies when player enters range', () => {
      const enemy = createEnemy({ behavior: 'aggressive' });
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'idle',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: (id) => (id === player.id ? player : null),
      });

      ai.tick(createTickContext());

      expect(state.state).toBe('combat');
      expect(state.currentTarget).toBe(player);
      expect(state.aggroList.has(player.id)).toBe(true);
    });

    it('should not aggro on passive enemies', () => {
      const enemy = createEnemy({ behavior: 'passive' });
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'idle',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: () => null,
      });

      ai.tick(createTickContext());

      expect(state.state).toBe('idle');
      expect(state.currentTarget).toBeNull();
    });
  });

  describe('combat behavior', () => {
    it('should attack target when in combat and off cooldown', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const enemy = createEnemy();
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: player,
        aggroList: new Map([[player.id, 100]]),
        attackCooldown: 0,
        state: 'combat',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: (id) => (id === player.id ? player : null),
      });

      const result = ai.tick(createTickContext());

      expect(result.events).toHaveLength(1);
      expect(result.events![0]!.sourceId).toBe(enemy.id);
      expect(result.events![0]!.targetId).toBe(player.id);

      vi.restoreAllMocks();
    });

    it('should not attack while on cooldown', () => {
      const enemy = createEnemy();
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: player,
        aggroList: new Map([[player.id, 100]]),
        attackCooldown: 1000,
        state: 'combat',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: (id) => (id === player.id ? player : null),
      });

      const result = ai.tick(createTickContext());

      expect(result.events).toHaveLength(0);
      expect(state.attackCooldown).toBe(900); // Reduced by deltaMs
    });

    it('should reset cooldown after attacking', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const enemy = createEnemy({ combatStats: { ...createEnemy().combatStats, attackSpeed: 2500 } });
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: player,
        aggroList: new Map([[player.id, 100]]),
        attackCooldown: 0,
        state: 'combat',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: (id) => (id === player.id ? player : null),
      });

      ai.tick(createTickContext());

      expect(state.attackCooldown).toBe(2500);

      vi.restoreAllMocks();
    });
  });

  describe('aggro management', () => {
    it('should increase aggro when attacked', () => {
      const enemy = createEnemy();
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'idle',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: (id) => (id === player.id ? player : null),
      });

      ai.onDamageTaken(player.id, 20);

      expect(state.aggroList.get(player.id)).toBe(20);
      expect(state.state).toBe('combat');
      expect(state.currentTarget).toBe(player);
    });

    it('should switch targets based on highest aggro', () => {
      const enemy = createEnemy();
      const player1 = createPlayer({ id: 'player-1', name: 'Hero1' });
      const player2 = createPlayer({ id: 'player-2', name: 'Hero2' });
      const state: EnemyAIState = {
        enemy,
        currentTarget: player1,
        aggroList: new Map([
          [player1.id, 50],
          [player2.id, 100],
        ]),
        attackCooldown: 0,
        state: 'combat',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player1, player2],
        resolveTarget: (id) => {
          if (id === player1.id) return player1;
          if (id === player2.id) return player2;
          return null;
        },
      });

      ai.updateTarget();

      expect(state.currentTarget).toBe(player2);
    });

    it('should decay aggro over time when not in combat', () => {
      const enemy = createEnemy();
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map([[player.id, 100]]),
        attackCooldown: 0,
        state: 'evading', // Running back home
        homePosition: 'room-1',
        currentPosition: 'room-2',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [],
        resolveTarget: () => null,
      });

      // Simulate time passing
      ai.tick(createTickContext(1000));

      expect(state.aggroList.get(player.id)).toBeLessThan(100);
    });
  });

  describe('evade/leash behavior', () => {
    it('should enter evade state when target moves out of leash range', () => {
      const enemy = createEnemy({ leashRange: 5 });
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'combat',
        homePosition: 'room-1',
        currentPosition: 'room-6', // Beyond leash range
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [],
        resolveTarget: () => null,
      });

      ai.tick(createTickContext());

      expect(state.state).toBe('evading');
    });

    it('should return to idle and clear aggro after evading', () => {
      const enemy = createEnemy();
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map([[player.id, 100]]),
        attackCooldown: 0,
        state: 'evading',
        homePosition: 'room-1',
        currentPosition: 'room-1', // Back home
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [],
        resolveTarget: () => null,
      });

      ai.tick(createTickContext());

      expect(state.state).toBe('idle');
      expect(state.aggroList.size).toBe(0);
    });
  });

  describe('death handling', () => {
    it('should enter dead state when HP reaches 0', () => {
      const enemy = createEnemy({ currentHp: 0 });
      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'combat',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [],
        resolveTarget: () => null,
      });

      const result = ai.tick(createTickContext());

      expect(state.state).toBe('dead');
      expect(result.events).toContainEqual(
        expect.objectContaining({
          eventType: 'death',
          sourceId: enemy.id,
        })
      );
    });

    it('should not process AI when dead', () => {
      const enemy = createEnemy({ currentHp: 0 });
      const player = createPlayer();
      const state: EnemyAIState = {
        enemy,
        currentTarget: player,
        aggroList: new Map([[player.id, 100]]),
        attackCooldown: 0,
        state: 'dead',
        homePosition: 'room-1',
        currentPosition: 'room-1',
      };

      const ai = createEnemyAI(state, {
        getEntitiesInRange: () => [player],
        resolveTarget: (id) => (id === player.id ? player : null),
      });

      const result = ai.tick(createTickContext());

      expect(result.events).toHaveLength(0);
    });
  });
});
