import { StyleSheet, View } from 'react-native';

import type { CommentNode } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { formatRelative } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

type Props = { comment: CommentNode; onReply?: (c: CommentNode) => void };

export function CommentItem({ comment, onReply }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.row, { marginLeft: comment.depth * 24 }]}>
        {comment.depth > 0 ? <View style={[styles.thread, { backgroundColor: colors.border }]} /> : null}
        <Avatar name={comment.authorName} size={34} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.head}>
            <Txt variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
              {comment.authorName}
            </Txt>
            <Txt variant="caption" color="textTertiary">
              {formatRelative(comment.date)}
            </Txt>
          </View>
          <Txt variant="bodySmall" selectable>
            {comment.text}
          </Txt>
          {onReply && comment.depth < 3 ? (
            <Tap onPress={() => onReply(comment)} dim scaleTo={1} hitSlop={6} style={{ alignSelf: 'flex-start' }} accessibilityRole="button">
              <Txt variant="caption" color="tint" style={{ fontWeight: '600' }}>
                Antworten
              </Txt>
            </Tap>
          ) : null}
        </View>
      </View>
      {comment.children.map((child) => (
        <CommentItem key={child.id} comment={child} onReply={onReply} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  thread: { position: 'absolute', left: -14, top: 0, bottom: -space.sm, width: 2, borderRadius: 1 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
});
