import { Alert, Linking, StyleSheet, View } from 'react-native';

import { useConfig } from '@/api/queries';

import type { CommentNode } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { formatRelative } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

type Props = { comment: CommentNode; onReply?: (c: CommentNode) => void; reportable?: boolean };

export function CommentItem({ comment, onReply, reportable = true }: Props) {
  const { colors } = useTheme();
  const config = useConfig();

  const report = () => {
    const to = config.data?.site.contact_email ?? '';
    const subject = encodeURIComponent(`Kommentar melden (#${comment.id})`);
    const body = encodeURIComponent(`Ich möchte diesen Kommentar melden:\n\nKommentar-ID: ${comment.id}\nVon: ${comment.authorName}\nText: „${comment.text.slice(0, 300)}“\n\nGrund:\n`);
    Alert.alert('Kommentar melden', 'Die Redaktion prüft gemeldete Kommentare und entfernt sie, wenn sie gegen die Regeln verstoßen.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Per E-Mail melden', style: 'destructive', onPress: () => Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`).catch(() => undefined) },
    ]);
  };
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
          <View style={styles.actions}>
            {onReply && comment.depth < 3 ? (
              <Tap onPress={() => onReply(comment)} dim scaleTo={1} hitSlop={6} accessibilityRole="button">
                <Txt variant="caption" color="tint" style={{ fontWeight: '600' }}>
                  Antworten
                </Txt>
              </Tap>
            ) : null}
            {reportable ? (
              <Tap onPress={report} dim scaleTo={1} hitSlop={6} accessibilityRole="button" accessibilityLabel="Kommentar melden">
                <Txt variant="caption" color="textTertiary">
                  Melden
                </Txt>
              </Tap>
            ) : null}
          </View>
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
  actions: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
});
