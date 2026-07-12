/**
 * Tests for NPC combat AI system.
 */

import { describe, it, expect } from 'vitest';
import { createRng } from '@solo-mud/shared';
import type { NPC, NpcCombatStats, Creature } from '@solo-mud/shared';
import {
  selectNpcAction,
  applyNpcAction,
  tickNpcCooldowns,
  regenNpcMana,
} from './npc-combat';

function createTestCombatStats(overrides: Partial<NpcCombatStats> = {}): NpcCombatStats {
  return {
    level: 30,
    maxHp: 400,
    currentHp: 400,
    maxMp: 100,
    currentMp: 100,
    damage: 45,
    class: 'warrior',
    knownSpells: ['battle_shout', 'heroic_strike', 'shield_bash'],
    abilityCooldowns: {},
    activeBuffs: [],
    aiPriority: 'aggressive',
    ...overrides,
  };
}

function createTestNpc(overrides: Partial<NPC> = {}): NPC {
  return {
    id: 'test_npc',
    name: 'Test Guard',
    title: 'Guard',
    locationId: 'town_gate',
    dialogue: [],
    role: 'guard',
    combat: createTestCombatStats(),
    ...overrides,
  };
}

function createTestCreature(): Creature {
  return {
    id: 'test_creature',
    templateId: 'goblin',
    name: 'Goblin',
    level: 5,
    behavior: 'aggressive',
    mobility: 'roaming',
    currentHp: 50,
    maxHp: 50,
    locationId: 'town_gate',
    homeLocationId: 'wilderness',
    spawnLocationId: 'wilderness',
    inCombat: true,
    description: 'A goblin.',
  };
}

