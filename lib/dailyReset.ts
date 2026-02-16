/**
 * Automated Daily Reset
 *
 * Handles the end-of-day / start-of-day transition:
 *
 * 1. Detects when a new day has started (via foreground check).
 * 2. Fails any active goals that were NOT completed the previous day.
 * 3. Resets daily progress (currentProgress, appProgress, isCompleted) for all goals.
 * 4. Stores the last reset date in AsyncStorage so it only runs once per day.
 *
 * Works in both TEST_MODE (local state only) and production (Firebase).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, User } from './types';
import {
  resetDailyProgress,
  failGoal,
} from './firebase';

// ─── Storage Key ───────────────────────────────────────────────
const LAST_RESET_KEY = '@bv_last_daily_reset';

// ─── Types ─────────────────────────────────────────────────────

export interface DailyResetResult {
  didReset: boolean;
  failedGoalIds: string[];
  resetDate: string;
  previousResetDate: string | null;
}

// ─── Core Logic ────────────────────────────────────────────────

/**
 * Get the date string (YYYY-MM-DD) for the last daily reset.
 */
export async function getLastResetDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_RESET_KEY);
  } catch {
    return null;
  }
}

/**
 * Check whether a daily reset is needed (i.e. last reset was before today).
 */
export async function isDailyResetNeeded(): Promise<boolean> {
  const lastReset = await getLastResetDate();
  const today = getTodayDate();
  return lastReset !== today;
}

/**
 * Perform the daily reset for TEST_MODE (local state only).
 *
 * Returns an object describing what happened so the caller can
 * dispatch the appropriate state updates.
 */
export async function performLocalDailyReset(
  goals: Goal[],
  user: User | null,
): Promise<DailyResetResult> {
  const today = getTodayDate();
  const lastReset = await getLastResetDate();

  // Already reset today
  if (lastReset === today) {
    return { didReset: false, failedGoalIds: [], resetDate: today, previousResetDate: lastReset };
  }

  const failedGoalIds: string[] = [];

  // Only fail goals if there was a previous reset (not first launch)
  if (lastReset) {
    // Find active goals that were NOT completed yesterday
    const activeUncompleted = goals.filter(g => g.isActive && !g.isCompleted);
    for (const goal of activeUncompleted) {
      failedGoalIds.push(goal.id);
    }
  }

  // Mark today as reset
  await AsyncStorage.setItem(LAST_RESET_KEY, today);

  return {
    didReset: true,
    failedGoalIds,
    resetDate: today,
    previousResetDate: lastReset,
  };
}

/**
 * Perform the daily reset for PRODUCTION mode (Firebase).
 *
 * Calls Firebase functions to fail uncompleted goals and reset progress.
 */
export async function performFirebaseDailyReset(
  userId: string,
  goals: Goal[],
): Promise<DailyResetResult> {
  const today = getTodayDate();
  const lastReset = await getLastResetDate();

  // Already reset today
  if (lastReset === today) {
    return { didReset: false, failedGoalIds: [], resetDate: today, previousResetDate: lastReset };
  }

  const failedGoalIds: string[] = [];

  // Only fail goals if there was a previous reset (not first launch)
  if (lastReset) {
    const activeUncompleted = goals.filter(g => g.isActive && !g.isCompleted);
    for (const goal of activeUncompleted) {
      try {
        await failGoal(userId, goal.id);
        failedGoalIds.push(goal.id);
      } catch (e) {
        console.error(`[DailyReset] Failed to fail goal ${goal.id}:`, e);
      }
    }
  }

  // Reset all goals' daily progress
  try {
    await resetDailyProgress(userId);
  } catch (e) {
    console.error('[DailyReset] Failed to reset daily progress:', e);
  }

  // Mark today as reset
  await AsyncStorage.setItem(LAST_RESET_KEY, today);

  return {
    didReset: true,
    failedGoalIds,
    resetDate: today,
    previousResetDate: lastReset,
  };
}

/**
 * Calculate how many days were missed between two dates.
 * Useful for determining if multiple days were missed (village destruction).
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = Math.abs(b.getTime() - a.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── Helpers ───────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}
