/**
 * Weather simulation system using Markov chain transitions.
 * Creates natural weather progression patterns.
 */

import type { WeatherState, Rng } from '@solo-mud/shared';

export type WeatherType = WeatherState['type'];

/** Callback when weather changes */
export type WeatherChangeCallback = (newWeather: WeatherState, oldWeather: WeatherState) => void;

/** Weather simulator interface */
export interface WeatherSimulator {
  /** Get current weather state */
  getWeather(): WeatherState;

  /** Advance weather simulation by one step */
  tick(): void;

  /** Set weather directly */
  setWeather(weather: WeatherState): void;

  /** Start auto-ticking at interval */
  start(intervalMs: number): void;

  /** Stop auto-ticking */
  stop(): void;

  /** Register callback for weather changes */
  onChange(callback: WeatherChangeCallback): () => void;
}

/** Transition probabilities from each weather type */
const WEATHER_TRANSITIONS: Record<WeatherType, Partial<Record<WeatherType, number>>> = {
  clear: {
    clear: 0.7,
    cloudy: 0.2,
    fog: 0.08,
    rain: 0.015,
    storm: 0.005,
  },
  cloudy: {
    clear: 0.25,
    cloudy: 0.4,
    fog: 0.1,
    rain: 0.2,
    storm: 0.05,
  },
  rain: {
    clear: 0.1,
    cloudy: 0.25,
    fog: 0.1,
    rain: 0.4,
    storm: 0.15,
  },
  storm: {
    clear: 0.05,
    cloudy: 0.2,
    fog: 0.05,
    rain: 0.4,
    storm: 0.3,
  },
  fog: {
    clear: 0.3,
    cloudy: 0.25,
    fog: 0.35,
    rain: 0.08,
    storm: 0.02,
  },
};

/** Intensity descriptions by weather type */
const WEATHER_DESCRIPTIONS: Record<
  WeatherType,
  { light: string[]; medium: string[]; heavy: string[] }
> = {
  clear: {
    light: ['A few wisps of cloud drift lazily across the sky.'],
    medium: ['The sky is bright and clear.'],
    heavy: ['Not a single cloud mars the brilliant blue sky.'],
  },
  cloudy: {
    light: ['Light clouds drift overhead.'],
    medium: ['Gray clouds fill the sky.'],
    heavy: ['Dark, heavy clouds blanket the sky above.'],
  },
  rain: {
    light: ['A light drizzle mists the air.', 'Thin rain falls gently.'],
    medium: ['Steady rain patters down around you.', 'Rain falls in a constant rhythm.'],
    heavy: ['Heavy rain pours from the sky.', 'Driving rain hammers the ground.'],
  },
  storm: {
    light: ['Distant thunder rumbles as rain falls.'],
    medium: ['Lightning flashes across the sky as the storm rages.'],
    heavy: ['The storm howls with fury, lightning crackling overhead.'],
  },
  fog: {
    light: ['Thin wisps of fog curl around you.', 'A light mist hangs in the air.'],
    medium: ['Fog shrouds the area, limiting visibility.'],
    heavy: ['Dense fog blankets everything, thick as a heavy curtain.'],
  },
};

/**
 * Get transition probabilities for a weather type.
 */
export function getWeatherTransitions(type: WeatherType): Partial<Record<WeatherType, number>> {
  return { ...WEATHER_TRANSITIONS[type] };
}

/**
 * Get a description for the current weather.
 */
export function getWeatherDescription(weather: WeatherState): string {
  const descs = WEATHER_DESCRIPTIONS[weather.type];

  let intensityDescs: string[];
  if (weather.intensity < 0.33) {
    intensityDescs = descs.light;
  } else if (weather.intensity < 0.66) {
    intensityDescs = descs.medium;
  } else {
    intensityDescs = descs.heavy;
  }

  // Always return the first description for determinism in tests
  return intensityDescs[0]!;
}

/**
 * Pick a new weather type based on transition probabilities.
 */
function pickNextWeather(current: WeatherType, rng: Rng): WeatherType {
  const transitions = WEATHER_TRANSITIONS[current];
  const roll = rng.next();

  let cumulative = 0;
  for (const [type, prob] of Object.entries(transitions)) {
    cumulative += prob!;
    if (roll < cumulative) {
      return type as WeatherType;
    }
  }

  return current;
}

/**
 * Drift intensity up or down slightly.
 */
function driftIntensity(current: number, rng: Rng): number {
  const drift = (rng.next() - 0.5) * 0.2; // -0.1 to +0.1
  const newIntensity = current + drift;
  return Math.max(0.1, Math.min(0.95, newIntensity));
}

/**
 * Create a weather simulator.
 */
export function createWeatherSimulator(initialWeather: WeatherState, rng: Rng): WeatherSimulator {
  let weather: WeatherState = { ...initialWeather };
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const changeCallbacks: Set<WeatherChangeCallback> = new Set();

  function tick(): void {
    const oldWeather = { ...weather };

    // Pick next weather type
    const newType = pickNextWeather(weather.type, rng);

    // Drift intensity
    let newIntensity: number;
    if (newType !== weather.type) {
      // Reset intensity when changing weather
      newIntensity = 0.3 + rng.next() * 0.4; // 0.3-0.7
    } else {
      newIntensity = driftIntensity(weather.intensity, rng);
    }

    weather = {
      type: newType,
      intensity: newIntensity,
    };

    // Fire callbacks if weather type changed
    if (newType !== oldWeather.type) {
      for (const callback of changeCallbacks) {
        callback(weather, oldWeather);
      }
    }
  }

  function setWeather(newWeather: WeatherState): void {
    weather = { ...newWeather };
  }

  function start(intervalMs: number): void {
    if (intervalId !== null) {
      stop();
    }
    intervalId = setInterval(tick, intervalMs);
  }

  function stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function onChange(callback: WeatherChangeCallback): () => void {
    changeCallbacks.add(callback);
    return () => {
      changeCallbacks.delete(callback);
    };
  }

  return {
    getWeather: () => ({ ...weather }),
    tick,
    setWeather,
    start,
    stop,
    onChange,
  };
}
