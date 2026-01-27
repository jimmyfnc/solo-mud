import { describe, it, expect } from 'vitest';
import { generateAmbientAction, selectWeightedAction } from './ambient';
import type { NPC } from '@solo-mud/shared';

const mockNPC: NPC = {
  id: 'mira',
  name: 'Mira',
  title: 'the Innkeeper',
  locationId: 'town_inn',
  dialogue: [],
  simulation: {
    personality: 'cheerful',
    topics: ['weather'],
    topicInterest: { weather: 5 },
    ambientActions: [
      { text: 'wipes down the bar', weight: 5 },
      { text: 'hums a tune', weight: 2 },
    ],
    reactions: {},
  },
};

describe('selectWeightedAction', () => {
  it('should select from weighted actions', () => {
    const actions = [
      { text: 'action1', weight: 10 },
      { text: 'action2', weight: 1 },
    ];

    // With high weight difference, action1 should be selected most often
    const results = Array.from({ length: 100 }, () => selectWeightedAction(actions));
    const action1Count = results.filter(a => a?.text === 'action1').length;

    expect(action1Count).toBeGreaterThan(70); // Should be heavily weighted
  });

  it('should return null for empty actions', () => {
    expect(selectWeightedAction([])).toBeNull();
  });
});

describe('generateAmbientAction', () => {
  it('should generate ambient action message', () => {
    const message = generateAmbientAction(mockNPC);

    expect(message).not.toBeNull();
    expect(message?.type).toBe('simulation');
    expect(message?.subtype).toBe('ambient_action');
    expect(message?.npc).toBe('mira');
    expect(message?.npcName).toBe('Mira');
  });

  it('should return null for NPC without simulation data', () => {
    const npcWithoutSim: NPC = { ...mockNPC, simulation: undefined };
    expect(generateAmbientAction(npcWithoutSim)).toBeNull();
  });
});
