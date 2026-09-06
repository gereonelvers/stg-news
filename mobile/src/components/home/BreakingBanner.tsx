import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { PostCard } from '@/api/types';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useOpenPost } from '@/lib/navigation';
import { gutter, radius, space } from '@/theme/tokens';

export function BreakingBanner({ post }: { post: PostCard }) {
  const open = useOpenPost();
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.wrap}>
      <Tap onPress={() => open(post)} haptics="medium" scaleTo={0.98} style={styles.banner} accessibilityRole="button" accessibilityLabel={`Eilmeldung: ${post.title}`}>
        <View style={styles.iconWrap}>
          <Icon name="bolt" size={18} color="#FFF" weight="bold" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="chip" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Eilmeldung
          </Txt>
          <Txt variant="title" style={{ color: '#FFF' }} numberOfLines={2}>
            {post.title}
          </Txt>
        </View>
        <Icon name="chevronRight" size={16} color="rgba(255,255,255,0.7)" weight="bold" />
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: gutter, marginBottom: space.lg },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: '#D11A2A', padding: space.md, borderRadius: radius.lg },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
