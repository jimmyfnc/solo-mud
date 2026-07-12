/**
 * Tests for GCD and ability cooldown system.
 */

import { describe, it, expect } from 'vitest';
import {
  createCooldownManager,
  type AbilityDefinition,
} from './cooldowns';

// Sample abilities for testing
const sampleAbilities: Record<string, AbilityDefinition> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    cooldownMs: 5000,
    gcdMs: 1500,
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    cooldownMs: 10000,
    gcdMs: 1500,
  },
  instantCast: {
    id: 'instantCast',
    name: 'Instant Cast',
    cooldownMs: 3000,
    gcdMs: 0, // Off-GCD ability
  },
};

describe('CooldownManager', () => {
  describe('GCD management', () => {
    it('should start with no GCD', () => {
      const manager = createCooldownManager();
      expect(manager.getGcdRemaining()).toBe(0);
      expect(manager.isOnGcd()).toBe(false);
    });

    it('should trigger GCD when ability is used', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);

      expect(manager.isOnGcd()).toBe(true);
      expect(manager.getGcdRemaining()).toBe(1500);
    });

    it('should reduce GCD over time', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);

      manager.tick(500);
      expect(manager.getGcdRemaining()).toBe(1000);

      manager.tick(500);
      expect(manager.getGcdRemaining()).toBe(500);
    });

    it('should clear GCD when time expires', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);

      manager.tick(1500);
      expect(manager.isOnGcd()).toBe(false);
      expect(manager.getGcdRemaining()).toBe(0);
    });

    it('should not go negative on GCD', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1000);

      manager.tick(2000);
      expect(manager.getGcdRemaining()).toBe(0);
    });
  });

  describe('ability cooldowns', () => {
    it('should start with no ability cooldowns', () => {
      const manager = createCooldownManager();
      expect(manager.getAbilityCooldown('fireball')).toBe(0);
      expect(manager.isAbilityOnCooldown('fireball')).toBe(false);
    });

    it('should put ability on cooldown', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);

      expect(manager.isAbilityOnCooldown('fireball')).toBe(true);
      expect(manager.getAbilityCooldown('fireball')).toBe(5000);
    });

    it('should reduce ability cooldowns over time', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);

      manager.tick(2000);
      expect(manager.getAbilityCooldown('fireball')).toBe(3000);
    });

    it('should clear ability cooldown when expired', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);

      manager.tick(5000);
      expect(manager.isAbilityOnCooldown('fireball')).toBe(false);
      expect(manager.getAbilityCooldown('fireball')).toBe(0);
    });

    it('should track multiple ability cooldowns independently', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);
      manager.triggerAbilityCooldown('heal', 10000);

      manager.tick(3000);
      expect(manager.getAbilityCooldown('fireball')).toBe(2000);
      expect(manager.getAbilityCooldown('heal')).toBe(7000);

      manager.tick(3000);
      expect(manager.isAbilityOnCooldown('fireball')).toBe(false);
      expect(manager.isAbilityOnCooldown('heal')).toBe(true);
    });
  });

  describe('canUseAbility', () => {
    it('should allow ability when off GCD and off cooldown', () => {
      const manager = createCooldownManager();
      expect(manager.canUseAbility(sampleAbilities.fireball!)).toBe(true);
    });

    it('should block ability when on GCD', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);

      expect(manager.canUseAbility(sampleAbilities.fireball!)).toBe(false);
    });

    it('should allow off-GCD abilities while on GCD', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);

      expect(manager.canUseAbility(sampleAbilities.instantCast!)).toBe(true);
    });

    it('should block ability when on its cooldown', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);

      expect(manager.canUseAbility(sampleAbilities.fireball!)).toBe(false);
    });

    it('should block ability when on both GCD and cooldown', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);
      manager.triggerAbilityCooldown('fireball', 5000);

      expect(manager.canUseAbility(sampleAbilities.fireball!)).toBe(false);
    });
  });

  describe('useAbility', () => {
    it('should trigger GCD and cooldown when ability is used', () => {
      const manager = createCooldownManager();
      const result = manager.useAbility(sampleAbilities.fireball!);

      expect(result.success).toBe(true);
      expect(manager.isOnGcd()).toBe(true);
      expect(manager.getGcdRemaining()).toBe(1500);
      expect(manager.isAbilityOnCooldown('fireball')).toBe(true);
      expect(manager.getAbilityCooldown('fireball')).toBe(5000);
    });

    it('should not trigger GCD for off-GCD abilities', () => {
      const manager = createCooldownManager();
      const result = manager.useAbility(sampleAbilities.instantCast!);

      expect(result.success).toBe(true);
      expect(manager.isOnGcd()).toBe(false);
      expect(manager.isAbilityOnCooldown('instantCast')).toBe(true);
    });

    it('should fail when ability cannot be used', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);

      const result = manager.useAbility(sampleAbilities.fireball!);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('gcd');
    });

    it('should fail with cooldown reason when ability is on cooldown', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);

      const result = manager.useAbility(sampleAbilities.fireball!);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('cooldown');
      expect(result.remaining).toBe(5000);
    });
  });

  describe('getAllCooldowns', () => {
    it('should return all active cooldowns', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 5000);
      manager.triggerAbilityCooldown('heal', 10000);

      const cooldowns = manager.getAllCooldowns();

      expect(cooldowns).toEqual({
        fireball: 5000,
        heal: 10000,
      });
    });

    it('should not include expired cooldowns', () => {
      const manager = createCooldownManager();
      manager.triggerAbilityCooldown('fireball', 1000);
      manager.triggerAbilityCooldown('heal', 5000);

      manager.tick(2000);
      const cooldowns = manager.getAllCooldowns();

      expect(cooldowns).toEqual({
        heal: 3000,
      });
      expect(cooldowns['fireball']).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all cooldowns and GCD', () => {
      const manager = createCooldownManager();
      manager.triggerGcd(1500);
      manager.triggerAbilityCooldown('fireball', 5000);
      manager.triggerAbilityCooldown('heal', 10000);

      manager.reset();

      expect(manager.isOnGcd()).toBe(false);
      expect(manager.isAbilityOnCooldown('fireball')).toBe(false);
      expect(manager.isAbilityOnCooldown('heal')).toBe(false);
    });
  });
});
