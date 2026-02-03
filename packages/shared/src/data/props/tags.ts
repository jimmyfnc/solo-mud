/**
 * Tag-based interactions between props and items.
 * Tags enable automatic item+prop matching (e.g., any 'fillable' item works with any 'water_source' prop).
 * The ${item} and ${prop} placeholders get replaced at runtime.
 */

import type { TagInteraction } from './types';

export const TAG_INTERACTIONS: Record<string, TagInteraction> = {
  'water_source': {
    itemTags: ['fillable'],
    verb: 'fill',
    text: 'You fill your ${item} from the ${prop}. Cool water sloshes inside.',
    resultItem: '${item.baseId}_filled',
    consumeItem: true,
  },
  'fire': {
    itemTags: ['lightable'],
    verb: 'light',
    text: 'You hold the ${item} to the flames until it catches, casting dancing shadows.',
    effect: 'light_source',
  },
  'heat_source': {
    itemTags: ['cookable'],
    verb: 'cook',
    text: 'You carefully cook the ${item} over the ${prop}. The smell is enticing.',
    resultItem: '${item.baseId}_cooked',
    consumeItem: true,
  },
  'holy_water_source': {
    itemTags: ['fillable'],
    verb: 'fill',
    text: 'You reverently fill your ${item} with blessed water. It seems to glow faintly.',
    resultItem: 'holy_water',
    consumeItem: true,
  },
};
