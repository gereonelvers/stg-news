import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { CommentNode } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Row';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { pluralize } from '@/lib/text';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';
import { CommentItem } from './CommentItem';

type Props = {
  postId: number;
  thread: CommentNode[] | null;
  total: number;
  open: boolean;
};

/** The comments block at the end of an article: a taste of the thread plus a one-tap way in. */
export function CommentsPreview({ postId, thread, total, open }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const commenter = useSettings((s) => s.commenter);
  const openThread = (compose?: boolean) =>
    router.push({ pathname: '/kommentare/[id]', params: compose ? { id: String(postId), compose: '1' } : { id: String(postId) } });
  const teaser = thread?.slice(0, 2) ?? [];
  const rest = total - teaser.reduce((n, c) => n + 1 + c.children.length, 0);

  return (
    <View>
      <SectionHeader
        title="Kommentare"
        subtitle={total ? `${total} bisher` : open ? 'Sei die erste Stimme' : undefined}
        onAction={total ? () => openThread() : undefined}
        actionLabel="Alle"
      />
      <View style={styles.body}>
        {teaser.map((c, i) => (
          <View key={c.id} style={{ gap: space.lg }}>
            {i > 0 ? <Separator /> : null}
            <CommentItem comment={c} compact />
          </View>
        ))}
        {rest > 0 ? (
          <Tap onPress={() => openThread()} dim scaleTo={1} style={styles.more} accessibilityRole="button">
            <Txt variant="caption" color="tint" weight="600">
              {rest === 1 ? 'Noch einen Kommentar lesen' : `Alle ${pluralize(total, 'Kommentar', 'Kommentare')} lesen`}
            </Txt>
            <Icon name="chevronRight" size={12} color="tint" weight="bold" />
          </Tap>
        ) : null}
        {open ? (
          <Tap onPress={() => openThread(true)} haptics="light" style={[styles.faux, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Kommentar schreiben">
            {commenter.name ? (
              <Avatar name={commenter.name} size={28} />
            ) : (
              <View style={[styles.you, { backgroundColor: colors.tintSoft }]}>
                <Icon name="pencil" size={15} color="tint" />
              </View>
            )}
            <Txt variant="bodySmall" color="textTertiary" style={{ flex: 1 }}>
              {total ? 'Mitdiskutieren …' : 'Was denkst du?'}
            </Txt>
            <View style={[styles.send, { backgroundColor: colors.surface2 }]}>
              <Icon name="send" size={14} color="textTertiary" weight="semibold" />
            </View>
          </Tap>
        ) : (
          <Txt variant="caption" color="textTertiary">
            Kommentare sind für diesen Artikel geschlossen.
          </Txt>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: gutter, gap: space.lg },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  faux: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: 10, paddingRight: 6, paddingVertical: 6, borderRadius: 24, minHeight: 48 },
  you: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  send: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
