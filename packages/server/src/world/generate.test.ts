import { describe, it, expect } from 'vitest';
import { WILD_LOCATIONS, WILD_ENTRANCE, WILD_WATCHTOWER, WILD_WOLF_DEN } from '@solo-mud/shared';
import { generateWorld } from './generate';
import { validateWorld } from './validate';

const PARAMS = { seed: 'test-world', nodeCount: 18, extraEdges: 5, lockedEdges: 2 };

describe('generateWorld (authored-zone assembly)', () => {
  it('should assemble a fully connected world', () => {
    const world = generateWorld({ ...PARAMS, seed: 'test-connected' });

    // 20 Western Reaches + 12 town + 1 bank + 9 sewer + 48 woods = 90 total
    expect(Object.keys(world.locations).length).toBe(90);
    expect(world.startId).toBe('town_inn');
    expect(world.goalId).toBe(WILD_WATCHTOWER);
    expect(world.startId).not.toBe(world.goalId);
  });

  it('should assemble a solvable world', () => {
    const world = generateWorld({ ...PARAMS, seed: 'test-solvable' });
    const validation = validateWorld(world);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should be deterministic for same seed', () => {
    const world1 = generateWorld({ ...PARAMS, seed: 'deterministic-test' });
    const world2 = generateWorld({ ...PARAMS, seed: 'deterministic-test' });

    expect(Object.keys(world1.locations)).toEqual(Object.keys(world2.locations));
    expect(Object.keys(world1.exits)).toEqual(Object.keys(world2.exits));
    expect(Object.keys(world1.creatures)).toEqual(Object.keys(world2.creatures));
  });

  it('should vary creature spawns by seed (skeleton stays fixed)', () => {
    const world1 = generateWorld({ ...PARAMS, seed: 'seed-a' });
    const world2 = generateWorld({ ...PARAMS, seed: 'seed-b' });

    // The authored skeleton is identical...
    expect(Object.keys(world1.locations)).toEqual(Object.keys(world2.locations));
    // ...but the procedural creature population differs
    expect(Object.keys(world1.creatures)).not.toEqual(Object.keys(world2.creatures));
  });

  it('should keep the sewer key/lock progression intact', () => {
    const world = generateWorld({ ...PARAMS, seed: 'locked-test' });

    const lockedExits = Object.values(world.exits).filter((e) => e.type === 'locked');
    expect(lockedExits.length).toBeGreaterThan(0);
    expect(validateWorld(world).valid).toBe(true); // keys reachable before locks
  });

  it('should ramp wilderness depth westward for difficulty scaling', () => {
    const world = generateWorld({ ...PARAMS, seed: 'depth-test' });

    expect(world.locations[WILD_ENTRANCE]!.depth).toBe(1);
    expect(world.locations[WILD_WATCHTOWER]!.depth).toBeGreaterThanOrEqual(9);
  });

  it('should place boss anchors in their lairs', () => {
    const world = generateWorld({ ...PARAMS, seed: 'boss-test' });

    const denCreatures = world.locations[WILD_WOLF_DEN]!.creatures
      .map((id) => world.creatures[id])
      .filter(Boolean);
    expect(denCreatures.some((c) => c!.name === 'Packleader')).toBe(true);

    const towerCreatures = world.locations[WILD_WATCHTOWER]!.creatures
      .map((id) => world.creatures[id])
      .filter(Boolean);
    expect(towerCreatures.some((c) => c!.name === 'Elder Troll')).toBe(true);
  });

  it('should spawn creatures procedurally in the outdoor zones', () => {
    const world = generateWorld({ ...PARAMS, seed: 'spawn-test' });

    const wildSpawns = Object.values(world.creatures).filter((c) =>
      c.locationId.startsWith('wild_') && !c.id.includes('anchor')
    );
    expect(wildSpawns.length).toBeGreaterThan(0);
  });

  it('should not mutate the authored zone data between generations', () => {
    const before = WILD_LOCATIONS[WILD_WOLF_DEN]!.creatures.length;
    generateWorld({ ...PARAMS, seed: 'mutation-test-1' });
    generateWorld({ ...PARAMS, seed: 'mutation-test-2' });
    expect(WILD_LOCATIONS[WILD_WOLF_DEN]!.creatures.length).toBe(before);
  });
});

describe('town integration', () => {
  it('should include Easthollow town locations', () => {
    const world = generateWorld({ ...PARAMS, seed: 'test-town' });

    expect(world.locations['town_inn']).toBeDefined();
    expect(world.locations['town_square']).toBeDefined();
    expect(world.locations['town_gate']).toBeDefined();
    expect(world.locations['town_inn']!.isSafeZone).toBe(true);
  });

  it('should set startId to town_inn', () => {
    const world = generateWorld({ ...PARAMS, seed: 'test-town-start' });
    expect(world.startId).toBe('town_inn');
  });

  it('should connect Outside Walls west into the Western Reaches', () => {
    const world = generateWorld({ ...PARAMS, seed: 'test-town-gate' });

    const outsideWallsExits = world.adjacency['town_outside_walls'] ?? [];
    const exitToWilderness = outsideWallsExits.find((exitId) => {
      const exit = world.exits[exitId];
      return exit?.to === WILD_ENTRANCE && exit.label === 'west';
    });

    expect(exitToWilderness).toBeDefined();

    // And the return exit leads back east
    const returnExits = world.adjacency[WILD_ENTRANCE] ?? [];
    const exitBack = returnExits.find((exitId) => {
      const exit = world.exits[exitId];
      return exit?.to === 'town_outside_walls' && exit.label === 'east';
    });
    expect(exitBack).toBeDefined();
  });

  it('should include town NPCs', () => {
    const world = generateWorld({ ...PARAMS, seed: 'test-town-npcs' });

    expect(world.npcs['npc_mira']).toBeDefined();
    expect(world.npcs['npc_mira']!.name).toBe('Mira');
  });
});
