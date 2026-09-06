import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PERSIST_MAX_AGE, persister, queryClient } from '@/api/persist';
import { useDevDriver } from '@/lib/devDriver';
import { postIdFromResponse, setupNotifications } from '@/lib/notifications';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

/** iOS 26 headers are Liquid Glass already; only older iOS needs a blur. */
const legacyBlur = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) < 26 ? ('systemChromeMaterial' as const) : undefined;
import { brand } from '@/theme/tokens';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ fade: true, duration: 350 });
setupNotifications();

export default function RootLayout() {
  // Fonts are embedded natively by the expo-font config plugin in development
  // builds; loading them here as well makes Expo Go (no config plugins) work.
  const [fontsReady] = useFonts({
    'BarlowCondensed-Medium': require('@/assets/fonts/BarlowCondensed-Medium.ttf'),
    'BarlowCondensed-SemiBold': require('@/assets/fonts/BarlowCondensed-SemiBold.ttf'),
    'BarlowCondensed-Bold': require('@/assets/fonts/BarlowCondensed-Bold.ttf'),
    'BarlowCondensed-ExtraBold': require('@/assets/fonts/BarlowCondensed-ExtraBold.ttf'),
    'BarlowCondensed-BoldItalic': require('@/assets/fonts/BarlowCondensed-BoldItalic.ttf'),
  });
  if (!fontsReady) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: PERSIST_MAX_AGE, buster: 'v1' }}>
        <ThemeProvider>
          <Navigation />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

function Navigation() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  useNotificationRouting();
  useDevDriver();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.tint,
      background: colors.bg,
      card: colors.bgElevated,
      text: colors.text,
      border: colors.border,
      notification: brand.crimson,
    },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerTintColor: colors.tint,
          headerTitleStyle: { color: colors.text },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="artikel/[id]" options={{ title: '', headerTransparent: Platform.OS === 'ios', headerBlurEffect: legacyBlur, headerShadowVisible: false }} />
        <Stack.Screen name="ressort/[id]" options={{ headerLargeTitle: true, headerTransparent: Platform.OS === 'ios', headerBlurEffect: legacyBlur }} />
        <Stack.Screen name="autor/[id]" options={{ title: '', headerTransparent: Platform.OS === 'ios', headerBlurEffect: legacyBlur }} />
        <Stack.Screen name="seite/[slug]" options={{ title: '', headerLargeTitle: true, headerTransparent: Platform.OS === 'ios', headerBlurEffect: legacyBlur }} />
        <Stack.Screen
          name="kommentare/[id]"
          options={{
            title: 'Kommentare',
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'card',
            sheetAllowedDetents: [0.75, 1],
            sheetGrabberVisible: true,
            headerShown: Platform.OS === 'android',
            animation: Platform.OS === 'android' ? 'slide_from_bottom' : undefined,
          }}
        />
        <Stack.Screen name="einstellungen" options={{ title: 'Einstellungen', presentation: 'modal' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Nicht gefunden' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

/** Open the article a notification points to, both from cold start and while running. */
const handledNotifications = new Set<string>();

function useNotificationRouting() {
  const router = useRouter();
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null | undefined) => {
      if (!response) return;
      const key = response.notification.request.identifier || `${response.notification.date}`;
      if (handledNotifications.has(key)) return;
      handledNotifications.add(key);
      const id = postIdFromResponse(response);
      if (id) router.push({ pathname: '/artikel/[id]', params: { id: String(id) } });
    };
    // Cold start: the tap that launched the app.
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    // Warm: taps while the app is running or in the background.
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);
}
