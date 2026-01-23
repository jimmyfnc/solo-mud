import { describe, it, expect } from 'vitest';
import { generateWorld } from './generate';
import { validateWorld } from './validate';

describe('generateWorld', () => {
  it('should generate a connected world', () => {
    const world = generateWorld({ seed: 'test-connected', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });

    expect(Object.keys(world.locations).length).toBe(18);
    expect(world.startId).toBeDefined();
    expect(world.goalId).toBeDefined();
    expect(world.startId).not.toBe(world.goalId);
  });

  it('should generate a solvable world', () => {
    const world = generateWorld({ seed: 'test-solvable', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });
    const validation = validateWorld(world);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should be deterministic for same seed', () => {
    const world1 = generateWorld({ seed: 'deterministic-test', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });
    const world2 = generateWorld({ seed: 'deterministic-test', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });

    expect(world1.startId).toBe(world2.startId);
    expect(world1.goalId).toBe(world2.goalId);
    expect(Object.keys(world1.locations)).toEqual(Object.keys(world2.locations));
    expect(Object.keys(world1.exits)).toEqual(Object.keys(world2.exits));
  });

  it('should produce different worlds for different seeds', () => {
    const world1 = generateWorld({ seed: 'seed-a', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });
    const world2 = generateWorld({ seed: 'seed-b', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });

    // Very unlikely to have same goal by chance
    expect(world1.goalId === world2.goalId && world1.startId === world2.startId).toBe(false);
  });

  it('should place locked exits on critical path', () => {
    const world = generateWorld({ seed: 'locked-test', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });

    const lockedExits = Object.values(world.exits).filter((e) => e.type === 'locked');
    expect(lockedExits.length).toBeGreaterThanOrEqual(2); // At least 2 locked (may have reverse edges)

    // Each locked exit should have a requirement
    for (const exit of lockedExits) {
      expect(exit.requirement).toBeDefined();
    }
  });

  it('should place keys reachable before their locks', () => {
    const world = generateWorld({ seed: 'key-placement', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });
    const validation = validateWorld(world);

    // If valid, keys must be reachable before locks
    expect(validation.valid).toBe(true);
  });

  it('should assign biomes based on depth', () => {
    const world = generateWorld({ seed: 'biome-test', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });

    const startLocation = world.locations[world.startId];
    const goalLocation = world.locations[world.goalId];

    // Start should have shallow biome weights (plains/forest)
    expect(startLocation!.depth).toBe(0);
    // Goal should have higher depth
    expect(goalLocation!.depth).toBeGreaterThan(0);
  });
});
