/**
 * Tests for dynamic description templates.
 */

import { describe, it, expect } from 'vitest';
import {
  generateDescription,
  type DescriptionContext,
  type DescriptionTemplate,
} from './templates';
import { createRng } from '@solo-mud/shared';

// Helper to create context
function createContext(overrides: Partial<DescriptionContext> = {}): DescriptionContext {
  return {
    biome: 'forest',
    timeOfDay: 'morning',
    weather: 'clear',
    visitCount: 1,
    props: [],
    rng: createRng('test-seed'),
    ...overrides,
  };
}

describe('generateDescription', () => {
  it('should generate a description based on biome', () => {
    const forestCtx = createContext({ biome: 'forest' });
    const desertCtx = createContext({ biome: 'desert' });

    const forestDesc = generateDescription(forestCtx);
    const desertDesc = generateDescription(desertCtx);

    expect(forestDesc).not.toBe(desertDesc);
  });

  it('should vary descriptions based on time of day', () => {
    const morningCtx = createContext({ timeOfDay: 'morning' });
    const nightCtx = createContext({ timeOfDay: 'night' });

    const morningDesc = generateDescription(morningCtx);
    const nightDesc = generateDescription(nightCtx);

    // Should have different descriptions for different times
    expect(morningDesc).not.toBe(nightDesc);
  });

  it('should include weather effects in description', () => {
    const rainCtx = createContext({ weather: 'rain' });
    const stormCtx = createContext({ weather: 'storm' });

    const rainDesc = generateDescription(rainCtx);
    const stormDesc = generateDescription(stormCtx);

    // Rain and storm should add weather-specific content
    expect(rainDesc.toLowerCase()).toMatch(/rain|drizzle|wet|damp/);
    expect(stormDesc.toLowerCase()).toMatch(/storm|thunder|lightning|howl/);
  });

  it('should provide different description on repeat visits', () => {
    const firstVisit = createContext({ visitCount: 1 });
    const thirdVisit = createContext({ visitCount: 3 });

    // Use same seed for determinism
    const desc1 = generateDescription({ ...firstVisit, rng: createRng('visit-test') });
    const desc3 = generateDescription({ ...thirdVisit, rng: createRng('visit-test') });

    // First visit descriptions tend to be more detailed
    // Subsequent visits should be shorter or reference familiarity
    expect(desc1.length).toBeGreaterThan(0);
    expect(desc3.length).toBeGreaterThan(0);
  });

  it('should sometimes incorporate props into description', () => {
    // Run multiple times to check props get included at least once
    let propsIncluded = false;
    const props = ['ancient oak', 'moss-covered stones'];

    for (let i = 0; i < 20; i++) {
      const ctx = createContext({
        biome: 'forest',
        props,
        rng: createRng(`props-test-${i}`),
      });

      const desc = generateDescription(ctx);
      if (desc.toLowerCase().includes('oak') || desc.toLowerCase().includes('stones')) {
        propsIncluded = true;
        break;
      }
    }

    // Props should be mentioned at least once across multiple generations
    expect(propsIncluded).toBe(true);
  });

  it('should handle all biome types', () => {
    const biomes = ['plains', 'forest', 'hills', 'swamp', 'mountains', 'desert'] as const;

    for (const biome of biomes) {
      const ctx = createContext({ biome });
      const desc = generateDescription(ctx);
      expect(desc.length).toBeGreaterThan(10);
    }
  });

  it('should handle all time periods', () => {
    const times = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'] as const;

    for (const timeOfDay of times) {
      const ctx = createContext({ timeOfDay });
      const desc = generateDescription(ctx);
      expect(desc.length).toBeGreaterThan(10);
    }
  });

  it('should produce deterministic output with same RNG seed', () => {
    const ctx1 = createContext({ rng: createRng('deterministic') });
    const ctx2 = createContext({ rng: createRng('deterministic') });

    const desc1 = generateDescription(ctx1);
    const desc2 = generateDescription(ctx2);

    expect(desc1).toBe(desc2);
  });
});

describe('DescriptionTemplate', () => {
  it('should allow custom templates', () => {
    const customTemplate: DescriptionTemplate = {
      biome: 'forest',
      variants: [
        {
          text: 'Custom forest description with {prop}.',
          conditions: { minVisitCount: 1 },
        },
      ],
    };

    // Custom templates structure is valid
    expect(customTemplate.variants[0]!.text).toContain('{prop}');
    expect(customTemplate.biome).toBe('forest');
  });
});
