import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

/** iOS 26 headers are Liquid Glass already; only older iOS needs a blur. */
const legacyBlur = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) < 26 ? ('systemChromeMaterial' as const) : undefined;

export default function TabStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.tint,
        headerTitleStyle: { color: colors.text },
        headerLargeTitle: true,
        headerLargeTitleStyle: { color: colors.text },
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: legacyBlur,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
