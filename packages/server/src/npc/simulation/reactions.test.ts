import { describe, it, expect } from 'vitest';
import { generateReaction, evaluateCondition, selectReactingNPCs } from './reactions';
import type { NPC } from '@solo-mud/shared';

const marcus: NPC = {
  id: 'marcus',
  name: 'Marcus',
  title: 'the Guard',
  locationId: 'town_gate',
  dialogue: [],
  simulation: {
    personality: 'stern',
    topics: ['security'],
    topicInterest: { security: 9 },
    ambientActions: [],
    reactions: {
      player_enter: [
        { weight: 5, says: 'Adventurer.' },
        { weight: 3, says: 'State your business.', condition: 'player.level < 3' },
        { weight: 2, action: 'nods respectfully', condition: 'player.level >= 10' },
      ],
      creature_enter: [
        { weight: 10, action: 'draws his sword', says: 'Creature! Stand back!' },
      ],
    },
  },
};

describe('evaluateCondition', () => {
  it('should evaluate level conditions', () => {
    expect(evaluateCondition('player.level < 3', { level: 1 })).toBe(true);
    expect(evaluateCondition('player.level < 3', { level: 5 })).toBe(false);
    expect(evaluateCondition('player.level >= 10', { level: 10 })).toBe(true);
    expect(evaluateCondition('player.level >= 10', { level: 5 })).toBe(false);
  });

  it('should return true for undefined condition', () => {
    expect(evaluateCondition(undefined, { level: 5 })).toBe(true);
  });
});

describe('generateReaction', () => {
  it('should generate reaction to player entering', () => {
    const reaction = generateReaction(marcus, 'player_enter', { level: 1 });

    expect(reaction).not.toBeNull();
    expect(reaction?.type).toBe('simulation');
    expect(reaction?.subtype).toBe('reaction_to_player');
  });

  it('should filter by condition', () => {
    // High level player should not get "State your business"
    const reactions = Array.from({ length: 50 }, () =>
      generateReaction(marcus, 'player_enter', { level: 15 })
    );

    const stateBusinessCount = reactions.filter(r => r?.says?.includes('State your business')).length;
    expect(stateBusinessCount).toBe(0);
  });

  it('should return null for trigger with no reactions', () => {
    expect(generateReaction(marcus, 'player_death', { level: 5 })).toBeNull();
  });
});

describe('selectReactingNPCs', () => {
  const mira: NPC = {
    id: 'mira',
    name: 'Mira',
    locationId: 'town_inn',
    dialogue: [],
    simulation: {
      personality: 'friendly',
      topics: [],
      topicInterest: {},
      ambientActions: [],
      reactions: {
        player_enter: [{ weight: 5, says: 'Welcome!' }],
      },
    },
  };

  const noReactionsNPC: NPC = {
    id: 'silent',
    name: 'Silent Bob',
    locationId: 'town_square',
    dialogue: [],
    simulation: {
      personality: 'gruff',
      topics: [],
      topicInterest: {},
      ambientActions: [],
      reactions: {},
    },
  };

  it('should only select NPCs with reactions for the trigger', () => {
    const npcs = [marcus, mira, noReactionsNPC];
    const selected = selectReactingNPCs(npcs, 'player_enter', 10);

    expect(selected.length).toBe(2);
    expect(selected.map(n => n.id).sort()).toEqual(['marcus', 'mira']);
  });

  it('should limit the number of reacting NPCs', () => {
    const npcs = [marcus, mira];
    const selected = selectReactingNPCs(npcs, 'player_enter', 1);

    expect(selected.length).toBe(1);
  });

  it('should return empty array when no NPCs have reactions', () => {
    const selected = selectReactingNPCs([noReactionsNPC], 'player_enter', 2);

    expect(selected.length).toBe(0);
  });
});
