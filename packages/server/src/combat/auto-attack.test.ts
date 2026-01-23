/**
 * Tests for auto-attack mechanics.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createAutoAttackHandler,
  calculateDamage,
  rollAttack,
  type AutoAttackState,
  type CombatEntity,
} from './auto-attack';
import type { TickContext } from './tick';

// Helper to create a mock combat entity
function createEntity(overrides: Partial<CombatEntity> = {}): CombatEntity {
  return {
    id: 'entity-1',
    name: 'Test Entity',
    currentHp: 100,
    maxHp: 100,
    combatStats: {
      attackPower: 20,
      spellPower: 10,
      defense: 10,
      magicResist: 10,
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
function createTickContext(overrides: Partial<TickContext> = {}): TickContext {
  return {
    tickNumber: 1,
    deltaMs: 100,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('rollAttack', () => {
  it('should return hit when roll succeeds', () => {
    // Force hit with random returning low value
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, hitChance: 0.95 } });
    const defender = createEntity({ combatStats: { ...createEntity().combatStats, dodgeChance: 0.05 } });

    const result = rollAttack(attacker, defender);
    expect(result.type).toBe('hit');

    vi.restoreAllMocks();
  });

  it('should return miss when hit roll fails', () => {
    // Force miss with random returning high value
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, hitChance: 0.5 } });
    const defender = createEntity();

    const result = rollAttack(attacker, defender);
    expect(result.type).toBe('miss');

    vi.restoreAllMocks();
  });

  it('should return dodge when dodge roll succeeds', () => {
    // First roll hits, second roll dodges
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1) // Hit roll succeeds
      .mockReturnValueOnce(0.01); // Dodge roll succeeds (< 0.05)

    const attacker = createEntity();
    const defender = createEntity({ combatStats: { ...createEntity().combatStats, dodgeChance: 0.05 } });

    const result = rollAttack(attacker, defender);
    expect(result.type).toBe('dodge');

    vi.restoreAllMocks();
  });

  it('should return crit when crit roll succeeds', () => {
    // Hit, no dodge, crit
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1) // Hit
      .mockReturnValueOnce(0.99) // No dodge
      .mockReturnValueOnce(0.05); // Crit (< 0.1)

    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, critChance: 0.1 } });
    const defender = createEntity();

    const result = rollAttack(attacker, defender);
    expect(result.type).toBe('crit');

    vi.restoreAllMocks();
  });
});

describe('calculateDamage', () => {
  it('should calculate base damage from attack power', () => {
    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, attackPower: 20 } });
    const defender = createEntity({ combatStats: { ...createEntity().combatStats, defense: 10 } });

    const damage = calculateDamage(attacker, defender, false);

    // Base damage = attackPower, reduced by defense
    // Formula: max(1, attackPower - defense/2) with some variance
    expect(damage).toBeGreaterThanOrEqual(1);
    expect(damage).toBeLessThanOrEqual(25);
  });

  it('should apply crit multiplier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Consistent variance

    const attacker = createEntity({
      combatStats: { ...createEntity().combatStats, attackPower: 20, critDamage: 2.0 },
    });
    const defender = createEntity({ combatStats: { ...createEntity().combatStats, defense: 0 } });

    const normalDamage = calculateDamage(attacker, defender, false);
    const critDamage = calculateDamage(attacker, defender, true);

    expect(critDamage).toBeGreaterThan(normalDamage);

    vi.restoreAllMocks();
  });

  it('should have minimum damage of 1', () => {
    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, attackPower: 1 } });
    const defender = createEntity({ combatStats: { ...createEntity().combatStats, defense: 100 } });

    const damage = calculateDamage(attacker, defender, false);
    expect(damage).toBeGreaterThanOrEqual(1);
  });
});

describe('createAutoAttackHandler', () => {
  it('should not attack if attacker has no target', () => {
    const attacker = createEntity();
    const state: AutoAttackState = {
      attacker,
      target: null,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => null);
    const result = handler(createTickContext());

    expect(result.events).toHaveLength(0);
  });

  it('should not attack if auto-attack is disabled', () => {
    const attacker = createEntity();
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: false,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => target);
    const result = handler(createTickContext());

    expect(result.events).toHaveLength(0);
  });

  it('should not attack while on cooldown', () => {
    const attacker = createEntity();
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 1000, // 1 second remaining
    };

    const handler = createAutoAttackHandler(state, () => target);
    const result = handler(createTickContext({ deltaMs: 100 }));

    expect(result.events).toHaveLength(0);
    expect(state.attackCooldown).toBe(900); // Reduced by deltaMs
  });

  it('should attack when cooldown expires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Ensure hit

    const attacker = createEntity();
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => target);
    const result = handler(createTickContext());

    expect(result.events).toHaveLength(1);
    expect(result.events![0]!.sourceId).toBe(attacker.id);
    expect(result.events![0]!.targetId).toBe(target.id);

    vi.restoreAllMocks();
  });

  it('should reset cooldown after attacking', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, attackSpeed: 2000 } });
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => target);
    handler(createTickContext());

    expect(state.attackCooldown).toBe(2000);

    vi.restoreAllMocks();
  });

  it('should generate hit event on successful attack', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1) // Hit
      .mockReturnValueOnce(0.99) // No dodge
      .mockReturnValueOnce(0.99) // No crit
      .mockReturnValueOnce(0.5); // Damage variance

    const attacker = createEntity();
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => target);
    const result = handler(createTickContext());

    expect(result.events![0]!.eventType).toBe('attack');
    expect(result.events![0]!.value).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('should generate miss event on missed attack', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // Miss

    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, hitChance: 0.5 } });
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => target);
    const result = handler(createTickContext());

    expect(result.events![0]!.eventType).toBe('miss');

    vi.restoreAllMocks();
  });

  it('should generate crit event on critical hit', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1) // Hit
      .mockReturnValueOnce(0.99) // No dodge
      .mockReturnValueOnce(0.01) // Crit
      .mockReturnValueOnce(0.5); // Damage variance

    const attacker = createEntity({ combatStats: { ...createEntity().combatStats, critChance: 0.1 } });
    const target = createEntity({ id: 'target-1', name: 'Target' });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => target);
    const result = handler(createTickContext());

    expect(result.events![0]!.eventType).toBe('crit');

    vi.restoreAllMocks();
  });

  it('should clear target if target is dead', () => {
    const attacker = createEntity();
    const target = createEntity({ id: 'target-1', name: 'Target', currentHp: 0 });
    const state: AutoAttackState = {
      attacker,
      target,
      autoAttackEnabled: true,
      attackCooldown: 0,
    };

    const handler = createAutoAttackHandler(state, () => null); // Target resolver returns null (dead)
    const result = handler(createTickContext());

    expect(result.events).toHaveLength(0);
    expect(state.target).toBeNull();
  });
});
