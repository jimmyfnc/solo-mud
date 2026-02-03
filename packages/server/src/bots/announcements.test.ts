import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDeathAnnouncement,
  createRespawnAnnouncement,
  formatAnnouncementForBroadcast,
  type BotAnnouncement,
} from './announcements';
import type { BotDeathInfo } from './death-handler';

describe('Bot Announcements', () => {
  let normalDeathInfo: BotDeathInfo;
  let heroicDeathInfo: BotDeathInfo;

  beforeEach(() => {
    normalDeathInfo = {
      botId: 'bot_theron',
      botName: 'Theron the Bold',
      killedBy: 'creature_large_rat',
      killerName: 'Large Rat',
      location: 'sewer_junction',
      wasHeroic: false,
      timestamp: Date.now(),
    };

    heroicDeathInfo = {
      botId: 'bot_theron',
      botName: 'Theron the Bold',
      killedBy: 'creature_rat_king',
      killerName: 'Rat King',
      location: 'sewer_kings_lair',
      wasHeroic: true,
      timestamp: Date.now(),
    };
  });

  describe('createDeathAnnouncement', () => {
    it('should return death type for normal death', () => {
      const announcement = createDeathAnnouncement(normalDeathInfo);

      expect(announcement.type).toBe('death');
    });

    it('should return heroic_death type when wasHeroic is true', () => {
      const announcement = createDeathAnnouncement(heroicDeathInfo);

      expect(announcement.type).toBe('heroic_death');
    });

    it('should include bot name in announcement', () => {
      const announcement = createDeathAnnouncement(normalDeathInfo);

      expect(announcement.botName).toBe('Theron the Bold');
    });

    it('should include location in normal death message', () => {
      const announcement = createDeathAnnouncement(normalDeathInfo);

      expect(announcement.message).toContain('sewer_junction');
    });

    it('should include killer name in heroic death message', () => {
      const announcement = createDeathAnnouncement(heroicDeathInfo);

      expect(announcement.message).toContain('Rat King');
    });

    it('should include bot name in death message', () => {
      const announcement = createDeathAnnouncement(normalDeathInfo);

      expect(announcement.message).toContain('Theron the Bold');
    });

    it('should include timestamp', () => {
      const now = Date.now();
      normalDeathInfo.timestamp = now;
      const announcement = createDeathAnnouncement(normalDeathInfo);

      expect(announcement.timestamp).toBe(now);
    });

    it('should use death phrase variations for normal death', () => {
      const validPhrases = ['has fallen in', 'met their end in', 'was slain in'];
      const announcement = createDeathAnnouncement(normalDeathInfo);

      const hasValidPhrase = validPhrases.some((phrase) =>
        announcement.message.includes(phrase)
      );
      expect(hasValidPhrase).toBe(true);
    });

    it('should use heroic phrase variations for heroic death', () => {
      const validPhrases = [
        'died heroically fighting',
        'fell in glorious battle against',
      ];
      const announcement = createDeathAnnouncement(heroicDeathInfo);

      const hasValidPhrase = validPhrases.some((phrase) =>
        announcement.message.includes(phrase)
      );
      expect(hasValidPhrase).toBe(true);
    });
  });

  describe('createRespawnAnnouncement', () => {
    it('should return respawn type', () => {
      const announcement = createRespawnAnnouncement('Theron the Bold');

      expect(announcement.type).toBe('respawn');
    });

    it('should include bot name in announcement', () => {
      const announcement = createRespawnAnnouncement('Theron the Bold');

      expect(announcement.botName).toBe('Theron the Bold');
    });

    it('should include bot name in message', () => {
      const announcement = createRespawnAnnouncement('Theron the Bold');

      expect(announcement.message).toContain('Theron the Bold');
    });

    it('should mention Easthollow in message', () => {
      const announcement = createRespawnAnnouncement('Theron the Bold');

      expect(announcement.message).toContain('Easthollow');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const announcement = createRespawnAnnouncement('Theron the Bold');
      const after = Date.now();

      expect(announcement.timestamp).toBeGreaterThanOrEqual(before);
      expect(announcement.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('formatAnnouncementForBroadcast', () => {
    it('should add [WORLD] prefix for death announcement', () => {
      const announcement: BotAnnouncement = {
        type: 'death',
        botName: 'Theron',
        message: 'Theron has fallen in sewer_junction!',
        timestamp: Date.now(),
      };

      const formatted = formatAnnouncementForBroadcast(announcement);

      expect(formatted).toContain('[WORLD]');
    });

    it('should add [WORLD] prefix for respawn announcement', () => {
      const announcement: BotAnnouncement = {
        type: 'respawn',
        botName: 'Theron',
        message: 'Theron has returned to Easthollow!',
        timestamp: Date.now(),
      };

      const formatted = formatAnnouncementForBroadcast(announcement);

      expect(formatted).toContain('[WORLD]');
    });

    it('should include emoji for heroic death', () => {
      const announcement: BotAnnouncement = {
        type: 'heroic_death',
        botName: 'Theron',
        message: 'Theron died heroically fighting Rat King!',
        timestamp: Date.now(),
      };

      const formatted = formatAnnouncementForBroadcast(announcement);

      expect(formatted).toContain('⚔️');
    });

    it('should include message content', () => {
      const announcement: BotAnnouncement = {
        type: 'death',
        botName: 'Theron',
        message: 'Theron has fallen in sewer_junction!',
        timestamp: Date.now(),
      };

      const formatted = formatAnnouncementForBroadcast(announcement);

      expect(formatted).toContain('Theron has fallen in sewer_junction!');
    });

    it('should format normal death without emoji', () => {
      const announcement: BotAnnouncement = {
        type: 'death',
        botName: 'Theron',
        message: 'Theron has fallen in sewer_junction!',
        timestamp: Date.now(),
      };

      const formatted = formatAnnouncementForBroadcast(announcement);

      expect(formatted).not.toContain('⚔️');
    });

    it('should format respawn without emoji', () => {
      const announcement: BotAnnouncement = {
        type: 'respawn',
        botName: 'Theron',
        message: 'Theron has returned to Easthollow!',
        timestamp: Date.now(),
      };

      const formatted = formatAnnouncementForBroadcast(announcement);

      expect(formatted).not.toContain('⚔️');
    });
  });
});
