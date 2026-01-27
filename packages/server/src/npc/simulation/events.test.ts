import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationEventBus, createHotTopic } from './events';

describe('SimulationEventBus', () => {
  let eventBus: SimulationEventBus;

  beforeEach(() => {
    eventBus = new SimulationEventBus();
  });

  it('should emit and receive events', () => {
    const handler = vi.fn();
    eventBus.on('creature_killed', handler);

    eventBus.emit('creature_killed', { creatureId: 'rat_1', killerId: 'player_1', locationId: 'town_square' });

    expect(handler).toHaveBeenCalledWith({
      creatureId: 'rat_1',
      killerId: 'player_1',
      locationId: 'town_square',
    });
  });

  it('should allow removing listeners', () => {
    const handler = vi.fn();
    eventBus.on('player_death', handler);
    eventBus.off('player_death', handler);

    eventBus.emit('player_death', { playerId: 'player_1', locationId: 'sewer_entrance' });

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('createHotTopic', () => {
  it('should create hot topic from boss defeat', () => {
    const topic = createHotTopic('boss_defeated', {
      bossName: 'Rat King',
      playerName: 'Hero',
      locationId: 'sewer_kings_lair',
    });

    expect(topic.headline).toContain('Rat King');
    expect(topic.severity).toBe('major');
    expect(topic.decayHours).toBeGreaterThan(0);
    expect(topic.reactions.shocked).toBeDefined();
  });

  it('should create hot topic from player death', () => {
    const topic = createHotTopic('player_death', {
      playerName: 'Hero',
      locationId: 'sewer_entrance',
    });

    expect(topic.severity).toBe('minor');
    expect(topic.reactions.sad).toBeDefined();
  });
});
