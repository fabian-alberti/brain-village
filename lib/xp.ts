import { Goal, GoalType } from './types';

// Base XP for each goal type
const BASE_XP: Record<GoalType, number> = {
  overall_screen_time: 50,
  app_time_limit: 30,
  app_opens_limit: 20,
};

// Level thresholds - XP required to reach each level
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000];

/**
 * Calculate XP reward for a goal based on type and difficulty
 */
export function calculateXpReward(type: GoalType, limit: number): number {
  const baseXp = BASE_XP[type];
  
  // Stricter limits give more XP
  let difficultyMultiplier = 1.0;
  
  if (type === 'app_opens_limit') {
    // For opens: 5 or less = 1.5x, 10 or less = 1.2x
    if (limit <= 5) difficultyMultiplier = 1.5;
    else if (limit <= 10) difficultyMultiplier = 1.2;
  } else {
    // For time limits: 30min or less = 1.5x, 1hr or less = 1.2x
    if (limit <= 30) difficultyMultiplier = 1.5;
    else if (limit <= 60) difficultyMultiplier = 1.2;
  }
  
  return Math.round(baseXp * difficultyMultiplier);
}

/**
 * Get the current level based on total XP
 */
export function getLevelFromXp(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for the next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return Infinity; // Max level reached
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get XP progress within current level (0-100%)
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelXp = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextLevelXp = getXpForNextLevel(currentLevel);
  
  if (nextLevelXp === Infinity) return 100;
  
  const xpInLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  
  return Math.round((xpInLevel / xpNeeded) * 100);
}

/**
 * Calculate goal completion progress percentage
 */
export function getGoalProgress(goal: Goal): number {
  if (goal.limit === 0) return 0;
  
  // For time/opens limits, progress is inverse (less is better)
  // 0% logged = 100% progress toward goal
  // limit reached = 0% remaining progress
  const usedPercentage = (goal.currentProgress / goal.limit) * 100;
  return Math.max(0, Math.min(100, 100 - usedPercentage));
}

/**
 * Check if a goal is met (user stayed under the limit)
 */
export function isGoalMet(goal: Goal): boolean {
  return goal.currentProgress <= goal.limit;
}

/**
 * Get descriptive text for goal type
 */
export function getGoalTypeLabel(type: GoalType): string {
  switch (type) {
    case 'overall_screen_time':
      return 'Overall Screen Time';
    case 'app_time_limit':
      return 'App Time Limit';
    case 'app_opens_limit':
      return 'App Opens Limit';
  }
}

/**
 * Format minutes into human readable string
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}
