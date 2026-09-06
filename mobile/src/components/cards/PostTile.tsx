import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { PostCard } from '@/api/types';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useOpenPost } from '@/lib/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Meta } from './Meta';

export const TILE_WIDTH = 236;

/** Tile for horizontal rails. */
export function PostTile({ post, accent }: { post: PostCard; accent?: string }) {
  const { colors } = useTheme();
  const open = useOpenPost();
  const image = post.image?.sizes?.medium_large?.src ?? post.image?.src;
  return (
    <Tap onPress={() => open(post)} scaleTo={0.97} haptics="light" style={[styles.tile, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel={post.title}>
      <View style={[styles.imageWrap, { backgroundColor: colors.skeleton }]}>
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="disk" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: accent ?? colors.surface2 }]}>
            <Txt style={{ fontSize: 40 }}>{post.primary_category?.emoji ?? '📰'}</Txt>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Txt variant="headlineSmall" numberOfLines={3}>
          {post.title}
        </Txt>
        <Meta post={post} compact />
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: { width: TILE_WIDTH, borderRadius: radius.lg, overflow: 'hidden' },
  imageWrap: { width: TILE_WIDTH, height: Math.round(TILE_WIDTH * 0.62) },
  body: { padding: space.md, gap: 6, minHeight: 92 },
});
