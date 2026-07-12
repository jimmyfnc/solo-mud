/**
 * Tests for item proc effects and boss respawn behavior.
 */

import { describe, it, expect } from 'vitest';
import type { Creature, Item, Player, World } from '@solo-mud/shared';
import { BOSS_RESPAWN_MS, BOSS_RESPAWN_JITTER, TIER_CONFIG } from '@solo-mud/shared';
import { applyOnHitEffects, applyOnKillEffects, getHealingBoost } from './item-effects';
import { queueRespawn } from '../game/ecosystem';

function makeWorldWithWeapon(effects: Item['effects']): { world: World; player: Player; creature: Creature } {
  const weapon: Item = {
    id: 'test_weapon', baseId: 'test_weapon', name: 'Test Weapon',
    tags: ['weapon'], rarity: 'epic', affixes: [], effects,
  };
  const world = { items: { test_weapon: weapon } } as unknown as World;
  const player = {
    id: 'p1', level: 10, maxHp: 100, currentHp: 50,
    equipment: { weapon: 'test_weapon' },
  } as unknown as Player;
  const creature = {
    id: 'c1', templateId: 'wolf', name: 'Wolf', level: 5,
    currentHp: 40, maxHp: 40,
  } as unknown as Creature;
  return { world, player, creature };
}

describe('item proc effects', () => {
  it('on_kill heal_self restores a percentage of max HP', () => {
    const { world, player } = makeWorldWithWeapon([
      { trigger: 'on_kill', kind: 'heal_self', amount: 15, text: 'The axe drinks deep.' },
    ]);
    const output = applyOnKillEffects(player, world, () => 0);
    expect(player.currentHp).toBe(65); // +15% of 100
    expect(output.some(l => l.text.includes('drinks deep'))).toBe(true);
  });

  it('heal_self never exceeds max HP', () => {
    const { world, player } = makeWorldWithWeapon([
      { trigger: 'on_kill', kind: 'heal_self', amount: 50 },
    ]);
    player.currentHp = 95;
    applyOnKillEffects(player, world, () => 0);
    expect(player.currentHp).toBe(100);
  });

  it('on_hit bonus_damage deals extra damage to the creature', () => {
    const { world, player, creature } = makeWorldWithWeapon([
      { trigger: 'on_hit', kind: 'bonus_damage', chance: 1, amount: 50, text: 'It flickers!' },
    ]);
    const result = applyOnHitEffects(player, world, creature, 20, false, () => 0);
    expect(result.bonusDamage).toBe(10); // 50% of the 20-damage hit
    expect(creature.currentHp).toBe(30);
  });

  it('on_hit root_target roots the creature (root kind, no DOT)', () => {
    const { world, player, creature } = makeWorldWithWeapon([
      { trigger: 'on_hit', kind: 'root_target', chance: 1, duration: 4, text: 'Roots burst!' },
    ]);
    applyOnHitEffects(player, world, creature, 10, false, () => 0);
    expect(creature.trapped).toBeDefined();
    expect(creature.trapped!.kind).toBe('root');
    expect(creature.trapped!.dotDamage).toBe(0);
    expect(creature.trapped!.expiresAt).toBeGreaterThan(Date.now());
  });

  it('respects proc chance (roll above chance = no proc)', () => {
    const { world, player, creature } = makeWorldWithWeapon([
      { trigger: 'on_hit', kind: 'bonus_damage', chance: 0.25, amount: 50 },
    ]);
    const result = applyOnHitEffects(player, world, creature, 20, false, () => 0.9);
    expect(result.bonusDamage).toBe(0);
    expect(creature.currentHp).toBe(40);
  });

  it('passive healing_boost multiplies healing', () => {
    const { world, player } = makeWorldWithWeapon([
      { trigger: 'passive', kind: 'healing_boost', amount: 25 },
    ]);
    expect(getHealingBoost(player, world)).toBe(1.25);
  });
});

describe('boss respawns', () => {
  function makeCreature(isBoss: boolean): Creature {
    return {
      id: 'b1', templateId: 'thornlord', name: 'Thornlord', level: 18,
      behavior: 'aggressive', mobility: 'static',
      currentHp: 0, maxHp: 200,
      locationId: 'woods_thorn_den', homeLocationId: 'woods_thorn_den',
      spawnLocationId: 'woods_thorn_den',
      inCombat: false, description: '',
      isBossAnchor: isBoss,
    };
  }

  it('boss anchors respawn on the slow boss clock with jitter', () => {
    const entry = queueRespawn(makeCreature(true), 'dangerous');
    const delay = entry.respawnAt - Date.now();
    expect(delay).toBeGreaterThanOrEqual(BOSS_RESPAWN_MS * (1 - BOSS_RESPAWN_JITTER) - 50);
    expect(delay).toBeLessThanOrEqual(BOSS_RESPAWN_MS * (1 + BOSS_RESPAWN_JITTER) + 50);
    // Identity survives the respawn
    expect(entry.name).toBe('Thornlord');
    expect(entry.mobility).toBe('static');
    expect(entry.isBossAnchor).toBe(true);
  });

  it('regular creatures keep the fast tier clock', () => {
    const entry = queueRespawn(makeCreature(false), 'dangerous');
    const delay = entry.respawnAt - Date.now();
    expect(delay).toBeLessThanOrEqual(TIER_CONFIG.dangerous.respawnMs + 50);
    expect(entry.isBossAnchor).toBeUndefined();
  });
});
