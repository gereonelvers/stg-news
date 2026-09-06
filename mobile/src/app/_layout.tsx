import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PERSIST_MAX_AGE, persister, queryClient } from '@/api/persist';
import { postIdFromResponse, setupNotifications } from '@/lib/notifications';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { brand } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ fade: true, duration: 350 });
setupNotifications();

export default function RootLayout() {
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
        <Stack.Screen name="artikel/[id]" options={{ title: '', headerTransparent: Platform.OS === 'ios', headerBlurEffect: 'systemChromeMaterial', headerShadowVisible: false }} />
        <Stack.Screen name="ressort/[id]" options={{ headerLargeTitle: true, headerTransparent: Platform.OS === 'ios', headerBlurEffect: 'systemChromeMaterial' }} />
        <Stack.Screen name="autor/[id]" options={{ title: '', headerTransparent: Platform.OS === 'ios', headerBlurEffect: 'systemChromeMaterial' }} />
        <Stack.Screen name="seite/[slug]" options={{ title: '', headerLargeTitle: true, headerTransparent: Platform.OS === 'ios', headerBlurEffect: 'systemChromeMaterial' }} />
        <Stack.Screen
          name="kommentare/[id]"
          options={{
            title: 'Kommentare',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.7, 1],
            sheetGrabberVisible: true,
            headerShown: Platform.OS === 'android',
          }}
        />
        <Stack.Screen name="einstellungen" options={{ title: 'Einstellungen', presentation: 'modal' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Nicht gefunden' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

/** Open the article a notification points to, both from cold start and while running. */
function useNotificationRouting() {
  const router = useRouter();
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const id = postIdFromResponse(last);
    if (id) router.push({ pathname: '/artikel/[id]', params: { id: String(id) } });
  }, [last, router]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = postIdFromResponse(response);
      if (id) router.push({ pathname: '/artikel/[id]', params: { id: String(id) } });
    });
    return () => sub.remove();
  }, [router]);
}
