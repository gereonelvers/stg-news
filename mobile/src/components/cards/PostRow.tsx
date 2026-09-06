import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { PostCard } from '@/api/types';
import { Chip } from '@/components/ui/Chip';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useOpenPost } from '@/lib/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, space } from '@/theme/tokens';
import { Meta } from './Meta';

type Props = { post: PostCard; showCategory?: boolean; showAuthor?: boolean; right?: React.ReactNode };

/** Compact list row: text left, square thumbnail right. */
export function PostRow({ post, showCategory = true, showAuthor = true, right }: Props) {
  const { colors } = useTheme();
  const open = useOpenPost();
  const thumb = post.image?.sizes?.medium?.src ?? post.image?.src;
  return (
    <Tap onPress={() => open(post)} dim scaleTo={1} style={styles.row} accessibilityRole="button" accessibilityLabel={post.title}>
      <View style={styles.text}>
        {showCategory && post.primary_category ? <Chip category={post.primary_category} navigable={false} /> : null}
        <Txt variant="title" numberOfLines={3}>
          {post.title}
        </Txt>
        <Meta post={post} showAuthor={showAuthor} compact />
      </View>
      {thumb ? (
        <Image source={{ uri: thumb }} style={[styles.thumb, { backgroundColor: colors.skeleton }]} contentFit="cover" transition={200} cachePolicy="disk" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
          <Txt style={{ fontSize: 28 }}>{post.primary_category?.emoji ?? '📰'}</Txt>
        </View>
      )}
      {right}
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: gutter, paddingVertical: space.md },
  text: { flex: 1, gap: 6 },
  thumb: { width: 92, height: 92, borderRadius: radius.md },
});
