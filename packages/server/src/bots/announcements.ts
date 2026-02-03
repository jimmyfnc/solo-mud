/**
 * Bot announcement system - broadcasts for death, respawn, and heroic events.
 */

import type { BotDeathInfo } from './death-handler';

/** Announcement types for bot lifecycle events */
export interface BotAnnouncement {
  type: 'death' | 'respawn' | 'heroic_death';
  botName: string;
  message: string;
  timestamp: number;
}

/** Death message variations for normal deaths */
const DEATH_PHRASES = [
  'has fallen in',
  'met their end in',
  'was slain in',
];

/** Death message variations for heroic deaths (fighting bosses) */
const HEROIC_DEATH_PHRASES = [
  'died heroically fighting',
  'fell in glorious battle against',
];

/**
 * Select a random phrase from an array.
 */
function pickRandom<T>(phrases: T[]): T {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Create a death announcement for a bot.
 * - Normal deaths include the location where they died
 * - Heroic deaths (fighting bosses) include the killer's name
 */
export function createDeathAnnouncement(info: BotDeathInfo): BotAnnouncement {
  if (info.wasHeroic) {
    const phrase = pickRandom(HEROIC_DEATH_PHRASES);
    return {
      type: 'heroic_death',
      botName: info.botName,
      message: `${info.botName} ${phrase} ${info.killerName}!`,
      timestamp: info.timestamp,
    };
  }

  const phrase = pickRandom(DEATH_PHRASES);
  return {
    type: 'death',
    botName: info.botName,
    message: `${info.botName} ${phrase} ${info.location}!`,
    timestamp: info.timestamp,
  };
}

/**
 * Create a respawn announcement for a bot returning to town.
 */
export function createRespawnAnnouncement(botName: string): BotAnnouncement {
  return {
    type: 'respawn',
    botName,
    message: `${botName} has returned to Easthollow!`,
    timestamp: Date.now(),
  };
}

/**
 * Format an announcement for broadcast to players.
 * - All announcements get [WORLD] prefix
 * - Heroic deaths get special sword emoji prefix
 */
export function formatAnnouncementForBroadcast(announcement: BotAnnouncement): string {
  if (announcement.type === 'heroic_death') {
    return `⚔️ [WORLD] ${announcement.message}`;
  }

  return `[WORLD] ${announcement.message}`;
}
