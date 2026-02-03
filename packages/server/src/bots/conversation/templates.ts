/**
 * Template-based conversation system for bot players.
 * Provides speech templates organized by style for various situations.
 */

import type { BotSpeechStyle } from '@solo-mud/shared';
import type { BotPlayer } from '../bot-player';

// ============================================================================
// Template Collections
// ============================================================================

/** Greeting templates by speech style */
export const GREETING_TEMPLATES: Record<BotSpeechStyle, string[]> = {
  formal: [
    'Well met, {name}.',
    'Greetings, {name}.',
    'Hail, adventurer.',
    'Good day to you, {name}.',
    'A pleasure to make your acquaintance.',
  ],
  casual: [
    'Hey {name}!',
    'Oh hey!',
    "What's up?",
    'Yo, {name}!',
    "How's it going?",
  ],
  gruff: [
    'Hmph. {name}.',
    'You again.',
    'What do you want?',
    '{name}.',
    "What's it to you?",
  ],
  cheerful: [
    'Hi there, {name}!',
    'Great to see you!',
    'Hello, friend!',
    "Oh, {name}! How wonderful!",
    "It's such a nice day, isn't it {name}?",
  ],
  mysterious: [
    'Ah... {name}.',
    'The fates bring us together.',
    'I sensed your presence.',
    'We meet again, as was foretold.',
    'The winds whispered your name, {name}.',
  ],
};

/** Combat bark templates by speech style */
export const COMBAT_BARK_TEMPLATES: Record<BotSpeechStyle, string[]> = {
  formal: [
    'For glory!',
    'Have at thee!',
    'Prepare yourself!',
    'En garde!',
    'Steel yourself!',
  ],
  casual: [
    "Let's do this!",
    'Here we go!',
    'Bring it!',
    'Time to fight!',
    'Come on!',
  ],
  gruff: [
    "You'll regret this!",
    'Come and get some!',
    'Die!',
    'Rrragh!',
    "I'll crush you!",
  ],
  cheerful: [
    "This'll be fun!",
    'Woohoo, adventure!',
    "Let's dance!",
    'Ready for action!',
    'Here I come!',
  ],
  mysterious: [
    'Your fate is sealed.',
    'The shadows guide my blade.',
    'Destiny calls.',
    'So it begins.',
    'The stars have aligned.',
  ],
};

/** Victory templates by speech style */
export const VICTORY_TEMPLATES: Record<BotSpeechStyle, string[]> = {
  formal: [
    'Another victory for honor.',
    'The battle is won.',
    'A worthy opponent.',
    'Justice prevails.',
    'Victory is ours.',
  ],
  casual: [
    'Woo! Got em!',
    'Too easy!',
    'Nice!',
    'Yeah!',
    'Nailed it!',
  ],
  gruff: [
    'Pathetic.',
    'Hmph. Done.',
    'Weak.',
    'Is that all?',
    "That's what you get.",
  ],
  cheerful: [
    'We did it!',
    'Yay, we won!',
    'That was exciting!',
    'Great job everyone!',
    'Hooray!',
  ],
  mysterious: [
    'As the prophecy foretold.',
    'Their thread has been cut.',
    'The balance is restored.',
    'It was written.',
    'The darkness recedes.',
  ],
};

/** Low HP templates by speech style */
export const LOW_HP_TEMPLATES: Record<BotSpeechStyle, string[]> = {
  formal: [
    'I require assistance!',
    'My strength wanes!',
    'Aid me, if you please!',
    'I am in dire need!',
    'A healer, perhaps?',
  ],
  casual: [
    'I need help!',
    'Ow ow ow!',
    "This isn't going well...",
    "I'm hurting here!",
    'A little help?',
  ],
  gruff: [
    "This... won't stop me!",
    "I'm not done yet!",
    'Just a scratch!',
    'Ugh... fine.',
    "I've had worse.",
  ],
  cheerful: [
    "Ouch, that smarts!",
    'Um, help please?',
    "I'm getting a bit wobbly!",
    'Could use a hand here!',
    "This is getting intense!",
  ],
  mysterious: [
    'My essence fades...',
    'The light grows dim.',
    'Perhaps my time draws near.',
    'The veil thins.',
    'I sense the beyond.',
  ],
};

/** Death templates by speech style */
export const DEATH_TEMPLATES: Record<BotSpeechStyle, string[]> = {
  formal: [
    'Tell my tale...',
    'Farewell, brave souls.',
    'My duty... is done.',
    'Honor... preserved.',
    'Until we meet again.',
  ],
  casual: [
    "I'll be back...",
    'Not cool...',
    'Aw man...',
    'This stinks...',
    'See you later...',
  ],
  gruff: [
    'This... changes nothing.',
    'Curse you...',
    'Not... like this.',
    'Rrgh...',
    "I'll remember this.",
  ],
  cheerful: [
    "That wasn't very nice...",
    'Owie...',
    'Okay, I need a nap.',
    "I'll try again later!",
    "Well, that happened!",
  ],
  mysterious: [
    'The wheel turns...',
    'Death is but a door.',
    'I return to the void.',
    'My story continues elsewhere.',
    'The shadows claim me.',
  ],
};

