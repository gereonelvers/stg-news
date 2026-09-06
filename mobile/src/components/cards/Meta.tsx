import { StyleSheet, View } from 'react-native';

import type { PostCard } from '@/api/types';
import { Icon } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/Txt';
import { formatRelative } from '@/lib/dates';
import { formatViews } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  post: PostCard;
  onImage?: boolean;
  showAuthor?: boolean;
  showStats?: boolean;
  compact?: boolean;
};

/** "Autor · vor 3 Std. · 4 Min." line under titles. */
export function Meta({ post, onImage, showAuthor = true, showStats = false, compact = false }: Props) {
  const { colors } = useTheme();
  const color = onImage ? 'rgba(255,255,255,0.85)' : colors.textSecondary;
  const parts: string[] = [];
  if (showAuthor && post.author?.name) parts.push(post.author.name);
  parts.push(formatRelative(post.date));
  if (!compact) parts.push(`${post.reading_time} Min.`);
  return (
    <View style={styles.row}>
      <Txt variant="caption" style={{ color, flexShrink: 1 }} numberOfLines={1}>
        {parts.join(' · ')}
      </Txt>
      {showStats && (post.comment_count > 0 || post.views > 0) ? (
        <View style={styles.stats}>
          {post.views > 0 ? (
            <View style={styles.stat}>
              <Icon name="eye" size={12} color={color} />
              <Txt variant="caption" style={{ color }}>
                {formatViews(post.views)}
              </Txt>
            </View>
          ) : null}
          {post.comment_count > 0 ? (
            <View style={styles.stat}>
              <Icon name="comment" size={12} color={color} />
              <Txt variant="caption" style={{ color }}>
                {post.comment_count}
              </Txt>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stats: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
