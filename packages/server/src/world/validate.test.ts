import { describe, it, expect } from 'vitest';
import type { World, Location, Exit, Item } from '@solo-mud/shared';
import { simulateReachability, validateWorld } from './validate';

describe('simulateReachability', () => {
  it('should reach all open locations from start', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      { from: 'a', to: 'b', type: 'open' },
      { from: 'b', to: 'goal', type: 'open' },
    ]);

    const result = simulateReachability(world);

    expect(result.reachable.has('start')).toBe(true);
    expect(result.reachable.has('a')).toBe(true);
    expect(result.reachable.has('b')).toBe(true);
    expect(result.reachable.has('goal')).toBe(true);
  });

  it('should not reach locked locations without key', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
    ]);

    const result = simulateReachability(world);

    expect(result.reachable.has('start')).toBe(true);
    expect(result.reachable.has('a')).toBe(true);
    expect(result.reachable.has('goal')).toBe(false);
  });

  it('should reach locked locations when key is available', () => {
    const world = createTestWorld(
      [
        { from: 'start', to: 'a', type: 'open' },
        { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
      ],
      { a: ['key_iron'] } // Key is in location 'a'
    );

    const result = simulateReachability(world);

    expect(result.reachable.has('goal')).toBe(true);
    expect(result.inventory.has('key_iron')).toBe(true);
  });

  it('should collect items as locations become reachable', () => {
    const world = createTestWorld(
      [
        { from: 'start', to: 'a', type: 'open' },
        { from: 'a', to: 'b', type: 'locked', requirement: { kind: 'item', value: 'key_1' } },
        { from: 'b', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_2' } },
      ],
      {
        start: ['key_1'],
        b: ['key_2'],
      }
    );

    const result = simulateReachability(world);

    expect(result.reachable.has('goal')).toBe(true);
    expect(result.inventory.has('key_1')).toBe(true);
    expect(result.inventory.has('key_2')).toBe(true);
  });
});

describe('validateWorld', () => {
  it('should pass for valid solvable world', () => {
    const world = createTestWorld(
      [
        { from: 'start', to: 'a', type: 'open' },
        { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
        { from: 'start', to: 'side', type: 'open' },
      ],
      { side: ['key_iron'] }
    );

    const result = validateWorld(world);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when goal is unreachable', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
      // No key_iron anywhere
    ]);

    const result = validateWorld(world);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('unreachable'))).toBe(true);
  });

  it('should fail when graph is disconnected', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      // 'goal' has no connections
    ]);
    // Manually add disconnected goal
    world.locations['goal'] = createLocation('goal');

    const result = validateWorld(world);

    expect(result.valid).toBe(false);
  });
});

// ============ Test Helpers ============

interface TestEdge {
  from: string;
  to: string;
  type: 'open' | 'locked';
  requirement?: { kind: 'item'; value: string };
}

function createTestWorld(
  edges: TestEdge[],
  itemPlacements: Record<string, string[]> = {}
): World {
  const locations: Record<string, Location> = {};
  const exits: Record<string, Exit> = {};
  const adjacency: Record<string, string[]> = {};
  const items: Record<string, Item> = {};

  // Create locations
  const locationIds = new Set<string>();
  locationIds.add('start');
  locationIds.add('goal');
  for (const edge of edges) {
    locationIds.add(edge.from);
    locationIds.add(edge.to);
  }

  for (const id of locationIds) {
    locations[id] = createLocation(id);
    adjacency[id] = [];
  }

  // Create exits
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]!;
    const exitId = `exit_${i}`;
    const reverseExitId = `exit_${i}_rev`;

    exits[exitId] = {
      id: exitId,
      from: edge.from,
      to: edge.to,
      label: `to_${edge.to}`,
      type: edge.type,
      requirement: edge.requirement,
    };

    exits[reverseExitId] = {
      id: reverseExitId,
      from: edge.to,
      to: edge.from,
      label: `to_${edge.from}`,
      type: edge.type,
      requirement: edge.requirement,
    };

    adjacency[edge.from]!.push(exitId);
    adjacency[edge.to]!.push(reverseExitId);
  }

  // Place items
  for (const [locationId, itemIds] of Object.entries(itemPlacements)) {
    for (const itemId of itemIds) {
      items[itemId] = {
        id: itemId,
        baseId: itemId,
        name: itemId,
        tags: ['key'],
        rarity: 'common',
        affixes: [],
      };
      locations[locationId]!.items.push(itemId);
    }
  }

  return {
    seed: 'test',
    startId: 'start',
    goalId: 'goal',
    locations,
    exits,
    adjacency,
    items,
    time: { totalMinutes: 0, timeOfDay: 'morning', day: 1 },
    weather: { type: 'clear', intensity: 0 },
  };
}

function createLocation(id: string): Location {
  return {
    id,
    name: id,
    biome: { plains: 1 },
    props: [],
    items: [],
    enemies: [],
    visitState: { visitCount: 0 },
    depth: 0,
  };
}
