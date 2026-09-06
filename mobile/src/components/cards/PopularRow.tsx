import { StyleSheet, View } from 'react-native';

import type { PostCard } from '@/api/types';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useOpenPost } from '@/lib/navigation';
import { formatViews } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';
import { displayFont, gutter, space } from '@/theme/tokens';

/** Numbered "most read" row. */
export function PopularRow({ post, rank }: { post: PostCard; rank: number }) {
  const { colors } = useTheme();
  const open = useOpenPost();
  return (
    <Tap onPress={() => open(post)} dim scaleTo={1} style={styles.row} accessibilityRole="button" accessibilityLabel={`Platz ${rank}: ${post.title}`}>
      <Txt style={[displayFont(800), { fontSize: 40, lineHeight: 44, color: rank === 1 ? colors.tint : colors.textTertiary, width: 44, textAlign: 'center' }]}>{rank}</Txt>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="title" numberOfLines={2}>
          {post.title}
        </Txt>
        <Txt variant="caption" color="textSecondary" numberOfLines={1}>
          {post.primary_category?.name ?? ''}
          {post.primary_category ? ' · ' : ''}
          {formatViews(post.views)} Aufrufe
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: gutter, paddingVertical: space.sm + 2 },
});
