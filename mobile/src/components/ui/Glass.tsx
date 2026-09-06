import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /** Corner radius, applied consistently across implementations. */
  radius?: number;
  tint?: string;
  interactive?: boolean;
}>;

const liquid = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Floating surface: Liquid Glass on iOS 26, a blur on older iOS and a tonal
 * surface on Android (where blur is expensive and not idiomatic).
 */
export function Glass({ children, style, radius = 22, tint, interactive }: Props) {
  const { colors, isDark } = useTheme();
  if (liquid) {
    return (
      <GlassView
        glassEffectStyle="regular"
        tintColor={tint}
        isInteractive={interactive}
        style={[styles.base, { borderRadius: radius }, style]}>
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={[styles.base, { borderRadius: radius, backgroundColor: colors.glassFallback }, style]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius, backgroundColor: colors.bgElevated, elevation: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
