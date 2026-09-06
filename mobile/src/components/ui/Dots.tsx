import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { brand } from '@/theme/tokens';

/**
 * The two dots of the "Ü" in the masthead – one grey, one rust – bouncing.
 * Used as the app's loading indicator.
 */
export function DotLoader({ size = 10 }: { size?: number }) {
  return (
    <View style={[styles.row, { gap: size * 0.9 }]} accessibilityLabel="Lädt" accessibilityRole="progressbar">
      <Dot size={size} delay={0} />
      <Dot size={size} delay={160} color={brand.rust} />
    </View>
  );
}

function Dot({ size, delay, color }: { size: number; delay: number; color?: string }) {
  const { colors } = useTheme();
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-size * 0.8, { duration: 320 }), withTiming(0, { duration: 320 })), -1, false),
    );
  }, [delay, size, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? colors.textTertiary }, style]}
    />
  );
}

/** Static brand mark: a small rust dot. */
export function RedDot({ size = 8 }: { size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: brand.rust }} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingVertical: 24 },
});
