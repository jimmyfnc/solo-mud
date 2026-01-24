/**
 * Descriptions module - dynamic text generation.
 */

export {
  generateDescription,
  getShortDescription,
  generateExitProse,
  type DescriptionContext,
  type DescriptionTemplate,
  type TemplateVariant,
  type TemplateConditions,
  type Biome,
  type Weather,
  type ExitInfo,
} from './templates';

export {
  getTimeEffects,
  getLightLevel,
  getVisibilityModifier,
  getAmbientDescription,
  type TimeEffects,
} from './time-effects';
