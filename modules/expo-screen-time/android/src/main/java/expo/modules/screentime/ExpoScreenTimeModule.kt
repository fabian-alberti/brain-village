package expo.modules.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

/**
 * Expo native module that bridges Android's UsageStatsManager to JavaScript.
 *
 * Provides:
 *   - Permission checking/requesting for PACKAGE_USAGE_STATS
 *   - Per-app foreground usage data for the current day
 *   - Total screen time for the current day
 *
 * The user must manually grant "Usage access" in system settings.
 * The module opens the correct settings page via requestPermission().
 */
class ExpoScreenTimeModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("ExpoScreenTime")

        // Whether the native module is available (always true on Android)
        Function("isAvailable") {
            true
        }

        // Check if the app has usage stats permission
        AsyncFunction("hasPermission") {
            hasUsageStatsPermission()
        }

        // Open the system Settings screen for usage access
        AsyncFunction("requestPermission") {
            val context = appContext.reactContext ?: return@AsyncFunction false
            try {
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                true
            } catch (e: Exception) {
                false
            }
        }

        // Get per-app usage stats for today
        AsyncFunction("getUsageStats") {
            if (!hasUsageStatsPermission()) {
                return@AsyncFunction emptyMap<String, Any>()
            }

            val context = appContext.reactContext
                ?: return@AsyncFunction emptyMap<String, Any>()
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE)
                as? UsageStatsManager
                ?: return@AsyncFunction emptyMap<String, Any>()

            val (startTime, endTime) = todayRange()
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            ) ?: return@AsyncFunction emptyMap<String, Any>()

            val pm = context.packageManager
            val result = mutableMapOf<String, Map<String, Any>>()

            for (stat in stats) {
                val minutes = stat.totalTimeInForeground / 60_000
                if (minutes <= 0) continue

                // Try to resolve a human-readable app name
                val appName = try {
                    val appInfo = pm.getApplicationInfo(stat.packageName, 0)
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: PackageManager.NameNotFoundException) {
                    stat.packageName
                }

                result[stat.packageName] = mapOf(
                    "packageName" to stat.packageName,
                    "totalTimeMinutes" to minutes,
                    "appName" to appName
                )
            }

            result as Map<String, Any>
        }

        // Get total screen time for today (sum of all foreground times)
        AsyncFunction("getTotalScreenTime") {
            if (!hasUsageStatsPermission()) {
                return@AsyncFunction 0L
            }

            val context = appContext.reactContext ?: return@AsyncFunction 0L
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE)
                as? UsageStatsManager ?: return@AsyncFunction 0L

            val (startTime, endTime) = todayRange()
            val stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            ) ?: return@AsyncFunction 0L

            var totalMinutes = 0L
            for (stat in stats) {
                totalMinutes += stat.totalTimeInForeground / 60_000
            }
            totalMinutes
        }
    }

    // ── Helpers ──────────────────────────────────────────────

    private fun hasUsageStatsPermission(): Boolean {
        val context = appContext.reactContext ?: return false
        val appOpsManager = context.getSystemService(Context.APP_OPS_SERVICE)
            as? AppOpsManager ?: return false

        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOpsManager.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOpsManager.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }

        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun todayRange(): Pair<Long, Long> {
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startTime = calendar.timeInMillis
        return Pair(startTime, endTime)
    }
}