describe('NPC Combat AI', () => {
  describe('selectNpcAction', () => {
    it('should return basic attack when no spells available', () => {
      const npc = createTestNpc({
        combat: createTestCombatStats({
          knownSpells: [],
          currentMp: 0,
        }),
      });

      const action = selectNpcAction({
        npc,
        combat: npc.combat!,
        target: createTestCreature(),
        allies: [],
        rng: createRng('test'),
      });

      expect(action.type).toBe('attack');
      expect(action.damage).toBeGreaterThan(0);
    });

    it('should return none when no target', () => {
      const npc = createTestNpc();

      const action = selectNpcAction({
        npc,
        combat: npc.combat!,
        target: null,
        allies: [],
        rng: createRng('test'),
      });

      expect(action.type).toBe('none');
    });

    it('should select damage spell when available', () => {
      const npc = createTestNpc({
        combat: createTestCombatStats({
          knownSpells: ['heroic_strike'],
          currentMp: 50,
        }),
      });

      // Run multiple times to account for randomness
      let foundSpell = false;
      for (let i = 0; i < 10; i++) {
        const action = selectNpcAction({
          npc,
          combat: npc.combat!,
          target: createTestCreature(),
          allies: [],
          rng: createRng(`test-${i}`),
        });

        if (action.type === 'spell' && action.spellId === 'heroic_strike') {
          foundSpell = true;
          break;
        }
      }

      expect(foundSpell).toBe(true);
    });

    it('should use emergency spell when low HP', () => {
      const npc = createTestNpc({
        combat: createTestCombatStats({
          knownSpells: ['second_wind'],
          currentHp: 50, // 12.5% HP
          maxHp: 400,
          currentMp: 100,
        }),
      });

      const action = selectNpcAction({
        npc,
        combat: npc.combat!,
        target: createTestCreature(),
        allies: [],
        rng: createRng('emergency-test'),
      });

      expect(action.type).toBe('spell');
      expect(action.spellId).toBe('second_wind');
    });

    it('should select buff when no buffs active', () => {
      const npc = createTestNpc({
        combat: createTestCombatStats({
          knownSpells: ['battle_shout'],
          activeBuffs: [],
          currentMp: 50,
        }),
      });

      // Run multiple times - buff has 30% chance to be prioritized
      let foundBuff = false;
      for (let i = 0; i < 20; i++) {
        const action = selectNpcAction({
          npc,
          combat: npc.combat!,
          target: createTestCreature(),
          allies: [],
          rng: createRng(`buff-test-${i}`),
        });

        if (action.type === 'spell' && action.spellId === 'battle_shout') {
          foundBuff = true;
          break;
        }
      }

      expect(foundBuff).toBe(true);
    });

    it('should not cast spell on cooldown', () => {
      const npc = createTestNpc({
        combat: createTestCombatStats({
          knownSpells: ['heroic_strike'],
          abilityCooldowns: { heroic_strike: 5 }, // 5 seconds remaining
          currentMp: 50,
        }),
      });

      // Should fall back to basic attack
      const action = selectNpcAction({
        npc,
        combat: npc.combat!,
        target: createTestCreature(),
        allies: [],
        rng: createRng('cooldown-test'),
      });

      // Heroic strike should not be selected because it's on cooldown
      if (action.type === 'spell') {
        expect(action.spellId).not.toBe('heroic_strike');
      }
    });

    it('should not cast spell without enough mana', () => {
      const npc = createTestNpc({
        combat: createTestCombatStats({
          knownSpells: ['heroic_strike'], // costs 10 mana
          currentMp: 5, // Not enough mana
        }),
      });

      const action = selectNpcAction({
        npc,
        combat: npc.combat!,
        target: createTestCreature(),
        allies: [],
        rng: createRng('mana-test'),
      });

      // Should not be heroic strike
      if (action.type === 'spell') {
        expect(action.spellId).not.toBe('heroic_strike');
      }
    });
  });

  describe('applyNpcAction', () => {
    it('should deduct mana when casting spell', () => {
      const combat = createTestCombatStats({
        currentMp: 50,
      });

      const updated = applyNpcAction(
        combat,
        { type: 'spell', spellId: 'heroic_strike', damage: 25, message: 'Test' },
        1000
      );

      expect(updated.currentMp).toBeLessThan(50);
    });

    it('should set spell cooldown', () => {
      const combat = createTestCombatStats();

      const updated = applyNpcAction(
        combat,
        { type: 'spell', spellId: 'heroic_strike', damage: 25, message: 'Test' },
        1000
      );

      expect(updated.abilityCooldowns['heroic_strike']).toBeGreaterThan(0);
    });

    it('should apply self-healing', () => {
      const combat = createTestCombatStats({
        currentHp: 200,
        maxHp: 400,
      });

      const updated = applyNpcAction(
        combat,
        { type: 'spell', spellId: 'light_heal', healing: 50, message: 'Test' },
        1000
      );

      expect(updated.currentHp).toBe(250);
    });

    it('should not overheal', () => {
      const combat = createTestCombatStats({
        currentHp: 380,
        maxHp: 400,
      });

      const updated = applyNpcAction(
        combat,
        { type: 'spell', spellId: 'light_heal', healing: 50, message: 'Test' },
        1000
      );

      expect(updated.currentHp).toBe(400);
    });

    it('should add buff to active buffs', () => {
      const combat = createTestCombatStats({
        activeBuffs: [],
        knownSpells: ['battle_shout'],
      });

      const updated = applyNpcAction(
        combat,
        { type: 'spell', spellId: 'battle_shout', message: 'Test' },
        1000
      );

      expect(updated.activeBuffs.length).toBe(1);
      expect(updated.activeBuffs[0]!.id).toBe('battle_shout');
    });
  });

  describe('tickNpcCooldowns', () => {
    it('should reduce cooldowns', () => {
      const combat = createTestCombatStats({
        abilityCooldowns: { heroic_strike: 10 },
      });

      const updated = tickNpcCooldowns(combat, 5);

      expect(updated.abilityCooldowns['heroic_strike']).toBe(5);
    });

    it('should remove cooldowns that reach zero', () => {
      const combat = createTestCombatStats({
        abilityCooldowns: { heroic_strike: 5 },
      });

      const updated = tickNpcCooldowns(combat, 10);

      expect(updated.abilityCooldowns['heroic_strike']).toBeUndefined();
    });

    it('should reduce buff durations', () => {
      const combat = createTestCombatStats({
        activeBuffs: [{ id: 'battle_shout', name: 'Battle Shout', duration: 20, stacks: 1, appliedAt: 0 }],
      });

      const updated = tickNpcCooldowns(combat, 5);

      expect(updated.activeBuffs[0]!.duration).toBe(15);
    });

    it('should remove expired buffs', () => {
      const combat = createTestCombatStats({
        activeBuffs: [{ id: 'battle_shout', name: 'Battle Shout', duration: 5, stacks: 1, appliedAt: 0 }],
      });

      const updated = tickNpcCooldowns(combat, 10);

      expect(updated.activeBuffs.length).toBe(0);
    });
  });

  describe('regenNpcMana', () => {
    it('should regenerate mana', () => {
      const combat = createTestCombatStats({
        currentMp: 50,
        maxMp: 100,
      });

      const updated = regenNpcMana(combat, 10);

      expect(updated.currentMp).toBeGreaterThan(50);
    });

    it('should not exceed max mana', () => {
      const combat = createTestCombatStats({
        currentMp: 99,
        maxMp: 100,
      });

      const updated = regenNpcMana(combat, 100);

      expect(updated.currentMp).toBe(100);
    });
  });
});
