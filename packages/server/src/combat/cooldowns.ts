/**
 * GCD and ability cooldown management.
 */

/** Definition of an ability's cooldown properties */
export interface AbilityDefinition {
  id: string;
  name: string;
  /** Cooldown duration in milliseconds */
  cooldownMs: number;
  /** GCD duration in milliseconds (0 = off-GCD ability) */
  gcdMs: number;
}

/** Result of attempting to use an ability */
export interface UseAbilityResult {
  success: boolean;
  reason?: 'gcd' | 'cooldown';
  remaining?: number;
}

/** Cooldown manager interface */
export interface CooldownManager {
  /** Get remaining GCD time in ms */
  getGcdRemaining(): number;
  /** Check if on GCD */
  isOnGcd(): boolean;
  /** Trigger GCD */
  triggerGcd(durationMs: number): void;

  /** Get remaining cooldown for an ability */
  getAbilityCooldown(abilityId: string): number;
  /** Check if ability is on cooldown */
  isAbilityOnCooldown(abilityId: string): boolean;
  /** Put ability on cooldown */
  triggerAbilityCooldown(abilityId: string, durationMs: number): void;

  /** Check if an ability can be used */
  canUseAbility(ability: AbilityDefinition): boolean;
  /** Attempt to use an ability */
  useAbility(ability: AbilityDefinition): UseAbilityResult;

  /** Get all active ability cooldowns */
  getAllCooldowns(): Record<string, number>;

  /** Process time passing (reduce cooldowns) */
  tick(deltaMs: number): void;
  /** Reset all cooldowns */
  reset(): void;
}

/**
 * Create a cooldown manager instance.
 */
export function createCooldownManager(): CooldownManager {
  let gcdRemaining = 0;
  const abilityCooldowns = new Map<string, number>();

  return {
    getGcdRemaining(): number {
      return gcdRemaining;
    },

    isOnGcd(): boolean {
      return gcdRemaining > 0;
    },

    triggerGcd(durationMs: number): void {
      gcdRemaining = durationMs;
    },

    getAbilityCooldown(abilityId: string): number {
      return abilityCooldowns.get(abilityId) ?? 0;
    },

    isAbilityOnCooldown(abilityId: string): boolean {
      return (abilityCooldowns.get(abilityId) ?? 0) > 0;
    },

    triggerAbilityCooldown(abilityId: string, durationMs: number): void {
      abilityCooldowns.set(abilityId, durationMs);
    },

    canUseAbility(ability: AbilityDefinition): boolean {
      // Check if ability is on its individual cooldown
      if (this.isAbilityOnCooldown(ability.id)) {
        return false;
      }

      // Check GCD (if ability is affected by GCD)
      if (ability.gcdMs > 0 && this.isOnGcd()) {
        return false;
      }

      return true;
    },

    useAbility(ability: AbilityDefinition): UseAbilityResult {
      // Check ability cooldown first
      if (this.isAbilityOnCooldown(ability.id)) {
        return {
          success: false,
          reason: 'cooldown',
          remaining: this.getAbilityCooldown(ability.id),
        };
      }

      // Check GCD (if ability is affected by GCD)
      if (ability.gcdMs > 0 && this.isOnGcd()) {
        return {
          success: false,
          reason: 'gcd',
          remaining: this.getGcdRemaining(),
        };
      }

      // Use the ability
      this.triggerAbilityCooldown(ability.id, ability.cooldownMs);

      // Trigger GCD if ability has one
      if (ability.gcdMs > 0) {
        this.triggerGcd(ability.gcdMs);
      }

      return { success: true };
    },

    getAllCooldowns(): Record<string, number> {
      const result: Record<string, number> = {};
      for (const [id, remaining] of abilityCooldowns) {
        if (remaining > 0) {
          result[id] = remaining;
        }
      }
      return result;
    },

    tick(deltaMs: number): void {
      // Reduce GCD
      if (gcdRemaining > 0) {
        gcdRemaining = Math.max(0, gcdRemaining - deltaMs);
      }

      // Reduce ability cooldowns
      for (const [id, remaining] of abilityCooldowns) {
        const newRemaining = Math.max(0, remaining - deltaMs);
        if (newRemaining > 0) {
          abilityCooldowns.set(id, newRemaining);
        } else {
          abilityCooldowns.delete(id);
        }
      }
    },

    reset(): void {
      gcdRemaining = 0;
      abilityCooldowns.clear();
    },
  };
}
