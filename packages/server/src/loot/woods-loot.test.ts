/**
 * Tests for Whispering Woods loot: boss fragments, epic uniques, and the
 * Dryad's Heart Key assembly at the Sanctum altar.
 */

import { describe, it, expect } from 'vitest';
import { createRng } from '@solo-mud/shared';
import { generateCreatureLoot } from './creature-loot';
import { WOODS_LOOT_TABLES } from './woods-loot';
import { generateWorld } from '../world/generate';
import { sessionManager } from '../game/session';
import { executeCommand } from '../commands/handlers';

const BOSS_FRAGMENTS: Record<string, string> = {
  sprite_trickster: 'fragment_innocence',
  redcap_chieftain: 'fragment_fury',
  satyr_shaman: 'fragment_spirit',
  spider_queen: 'fragment_hunger',
  thornlord: 'fragment_growth',
};

describe('woods loot', () => {
  it('every sub-dungeon boss always drops its key fragment', () => {
    for (const [boss, fragment] of Object.entries(BOSS_FRAGMENTS)) {
      // Multiple seeds — the fragment is an alwaysDrop, never chance
      for (let i = 0; i < 5; i++) {
        const loot = generateCreatureLoot(boss, 15, createRng(`frag-${boss}-${i}`));
        expect(
          loot.some(item => item.baseId === fragment),
          `${boss} should always drop ${fragment} (seed ${i})`
        ).toBe(true);
      }
    }
  });

  it('the Matriarch drops no fragment (she is what they unlock)', () => {
    const loot = generateCreatureLoot('corrupted_dryad_matriarch', 20, createRng('matriarch'));
    expect(loot.some(item => item.tags.includes('fragment'))).toBe(false);
    expect(loot.length).toBeGreaterThan(0); // guaranteed boss drop
  });

  it('boss uniques can drop at epic rarity', () => {
    // Farm the thornlord across seeds until the bow appears
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      const loot = generateCreatureLoot('thornlord', 18, createRng(`farm-${i}`));
      const bow = loot.find(item => item.baseId === 'bramblewood_bow');
      if (bow) {
        expect(bow.rarity).toBe('epic');
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('common woods creatures have loot tables', () => {
    for (const id of ['redcap', 'ettercap', 'twisted_treant', 'mischievous_sprite']) {
      expect(WOODS_LOOT_TABLES[id], `${id} should have a table`).toBeDefined();
    }
  });

  it('woods bosses actually spawn in their lairs', () => {
    const world = generateWorld({ seed: 'boss-spawn-test', nodeCount: 1, extraEdges: 0, lockedEdges: 0 });
    const expectSpawn = (locationId: string, templateId: string) => {
      const creatures = world.locations[locationId]!.creatures.map(id => world.creatures[id]);
      expect(
        creatures.some(c => c?.templateId === templateId),
        `${templateId} should guard ${locationId}`
      ).toBe(true);
    };
    expectSpawn('woods_pixie_court', 'sprite_trickster');
    expectSpawn('woods_fen_mound', 'redcap_chieftain');
    expectSpawn('woods_stones_altar', 'satyr_shaman');
    expectSpawn('woods_spider_lair', 'spider_queen');
    expectSpawn('woods_thorn_den', 'thornlord');
    expectSpawn('woods_sanctum_heart', 'corrupted_dryad_matriarch');
    expectSpawn('woods_sanctum_heart', 'matriarchs_handmaiden');
  });
});

describe('sanctum altar key assembly', () => {
  function makeSessionAtAltar() {
    const { session } = sessionManager.createSession(
      `altar-test-${Math.random().toString(36).slice(2)}`, 'KeyForger', 'warrior'
    );
    session.player.locationId = 'woods_sanctum_altar';
    return session;
  }

  function giveFragments(session: ReturnType<typeof makeSessionAtAltar>, baseIds: string[]) {
    for (const baseId of baseIds) {
      const id = `test_${baseId}_${Math.random().toString(36).slice(2)}`;
      session.world.items[id] = {
        id, baseId, name: baseId, tags: ['quest', 'fragment', 'key'], rarity: 'rare', affixes: [],
      };
      session.player.inventory.push({ itemId: id, quantity: 1 });
    }
  }

  it('the root gate blocks the way south without the key', () => {
    const session = makeSessionAtAltar();
    const result = executeCommand(session, 'south');
    expect(result.output.some(l => l.text.includes('gate of twisted roots'))).toBe(true);
    expect(session.player.locationId).toBe('woods_sanctum_altar');
  });

  it('the altar reports missing fragments', () => {
    const session = makeSessionAtAltar();
    giveFragments(session, ['fragment_innocence', 'fragment_fury']);
    const result = executeCommand(session, 'use altar');
    const text = result.output.map(l => l.text).join(' ');
    expect(text).toContain('missing');
    expect(text).toContain('Fragment of Spirit');
    expect(text).not.toContain('forged');
  });

  it('with all five fragments the key is forged, fragments consumed, gate opens', () => {
    const session = makeSessionAtAltar();
    giveFragments(session, Object.values(BOSS_FRAGMENTS));

    const result = executeCommand(session, 'use altar');
    expect(result.output.some(l => l.text.includes('Key is forged'))).toBe(true);

    // Fragments consumed from inventory; the key lands on the keyring
    const inv = session.player.inventory.map(s => session.world.items[s.itemId]?.baseId);
    const keyring = (session.player.keyring ?? []).map(id => session.world.items[id]?.baseId);
    expect(keyring).toContain('dryads_heart_key');
    for (const frag of Object.values(BOSS_FRAGMENTS)) {
      expect(inv).not.toContain(frag);
    }

    // The way south is open now
    executeCommand(session, 'south');
    expect(session.player.locationId).toBe('woods_sanctum_grove');
  });
});
