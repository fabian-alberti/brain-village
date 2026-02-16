/**
 * Screen Time Tracking Service
 *
 * Provides screen time data via platform-native APIs:
 *   - Android: UsageStatsManager (requires PACKAGE_USAGE_STATS permission)
 *   - iOS: DeviceActivity framework (requires Apple FamilyControls entitlement)
 *
 * Screen time permission is REQUIRED for the app to function.
 * It is checked during onboarding and the app gates on it.
 *
 * In development (SIMULATE_SCREEN_TIME = true), returns deterministic
 * mock data so the app can be tested in Expo Go without native builds.
 */

import { SIMULATE_SCREEN_TIME } from './config';
import type { ExpoScreenTimeInterface } from '../modules/expo-screen-time';

// ─── Types ─────────────────────────────────────────────────────

export interface DailyScreenTime {
  date: string;                        // YYYY-MM-DD
  totalMinutes: number;
  perApp: Record<string, number>;      // appName → minutes
}

// ─── Native Module Bridge ──────────────────────────────────────

let _nativeModule: ExpoScreenTimeInterface | null = null;
let _nativeChecked = false;

function getNativeModule(): ExpoScreenTimeInterface | null {
  if (_nativeChecked) return _nativeModule;
  _nativeChecked = true;
  try {
    _nativeModule = require('../modules/expo-screen-time').default;
  } catch {
    _nativeModule = null;
  }
  return _nativeModule;
}

/**
 * Whether we're using simulated data (development / Expo Go).
 */
export function isSimulationMode(): boolean {
  return SIMULATE_SCREEN_TIME;
}

/**
 * Whether the native screen time module is available on this device.
 * Returns true on Android production builds, false in Expo Go / iOS (for now).
 */
