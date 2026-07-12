/**
 * Balance regression tests — simulated fights must stay inside playable
 * bands. If a content or formula change breaks pacing, this fails before
 * players feel it.
 *
 * Baselines are conservative (no spells, no procs, no buffs), so real play
 * is easier than these numbers.
 */

import { describe, it, expect } from 'vitest';
import { simulateFight, describeSim } from './combat-sim';

describe('combat balance bands', () => {
  it('early game: at-level trash is comfortably beatable', () => {
    const rat = simulateFight({ playerLevel: 1, className: 'warrior', weaponBaseId: 'rusty_sword', creatureTemplateId: 'sewer_rat', creatureLevel: 1 });
    const wolf = simulateFight({ playerLevel: 3, className: 'warrior', weaponBaseId: 'rusty_sword', creatureTemplateId: 'wolf', creatureLevel: 3 });
    console.log(describeSim('L1 vs sewer_rat', rat));
    console.log(describeSim('L3 vs wolf', wolf));

    expect(rat.winRate).toBeGreaterThanOrEqual(0.95);
    expect(wolf.winRate).toBeGreaterThanOrEqual(0.9);
    expect(rat.avgTicksToKill).toBeLessThanOrEqual(8);
  });

  it('early bosses: hard but beatable with potions', () => {
    const kingRat = simulateFight({
      playerLevel: 6, className: 'warrior', weaponBaseId: 'iron_sword',
      creatureTemplateId: 'king_rat', creatureLevel: 6, bonusDefense: 6, potions: 2,
    });
    console.log(describeSim('L6 vs king_rat', kingRat));
    expect(kingRat.winRate).toBeGreaterThanOrEqual(0.8);
  });

  it('mid game: Western Reaches bosses are beatable with basic gear', () => {
    const troll = simulateFight({
      playerLevel: 9, className: 'warrior', weaponBaseId: 'iron_sword',
      creatureTemplateId: 'troll', creatureLevel: 9, bonusDefense: 8,
    });
    console.log(describeSim('L9 vs Elder Troll', troll));
    expect(troll.winRate).toBeGreaterThanOrEqual(0.8);
  });

  it('woods: at-level mobs stay fair through the level range', () => {
    const redcap = simulateFight({
      playerLevel: 10, className: 'warrior', weaponBaseId: 'iron_sword',
      creatureTemplateId: 'redcap', creatureLevel: 10, bonusDefense: 10,
    });
    const ettercap = simulateFight({
      playerLevel: 15, className: 'warrior', weaponBaseId: 'bloodcap_cleaver',
      creatureTemplateId: 'ettercap', creatureLevel: 15, bonusDefense: 15,
    });
    console.log(describeSim('L10 vs redcap', redcap));
    console.log(describeSim('L15 vs ettercap', ettercap));

    expect(redcap.winRate).toBeGreaterThanOrEqual(0.9);
    expect(ettercap.winRate).toBeGreaterThanOrEqual(0.9);
  });

  it('endgame: Thornlord demands potions, rewards preparation', () => {
    const unprepared = simulateFight({
      playerLevel: 18, className: 'warrior', weaponBaseId: 'bloodcap_cleaver',
      creatureTemplateId: 'thornlord', creatureLevel: 18, bonusDefense: 18,
    });
    const prepared = simulateFight({
      playerLevel: 18, className: 'warrior', weaponBaseId: 'bloodcap_cleaver',
      creatureTemplateId: 'thornlord', creatureLevel: 18, bonusDefense: 18, potions: 5,
    });
    console.log(describeSim('L18 vs Thornlord (no potions)', unprepared));
    console.log(describeSim('L18 vs Thornlord (5 potions)', prepared));

    // Unprepared should be risky (not a free win); prepared should usually win
    expect(unprepared.winRate).toBeLessThanOrEqual(0.75);
    expect(prepared.winRate).toBeGreaterThanOrEqual(0.6);
    expect(prepared.winRate).toBeGreaterThan(unprepared.winRate);
  });

  it('capstone: the Matriarch punishes the unprepared, falls to resist gear', () => {
    const potionsOnly = simulateFight({
      playerLevel: 20, className: 'warrior', weaponBaseId: 'bloodcap_cleaver',
      creatureTemplateId: 'corrupted_dryad_matriarch', creatureLevel: 20,
      bonusDefense: 20, potions: 5,
    });
    const fullPrep = simulateFight({
      playerLevel: 20, className: 'warrior', weaponBaseId: 'bloodcap_cleaver',
      creatureTemplateId: 'corrupted_dryad_matriarch', creatureLevel: 20,
      bonusDefense: 20, bonusResist: 30, potions: 5,
    });
    console.log(describeSim('L20 vs Matriarch (potions only)', potionsOnly));
    console.log(describeSim('L20 vs Matriarch (+resist gear)', fullPrep));

    expect(potionsOnly.winRate).toBeGreaterThanOrEqual(0.4);
    expect(fullPrep.winRate).toBeGreaterThanOrEqual(0.85);
    // Resist gear must matter for her nature damage
    expect(fullPrep.winRate).toBeGreaterThan(potionsOnly.winRate);
  });

  it('gray mobs stay trivial (sanity floor)', () => {
    const gray = simulateFight({
      playerLevel: 15, className: 'warrior', weaponBaseId: 'bloodcap_cleaver',
      creatureTemplateId: 'sewer_rat', creatureLevel: 1, bonusDefense: 15,
    });
    expect(gray.winRate).toBe(1);
    expect(gray.avgTicksToKill).toBeLessThanOrEqual(2);
  });
});
