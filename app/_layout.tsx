import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import '../global.css';

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
  const { isAuthenticated, isLoading } = useApp();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'goal';
    const inLoginPage = segments[0] === 'login';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && inLoginPage) {
      // Redirect to main app if on login page while authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

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
