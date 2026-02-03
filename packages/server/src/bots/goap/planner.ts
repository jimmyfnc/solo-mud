/**
 * GOAP Planner - selects actions based on goals and available actions.
 */

import type { BotPlayer } from '../bot-player';
import { selectHighestPriorityGoal } from './goals';
import { getAvailableActions, getActionCost } from './actions';

/** Map of goals to actions that can help achieve them */
const GOAL_TO_ACTIONS: Record<string, string[]> = {
  survive: ['flee', 'use_potion', 'rest'],
  heal_up: ['use_potion', 'rest'],
  level_up: ['attack', 'explore', 'travel'],
  get_richer: ['loot', 'sell_item', 'attack'], // Attack for XP/drops
  socialize: ['say'],
  explore: ['explore', 'travel'],
  rest: ['rest'],
};

/** Select the best action for a given goal */
export function selectBestAction(bot: BotPlayer, goalId: string): string | null {
  const availableActions = getAvailableActions(bot);
  const goalActions = GOAL_TO_ACTIONS[goalId] || [];

  // Filter to actions that are both available and relevant to the goal
  let candidateActions = availableActions.filter((a) => goalActions.includes(a));

  if (candidateActions.length === 0) {
    // Fall back to any available action
    if (availableActions.length === 0) return null;
    candidateActions = [...availableActions];
  }

  // Sort by cost (lower is better)
  candidateActions.sort((a, b) => getActionCost(a, bot) - getActionCost(b, bot));

  return candidateActions[0] || null;
}

/** Create a plan (list of actions) for the bot */
export function planActions(bot: BotPlayer): string[] {
  // Select highest priority goal
  const goalId = selectHighestPriorityGoal(bot);

  // Store current goal on bot
  bot.currentGoalId = goalId;

  // Select best action for this goal
  const action = selectBestAction(bot, goalId);

  if (!action) {
    return [];
  }

  // For now, return single-step plan
  // Future: implement multi-step planning with A*
  return [action];
}

/** Get the next action to execute */
export function getNextAction(bot: BotPlayer): string | null {
  // If we have a plan, use it
  if (bot.currentPlan && bot.currentPlan.length > 0) {
    return bot.currentPlan[0] ?? null;
  }

  // Otherwise, create a new plan
  const plan = planActions(bot);
  bot.currentPlan = plan;

  return plan[0] || null;
}

/** Mark current action as complete */
export function completeAction(bot: BotPlayer): void {
  if (bot.currentPlan && bot.currentPlan.length > 0) {
    bot.currentPlan.shift();
  }
}
