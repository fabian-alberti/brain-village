/**
 * Expo Screen Time Module
 *
 * Provides access to platform-native screen time / usage statistics:
 *   - Android: UsageStatsManager (per-app foreground time)
 *   - iOS: Stub — requires Apple's FamilyControls entitlement for real data
 *
 * Usage:
 *   import ExpoScreenTime from './modules/expo-screen-time';
 *   if (ExpoScreenTime) {
 *     const hasPermission = await ExpoScreenTime.hasPermission();
 *     const stats = await ExpoScreenTime.getUsageStats();
 *   }
 *
 * NOTE: This module only works in development builds (EAS Build) or
 * standalone apps. It is NOT available in Expo Go.
 */

export interface UsageStatEntry {
  packageName: string;
  totalTimeMinutes: number;
  appName?: string;
}

export interface ExpoScreenTimeInterface {
  /**
   * Whether native screen time APIs are available on this platform.
   */
  isAvailable(): boolean;

  /**
   * Whether the app has permission to read usage statistics.
   * Android: PACKAGE_USAGE_STATS permission.
   * iOS: Always returns false (requires FamilyControls entitlement).
   */
  hasPermission(): Promise<boolean>;

  /**
   * Open the system settings screen where the user can grant usage access.
   * Android: Opens "Usage access" settings.
   * iOS: No-op (returns false).
   */
  requestPermission(): Promise<boolean>;

  /**
   * Get per-app usage statistics for today.
   * Returns a map of package name → usage entry.
   */
  getUsageStats(): Promise<Record<string, UsageStatEntry>>;

  /**
   * Get total device screen time for today in minutes.
   */
  getTotalScreenTime(): Promise<number>;
}

// Try to load the native module. Returns null if not available (Expo Go, web).
let ExpoScreenTime: ExpoScreenTimeInterface | null = null;

try {
  const { requireNativeModule } = require('expo-modules-core');
  ExpoScreenTime = requireNativeModule('ExpoScreenTime');
} catch {
  // Native module not available — running in Expo Go or on web.
  ExpoScreenTime = null;
}

export default ExpoScreenTime;
