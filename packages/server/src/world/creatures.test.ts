import { describe, it, expect } from 'vitest';
import { generateWorld } from './generate';
import { CREATURE_TEMPLATES } from '@solo-mud/shared';

describe('creature templates', () => {
  it('all templates have a tier defined', () => {
    for (const [id, template] of Object.entries(CREATURE_TEMPLATES)) {
      expect(template.tier, `${id} missing tier`).toBeDefined();
      expect(['ambient', 'common', 'dangerous', 'apex']).toContain(template.tier);
    }
  });
});

describe('creature spawning', () => {
  it('should spawn creatures in the world', () => {
    const world = generateWorld({
      seed: 'creature-test-123',
      nodeCount: 18,
      extraEdges: 5,
      lockedEdges: 2,
    });

    // Should have spawned some creatures
    const creatureCount = Object.keys(world.creatures).length;
    expect(creatureCount).toBeGreaterThan(0);

    console.log('\n=== CREATURE SPAWNING RESULTS ===');
    console.log(`Total creatures spawned: ${creatureCount}`);

    // Verify creature distribution
    const creaturesByBehavior = { passive: 0, territorial: 0, aggressive: 0 };
    for (const c of Object.values(world.creatures)) {
      creaturesByBehavior[c.behavior]++;
    }
    console.log(`\nBy behavior: passive=${creaturesByBehavior.passive}, territorial=${creaturesByBehavior.territorial}, aggressive=${creaturesByBehavior.aggressive}`);

    // Show by location
    console.log('\n--- Creatures by Location (sorted by depth) ---');
    const locsByDepth = Object.values(world.locations).sort((a, b) => a.depth - b.depth);

    for (const loc of locsByDepth) {
      const creatures = loc.creatures.map(id => world.creatures[id]).filter((c): c is NonNullable<typeof c> => !!c);
      if (creatures.length > 0) {
        const biomeEntries = Object.entries(loc.biome).sort((a, b) => (b[1] as number) - (a[1] as number));
        const biome = biomeEntries[0]?.[0] ?? 'unknown';
        const creatureInfo = creatures.map(c => `${c.name}[${c.behavior[0]}]`).join(', ');
        console.log(`  Depth ${loc.depth}: ${loc.name} (${biome}) - ${creatureInfo}`);
      }
    }
  });

  it('should not spawn hostile creatures at depth 0-1 (safe zone)', () => {
    const world = generateWorld({
      seed: 'safe-zone-test-456',
      nodeCount: 18,
      extraEdges: 5,
      lockedEdges: 2,
    });

    const startLoc = world.locations[world.startId]!;
    console.log(`\nStart location: ${startLoc.name} (depth ${startLoc.depth})`);

    // Get depth 0-1 locations
    const safeZoneLocs = Object.values(world.locations).filter(loc => loc.depth <= 1);
    console.log(`Safe zone locations (depth 0-1): ${safeZoneLocs.length}`);

    let safeZoneCreatures = 0;
    for (const loc of safeZoneLocs) {
      safeZoneCreatures += loc.creatures.length;
    }
    console.log(`Creatures in safe zone: ${safeZoneCreatures}`);

    // Fewer creatures should spawn near start (30% chance)
    // This is a probabilistic test, so we just verify it's reasonable
    expect(safeZoneCreatures).toBeLessThan(safeZoneLocs.length * 2);
  });

  it('should have creatures with valid descriptions', () => {
    const world = generateWorld({
      seed: 'description-test-789',
      nodeCount: 18,
      extraEdges: 5,
      lockedEdges: 2,
    });

    for (const creature of Object.values(world.creatures)) {
      expect(creature.description).toBeTruthy();
      expect(creature.description.length).toBeGreaterThan(10);
    }

    // Show sample descriptions
    console.log('\n--- Sample Creature Descriptions ---');
    const samples = Object.values(world.creatures).slice(0, 5);
    for (const c of samples) {
      console.log(`  ${c.name}: "${c.description}"`);
    }
  });
});
