import ExpoModulesCore

/**
 * iOS stub for the ExpoScreenTime module.
 *
 * Apple's Screen Time API (DeviceActivity / FamilyControls) requires a
 * special entitlement that must be approved by Apple. Until that entitlement
 * is obtained, this module returns empty/false for all queries.
 *
 * To enable real iOS screen time tracking:
 * 1. Apply for the FamilyControls entitlement via Apple Developer portal.
 * 2. Add FamilyControls capability to the Xcode project.
 * 3. Implement DeviceActivityMonitor to track app usage.
 * 4. Update this module to bridge the native data to JavaScript.
 */
public class ExpoScreenTimeModule: Module {

    public func definition() -> ModuleDefinition {
        Name("ExpoScreenTime")

        // Screen Time API not available without Apple entitlement
        Function("isAvailable") { () -> Bool in
            return false
        }

        AsyncFunction("hasPermission") { () -> Bool in
            return false
        }

        AsyncFunction("requestPermission") { () -> Bool in
            // Would call AuthorizationCenter.shared.requestAuthorization(for:)
            // once FamilyControls entitlement is approved.
            return false
        }

        AsyncFunction("getUsageStats") { () -> [String: Any] in
            return [:]
        }

        AsyncFunction("getTotalScreenTime") { () -> Int in
            return 0
        }
    }
}