export function isNativeAvailable(): boolean {
  if (SIMULATE_SCREEN_TIME) return false;
  const mod = getNativeModule();
  if (!mod) return false;
  try {
    return mod.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Whether the user has granted screen time / usage access permission.
 * In simulation mode, always returns true.
 */
export async function hasPermission(): Promise<boolean> {
  if (SIMULATE_SCREEN_TIME) return true;
  const mod = getNativeModule();
  if (!mod) return false;
  try {
    return await mod.hasPermission();
  } catch {
    return false;
  }
}

/**
 * Open the system settings screen where the user can grant usage access.
 * Android: Opens "Usage access" settings.
 * Returns true if the settings screen was opened successfully.
 */
export async function requestPermission(): Promise<boolean> {
  if (SIMULATE_SCREEN_TIME) return true;
  const mod = getNativeModule();
  if (!mod) return false;
  try {
    return await mod.requestPermission();
  } catch {
    return false;
  }
}

// ─── Data Fetching ─────────────────────────────────────────────

/**
 * Get today's total screen time and per-app breakdown.
 * Uses native APIs in production or deterministic simulation in development.
 */
export async function getScreenTimeToday(): Promise<DailyScreenTime> {
  if (SIMULATE_SCREEN_TIME) {
    return getSimulatedScreenTime();
  }

  const mod = getNativeModule();
  if (!mod) {
    return { date: todayKey(), totalMinutes: 0, perApp: {} };
  }

  try {
    const hasPerm = await mod.hasPermission();
    if (!hasPerm) {
      return { date: todayKey(), totalMinutes: 0, perApp: {} };
    }

    const [total, stats] = await Promise.all([
      mod.getTotalScreenTime(),
      mod.getUsageStats(),
    ]);

    const perApp: Record<string, number> = {};
    if (stats && typeof stats === 'object') {
      for (const [pkg, entry] of Object.entries(stats)) {
        const info = entry as { totalTimeMinutes: number; appName?: string };
        const name = PACKAGE_TO_APP[pkg] || info.appName || pkg;
        if (info.totalTimeMinutes > 0) {
          perApp[name] = info.totalTimeMinutes;
        }
      }
    }

    return {
      date: todayKey(),
      totalMinutes: typeof total === 'number' ? total : 0,
      perApp,
    };
  } catch {
    return { date: todayKey(), totalMinutes: 0, perApp: {} };
  }
}

/**
 * Filter per-app screen time for a specific set of tracked apps.
 * When `allPerApp` is provided it filters that map directly, avoiding
 * a redundant re-fetch of screen time data.
 */
export function filterPerAppScreenTime(
  trackedApps: string[],
  allPerApp: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const app of trackedApps) {
    if (allPerApp[app] !== undefined) {
      result[app] = allPerApp[app];
    }
  }
  return result;
}

// ─── Simulation ────────────────────────────────────────────────
// Deterministic mock data based on time of day.
// No randomness — values are stable within the same minute.

function getSimulatedScreenTime(): DailyScreenTime {
  const now = new Date();
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

  // Simulate ~4 hours (240 min) total across a waking day (6 AM–10 PM = 960 min)
  const wakingMinutes = Math.max(0, minutesSinceMidnight - 360);
  const totalMinutes = Math.min(240, Math.round(wakingMinutes * 0.25));

  // Distribute across common apps using fixed weights
  const perApp = distributeToApps(totalMinutes);

  return {
    date: todayKey(),
    totalMinutes,
    perApp,
  };
}

/**
 * Distribute total minutes across a fixed set of "popular" apps
 * using deterministic weights. This gives a realistic per-app breakdown
 * for development and testing.
 */
function distributeToApps(totalMinutes: number): Record<string, number> {
  if (totalMinutes === 0) return {};

  const APP_WEIGHTS: [string, number][] = [
    ['Instagram', 25],
    ['TikTok', 22],
    ['YouTube', 18],
    ['WhatsApp', 10],
    ['Snapchat', 8],
    ['Reddit', 6],
    ['Twitter/X', 5],
    ['Discord', 4],
    ['Spotify', 3],
    ['Netflix', 3],
    ['Chrome', 3],
    ['Minecraft', 2],
    ['Duolingo', 1],
  ];

  const totalWeight = APP_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  const result: Record<string, number> = {};

  for (const [app, weight] of APP_WEIGHTS) {
    const minutes = Math.round((weight / totalWeight) * totalMinutes);
    if (minutes > 0) {
      result[app] = minutes;
    }
  }
  return result;
}

// ─── Android Package → App Name Mapping ────────────────────────

const PACKAGE_TO_APP: Record<string, string> = {
  'com.instagram.android': 'Instagram',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.twitter.android': 'Twitter/X',
  'com.facebook.katana': 'Facebook',
  'com.snapchat.android': 'Snapchat',
  'com.linkedin.android': 'LinkedIn',
  'com.pinterest': 'Pinterest',
  'com.reddit.frontpage': 'Reddit',
  'com.instagram.barcelona': 'Threads',
  'com.bereal.ft': 'BeReal',
  'com.roblox.client': 'Roblox',
  'com.mojang.minecraftpe': 'Minecraft',
  'com.king.candycrushsaga': 'Candy Crush',
  'com.supercell.clashroyale': 'Clash Royale',
  'com.innersloth.spacemafia': 'Among Us',
  'com.supercell.brawlstars': 'Brawl Stars',
  'com.miHoYo.GenshinImpact': 'Genshin Impact',
  'com.tencent.ig': 'PUBG Mobile',
  'com.google.android.youtube': 'YouTube',
  'com.netflix.mediaclient': 'Netflix',
  'tv.twitch.android.app': 'Twitch',
  'com.disney.disneyplus': 'Disney+',
  'com.spotify.music': 'Spotify',
  'com.amazon.avod': 'Prime Video',
  'com.hbo.hbonow': 'HBO Max',
  'com.duolingo': 'Duolingo',
  'org.khanacademy.android': 'Khan Academy',
  'org.coursera.android': 'Coursera',
  'com.quizlet.quizletandroid': 'Quizlet',
  'notion.id': 'Notion',
  'com.android.chrome': 'Chrome',
  'com.google.android.apps.maps': 'Maps',
  'com.google.android.calendar': 'Calendar',
  'com.strava': 'Strava',
  'com.myfitnesspal.android': 'MyFitnessPal',
  'com.getsomeheadspace.android': 'Headspace',
  'com.calm.android': 'Calm',
  'com.nike.plusgps': 'Nike Run Club',
  'com.whatsapp': 'WhatsApp',
  'org.telegram.messenger': 'Telegram',
  'com.discord': 'Discord',
  'org.thoughtcrime.securesms': 'Signal',
  'com.facebook.orca': 'Messenger',
};

// ─── Helpers ───────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}
