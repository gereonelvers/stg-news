import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countNodes, describeCommentError, usePostComment, useThread } from '@/api/comments';
import { useConfig } from '@/api/queries';
import type { CommentNode } from '@/api/types';
import { CommentItem } from '@/components/comments/CommentItem';
import { Composer } from '@/components/comments/Composer';
import { IdentityForm, type Identity } from '@/components/comments/Identity';
import { SentCard } from '@/components/comments/SentCard';
import { DotLoader } from '@/components/ui/Dots';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Row';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { pluralize } from '@/lib/text';
import { useCommentsStore } from '@/store/comments';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, maxContentWidth, space } from '@/theme/tokens';

type IdentityMode = 'hidden' | 'required' | 'edit';
type Sent = { email: string; next: 'verify' | 'moderate' | 'live' };

export default function KommentareScreen() {
  const { id: idParam, compose } = useLocalSearchParams<{ id: string; compose?: string }>();
  const id = Number(idParam);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const dockInset = useAnimatedStyle(() => ({ paddingBottom: Math.max(keyboard.height.value, insets.bottom) + space.sm }));
  const router = useRouter();
  const config = useConfig();
  const { query, thread } = useThread(id);
  const post = usePostComment();
  const addPending = useCommentsStore((s) => s.add);
  const prunePending = useCommentsStore((s) => s.prune);
  const commenter = useSettings((s) => s.commenter);
  const setCommenter = useSettings((s) => s.setCommenter);
  const identity: Identity | null = commenter.name && commenter.email ? commenter : null;

  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [identityMode, setIdentityMode] = useState<IdentityMode>('hidden');
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = thread ? countNodes(thread) : 0;
  const title = total ? pluralize(total, 'Kommentar', 'Kommentare') : 'Kommentare';
  const verification = config.data?.comments.email_verification ?? true;
  const moderated = config.data?.comments.moderated ?? true;
  const hint = verification
    ? 'Echter Name, freundlicher Ton. Du bestätigst deinen Kommentar per E-Mail.'
    : moderated
      ? 'Echter Name, freundlicher Ton. Die Redaktion schaltet Kommentare frei.'
      : 'Echter Name, freundlicher Ton – die Redaktion liest mit.';

  useEffect(() => {
    prunePending();
    if (compose === '1') {
      const t = setTimeout(() => inputRef.current?.focus(), Platform.OS === 'ios' ? 450 : 250);
      return () => clearTimeout(t);
    }
  }, [compose, prunePending]);

  const reply = (c: CommentNode) => {
    setReplyTo(c);
    setSent(null);
    haptic.selection();
    inputRef.current?.focus();
  };

  const send = async (who: Identity | null = identity) => {
    const content = text.trim();
    if (content.length < 2 || post.isPending) return;
    if (!who) {
      Keyboard.dismiss();
      setIdentityMode('required');
      return;
    }
    setError(null);
    setSent(null);
    try {
      const created = await post.mutateAsync({ post: id, parent: replyTo?.id, author_name: who.name, author_email: who.email, content });
      const live = created.status === 'approved';
      if (!live) addPending({ post: id, parent: replyTo?.id ?? 0, name: who.name, email: who.email, text: content });
      setText('');
      setReplyTo(null);
      setSent({ email: who.email, next: live ? 'live' : verification ? 'verify' : 'moderate' });
      Keyboard.dismiss();
      haptic.success();
      if (!replyTo) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350);
    } catch (e) {
      haptic.warning();
      setError(describeCommentError(e));
    }
  };

  const saveIdentity = (who: Identity) => {
    setCommenter(who);
    const wasRequired = identityMode === 'required';
    setIdentityMode('hidden');
    if (wasRequired) void send(who);
    else inputRef.current?.focus();
  };

  const list = query.isPending ? (
    <View style={{ paddingVertical: space.xxl }}>
      <DotLoader />
    </View>
  ) : query.isError ? (
    <ErrorView error={query.error} onRetry={() => query.refetch()} />
  ) : thread?.length ? (
    <View style={{ gap: space.lg }}>
      {thread.map((c, i) => (
        <View key={c.id} style={{ gap: space.lg }}>
          {i > 0 ? <Separator /> : null}
          <CommentItem comment={c} onReply={reply} />
        </View>
      ))}
    </View>
  ) : (
    <EmptyState emoji="💬" title="Noch still hier" message="Schreib den ersten Kommentar – mit echtem Namen und einem freundlichen Ton." />
  );

  const composer = (
    <Composer
      value={text}
      onChange={(t) => {
        setText(t);
        if (error) setError(null);
        if (sent) setSent(null);
      }}
      onSend={() => void send()}
      sending={post.isPending}
      replyTo={replyTo}
      onCancelReply={() => setReplyTo(null)}
      identity={identityMode === 'hidden' ? identity : null}
      onEditIdentity={() => setIdentityMode('edit')}
      inputRef={inputRef}
      error={error}
      hint={hint}>
      {identityMode !== 'hidden' ? (
        <IdentityForm
          initial={identity}
          emailDomain={config.data?.site.email_domain ?? 'stg-segeberg.de'}
          cta={identityMode === 'required' ? 'Kommentar absenden' : 'Speichern'}
          onSave={saveIdentity}
          onCancel={() => setIdentityMode('hidden')}
        />
      ) : sent ? (
        <SentCard email={sent.email} next={sent.next} onDone={() => setSent(null)} />
      ) : null}
    </Composer>
  );

  return (
    // collapsable=false keeps this wrapper in the native tree: react-native-screens
    // otherwise finds the ScrollView directly under the form sheet and resizes it itself.
    <View collapsable={false} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? space.lg : space.md, paddingBottom: space.xl }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          {Platform.OS === 'ios' ? (
            <View style={styles.sheetHead}>
              <View style={{ flex: 1 }}>
                <Txt variant="sectionTitle">Kommentare</Txt>
                {total ? (
                  <Txt variant="caption" color="textSecondary">
                    {pluralize(total, 'Beitrag', 'Beiträge')} zu diesem Artikel
                  </Txt>
                ) : null}
              </View>
              <Tap onPress={() => router.back()} hitSlop={8} style={[styles.close, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel="Schließen">
                <Icon name="close" size={14} color="textSecondary" weight="bold" />
              </Tap>
            </View>
          ) : null}
          {list}
        </View>
      </ScrollView>
      {/* The dock follows the keyboard frame-by-frame (Reanimated), which also works inside iOS form sheets and with Android edge-to-edge. */}
      <Animated.View style={[styles.dock, { borderTopColor: colors.separator, backgroundColor: colors.bgElevated }, dockInset]}>
        <View style={styles.column}>{composer}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sized by the sheet itself (iPad form sheets are narrower than the window), capped at reading width.
  column: { width: '100%', maxWidth: maxContentWidth + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.lg },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.sm },
});