/** Idle chat templates by speech style */
export const IDLE_CHAT_TEMPLATES: Record<BotSpeechStyle, string[]> = {
  formal: [
    'The weather is quite pleasant.',
    'A fine day for adventure.',
    'These are interesting times.',
    'I do wonder what lies ahead.',
    'Quiet today, is it not?',
  ],
  casual: [
    'Nice weather.',
    'Pretty quiet today.',
    "Wonder what's for dinner.",
    'Kinda bored, honestly.',
    'Anything interesting happening?',
  ],
  gruff: [
    '...',
    'Hmm.',
    'What are you looking at?',
    'Too quiet.',
    'Whatever.',
  ],
  cheerful: [
    "Isn't today lovely?",
    "I'm having such a good time!",
    'Anyone want to go exploring?',
    'What a beautiful place!',
    'I love meeting new people!',
  ],
  mysterious: [
    'The air feels different today.',
    'Do you sense that?',
    'Something stirs in the darkness.',
    'The signs are unclear.',
    'Patience reveals all.',
  ],
};

// ============================================================================
// Speech Generation
// ============================================================================

/**
 * Pick a random template and fill in variables.
 * @param style - The speech style to use
 * @param templates - The template collection to pick from
 * @param variables - Optional variables to replace in the template
 * @returns The filled-in speech string
 */
export function generateSpeech(
  style: BotSpeechStyle,
  templates: Record<BotSpeechStyle, string[]>,
  variables?: Record<string, string>
): string {
  const styleTemplates = templates[style];
  const index = Math.floor(Math.random() * styleTemplates.length);
  let text = styleTemplates[index];

  // Replace variables if provided
  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
  }

  return text;
}

// ============================================================================
// Conversation Generators
// ============================================================================

/**
 * Generate a greeting for another player.
 * 30% chance to add a catchphrase.
 * @param bot - The bot player generating the greeting
 * @param targetName - The name of the player being greeted
 * @returns The greeting string
 */
export function generateGreeting(bot: BotPlayer, targetName: string): string {
  const style = bot.botProfile.personality.speechStyle;
  let greeting = generateSpeech(style, GREETING_TEMPLATES, { name: targetName });

  // 30% chance to add a catchphrase
  const catchphrases = bot.botProfile.personality.catchphrases;
  if (catchphrases.length > 0 && Math.random() < 0.3) {
    const phraseIndex = Math.floor(Math.random() * catchphrases.length);
    greeting += ' ' + catchphrases[phraseIndex];
  }

  return greeting;
}

/**
 * Generate a combat bark (battle cry).
 * @param bot - The bot player
 * @returns The combat bark string
 */
export function generateCombatBark(bot: BotPlayer): string {
  const style = bot.botProfile.personality.speechStyle;
  return generateSpeech(style, COMBAT_BARK_TEMPLATES);
}

/**
 * Generate a victory statement.
 * @param bot - The bot player
 * @returns The victory string
 */
export function generateVictory(bot: BotPlayer): string {
  const style = bot.botProfile.personality.speechStyle;
  return generateSpeech(style, VICTORY_TEMPLATES);
}

/**
 * Generate a low HP call for help.
 * @param bot - The bot player
 * @returns The low HP call string
 */
export function generateLowHpCall(bot: BotPlayer): string {
  const style = bot.botProfile.personality.speechStyle;
  return generateSpeech(style, LOW_HP_TEMPLATES);
}

/**
 * Generate idle chatter.
 * @param bot - The bot player
 * @returns The idle chat string
 */
export function generateIdleChat(bot: BotPlayer): string {
  const style = bot.botProfile.personality.speechStyle;
  return generateSpeech(style, IDLE_CHAT_TEMPLATES);
}

// ============================================================================
// Relationship Modifiers
// ============================================================================

/** Friendly modifiers to append to speech */
const FRIENDLY_MODIFIERS = [', friend', ', my ally', ', companion'];

/** Hostile modifiers to append to speech */
const HOSTILE_MODIFIERS = [', cur', ', fool', ', wretch'];

/**
 * Modify speech based on relationship opinion.
 * Adds friendly or hostile modifiers based on opinion level.
 * @param speech - The original speech
 * @param opinion - The opinion value (-100 to +100)
 * @returns The modified speech string
 */
export function modifyByRelationship(speech: string, opinion: number): string {
  if (opinion > 50) {
    // Friendly - pick a random friendly modifier
    const modifier = FRIENDLY_MODIFIERS[Math.floor(Math.random() * FRIENDLY_MODIFIERS.length)];
    // Insert modifier before the period if there is one
    if (speech.endsWith('.')) {
      return speech.slice(0, -1) + modifier + '.';
    }
    return speech + modifier;
  }

  if (opinion < -30) {
    // Hostile - pick a random hostile modifier
    const modifier = HOSTILE_MODIFIERS[Math.floor(Math.random() * HOSTILE_MODIFIERS.length)];
    // Insert modifier before the period if there is one
    if (speech.endsWith('.')) {
      return speech.slice(0, -1) + modifier + '.';
    }
    return speech + modifier;
  }

  // Neutral - no modification
  return speech;
}
