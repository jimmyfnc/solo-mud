/**
 * Tests for time-of-day effects on descriptions and gameplay.
 */

import { describe, it, expect } from 'vitest';
import {
  getTimeEffects,
  getLightLevel,
  getVisibilityModifier,
  getAmbientDescription,
} from './time-effects';
import type { TimeOfDay } from '@solo-mud/shared';

describe('getTimeEffects', () => {
  it('should return effects for all time periods', () => {
    const times: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'];

    for (const time of times) {
      const effects = getTimeEffects(time);
      expect(effects).toBeDefined();
      expect(effects.lightLevel).toBeGreaterThanOrEqual(0);
      expect(effects.lightLevel).toBeLessThanOrEqual(1);
    }
  });

  it('should have highest light at noon', () => {
    const noon = getTimeEffects('noon');
    const night = getTimeEffects('night');
    const morning = getTimeEffects('morning');

    expect(noon.lightLevel).toBeGreaterThan(night.lightLevel);
    expect(noon.lightLevel).toBeGreaterThanOrEqual(morning.lightLevel);
  });

  it('should have lowest light at night', () => {
    const night = getTimeEffects('night');
    const dawn = getTimeEffects('dawn');
    const evening = getTimeEffects('evening');

    expect(night.lightLevel).toBeLessThan(dawn.lightLevel);
    expect(night.lightLevel).toBeLessThan(evening.lightLevel);
  });

  it('should have appropriate visibility range', () => {
    const noon = getTimeEffects('noon');
    const night = getTimeEffects('night');

    expect(noon.visibilityRange).toBeGreaterThan(night.visibilityRange);
  });
});

describe('getLightLevel', () => {
  it('should return normalized light level 0-1', () => {
    const times: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'];

    for (const time of times) {
      const level = getLightLevel(time);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    }
  });

  it('should be highest at noon', () => {
    expect(getLightLevel('noon')).toBe(1.0);
  });

  it('should be lowest at night', () => {
    expect(getLightLevel('night')).toBeLessThanOrEqual(0.2);
  });
});

describe('getVisibilityModifier', () => {
  it('should reduce visibility at night', () => {
    const dayMod = getVisibilityModifier('noon');
    const nightMod = getVisibilityModifier('night');

    expect(nightMod).toBeLessThan(dayMod);
  });

  it('should have full visibility during day', () => {
    expect(getVisibilityModifier('noon')).toBe(1.0);
    expect(getVisibilityModifier('morning')).toBeGreaterThanOrEqual(0.9);
  });

  it('should have reduced visibility at dawn/evening', () => {
    const dawnMod = getVisibilityModifier('dawn');
    const eveningMod = getVisibilityModifier('evening');

    expect(dawnMod).toBeLessThan(1.0);
    expect(eveningMod).toBeLessThan(1.0);
  });
});

describe('getAmbientDescription', () => {
  it('should return ambient sounds/feelings for each time', () => {
    const times: TimeOfDay[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night'];

    for (const time of times) {
      const ambient = getAmbientDescription(time);
      expect(ambient.length).toBeGreaterThan(0);
    }
  });

  it('should have night-specific ambient', () => {
    const nightAmbient = getAmbientDescription('night');
    expect(nightAmbient.toLowerCase()).toMatch(/dark|quiet|shadow|star|moon|cricket|owl/);
  });

  it('should have morning-specific ambient', () => {
    const morningAmbient = getAmbientDescription('morning');
    expect(morningAmbient.toLowerCase()).toMatch(/bird|fresh|dew|wake|bright|crisp/);
  });
});
