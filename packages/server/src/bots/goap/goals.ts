/**
 * GOAP Goal definitions and priority calculations.
 */

import type { BotGoalDef } from '@solo-mud/shared';
import type { BotPlayer } from '../bot-player';

/** Goal definition with runtime functions */
export interface Goal extends BotGoalDef {
  /** Calculate priority for this goal (0-100) */
  getPriority: (bot: BotPlayer) => number;
  /** Check if goal is complete */
  isComplete: (bot: BotPlayer) => boolean;
}

/** All defined goals */
export const GOALS: Record<string, Goal> = {
  survive: {
    id: 'survive',
    category: 'survival',
    description: 'Stay alive - flee, heal, or find safety',
    getPriority: (bot) => {
      const hpPercent = (bot.currentHp / bot.maxHp) * 100;
      let priority = 10; // Base

      // HP-based priority
      if (hpPercent < 30) {
        // Brave bots have lower survive priority (fight longer)
        const braveryMod = bot.botProfile.personality.bravery / 100;
        priority = Math.max(10, 100 - braveryMod * 30);
      } else if (hpPercent < 50) {
        priority = 50 - bot.botProfile.personality.bravery / 5;
      }

      // Recent death modifier - more cautious after dying
      const recentDeath = bot.botProfile.memory.deaths.find(
        (d) => Date.now() - d.timestamp < 300000 // 5 minutes
      );
      if (recentDeath) {
        priority += 15; // More survival-focused after death
      }

      return priority;
    },
    isComplete: (bot) => {
      return bot.currentHp / bot.maxHp >= 0.5;
    },
  },

  heal_up: {
    id: 'heal_up',
    category: 'survival',
    description: 'Restore HP to full',
    getPriority: (bot) => {
      const hpPercent = (bot.currentHp / bot.maxHp) * 100;
      if (hpPercent < 70) {
        return 80 - (hpPercent / 2);
      }
      return 0;
    },
    isComplete: (bot) => {
      return bot.currentHp >= bot.maxHp;
    },
  },

  level_up: {
    id: 'level_up',
    category: 'progression',
    description: 'Gain experience and level up',
    getPriority: (bot) => {
      // Base priority 50, modified by patience (patient bots prioritize leveling)
      const patienceMod = bot.botProfile.personality.patience / 100;
      return 40 + (patienceMod * 20);
    },
    isComplete: (_bot) => {
      // Never "complete" - always want more levels
      return false;
    },
  },

  get_richer: {
    id: 'get_richer',
    category: 'economic',
    description: 'Accumulate wealth',
    getPriority: (bot) => {
      // Greedy bots have higher priority
      const greedMod = bot.botProfile.personality.greed / 100;
      return 30 + (greedMod * 40);
    },
    isComplete: (_bot) => {
      // Never complete - always want more gold
      return false;
    },
  },

  socialize: {
    id: 'socialize',
    category: 'social',
    description: 'Interact with other players or bots',
    getPriority: (bot) => {
      // Social bots have higher priority
      const socialMod = bot.botProfile.personality.sociability / 100;
      const baseP = 20 + socialMod * 30;

      // Lower priority if recently socialized
      const timeSince = Date.now() - bot.botProfile.memory.lastSocialInteraction;
      if (timeSince < 60000) {
        // Less than 1 minute
        return baseP * 0.5;
      }

      // Higher priority if haven't socialized in a while (lonely!)
      if (timeSince > 300000) {
        // More than 5 minutes - social bots seek company
        return baseP + socialMod * 10;
      }

      return baseP;
    },
    isComplete: (bot) => {
      // Complete if socialized recently
      const timeSince = Date.now() - bot.botProfile.memory.lastSocialInteraction;
      return timeSince < 30000; // Within 30 seconds
    },
  },

  explore: {
    id: 'explore',
    category: 'progression',
    description: 'Discover new locations',
    getPriority: (bot) => {
      let priority = 25; // Base

      // Higher if exploration is preferred activity
      if (bot.botProfile.personality.preferredActivities.includes('exploration')) {
        priority = 45;
      }

      // Increase priority if haven't explored recently
      const lastExplore = bot.botProfile.memory.recentEvents.find(
        (e) => e.type === 'explored_location'
      );
      if (!lastExplore || Date.now() - lastExplore.timestamp > 180000) {
        // Haven't explored in 3 minutes - explorers get antsy
        if (bot.botProfile.personality.preferredActivities.includes('exploration')) {
          priority += 10;
        }
      }

      return priority;
    },
    isComplete: (_bot) => {
      // Never complete - always more to explore
      return false;
    },
  },

  rest: {
    id: 'rest',
    category: 'survival',
    description: 'Rest to regenerate faster',
    getPriority: (bot) => {
      const hpPercent = (bot.currentHp / bot.maxHp) * 100;
      const mpPercent = (bot.currentMp / bot.maxMp) * 100;

      // Only rest if not at full and not in immediate danger
      if (hpPercent < 70 || mpPercent < 50) {
        return 35;
      }
      return 0;
    },
    isComplete: (bot) => {
      return bot.currentHp >= bot.maxHp && bot.currentMp >= bot.maxMp;
    },
  },
};

/** Calculate priority for a goal */
export function calculateGoalPriority(goalId: string, bot: BotPlayer): number {
  const goal = GOALS[goalId];
  if (!goal) return 0;
  return goal.getPriority(bot);
}

/** Check if a goal is complete */
export function isGoalComplete(goalId: string, bot: BotPlayer): boolean {
  const goal = GOALS[goalId];
  if (!goal) return true;
  return goal.isComplete(bot);
}

/** Get the highest priority goal for a bot */
export function selectHighestPriorityGoal(bot: BotPlayer): string {
  let highestPriority = -1;
  let selectedGoal = 'level_up'; // Default

  for (const [goalId, goal] of Object.entries(GOALS)) {
    // Skip completed goals
    if (goal.isComplete(bot)) continue;

    const priority = goal.getPriority(bot);
    if (priority > highestPriority) {
      highestPriority = priority;
      selectedGoal = goalId;
    }
  }

  return selectedGoal;
}
