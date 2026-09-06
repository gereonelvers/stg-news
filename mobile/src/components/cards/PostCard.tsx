import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { PostCard as PostCardType } from '@/api/types';
import { Chip } from '@/components/ui/Chip';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useOpenPost } from '@/lib/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, maxContentWidth, radius, shadow, space } from '@/theme/tokens';
import { BookmarkButton } from './BookmarkButton';
import { Meta } from './Meta';

/** Large card with a 16:10 photo, used for the "Neu" stream. */
export function PostCard({ post }: { post: PostCardType }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const open = useOpenPost();
  const w = Math.min(width, maxContentWidth) - gutter * 2;
  const image = post.image?.sizes?.large?.src ?? post.image?.src;

  return (
    <Tap onPress={() => open(post)} scaleTo={0.985} haptics="light" style={[styles.card, { width: w, backgroundColor: colors.bgElevated }, shadow.card]} accessibilityRole="button" accessibilityLabel={post.title}>
      {image ? (
        <Image source={{ uri: image }} style={{ width: w, height: Math.round(w * 0.6), backgroundColor: colors.skeleton }} contentFit="cover" transition={250} cachePolicy="disk" />
      ) : null}
      <View style={styles.body}>
        <View style={styles.chipRow}>
          {post.primary_category ? <Chip category={post.primary_category} navigable={false} /> : <View />}
          <BookmarkButton post={post} size={20} />
        </View>
        <Txt variant="headline" numberOfLines={3}>
          {post.title}
        </Txt>
        {post.excerpt ? (
          <Txt variant="bodySmall" color="textSecondary" numberOfLines={2}>
            {post.excerpt}
          </Txt>
        ) : null}
        <Meta post={post} showStats />
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden', alignSelf: 'center' },
  body: { padding: space.lg, gap: space.sm },
  chipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
