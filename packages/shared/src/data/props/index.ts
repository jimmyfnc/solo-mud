/**
 * Props system exports
 */
export * from './types';
export * from './tags';

// Location prop collections
export { INN_PROPS } from './inn-props';
export { SQUARE_PROPS } from './square-props';
export { TRAINING_PROPS } from './training-props';
export { TEMPLE_PROPS } from './temple-props';
export { BLACKSMITH_PROPS } from './blacksmith-props';
export { ALCHEMIST_PROPS } from './alchemist-props';
export { GENERAL_PROPS } from './general-props';
export { GATE_PROPS } from './gate-props';
export { MARKET_PROPS } from './market-props';
export { EASTROAD_PROPS } from './eastroad-props';
export { OUTSIDE_PROPS } from './outside-props';
export { ALLEY_PROPS } from './alley-props';
export { BANK_PROPS } from './bank-props';

import type { PropDefinition } from './types';
import { INN_PROPS } from './inn-props';
import { SQUARE_PROPS } from './square-props';
import { TRAINING_PROPS } from './training-props';
import { TEMPLE_PROPS } from './temple-props';
import { BLACKSMITH_PROPS } from './blacksmith-props';
import { ALCHEMIST_PROPS } from './alchemist-props';
import { GENERAL_PROPS } from './general-props';
import { GATE_PROPS } from './gate-props';
import { MARKET_PROPS } from './market-props';
import { EASTROAD_PROPS } from './eastroad-props';
import { OUTSIDE_PROPS } from './outside-props';
import { ALLEY_PROPS } from './alley-props';
import { BANK_PROPS } from './bank-props';

/** Master registry of all props by ID */
export const PROP_REGISTRY: Record<string, PropDefinition> = {
  ...INN_PROPS,
  ...SQUARE_PROPS,
  ...TRAINING_PROPS,
  ...TEMPLE_PROPS,
  ...BLACKSMITH_PROPS,
  ...ALCHEMIST_PROPS,
  ...GENERAL_PROPS,
  ...GATE_PROPS,
  ...MARKET_PROPS,
  ...EASTROAD_PROPS,
  ...OUTSIDE_PROPS,
  ...ALLEY_PROPS,
  ...BANK_PROPS,
};

/** Get a prop by ID */
export function getProp(propId: string): PropDefinition | undefined {
  return PROP_REGISTRY[propId];
}

/** Map of location IDs to their props */
export const LOCATION_PROPS: Record<string, Record<string, PropDefinition>> = {
  town_inn: INN_PROPS,
  town_square: SQUARE_PROPS,
  town_training: TRAINING_PROPS,
  town_temple: TEMPLE_PROPS,
  town_blacksmith: BLACKSMITH_PROPS,
  town_alchemist: ALCHEMIST_PROPS,
  town_general: GENERAL_PROPS,
  town_gate: GATE_PROPS,
  town_market: MARKET_PROPS,
  town_east_road: EASTROAD_PROPS,
  town_outside_walls: OUTSIDE_PROPS,
  town_north_alley: ALLEY_PROPS,
  town_bank: BANK_PROPS,
};

/** Get all props for a location */
export function getPropsForLocation(locationId: string): Record<string, PropDefinition> {
  return LOCATION_PROPS[locationId] || {};
}

/** Get visible (non-hidden) props for a location */
export function getVisibleProps(locationId: string): PropDefinition[] {
  const props = LOCATION_PROPS[locationId];
  if (!props) return [];
  return Object.values(props).filter(p => !p.hidden);
}

/** Find a prop by name or partial match within a location */
export function findPropByName(
  locationId: string,
  searchTerm: string
): PropDefinition | undefined {
  const props = LOCATION_PROPS[locationId];
  if (!props) return undefined;

  const term = searchTerm.toLowerCase();

  // Exact match first
  for (const prop of Object.values(props)) {
    if (prop.name.toLowerCase() === term) {
      return prop;
    }
  }

  // Then partial match
  for (const prop of Object.values(props)) {
    if (prop.name.toLowerCase().includes(term)) {
      return prop;
    }
  }

  return undefined;
}
