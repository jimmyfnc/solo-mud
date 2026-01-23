/**
 * Time-of-day effects on descriptions and gameplay.
 * Controls light levels, visibility, and ambient descriptions.
 */

import type { TimeOfDay } from '@solo-mud/shared';

/** Effects for a specific time of day */
export interface TimeEffects {
  /** Light level from 0 (dark) to 1 (bright) */
  lightLevel: number;
  /** How far the player can see (in tiles) */
  visibilityRange: number;
  /** Ambient description for the time period */
  ambientDescription: string;
}

/** Time effects configuration for each period */
const TIME_EFFECTS_CONFIG: Record<TimeOfDay, TimeEffects> = {
  dawn: {
    lightLevel: 0.4,
    visibilityRange: 4,
    ambientDescription:
      'The sky brightens with the first light of dawn. Birds begin their morning chorus.',
  },
  morning: {
    lightLevel: 0.8,
    visibilityRange: 6,
    ambientDescription:
      'Fresh morning air carries the crisp scent of dew. The world feels bright and new.',
  },
  noon: {
    lightLevel: 1.0,
    visibilityRange: 8,
    ambientDescription:
      'The sun blazes overhead at its peak. Everything is bathed in bright light.',
  },
  afternoon: {
    lightLevel: 0.9,
    visibilityRange: 7,
    ambientDescription:
      'Warm afternoon light casts long, lazy shadows across the land.',
  },
  evening: {
    lightLevel: 0.5,
    visibilityRange: 4,
    ambientDescription:
      'The sun sinks toward the horizon, painting the sky in amber and crimson.',
  },
  night: {
    lightLevel: 0.15,
    visibilityRange: 2,
    ambientDescription:
      'Darkness blankets the land. Stars glitter above and crickets sing in the shadows.',
  },
};

/** Visibility modifiers for each time period */
const VISIBILITY_MODIFIERS: Record<TimeOfDay, number> = {
  dawn: 0.7,
  morning: 0.95,
  noon: 1.0,
  afternoon: 0.95,
  evening: 0.6,
  night: 0.3,
};

/**
 * Get all time effects for a given time of day.
 */
export function getTimeEffects(time: TimeOfDay): TimeEffects {
  return TIME_EFFECTS_CONFIG[time];
}

/**
 * Get the normalized light level (0-1) for a time of day.
 */
export function getLightLevel(time: TimeOfDay): number {
  return TIME_EFFECTS_CONFIG[time].lightLevel;
}

/**
 * Get the visibility modifier (0-1) that affects how far the player can see.
 * 1.0 = full visibility, lower = reduced visibility.
 */
export function getVisibilityModifier(time: TimeOfDay): number {
  return VISIBILITY_MODIFIERS[time];
}

/**
 * Get an ambient description appropriate for the time of day.
 * Includes sounds, feelings, and atmospheric details.
 */
export function getAmbientDescription(time: TimeOfDay): string {
  return TIME_EFFECTS_CONFIG[time].ambientDescription;
}
