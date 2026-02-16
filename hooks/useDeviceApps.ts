import { useState, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { APP_CATEGORIES, AppCategory } from '@/lib/types';
import { SIMULATE_DEVICE_APPS } from '@/lib/config';

// The apps that the simulator pretends are "installed".
// Change this list to test different scenarios.
const SIMULATED_INSTALLED_APPS = [
  // Social
  'Instagram', 'TikTok', 'Facebook', 'Snapchat', 'Reddit',
  // Entertainment
  'YouTube', 'Netflix', 'Spotify',
  // Messaging
  'WhatsApp', 'Discord', 'iMessage',
  // Games
  'Minecraft', 'Among Us',
  // Utilities
  'Safari', 'Chrome', 'Maps', 'Calendar',
  // Health
  'Strava', 'Health',
  // Education
  'Duolingo', 'Notion',
];
// ──────────────────────────────────────────────────────────────

/**
 * Hook that detects which apps from our predefined list are actually
 * installed on the user's device.
 *
 * How it works:
 * - When SIMULATE_DEVICE_APPS is true: filters the predefined list to
 *   only include apps in SIMULATED_INSTALLED_APPS (for testing).
 * - On iOS/Android (real build): uses Linking.canOpenURL(scheme) to check
 *   each app's URL scheme.
 * - On web / Expo Go fallback: returns the full predefined list.
 *
 * iOS note: for canOpenURL to work in a production build, the URL schemes
 * must be listed in Info.plist under LSApplicationQueriesSchemes (configured
 * in app.json → ios.infoPlist).
 */
export function useDeviceApps() {
  const [categories, setCategories] = useState<AppCategory[]>(APP_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceFiltered, setIsDeviceFiltered] = useState(false);

  useEffect(() => {
    // ── Simulated mode (for testing) ──
    if (SIMULATE_DEVICE_APPS) {
      const filtered: AppCategory[] = [];
      for (const cat of APP_CATEGORIES) {
        const installedApps = cat.apps.filter(app =>
          SIMULATED_INSTALLED_APPS.includes(app.name),
        );
        if (installedApps.length > 0) {
          filtered.push({ ...cat, apps: installedApps });
        }
      }
      setCategories(filtered);
      setIsDeviceFiltered(true);
      setIsLoading(false);
      return;
    }

    // ── Web: can't detect installed apps ──
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    // ── Native: real detection via URL schemes ──
    let cancelled = false;

    const detect = async () => {
      try {
        const results = await Promise.all(
          APP_CATEGORIES.flatMap(cat =>
            cat.apps.map(async (app) => {
              if (!app.urlScheme) {
                return { categoryId: cat.id, app, installed: true };
              }
              try {
                const canOpen = await Linking.canOpenURL(app.urlScheme);
                return { categoryId: cat.id, app, installed: canOpen };
              } catch {
                return { categoryId: cat.id, app, installed: false };
              }
            }),
          ),
        );

        if (cancelled) return;

        const filtered: AppCategory[] = [];
        let totalDetected = 0;

        for (const cat of APP_CATEGORIES) {
          const installedApps = results
            .filter(r => r.categoryId === cat.id && r.installed)
            .map(r => r.app);

          totalDetected += installedApps.length;

          if (installedApps.length > 0) {
            filtered.push({ ...cat, apps: installedApps });
          }
        }

        // If very few apps detected (e.g. Expo Go), fall back to full list
        const MIN_APPS_THRESHOLD = 3;
        if (totalDetected >= MIN_APPS_THRESHOLD && filtered.length > 0) {
          setCategories(filtered);
          setIsDeviceFiltered(true);
        }
      } catch (error) {
        console.log('Device app detection failed, using full list:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    detect();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading, isDeviceFiltered };
}
