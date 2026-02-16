import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useScreenTime } from '@/context/AppContext';
import {
  requestPermission,
  hasPermission,
  isNativeAvailable,
  isSimulationMode,
} from '@/lib/screenTime';

export default function ScreenTimePermissionScreen() {
  const screenTime = useScreenTime();
  const [checking, setChecking] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  // Re-check permission every time the app comes to foreground
  // (user may have just toggled it in Android Settings)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        const hasPerm = await hasPermission();
        if (hasPerm) {
          screenTime.refreshScreenTime();
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [screenTime]);

  const handleGrantPermission = async () => {
    setChecking(true);
    try {
      await requestPermission();
      // After returning from settings, wait briefly and re-check
      setTimeout(async () => {
        const hasPerm = await hasPermission();
        if (hasPerm) {
          screenTime.refreshScreenTime();
        }
        setChecking(false);
      }, 1500);
    } catch {
      setChecking(false);
    }
  };

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const hasPerm = await hasPermission();
      if (hasPerm) {
        screenTime.refreshScreenTime();
      }
    } finally {
      setChecking(false);
    }
  };

  const isAndroid = Platform.OS === 'android';
  const simulation = isSimulationMode();
  const nativeAvail = isNativeAvailable();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        {/* Icon */}
        <View style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: '#FFF3E0',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          <MaterialCommunityIcons name="cellphone-lock" size={48} color="#E65100" />
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 24,
          fontWeight: '800',
          color: '#1A1A1A',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          Screen Time Access Required
        </Text>

        {/* Description */}
        <Text style={{
          fontSize: 15,
          color: '#8B9D77',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 16,
        }}>
          Brain Village automatically tracks your screen time to help you meet your goals.
          To do this, we need access to your device's usage data.
        </Text>

        {/* How it works */}
        <View style={{
          backgroundColor: '#F5F5F0',
          borderRadius: 14,
          padding: 16,
          width: '100%',
          marginBottom: 32,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: 10,
          }}>
            How it works:
          </Text>
          {[
            'We read your daily screen time totals',
            'We track time per app to update your goals',
            'All data stays on your device — nothing is shared',
          ].map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color="#2D5A3D"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text style={{ fontSize: 13, color: '#4A4A4A', flex: 1, lineHeight: 20 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>

        {/* Main action button */}
        {isAndroid && nativeAvail && (
          <TouchableOpacity
            onPress={handleGrantPermission}
            disabled={checking}
            style={{
              width: '100%',
              backgroundColor: '#2D5A3D',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 12,
              opacity: checking ? 0.7 : 1,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {checking ? 'Checking...' : 'Open Usage Access Settings'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Fallback for non-Android or no native module */}
        {(!isAndroid || !nativeAvail) && !simulation && (
          <View style={{
            width: '100%',
            backgroundColor: '#FFF3E0',
            borderRadius: 14,
            padding: 16,
            marginBottom: 12,
            alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#E65100" />
            <Text style={{
              fontSize: 14,
              color: '#E65100',
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 20,
            }}>
              {Platform.OS === 'ios'
                ? 'Screen time tracking on iOS requires a special build. Please use the Android version for full functionality.'
                : 'Screen time tracking requires a production build. This feature is not available in Expo Go.'}
            </Text>
          </View>
        )}

        {/* Re-check button */}
        <TouchableOpacity
          onPress={handleRecheck}
          disabled={checking}
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            opacity: checking ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D5A3D' }}>
            {checking ? 'Checking...' : "I've Granted Permission"}
          </Text>
        </TouchableOpacity>

        {/* Android-specific hint */}
        {isAndroid && nativeAvail && (
          <Text style={{
            fontSize: 12,
            color: '#999',
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 18,
            paddingHorizontal: 12,
          }}>
            After tapping the button above, find "Brain Village" in the list and enable usage access. Then return to the app.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
