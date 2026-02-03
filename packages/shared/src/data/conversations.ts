/**
 * Pre-written conversation templates for specific NPC pairs.
 * These provide more interesting dialogue than random topic exchanges.
 */

import type { ConversationTemplate } from '../types/simulation';

export const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  // ============ Kira/Thom Rivalry (4 templates) ============
  {
    id: 'kira_thom_debt',
    initiatorIds: ['npc_kira'],
    responderIds: ['npc_thom'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "You still owe me for those hinges, Thom." },
      { speaker: 'responder', says: "I paid you in vegetables!" },
      { speaker: 'initiator', says: "That's not currency!" },
      { speaker: 'responder', says: "It is if you're hungry enough." },
    ],
  },
  {
    id: 'kira_thom_quality',
    initiatorIds: ['npc_kira'],
    responderIds: ['npc_thom'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "Saw another broken tool from your shop today." },
      { speaker: 'responder', says: "It's not my fault people don't read the care instructions!" },
      { speaker: 'initiator', says: "What care instructions? 'Don't use it'?" },
      { speaker: 'responder', action: 'sputters indignantly', says: "My merchandise is perfectly adequate!" },
    ],
  },
  {
    id: 'thom_kira_prices',
    initiatorIds: ['npc_thom'],
    responderIds: ['npc_kira'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "Your prices are robbery, you know." },
      { speaker: 'responder', says: "Quality costs money. Unlike your 'supplies'." },
      { speaker: 'initiator', says: "At least my customers can afford to eat afterward." },
    ],
  },
  {
    id: 'kira_thom_competition',
    initiatorIds: ['npc_kira'],
    responderIds: ['npc_thom'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', action: 'notices Thom nearby', says: "Come to see how real craftsmanship is done?" },
      { speaker: 'responder', says: "I'm just making sure you haven't driven away all the customers." },
      { speaker: 'initiator', says: "Hard to drive them away when they never go to your shop first." },
      { speaker: 'responder', action: 'crosses his arms', says: "We'll see who's laughing come festival season." },
    ],
  },

  // ============ Guard-Related Conversations (3 templates) ============
  {
    id: 'marcus_holt_duty',
    initiatorIds: ['npc_marcus'],
    responderIds: ['npc_holt'],
    topic: 'security',
    lines: [
      { speaker: 'initiator', says: "Gate duty again, Captain. Third week in a row." },
      { speaker: 'responder', says: "Someone has to watch the gate. You're good at it." },
      { speaker: 'initiator', says: "Is that a compliment or an insult?" },
      { speaker: 'responder', action: 'almost smiles', says: "Yes." },
    ],
  },
  {
    id: 'holt_marcus_discipline',
    initiatorIds: ['npc_holt'],
    responderIds: ['npc_marcus'],
    topic: 'security',
    lines: [
      { speaker: 'initiator', says: "I saw you yawning at your post yesterday." },
      { speaker: 'responder', says: "I was... checking for threats with my eyes closed, sir." },
      { speaker: 'initiator', says: "That's the worst excuse I've ever heard." },
      { speaker: 'responder', says: "I've been practicing it all morning." },
    ],
  },
  {
    id: 'marcus_giles_sighting',
    initiatorIds: ['npc_marcus'],
    responderIds: ['npc_giles'],
    topic: 'security',
    lines: [
      { speaker: 'initiator', says: "Seen anything strange near the fields lately?" },
      { speaker: 'responder', says: "Just Pete poking around where he shouldn't be." },
      { speaker: 'initiator', action: 'sighs', says: "That's not strange. That's just Tuesday." },
    ],
  },

  // ============ Inn Gossip Conversations (3 templates) ============
  {
    id: 'mira_giles_news',
    initiatorIds: ['npc_mira'],
    responderIds: ['npc_giles'],
    topic: 'gossip',
    lines: [
      { speaker: 'initiator', says: "Heard anything interesting from the travelers?" },
      { speaker: 'responder', says: "They say there's trouble on the roads east of here." },
      { speaker: 'initiator', says: "There's always trouble somewhere. Keeps the adventurers coming." },
      { speaker: 'responder', action: 'nods sagely', says: "Good for business, bad for peace of mind." },
    ],
  },
  {
    id: 'mira_elwin_potions',
    initiatorIds: ['npc_mira'],
    responderIds: ['npc_elwin'],
    topic: 'gossip',
    lines: [
      { speaker: 'initiator', says: "Elwin, what was that explosion yesterday?" },
      { speaker: 'responder', says: "A minor setback in the pursuit of knowledge." },
      { speaker: 'initiator', says: "Your 'setbacks' rattle my windows." },
      { speaker: 'responder', action: 'adjusts his spectacles', says: "Science requires sacrifice. Mostly of glassware." },
    ],
  },
  {
    id: 'giles_mira_adventurers',
    initiatorIds: ['npc_giles'],
    responderIds: ['npc_mira'],
    topic: 'adventurers',
    lines: [
      { speaker: 'initiator', says: "Another group of adventurers headed for the sewers today." },
      { speaker: 'responder', says: "Poor souls. At least they bought supplies first." },
      { speaker: 'initiator', says: "Think any of them will come back?" },
      { speaker: 'responder', action: 'shrugs', says: "The brave ones usually do. Eventually." },
    ],
  },

  // ============ Pete Scheme Discussions (3 templates) ============
  {
    id: 'pete_thom_deal',
    initiatorIds: ['npc_pete'],
    responderIds: ['npc_thom'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "Psst. Thom. I've got a business proposition." },
      { speaker: 'responder', says: "The last time I listened to you, I lost three chickens." },
      { speaker: 'initiator', says: "Those chickens were an investment! They're probably thriving somewhere." },
      { speaker: 'responder', says: "They were eaten by wolves, Pete. I saw the feathers." },
    ],
  },
  {
    id: 'giles_pete_scheme',
    initiatorIds: ['npc_giles'],
    responderIds: ['npc_pete'],
    topic: 'gossip',
    lines: [
      { speaker: 'initiator', says: "What are you up to now, Pete?" },
      { speaker: 'responder', says: "Me? Nothing. Just thinking about entrepreneurial opportunities." },
      { speaker: 'initiator', says: "Last I heard, loitering isn't a business." },
      { speaker: 'responder', action: 'looks offended', says: "It's called 'strategic positioning'." },
    ],
  },
  {
    id: 'mira_pete_tab',
    initiatorIds: ['npc_mira'],
    responderIds: ['npc_pete'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "Pete, your tab is getting longer than my patience." },
      { speaker: 'responder', says: "I'm good for it! I've got a plan that's about to pay off." },
      { speaker: 'initiator', says: "You've had twelve plans this month. None have paid anything." },
      { speaker: 'responder', action: 'holds up a finger', says: "Thirteen is my lucky number." },
    ],
  },

  // ============ Trainer Conversations (2 templates) ============
  {
    id: 'holt_sera_methods',
    initiatorIds: ['npc_holt'],
    responderIds: ['npc_sera'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "Your students keep setting things on fire." },
      { speaker: 'responder', action: 'winces', says: "That's... part of the learning process?" },
      { speaker: 'initiator', says: "Learning should not require a bucket brigade." },
      { speaker: 'responder', says: "To be fair, they're getting better at aiming away from the dummies." },
    ],
  },
  {
    id: 'shadow_holt_students',
    initiatorIds: ['npc_shadow'],
    responderIds: ['npc_holt'],
    topic: 'trade',
    lines: [
      { speaker: 'initiator', says: "Your new recruit has potential. Clumsy, but potential." },
      { speaker: 'responder', says: "High praise from you. What did they do?" },
      { speaker: 'initiator', says: "Almost spotted me twice. That's more than most manage." },
      { speaker: 'responder', action: 'grunts approvingly', says: "I'll work on their awareness. You keep testing them." },
    ],
  },
];

export const CONVERSATION_TEMPLATE_IDS = CONVERSATION_TEMPLATES.map(t => t.id);
