/**
 * Notification Service
 *
 * Handles two kinds of local notifications:
 *
 * 1. **Daily Goal Reminder** – a repeating notification at the user's chosen
 *    reminderTime (default 09:00) that nudges them to check their goals.
 *
 * 2. **Goal Progress Warning** – a one-shot notification fired when a goal
 *    reaches 75 % or 90 % of its limit, including the goal title and percentage.
 *    Each threshold is sent at most once per goal per day.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constants ──────────────────────────────────────────────────
const DAILY_REMINDER_ID = 'daily-goal-reminder';
const WARNED_GOALS_KEY = '@bv_warned_goals';

// Thresholds at which we fire a progress warning (ascending order)
const PROGRESS_THRESHOLDS = [75, 90] as const;

// ─── Notification channel (Android) ─────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

// ─── Permission ─────────────────────────────────────────────────

/**
 * Request permission to send local notifications.
 * Returns `true` if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check whether notification permissions are currently granted.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Daily Reminder ─────────────────────────────────────────────

/**
 * Schedule (or reschedule) the daily goal reminder at the given time.
 *
 * @param hour   - hour of the day (0-23)
 * @param minute - minute of the hour (0-59)
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel any existing daily reminder first
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Brain Village',
      body: "Good morning! Check in on today's goals and keep your village flourishing.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancel the daily reminder notification.
 */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
}

/**
 * Convenience: parse a "HH:MM" string and schedule the daily reminder.
 * If notifications are disabled, cancels any existing reminder instead.
 */
export async function syncDailyReminder(
  reminderTime: string,
  notificationsEnabled: boolean,
): Promise<void> {
  if (!notificationsEnabled) {
    await cancelDailyReminder();
    return;
  }

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const [h, m] = reminderTime.split(':').map(Number);
  const hour = isNaN(h) ? 9 : h;
  const minute = isNaN(m) ? 0 : m;

  await scheduleDailyReminder(hour, minute);
}

// ─── Goal Progress Warnings ─────────────────────────────────────

/**
 * Get the set of (goalId-threshold) pairs that have already been warned today.
 */
async function getWarnedGoals(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(WARNED_GOALS_KEY);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as { date: string; keys: string[] };
    const today = new Date().toISOString().split('T')[0];

    // Expire if from a different day
    if (parsed.date !== today) {
      await AsyncStorage.removeItem(WARNED_GOALS_KEY);
      return new Set();
    }

    return new Set(parsed.keys);
  } catch {
    return new Set();
  }
}

/**
 * Mark a (goalId-threshold) pair as warned for today.
 */
async function markWarned(goalId: string, threshold: number): Promise<void> {
  const warned = await getWarnedGoals();
  warned.add(`${goalId}-${threshold}`);

  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(
    WARNED_GOALS_KEY,
    JSON.stringify({ date: today, keys: Array.from(warned) }),
  );
}

/**
 * Check goal progress and fire a warning notification if it crosses
 * the 75 % or 90 % threshold (once per goal per threshold per day).
 *
 * Call this after any progress update.
 *
 * @param goalId   – the goal's unique id
 * @param goalName – the goal's display name (shown in the notification)
 * @param progress – the current progress value
 * @param limit    – the goal's limit value
 * @param notificationsEnabled – whether the user has notifications turned on
 */
export async function checkProgressWarning(
  goalId: string,
  goalName: string,
  progress: number,
  limit: number,
  notificationsEnabled: boolean,
): Promise<void> {
  if (!notificationsEnabled || limit <= 0) return;
  if (Platform.OS === 'web') return;

  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) return;

  const percentage = (progress / limit) * 100;
  const warned = await getWarnedGoals();

  for (const threshold of PROGRESS_THRESHOLDS) {
    const key = `${goalId}-${threshold}`;
    if (percentage >= threshold && !warned.has(key)) {
      const rounded = Math.round(percentage);

      let body: string;
      if (threshold === 90) {
        body = `You've reached ${rounded}% of "${goalName}". Almost at your limit!`;
      } else {
        body = `You've reached ${rounded}% of "${goalName}". Stay mindful!`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Goal Progress Warning',
          body,
          sound: true,
        },
        trigger: null, // fire immediately
      });

      await markWarned(goalId, threshold);
    }
  }
}

/**
 * Reset the warned-goals tracker (call during daily reset).
 */
export async function resetProgressWarnings(): Promise<void> {
  await AsyncStorage.removeItem(WARNED_GOALS_KEY);
}

// ─── Cleanup ────────────────────────────────────────────────────

/**
 * Cancel all scheduled notifications (e.g. on sign-out).
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await resetProgressWarnings();
}
