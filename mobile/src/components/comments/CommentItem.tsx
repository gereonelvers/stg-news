import * as Clipboard from 'expo-clipboard';
import { ActionSheetIOS, Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useConfig } from '@/api/queries';
import type { CommentNode } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { formatRelative } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { pluralize } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

type Props = {
  comment: CommentNode;
  onReply?: (c: CommentNode) => void;
  /** Article preview: no actions, replies collapsed to a count. */
  compact?: boolean;
};

const MAX_DEPTH = 3;

function openMenu(comment: CommentNode, contactEmail: string) {
  const copy = () => Clipboard.setStringAsync(comment.text).then(() => { haptic.selection(); });
  const report = () => {
    const subject = encodeURIComponent(`Kommentar melden (#${comment.id})`);
    const body = encodeURIComponent(`Ich möchte diesen Kommentar melden:\n\nKommentar-ID: ${comment.id}\nVon: ${comment.authorName}\nText: „${comment.text.slice(0, 300)}“\n\nGrund:\n`);
    Alert.alert('Kommentar melden', 'Die Redaktion prüft gemeldete Kommentare und entfernt sie, wenn sie gegen die Regeln verstoßen.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Per E-Mail melden', style: 'destructive', onPress: () => Linking.openURL(`mailto:${contactEmail}?subject=${subject}&body=${body}`).catch(() => undefined) },
    ]);
  };
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: `${comment.authorName} · ${formatRelative(comment.date)}`, options: ['Abbrechen', 'Text kopieren', 'Melden'], cancelButtonIndex: 0, destructiveButtonIndex: 2 },
      (i) => (i === 1 ? copy() : i === 2 ? report() : undefined),
    );
  } else {
    Alert.alert(comment.authorName, undefined, [
      { text: 'Text kopieren', onPress: copy },
      { text: 'Melden', style: 'destructive', onPress: report },
      { text: 'Abbrechen', style: 'cancel' },
    ]);
  }
}

export function CommentItem({ comment, onReply, compact = false }: Props) {
  const { colors } = useTheme();
  const config = useConfig();
  const isReply = comment.depth > 0;
  const avatar = isReply ? 28 : 36;
  const hasChildren = comment.children.length > 0 && !compact;
  const pendingLabel = config.data?.comments.email_verification ? 'Wartet auf deine Bestätigung' : 'Wartet auf Freigabe';

  return (
    <Animated.View entering={comment.pending ? FadeIn.duration(260) : undefined} style={styles.row}>
      <View style={{ width: avatar, alignItems: 'center' }}>
        <Avatar name={comment.authorName} size={avatar} />
        {hasChildren ? <View style={[styles.rail, { backgroundColor: colors.border, top: avatar + 6 }]} /> : null}
      </View>
      <View style={{ flex: 1, gap: 4, opacity: comment.pending ? 0.72 : 1 }}>
        <View style={styles.head}>
          <Txt variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
            {comment.authorName}
          </Txt>
          <Txt variant="caption" color="textTertiary" style={{ flex: 1 }} numberOfLines={1}>
            {formatRelative(comment.date)}
          </Txt>
          {!compact && !comment.pending ? (
            <Tap
              onPress={() => openMenu(comment, config.data?.site.contact_email ?? '')}
              hitSlop={10}
              dim
              scaleTo={1}
              accessibilityRole="button"
              accessibilityLabel="Mehr zu diesem Kommentar">
              <Icon name="more" size={16} color="textTertiary" />
            </Tap>
          ) : null}
        </View>
        <Txt variant="bodySmall" selectable={!compact} numberOfLines={compact ? 4 : undefined} style={{ lineHeight: 22 }}>
          {comment.text}
        </Txt>
        {comment.pending ? (
          <View style={[styles.pending, { backgroundColor: colors.tintSoft }]}>
            <Icon name="clock" size={12} color="tint" weight="semibold" />
            <Txt variant="micro" color="tint">
              {pendingLabel}
            </Txt>
          </View>
        ) : compact ? (
          comment.children.length ? (
            <Txt variant="caption" color="tint" weight="600">
              {pluralize(comment.children.length, 'Antwort', 'Antworten')}
            </Txt>
          ) : null
        ) : onReply && comment.depth < MAX_DEPTH ? (
          <Tap onPress={() => onReply(comment)} dim scaleTo={1} hitSlop={8} style={styles.replyBtn} accessibilityRole="button" accessibilityLabel={`${comment.authorName} antworten`}>
            <Icon name="reply" size={13} color="tint" weight="semibold" />
            <Txt variant="caption" color="tint" weight="600">
              Antworten
            </Txt>
          </Tap>
        ) : null}
        {hasChildren ? (
          <View style={styles.children}>
            {comment.children.map((child) => (
              <CommentItem key={child.id} comment={child} onReply={onReply} />
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  rail: { position: 'absolute', bottom: 0, width: 2, borderRadius: 1 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4 },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginTop: 2 },
  children: { gap: space.lg, marginTop: space.md },
});
