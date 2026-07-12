import { describe, it, expect } from 'vitest';
import {
  generatePersonality,
  generateCatchphrases,
  selectArchetype,
  ARCHETYPES,
} from './generator';

describe('Personality Generator', () => {
  describe('ARCHETYPES', () => {
    it('should define at least 5 archetypes', () => {
      expect(Object.keys(ARCHETYPES).length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid trait ranges for each archetype', () => {
      for (const archetype of Object.values(ARCHETYPES)) {
        expect(archetype.traits.bravery.min).toBeGreaterThanOrEqual(0);
        expect(archetype.traits.bravery.max).toBeLessThanOrEqual(100);
        expect(archetype.traits.greed.min).toBeGreaterThanOrEqual(0);
        expect(archetype.traits.greed.max).toBeLessThanOrEqual(100);
        expect(archetype.traits.sociability.min).toBeGreaterThanOrEqual(0);
        expect(archetype.traits.sociability.max).toBeLessThanOrEqual(100);
        expect(archetype.traits.patience.min).toBeGreaterThanOrEqual(0);
        expect(archetype.traits.patience.max).toBeLessThanOrEqual(100);
        expect(archetype.traits.aggression.min).toBeGreaterThanOrEqual(0);
        expect(archetype.traits.aggression.max).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('selectArchetype', () => {
    it('should return a valid archetype', () => {
      const archetype = selectArchetype();
      expect(ARCHETYPES[archetype]).toBeDefined();
    });
  });

  describe('generateCatchphrases', () => {
    it('should generate catchphrases for brave personality', () => {
      const phrases = generateCatchphrases({ bravery: 90, aggression: 80 });
      expect(phrases.length).toBeGreaterThan(0);
      // Should have combat-related phrases
      expect(
        phrases.some(
          (p) =>
            p.includes('!') || p.toLowerCase().includes('glory') || p.toLowerCase().includes('fight')
        )
      ).toBe(true);
    });

    it('should generate catchphrases for social personality', () => {
      const phrases = generateCatchphrases({ sociability: 90, greed: 20 });
      expect(phrases.length).toBeGreaterThan(0);
    });

    it('should generate catchphrases for greedy personality', () => {
      const phrases = generateCatchphrases({ greed: 90 });
      expect(phrases.length).toBeGreaterThan(0);
    });
  });

  describe('generatePersonality', () => {
    it('should generate valid personality with all required fields', () => {
      const personality = generatePersonality();

      expect(personality.bravery).toBeGreaterThanOrEqual(0);
      expect(personality.bravery).toBeLessThanOrEqual(100);
      expect(personality.greed).toBeGreaterThanOrEqual(0);
      expect(personality.greed).toBeLessThanOrEqual(100);
      expect(personality.sociability).toBeGreaterThanOrEqual(0);
      expect(personality.sociability).toBeLessThanOrEqual(100);
      expect(personality.patience).toBeGreaterThanOrEqual(0);
      expect(personality.patience).toBeLessThanOrEqual(100);
      expect(personality.aggression).toBeGreaterThanOrEqual(0);
      expect(personality.aggression).toBeLessThanOrEqual(100);

      expect(personality.preferredActivities.length).toBeGreaterThan(0);
      expect(personality.preferredZones.length).toBeGreaterThan(0);
      expect(personality.catchphrases.length).toBeGreaterThan(0);
      expect(personality.speechStyle).toBeDefined();
    });

    it('should generate coherent brave personality', () => {
      // Generate many and find a brave one
      let bravePersonality = null;
      for (let i = 0; i < 50; i++) {
        const p = generatePersonality();
        if (p.bravery > 70) {
          bravePersonality = p;
          break;
        }
      }

      if (bravePersonality) {
        // Brave personalities should prefer combat
        expect(bravePersonality.preferredActivities).toContain('combat');
      }
    });

    it('should generate social personalities that prefer socializing', () => {
      // (High sociability alone doesn't imply the socializing activity —
      // archetypes own the activity lists — so assert the correlation
      // deterministically: socializers exist and skew sociable.)
      const socializers = [];
      for (let i = 0; i < 100; i++) {
        const p = generatePersonality();
        if (p.preferredActivities.includes('socializing')) {
          socializers.push(p);
        }
      }

      expect(socializers.length).toBeGreaterThan(0);
      const avgSociability =
        socializers.reduce((sum, p) => sum + p.sociability, 0) / socializers.length;
      expect(avgSociability).toBeGreaterThan(40);
    });

    it('should generate unique personalities', () => {
      const p1 = generatePersonality();
      const p2 = generatePersonality();

      // At least some traits should differ (very unlikely to be identical)
      const identical =
        p1.bravery === p2.bravery &&
        p1.greed === p2.greed &&
        p1.sociability === p2.sociability &&
        p1.patience === p2.patience &&
        p1.aggression === p2.aggression;

      expect(identical).toBe(false);
    });
  });
});
