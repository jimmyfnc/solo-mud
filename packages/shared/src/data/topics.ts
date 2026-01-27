import type { NPCTopic } from '../types/simulation';

export const TOPICS: Record<string, NPCTopic> = {
  weather: {
    id: 'weather',
    category: 'small_talk',
    opinions: [
      "Looks like rain again...",
      "Fine day, isn't it?",
      "Cold wind from the north today.",
      "Sky's been grey for days now.",
      "At least it's not snowing.",
    ],
    responses: [
      "Aye, that it is.",
      "Could be worse.",
      "I've seen worse.",
      "True enough.",
    ],
  },

  rat_problem: {
    id: 'rat_problem',
    category: 'town_concern',
    opinions: [
      "The rats are getting bolder.",
      "Something's stirring them up in the sewers.",
      "Saw one big as a dog near the alley.",
      "They chewed through my grain sack last night.",
      "Captain should send guards down there.",
    ],
    responses: [
      "Keep 'em out of my shop, that's all I ask.",
      "Someone ought to do something about it.",
      "It's worse than last year, I reckon.",
      "I heard there's something bigger down there...",
    ],
  },

  adventurers: {
    id: 'adventurers',
    category: 'gossip',
    opinions: [
      "Another adventurer came through today.",
      "They never stay long, do they?",
      "Brave folk. Or foolish. Hard to tell.",
      "Good for business, at least.",
      "Wonder what they're looking for down in those sewers.",
    ],
    responses: [
      "As long as they pay their tab.",
      "Someone's got to deal with the rats.",
      "Better them than us.",
      "They come, they go. Always the same.",
    ],
  },

  trade: {
    id: 'trade',
    category: 'commerce',
    opinions: [
      "Supplies are running low.",
      "Caravan's late this week.",
      "Prices keep going up...",
      "Hard to get good steel these days.",
      "Business has been slow.",
    ],
    responses: [
      "Tell me about it.",
      "Same here.",
      "Everyone's feeling it.",
      "We make do.",
    ],
  },

  security: {
    id: 'security',
    category: 'town_concern',
    opinions: [
      "Guard patrols seem lighter lately.",
      "Did you hear about the trouble at the gate?",
      "Town walls could use some repairs.",
      "At least we're safer than the villages outside.",
    ],
    responses: [
      "The guards do their best.",
      "Could always be worse.",
      "I sleep with one eye open.",
      "That's what the walls are for.",
    ],
  },

  gossip: {
    id: 'gossip',
    category: 'gossip',
    opinions: [
      "Did you hear about what happened at the inn?",
      "Someone said they saw something strange near the temple.",
      "I heard the blacksmith's been working late every night.",
      "They say the alchemist talks to himself.",
    ],
    responses: [
      "Do tell...",
      "I hadn't heard that.",
      "People talk too much.",
      "Interesting...",
    ],
  },

  sewer_rumors: {
    id: 'sewer_rumors',
    category: 'town_concern',
    opinions: [
      "They say there's a king down there. A rat king.",
      "I heard screaming from the alley last night.",
      "Nobody who goes deep comes back the same.",
      "There's treasure down there, they say. If you're brave enough.",
    ],
    responses: [
      "Just old stories to scare children.",
      "I believe it.",
      "I'm not going to find out.",
      "Sounds like nonsense to me.",
    ],
  },

  harvest: {
    id: 'harvest',
    category: 'commerce',
    opinions: [
      "Harvest wasn't great this year.",
      "At least the fields are planted.",
      "Hoping for better weather next season.",
      "The soil's been good to us.",
    ],
    responses: [
      "We'll make it through.",
      "Always next year.",
      "Could be worse.",
      "That's farming for you.",
    ],
  },

  old_times: {
    id: 'old_times',
    category: 'nostalgia',
    opinions: [
      "Back in my day, things were different.",
      "I remember when this was all fields.",
      "The old mayor, now there was a leader.",
      "Things change. Not always for the better.",
    ],
    responses: [
      "Times change.",
      "I've heard the stories.",
      "Before my time.",
      "Some things never change though.",
    ],
  },

  festival: {
    id: 'festival',
    category: 'events',
    opinions: [
      "Festival's coming up soon.",
      "Remember last year's festival? What a night.",
      "I hope they have the fire dancers again.",
      "Best time of the year, festival week.",
    ],
    responses: [
      "Can't wait.",
      "I'll drink to that.",
      "Looking forward to it.",
      "Should be a good one.",
    ],
  },
};

export const TOPIC_IDS = Object.keys(TOPICS);
