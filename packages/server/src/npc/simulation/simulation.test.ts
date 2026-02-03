import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationEngine, getZoneType } from './index';
import type { NPC } from '@solo-mud/shared';

describe('getZoneType', () => {
  it('should identify social zones', () => {
    expect(getZoneType('town_inn')).toBe('social');
    expect(getZoneType('town_square')).toBe('social');
    expect(getZoneType('town_market')).toBe('social');
  });

  it('should identify quiet zones', () => {
    expect(getZoneType('town_temple')).toBe('quiet');
    expect(getZoneType('town_north_alley')).toBe('quiet');
  });

  it('should identify dungeon zones', () => {
    expect(getZoneType('sewer_entrance')).toBe('dungeon');
    expect(getZoneType('sewer_kings_lair')).toBe('dungeon');
  });

  it('should identify transitional zones', () => {
    expect(getZoneType('town_gate')).toBe('transitional');
    expect(getZoneType('town_east_road')).toBe('transitional');
  });
});

describe('SimulationEngine', () => {
  let engine: SimulationEngine;
  let mockSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSendMessage = vi.fn();
    engine = new SimulationEngine(mockSendMessage);
  });

  it('should be creatable', () => {
    expect(engine).toBeDefined();
  });

  it('should not run tick for dungeon zones', () => {
    const npcs: NPC[] = [];
    const result = engine.runTick('sewer_entrance', npcs, []);
    expect(result).toEqual([]);
  });
});
