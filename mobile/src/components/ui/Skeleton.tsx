import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, space } from '@/theme/tokens';

type Props = { width?: DimensionValue; height?: number; radius?: number; style?: StyleProp<ViewStyle> };

export function Skeleton({ width = '100%', height = 16, radius: r = radius.sm, style }: Props) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.55);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.skeleton }, animated, style]} />;
}

export function SkeletonHero() {
  return (
    <View style={{ paddingHorizontal: gutter, gap: space.md }}>
      <Skeleton height={260} radius={radius.lg} />
      <Skeleton width="40%" height={14} />
      <Skeleton height={28} />
      <Skeleton width="70%" height={28} />
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: space.sm }}>
        <Skeleton width="35%" height={12} />
        <Skeleton height={18} />
        <Skeleton width="80%" height={18} />
        <Skeleton width="50%" height={12} />
      </View>
      <Skeleton width={96} height={96} radius={radius.md} />
    </View>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.lg, paddingHorizontal: gutter, paddingVertical: space.lg, alignItems: 'center' },
});
