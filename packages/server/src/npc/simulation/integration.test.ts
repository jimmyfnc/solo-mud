import { describe, it, expect, vi } from 'vitest';
import { SimulationEngine } from './index';
import { EASTHOLLOW_NPCS } from '@solo-mud/shared';

describe('Simulation Integration', () => {
  it('should generate activity for town square', () => {
    const messages: any[] = [];
    const engine = new SimulationEngine((playerId, message) => {
      messages.push({ playerId, message });
    });

    const npcs = Object.values(EASTHOLLOW_NPCS).filter(
      npc => npc.simulation && npc.locationId === 'town_square'
    );

    // Run multiple ticks to ensure we get some output
    for (let i = 0; i < 10; i++) {
      engine.runTick('town_square', npcs, [
        { id: 'player_1', name: 'TestPlayer', level: 5, hp: 100, maxHp: 100 }
      ]);
    }

    expect(messages.length).toBeGreaterThan(0);
  });

  it('should generate activity for inn', () => {
    const messages: any[] = [];
    const engine = new SimulationEngine((playerId, message) => {
      messages.push({ playerId, message });
    });

    const npcs = Object.values(EASTHOLLOW_NPCS).filter(
      npc => npc.simulation && npc.locationId === 'town_inn'
    );

    for (let i = 0; i < 10; i++) {
      engine.runTick('town_inn', npcs, [
        { id: 'player_1', name: 'TestPlayer', level: 5, hp: 100, maxHp: 100 }
      ]);
    }

    expect(messages.length).toBeGreaterThan(0);
  });

  it('should handle player enter reactions', () => {
    const messages: any[] = [];
    const engine = new SimulationEngine((playerId, message) => {
      messages.push({ playerId, message });
    });

    const npcs = Object.values(EASTHOLLOW_NPCS).filter(
      npc => npc.simulation && npc.locationId === 'town_inn'
    );

    engine.handlePlayerEnter('town_inn', {
      id: 'player_1',
      name: 'TestPlayer',
      level: 5,
      hp: 100,
      maxHp: 100
    }, npcs);

    // Should get at least one reaction from Mira
    expect(messages.length).toBeGreaterThanOrEqual(1);
  });
});
