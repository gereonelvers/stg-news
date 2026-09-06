import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

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
        headerBlurEffect: 'systemChromeMaterial',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
