import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp, TEST_MODE } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import '../global.css';
import { isSimulationMode } from '@/lib/screenTime';

// Ensure NativeWind / CSS interop is aligned with Tailwind darkMode="class" on web.
// This prevents runtime crashes like:
// "Cannot manually set color scheme, as dark mode is type 'media'. Please use StyleSheet.setFlag('darkMode', 'class')"
if (Platform.OS === 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const interop = require('react-native-css-interop');
    interop?.StyleSheet?.setFlag?.('darkMode', 'class');
  } catch {
    // ignore – if the module isn't present we don't want to crash the app
  }
}

function RootLayoutNav() {
  const { isAuthenticated, isEmailVerified, isLoading, screenTimeStatus } = useApp();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  // In simulation mode or TEST_MODE, permission is always considered granted
  const hasScreenTimePermission =
    isSimulationMode() || TEST_MODE || screenTimeStatus.hasPermission;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'goal';
    const inLoginPage = segments[0] === 'login';
    const inVerifyPage = segments[0] === 'verify-email';
    const inPermissionPage = segments[0] === 'screen-time-permission';

    if (!isAuthenticated && (inAuthGroup || inPermissionPage)) {
      router.replace('/login');
    } else if (!isAuthenticated && inVerifyPage) {
      router.replace('/login');
    } else if (isAuthenticated && !isEmailVerified && !inVerifyPage) {
      router.replace('/verify-email');
    } else if (isAuthenticated && isEmailVerified && !hasScreenTimePermission && !inPermissionPage) {
      // Gate: require screen time permission before entering the app
      router.replace('/screen-time-permission');
    } else if (isAuthenticated && isEmailVerified && hasScreenTimePermission && (inLoginPage || inVerifyPage || inPermissionPage)) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isEmailVerified, isLoading, hasScreenTimePermission, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="goal/create" 
          options={{ 
            presentation: 'modal',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="goal/[id]" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="verify-email" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="screen-time-permission" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="reset-password" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="faq" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="about" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </>
  );
}

function RootLayoutWithProviders() {
  return (
    <AppProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootLayoutWithProviders />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
