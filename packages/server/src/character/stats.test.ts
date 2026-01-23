/**
 * Tests for combat stats calculations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCombatStats,
  getEffectiveStats,
  recalculatePlayerStats,
} from './stats';
import { createPlayer } from './player-factory';
import type { Item } from '@solo-mud/shared';

describe('calculateCombatStats', () => {
  it('should calculate attack power from STR', () => {
    const stats = calculateCombatStats({
      str: 14,
      dex: 10,
      con: 12,
      int: 8,
      wis: 8,
    });

    // Attack power = STR * 2
    expect(stats.attackPower).toBe(28);
  });

  it('should calculate spell power from INT', () => {
    const stats = calculateCombatStats({
      str: 8,
      dex: 10,
      con: 8,
      int: 14,
      wis: 12,
    });

    // Spell power = INT * 2
    expect(stats.spellPower).toBe(28);
  });

  it('should calculate defense from CON', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 10,
      con: 14,
      int: 10,
      wis: 10,
    });

    // Defense = CON + 5
    expect(stats.defense).toBe(19);
  });

  it('should calculate magic resist from WIS', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 14,
    });

    // Magic resist = WIS + 5
    expect(stats.magicResist).toBe(19);
  });

  it('should calculate hit chance from DEX', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 14,
      con: 10,
      int: 10,
      wis: 10,
    });

    // Hit chance = 0.9 + DEX * 0.005
    expect(stats.hitChance).toBeCloseTo(0.97, 2);
  });

  it('should calculate dodge chance from DEX', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 14,
      con: 10,
      int: 10,
      wis: 10,
    });

    // Dodge chance = 0.05 + DEX * 0.003
    expect(stats.dodgeChance).toBeCloseTo(0.092, 3);
  });

  it('should calculate crit chance from DEX', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 14,
      con: 10,
      int: 10,
      wis: 10,
    });

    // Crit chance = 0.05 + DEX * 0.002
    expect(stats.critChance).toBeCloseTo(0.078, 3);
  });

  it('should have base crit damage of 1.5x', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
    });

    expect(stats.critDamage).toBe(1.5);
  });

  it('should have base attack speed of 2000ms', () => {
    const stats = calculateCombatStats({
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
    });

    expect(stats.attackSpeed).toBe(2000);
  });
});

describe('getEffectiveStats', () => {
  it('should return base stats when no equipment', () => {
    const player = createPlayer({
      id: 'test',
      name: 'Test',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    const items: Record<string, Item> = {};
    const effective = getEffectiveStats(player, items);

    expect(effective).toEqual(player.baseStats);
  });

  it('should add equipment stat bonuses', () => {
    const player = createPlayer({
      id: 'test',
      name: 'Test',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    // Equip a sword with +5 STR
    player.equipment.weapon = 'sword-1';

    const items: Record<string, Item> = {
      'sword-1': {
        id: 'sword-1',
        baseId: 'iron-sword',
        name: 'Iron Sword of Strength',
        tags: ['weapon', 'sword'],
        rarity: 'uncommon',
        affixes: [
          {
            id: 'str-bonus',
            name: 'of Strength',
            type: 'suffix',
            statMods: { str: 5 },
          },
        ],
      },
    };

    const effective = getEffectiveStats(player, items);

    // Warrior base STR is 14, +5 from sword = 19
    expect(effective.str).toBe(19);
  });

  it('should stack bonuses from multiple equipment pieces', () => {
    const player = createPlayer({
      id: 'test',
      name: 'Test',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    player.equipment.weapon = 'sword-1';
    player.equipment.chest = 'armor-1';

    const items: Record<string, Item> = {
      'sword-1': {
        id: 'sword-1',
        baseId: 'iron-sword',
        name: 'Iron Sword',
        tags: ['weapon'],
        rarity: 'common',
        affixes: [
          {
            id: 'str-bonus',
            name: 'of Strength',
            type: 'suffix',
            statMods: { str: 3 },
          },
        ],
      },
      'armor-1': {
        id: 'armor-1',
        baseId: 'plate-armor',
        name: 'Plate Armor',
        tags: ['armor', 'chest'],
        rarity: 'common',
        affixes: [
          {
            id: 'con-bonus',
            name: 'of the Bear',
            type: 'suffix',
            statMods: { str: 2, con: 5 },
          },
        ],
      },
    };

    const effective = getEffectiveStats(player, items);

    // Warrior base: STR 14, CON 12
    // Sword: +3 STR
    // Armor: +2 STR, +5 CON
    expect(effective.str).toBe(19); // 14 + 3 + 2
    expect(effective.con).toBe(17); // 12 + 5
  });
});

describe('recalculatePlayerStats', () => {
  it('should update player max HP/MP based on current level', () => {
    const player = createPlayer({
      id: 'test',
      name: 'Test',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    const originalHp = player.maxHp;

    // Simulate level up
    player.level = 5;

    const items: Record<string, Item> = {};
    recalculatePlayerStats(player, items);

    // Max HP should increase with level
    expect(player.maxHp).toBeGreaterThan(originalHp);
  });

  it('should update carry weight based on effective STR', () => {
    const player = createPlayer({
      id: 'test',
      name: 'Test',
      className: 'mage',
      startLocationId: 'loc-1',
    });

    const originalCarry = player.maxCarryWeight;

    // Equip STR item
    player.equipment.ring1 = 'ring-1';

    const items: Record<string, Item> = {
      'ring-1': {
        id: 'ring-1',
        baseId: 'gold-ring',
        name: 'Ring of Giants',
        tags: ['ring'],
        rarity: 'rare',
        affixes: [
          {
            id: 'str-major',
            name: 'of Giants',
            type: 'suffix',
            statMods: { str: 10 },
          },
        ],
      },
    };

    recalculatePlayerStats(player, items);

    // Carry weight should increase (10 STR * 5 = +50)
    expect(player.maxCarryWeight).toBe(originalCarry + 50);
  });

  it('should cap current HP/MP at max values', () => {
    const player = createPlayer({
      id: 'test',
      name: 'Test',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    // Set current HP/MP higher than what new max would be
    player.currentHp = 1000;
    player.currentMp = 1000;

    const items: Record<string, Item> = {};
    recalculatePlayerStats(player, items);

    // Current values should be capped at max
    expect(player.currentHp).toBe(player.maxHp);
    expect(player.currentMp).toBe(player.maxMp);
  });
});
