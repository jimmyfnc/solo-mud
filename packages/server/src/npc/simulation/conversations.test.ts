import { describe, it, expect } from 'vitest';
import { findSharedTopics, generateConversation, scoreConversation } from './conversations';
import type { NPC } from '@solo-mud/shared';

const mira: NPC = {
  id: 'mira',
  name: 'Mira',
  title: 'the Innkeeper',
  locationId: 'town_inn',
  role: 'innkeeper',
  dialogue: [],
  simulation: {
    personality: 'cheerful',
    topics: ['weather', 'gossip', 'adventurers'],
    topicInterest: { weather: 5, gossip: 9, adventurers: 8 },
    ambientActions: [],
    reactions: {},
  },
};

const giles: NPC = {
  id: 'giles',
  name: 'Giles',
  title: 'the Farmer',
  locationId: 'town_square',
  role: 'citizen',
  dialogue: [],
  simulation: {
    personality: 'friendly',
    topics: ['weather', 'harvest', 'rat_problem'],
    topicInterest: { weather: 8, harvest: 7, rat_problem: 6 },
    ambientActions: [],
    reactions: {},
  },
};

describe('findSharedTopics', () => {
  it('should find topics both NPCs share', () => {
    const shared = findSharedTopics(mira, giles);
    expect(shared).toContain('weather');
    expect(shared).not.toContain('gossip'); // Only mira has this
    expect(shared).not.toContain('harvest'); // Only giles has this
  });

  it('should return empty array if no shared topics', () => {
    const npc1 = { ...mira, simulation: { ...mira.simulation!, topics: ['gossip'] } };
    const npc2 = { ...giles, simulation: { ...giles.simulation!, topics: ['harvest'] } };
    expect(findSharedTopics(npc1, npc2)).toEqual([]);
  });
});

describe('scoreConversation', () => {
  it('should score based on combined interest', () => {
    // Weather: mira 5 + giles 8 = 13
    const score = scoreConversation(mira, giles, 'weather');
    expect(score).toBe(13);
  });
});

describe('generateConversation', () => {
  it('should generate conversation between NPCs', () => {
    const topics = {
      weather: {
        id: 'weather',
        category: 'small_talk' as const,
        opinions: ['Looks like rain...'],
        responses: ['Aye, that it is.'],
      },
    };

    const conversation = generateConversation(mira, giles, 'weather', topics);

    expect(conversation).not.toBeNull();
    expect(conversation?.type).toBe('simulation');
    expect(conversation?.subtype).toBe('npc_conversation');
    expect(conversation?.lines?.length).toBeGreaterThanOrEqual(2);
  });
});
