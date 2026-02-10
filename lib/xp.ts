import { Goal, GoalType, APP_CATEGORIES } from './types';

// ============ XP LOOKUP TABLES ============
// Each entry: { maxLimit (inclusive, in minutes or opens), baseXp }
// Sorted from strictest to most lenient – first match wins.

const SCREEN_TIME_XP_TABLE: { maxLimit: number; baseXp: number }[] = [
  { maxLimit: 30,  baseXp: 180 },  // Below 0h 30min
  { maxLimit: 60,  baseXp: 140 },  // Below 1h 00min
  { maxLimit: 90,  baseXp: 110 },  // Below 1h 30min
  { maxLimit: 120, baseXp: 85 },   // Below 2h 00min
  { maxLimit: 150, baseXp: 65 },   // Below 2h 30min
  { maxLimit: 180, baseXp: 50 },   // Below 3h 00min
  { maxLimit: 210, baseXp: 38 },   // Below 3h 30min
  { maxLimit: 240, baseXp: 28 },   // Below 4h 00min
  { maxLimit: 270, baseXp: 20 },   // Below 4h 30min
  { maxLimit: 300, baseXp: 15 },   // Below 5h 00min
];

const APP_TIME_XP_TABLE: { maxLimit: number; baseXp: number }[] = [
  { maxLimit: 0,   baseXp: 80 },   // Below 0h 00min (don't open at all)
  { maxLimit: 30,  baseXp: 55 },   // Below 0h 30min
  { maxLimit: 60,  baseXp: 40 },   // Below 1h 00min
  { maxLimit: 90,  baseXp: 28 },   // Below 1h 30min
  { maxLimit: 120, baseXp: 20 },   // Below 2h 00min
  { maxLimit: 150, baseXp: 14 },   // Below 2h 30min
  { maxLimit: 180, baseXp: 10 },   // Below 3h 00min
];

const APP_OPENS_XP_TABLE: { maxLimit: number; baseXp: number }[] = [
  { maxLimit: 1,  baseXp: 80 },   // Fewer than 1 time
  { maxLimit: 3,  baseXp: 50 },   // Fewer than 3 times
  { maxLimit: 5,  baseXp: 35 },   // Fewer than 5 times
  { maxLimit: 10, baseXp: 22 },   // Fewer than 10 times
  { maxLimit: 15, baseXp: 15 },   // Fewer than 15 times
  { maxLimit: 20, baseXp: 10 },   // Fewer than 20 times
];

const XP_TABLES: Record<GoalType, { maxLimit: number; baseXp: number }[]> = {
  overall_screen_time: SCREEN_TIME_XP_TABLE,
  app_time_limit: APP_TIME_XP_TABLE,
  app_opens_limit: APP_OPENS_XP_TABLE,
};

// ============ COMPLETION BONUS ============

const COMPLETION_BONUS = 5; // flat +5 XP for completing any goal

// ============ STREAK MULTIPLIER ============

export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 7) return 1.5;
  if (streakDays >= 5) return 1.4;
  if (streakDays >= 3) return 1.2;
  return 1.0;
}

// ============ LEVEL THRESHOLDS ============
// XP needed to reach each level (cumulative)

export const LEVEL_THRESHOLDS = [0, 100, 300, 650, 1200];

// ============ APP COUNT MULTIPLIER ============
// Tracking more apps makes a goal slightly harder to manage.
// +2% per tracked app beyond the first, capped at +30%.
// Categories are expanded to their actual app count.

const APP_MULT_PER_APP = 0.02;
const APP_MULT_CAP = 1.3;

/**
 * Count the total number of individual apps tracked by a goal.
 * Each selected category is expanded to its actual app count.
 * @param availableCategories  Pass the device-filtered list when available;
 *                             defaults to the full APP_CATEGORIES.
 */
export function getTotalTrackedApps(
  targetApps: string[],
  targetCategories: string[],
  availableCategories = APP_CATEGORIES,
): number {
  let total = targetApps.length;
  for (const catId of targetCategories) {
    const cat = availableCategories.find(c => c.id === catId);
    if (cat) {
      total += cat.apps.length;
    }
  }
  return total;
}

/**
 * Get the app-count multiplier based on the total number of tracked apps.
 */
export function getAppCountMultiplier(
  targetApps: string[],
  targetCategories: string[],
  availableCategories = APP_CATEGORIES,
): number {
  const totalApps = getTotalTrackedApps(targetApps, targetCategories, availableCategories);
  if (totalApps <= 1) return 1.0;
  return Math.min(APP_MULT_CAP, 1.0 + (totalApps - 1) * APP_MULT_PER_APP);
}

// ============ XP CALCULATION ============

/**
 * Look up the base XP for a goal type and limit.
 * Returns the XP from the table, or a minimum fallback for limits outside the table.
 */
export function getBaseXpForGoal(type: GoalType, limit: number): number {
  const table = XP_TABLES[type];

  // Walk through the table (sorted strictest → most lenient).
  // Return the XP for the first entry whose maxLimit >= the goal limit.
  for (const entry of table) {
    if (limit <= entry.maxLimit) {
      return entry.baseXp;
    }
  }

  // Limit is more lenient than anything in the table – use the last (easiest) entry.
  return table[table.length - 1].baseXp;
}

/**
 * Calculate the XP reward stored on the goal (without streak).
 * Includes the app-count multiplier.
 * This is what gets saved to the Goal document.
 */
export function calculateXpReward(
  type: GoalType,
  limit: number,
  targetApps: string[] = [],
  targetCategories: string[] = [],
  availableCategories = APP_CATEGORIES,
): number {
  const base = getBaseXpForGoal(type, limit);
  const appMult = getAppCountMultiplier(targetApps, targetCategories, availableCategories);
  return Math.round(base * appMult);
}

/**
 * Calculate the final XP a user earns when completing a goal.
 * Formula: (Goal XP + Completion Bonus) × Streak Multiplier
 */
export function calculateFinalXp(goalXp: number, streakDays: number): number {
  const multiplier = getStreakMultiplier(streakDays);
  return Math.round((goalXp + COMPLETION_BONUS) * multiplier);
}

// ============ LEVEL HELPERS ============

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

// ============ GOAL PROGRESS HELPERS ============

/**
 * Calculate goal completion progress percentage.
 * For limits, less usage = more progress toward the goal.
 */
export function getGoalProgress(goal: Goal): number {
  if (goal.limit === 0) return goal.currentProgress === 0 ? 100 : 0;

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
