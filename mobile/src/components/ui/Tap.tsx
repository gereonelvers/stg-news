import { type ReactNode, useCallback } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TapProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the view shrinks while pressed. */
  scaleTo?: number;
  /** Dim while pressed (for rows and text buttons). */
  dim?: boolean;
  haptics?: 'light' | 'medium' | 'selection' | 'none';
};

/** Pressable with a soft, springy press feedback. */
export function Tap({ children, style, scaleTo = 0.97, dim = false, haptics = 'none', onPressIn, onPressOut, onPress, ...rest }: TapProps) {
  const pressed = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
    opacity: dim ? 1 - 0.35 * pressed.value : 1,
  }));

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      pressed.value = withTiming(1, { duration: 90 });
      onPressIn?.(e);
    },
    [onPressIn, pressed],
  );
  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      pressed.value = withSpring(0, { damping: 14, stiffness: 260, mass: 0.6 });
      onPressOut?.(e);
    },
    [onPressOut, pressed],
  );
  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (e) => {
      if (haptics !== 'none') haptic[haptics]();
      onPress?.(e);
    },
    [haptics, onPress],
  );

  return (
    <AnimatedPressable {...rest} onPressIn={handleIn} onPressOut={handleOut} onPress={handlePress} style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}
