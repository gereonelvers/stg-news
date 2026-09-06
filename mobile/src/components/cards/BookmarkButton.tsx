import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import type { PostCard } from '@/api/types';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { haptic } from '@/lib/haptics';
import { useBookmarks, useIsBookmarked } from '@/store/bookmarks';
import { useTheme } from '@/theme/ThemeProvider';

type Props = { post: PostCard; size?: number; color?: string; onImage?: boolean };

export function BookmarkButton({ post, size = 22, color, onImage }: Props) {
  const { colors } = useTheme();
  const saved = useIsBookmarked(post.id);
  const toggle = useBookmarks((s) => s.toggle);
  const pop = useSharedValue(1);

  useEffect(() => {
    pop.value = withSequence(withSpring(1.25, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 10 }));
  }, [saved, pop]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const tint = onImage ? '#FFFFFF' : saved ? colors.tint : (color ?? colors.textSecondary);

  return (
    <Tap
      onPress={() => {
        const now = toggle(post);
        now ? haptic.success() : haptic.light();
      }}
      hitSlop={10}
      scaleTo={0.85}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Lesezeichen entfernen' : 'Merken'}
      style={[styles.btn, onImage && styles.onImage]}>
      <Animated.View style={style}>
        <Icon name={saved ? 'bookmarkFill' : 'bookmark'} size={size} color={tint} weight="semibold" />
      </Animated.View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  onImage: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)' },
});
