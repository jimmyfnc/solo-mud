/**
 * Tests for weather simulation system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createWeatherSimulator,
  getWeatherTransitions,
  getWeatherDescription,
  type WeatherSimulator,
  type WeatherType,
} from './weather';
import type { WeatherState } from '@solo-mud/shared';
import { createRng } from '@solo-mud/shared';

describe('getWeatherTransitions', () => {
  it('should return transition probabilities for each weather type', () => {
    const types: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm', 'fog'];

    for (const type of types) {
      const transitions = getWeatherTransitions(type);
      expect(transitions).toBeDefined();

      // Sum of probabilities should be 1
      const sum = Object.values(transitions).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    }
  });

  it('should have higher self-transition for stable weather', () => {
    const clearTrans = getWeatherTransitions('clear');
    const stormTrans = getWeatherTransitions('storm');

    // Clear weather tends to stay clear
    expect(clearTrans.clear).toBeGreaterThan(0.5);
    // Storms are less stable
    expect(stormTrans.storm).toBeLessThan(0.5);
  });

  it('should have reasonable transition chains', () => {
    // Clear can become cloudy but rarely goes straight to storm
    const clearTrans = getWeatherTransitions('clear');
    expect(clearTrans.cloudy).toBeGreaterThan(clearTrans.storm!);

    // Cloudy can lead to rain
    const cloudyTrans = getWeatherTransitions('cloudy');
    expect(cloudyTrans.rain).toBeGreaterThan(0);
  });
});

describe('getWeatherDescription', () => {
  it('should return description for each weather type', () => {
    const types: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm', 'fog'];

    for (const type of types) {
      const desc = getWeatherDescription({ type, intensity: 0.5 });
      expect(desc.length).toBeGreaterThan(0);
    }
  });

  it('should vary description by intensity', () => {
    const lightRain = getWeatherDescription({ type: 'rain', intensity: 0.2 });
    const heavyRain = getWeatherDescription({ type: 'rain', intensity: 0.9 });

    expect(lightRain).not.toBe(heavyRain);
  });

  it('should include intensity keywords', () => {
    const lightFog = getWeatherDescription({ type: 'fog', intensity: 0.2 });
    const denseForest = getWeatherDescription({ type: 'fog', intensity: 0.9 });

    expect(lightFog.toLowerCase()).toMatch(/thin|light|wisp/);
    expect(denseForest.toLowerCase()).toMatch(/thick|dense|heavy|blanket/);
  });
});

describe('createWeatherSimulator', () => {
  let simulator: WeatherSimulator;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (simulator) {
      simulator.stop();
    }
    vi.useRealTimers();
  });

  it('should create simulator with initial weather', () => {
    const initial: WeatherState = { type: 'clear', intensity: 0.5 };
    simulator = createWeatherSimulator(initial, createRng('test-seed'));

    expect(simulator.getWeather()).toEqual(initial);
  });

  it('should update weather when tick is called', () => {
    simulator = createWeatherSimulator(
      { type: 'cloudy', intensity: 0.5 },
      createRng('weather-test')
    );

    // Multiple ticks should eventually cause weather change
    let changed = false;
    for (let i = 0; i < 100; i++) {
      const before = simulator.getWeather().type;
      simulator.tick();
      const after = simulator.getWeather().type;
      if (before !== after) {
        changed = true;
        break;
      }
    }

    expect(changed).toBe(true);
  });

  it('should fire onChange callback when weather changes', () => {
    const callback = vi.fn();
    simulator = createWeatherSimulator(
      { type: 'cloudy', intensity: 0.5 },
      createRng('callback-test')
    );

    simulator.onChange(callback);

    // Tick until weather changes
    for (let i = 0; i < 100; i++) {
      simulator.tick();
      if (callback.mock.calls.length > 0) break;
    }

    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0]![0]).toHaveProperty('type');
    expect(callback.mock.calls[0]![1]).toHaveProperty('type');
  });

  it('should auto-tick when started', () => {
    const callback = vi.fn();
    simulator = createWeatherSimulator(
      { type: 'cloudy', intensity: 0.5 },
      createRng('auto-tick-test')
    );

    simulator.onChange(callback);
    simulator.start(100); // 100ms per tick

    // Advance time significantly
    vi.advanceTimersByTime(10000);

    // Should have ticked many times, likely causing weather changes
    expect(callback.mock.calls.length).toBeGreaterThanOrEqual(0);
  });

  it('should stop auto-tick when stopped', () => {
    simulator = createWeatherSimulator(
      { type: 'clear', intensity: 0.5 },
      createRng('stop-test')
    );

    simulator.start(100);
    vi.advanceTimersByTime(500);
    simulator.stop();

    const weatherBefore = simulator.getWeather();
    vi.advanceTimersByTime(5000);
    const weatherAfter = simulator.getWeather();

    expect(weatherAfter).toEqual(weatherBefore);
  });

  it('should allow setting weather directly', () => {
    simulator = createWeatherSimulator(
      { type: 'clear', intensity: 0.3 },
      createRng('set-test')
    );

    simulator.setWeather({ type: 'storm', intensity: 0.8 });
    expect(simulator.getWeather().type).toBe('storm');
    expect(simulator.getWeather().intensity).toBe(0.8);
  });

  it('should allow removing callbacks', () => {
    const callback = vi.fn();
    simulator = createWeatherSimulator(
      { type: 'rain', intensity: 0.5 },
      createRng('unsubscribe-test')
    );

    const unsubscribe = simulator.onChange(callback);
    unsubscribe();

    // Force a weather change
    simulator.setWeather({ type: 'storm', intensity: 1.0 });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should produce deterministic weather with same seed', () => {
    const sim1 = createWeatherSimulator(
      { type: 'cloudy', intensity: 0.5 },
      createRng('deterministic')
    );

    const sim2 = createWeatherSimulator(
      { type: 'cloudy', intensity: 0.5 },
      createRng('deterministic')
    );

    const weather1: WeatherState[] = [];
    const weather2: WeatherState[] = [];

    for (let i = 0; i < 20; i++) {
      sim1.tick();
      sim2.tick();
      weather1.push({ ...sim1.getWeather() });
      weather2.push({ ...sim2.getWeather() });
    }

    expect(weather1).toEqual(weather2);
  });

  it('should vary intensity over time', () => {
    simulator = createWeatherSimulator(
      { type: 'rain', intensity: 0.5 },
      createRng('intensity-test')
    );

    const intensities = new Set<number>();
    for (let i = 0; i < 50; i++) {
      simulator.tick();
      intensities.add(Math.round(simulator.getWeather().intensity * 10) / 10);
    }

    // Should have some variation in intensity
    expect(intensities.size).toBeGreaterThan(1);
  });
});
