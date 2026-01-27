/**
 * Tests for player factory.
 */

import { describe, it, expect } from 'vitest';
import { createPlayer, calculateMaxHp, calculateMaxMp } from './player-factory';
import { CLASSES } from '@solo-mud/shared';

describe('createPlayer', () => {
  it('should create a player with the specified class', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'mage',
      startLocationId: 'loc-1',
    });

    expect(player.id).toBe('test-id');
    expect(player.name).toBe('TestPlayer');
    expect(player.class).toBe('mage');
    expect(player.locationId).toBe('loc-1');
  });

  it('should use class base stats', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    const warriorClass = CLASSES.warrior;
    expect(player.baseStats).toEqual(warriorClass.baseStats);
  });

  it('should calculate initial HP based on class', () => {
    const warrior = createPlayer({
      id: 'w1',
      name: 'Warrior',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    const mage = createPlayer({
      id: 'm1',
      name: 'Mage',
      className: 'mage',
      startLocationId: 'loc-1',
    });

    // Warrior should have more HP than mage (12 hp/level vs 6 hp/level)
    expect(warrior.maxHp).toBeGreaterThan(mage.maxHp);
    expect(warrior.currentHp).toBe(warrior.maxHp);
  });

  it('should calculate initial MP based on class', () => {
    const mage = createPlayer({
      id: 'm1',
      name: 'Mage',
      className: 'mage',
      startLocationId: 'loc-1',
    });

    const warrior = createPlayer({
      id: 'w1',
      name: 'Warrior',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    // Mage should have more MP than warrior (12 mp/level vs 2 mp/level)
    expect(mage.maxMp).toBeGreaterThan(warrior.maxMp);
    expect(mage.currentMp).toBe(mage.maxMp);
  });

  it('should initialize player at level 1', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'rogue',
      startLocationId: 'loc-1',
    });

    expect(player.level).toBe(1);
    expect(player.xp).toBe(0);
    expect(player.xpToNextLevel).toBe(100);
  });

  it('should initialize empty inventory and equipment', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'cleric',
      startLocationId: 'loc-1',
    });

    expect(player.inventory).toEqual([]);
    expect(player.equipment).toEqual({});
    expect(player.inventorySlots).toBe(20);
  });

  it('should bind player to start location', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'ranger',
      startLocationId: 'town-1',
    });

    expect(player.boundTownId).toBe('town-1');
  });

  it('should initialize combat state to non-combat', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    expect(player.inCombat).toBe(false);
    expect(player.autoAttack).toBe(false);
    expect(player.targetId).toBeUndefined();
  });

  it('should initialize with zero currency', () => {
    const player = createPlayer({
      id: 'test-id',
      name: 'TestPlayer',
      className: 'warrior',
      startLocationId: 'loc-1',
    });

    expect(player.currency).toEqual({ copper: 0, silver: 0, gold: 0 });
  });

  it('should calculate max carry weight based on STR', () => {
    const warrior = createPlayer({
      id: 'w1',
      name: 'Warrior',
      className: 'warrior', // STR 14
      startLocationId: 'loc-1',
    });

    const mage = createPlayer({
      id: 'm1',
      name: 'Mage',
      className: 'mage', // STR 8
      startLocationId: 'loc-1',
    });

    // Warrior should have higher carry weight
    expect(warrior.maxCarryWeight).toBeGreaterThan(mage.maxCarryWeight);
  });
});

describe('calculateMaxHp', () => {
  it('should calculate HP based on CON and class hp/level', () => {
    const warriorClass = CLASSES.warrior;
    const level = 1;

    const hp = calculateMaxHp(warriorClass, level);

    // Base HP = CON * 3 + hpPerLevel * level
    // Warrior: 12 * 3 + 12 * 1 = 36 + 12 = 48
    expect(hp).toBe(48);
  });

  it('should scale HP with level', () => {
    const warriorClass = CLASSES.warrior;

    const hp1 = calculateMaxHp(warriorClass, 1);
    const hp10 = calculateMaxHp(warriorClass, 10);

    // HP should increase significantly with level
    expect(hp10).toBeGreaterThan(hp1);
    // Level 10: 36 + 12 * 10 = 156
    expect(hp10).toBe(156);
  });
});

describe('calculateMaxMp', () => {
  it('should calculate MP based on INT/WIS and class mp/level', () => {
    const mageClass = CLASSES.mage;
    const level = 1;

    const mp = calculateMaxMp(mageClass, level);

    // Base MP = max(INT, WIS) * 2 + mpPerLevel * level
    // Mage: max(14, 12) * 2 + 12 * 1 = 28 + 12 = 40
    expect(mp).toBe(40);
  });

  it('should scale MP with level', () => {
    const mageClass = CLASSES.mage;

    const mp1 = calculateMaxMp(mageClass, 1);
    const mp10 = calculateMaxMp(mageClass, 10);

    // MP should increase significantly with level
    expect(mp10).toBeGreaterThan(mp1);
    // Level 10: 28 + 12 * 10 = 148
    expect(mp10).toBe(148);
  });
});

describe('tutorial progress', () => {
  it('should initialize tutorial progress for new player', () => {
    const player = createPlayer({
      id: 'test-player',
      name: 'Tester',
      className: 'warrior',
      startLocationId: 'town_inn',
    });

    expect(player.tutorial).toBeDefined();
    expect(player.tutorial.skipped).toBe(false);
    expect(player.tutorial.complete).toBe(false);
    expect(player.tutorial.completedSteps).toEqual([]);
  });
});
