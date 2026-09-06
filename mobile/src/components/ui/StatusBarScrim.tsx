import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Keeps the status bar readable on screens without a native header:
 * a blur on iOS, a near-opaque surface on Android.
 */
export function StatusBarScrim() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  if (insets.top === 0) return null;
  if (Platform.OS === 'ios') {
    return <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={[styles.bar, { height: insets.top }]} pointerEvents="none" />;
  }
  return <View style={[styles.bar, { height: insets.top, backgroundColor: colors.bg, opacity: 0.94 }]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
});
