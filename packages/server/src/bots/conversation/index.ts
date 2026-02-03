/**
 * Bot conversation system - template-based speech for AI players.
 */

export {
  // Template collections
  GREETING_TEMPLATES,
  COMBAT_BARK_TEMPLATES,
  VICTORY_TEMPLATES,
  LOW_HP_TEMPLATES,
  DEATH_TEMPLATES,
  IDLE_CHAT_TEMPLATES,
  // Generation functions
  generateSpeech,
  generateGreeting,
  generateCombatBark,
  generateVictory,
  generateLowHpCall,
  generateIdleChat,
  // Relationship modifiers
  modifyByRelationship,
} from './templates';
