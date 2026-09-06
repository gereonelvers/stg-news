import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countNodes, useComments, usePostComment } from '@/api/comments';
import { useConfig } from '@/api/queries';
import type { CommentNode } from '@/api/types';
import { CommentItem } from '@/components/comments/CommentItem';
import { Composer } from '@/components/comments/Composer';
import { DotLoader } from '@/components/ui/Dots';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Txt } from '@/components/ui/Txt';
import { pluralize } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export default function KommentareScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string; compose?: string }>();
  const id = Number(idParam);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const comments = useComments(id);
  const config = useConfig();
  const post = usePostComment();
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const total = comments.data ? countNodes(comments.data) : 0;

  const submit = async (input: { name: string; email: string; text: string }) => {
    await post.mutateAsync({ post: id, parent: replyTo?.id, author_name: input.name, author_email: input.email, content: input.text });
    setReplyTo(null);
    Alert.alert(
      'Danke!',
      config.data?.comments.email_verification
        ? 'Wir haben dir eine E-Mail geschickt. Bestätige darin deinen Kommentar, dann schaut die Redaktion kurz drüber und schaltet ihn frei.'
        : 'Dein Kommentar wird von der Redaktion geprüft und dann freigeschaltet.',
    );
  };

  const list = comments.isPending ? (
    <DotLoader />
  ) : comments.isError ? (
    <ErrorView error={comments.error} onRetry={() => comments.refetch()} />
  ) : comments.data?.length ? (
    <View style={{ gap: space.xl }}>
      {comments.data.map((c) => (
        <CommentItem key={c.id} comment={c} onReply={setReplyTo} />
      ))}
    </View>
  ) : (
    <EmptyState emoji="💬" title="Noch keine Kommentare" message="Du kannst der oder die Erste sein. Schreib, was du denkst – freundlich und mit echtem Namen." />
  );

  const composer = (
    <Composer
      replyTo={replyTo}
      onCancelReply={() => setReplyTo(null)}
      onSubmit={submit}
      submitting={post.isPending}
      emailDomain={config.data?.site.email_domain ?? 'stg-segeberg.de'}
      moderated={config.data?.comments.moderated ?? true}
    />
  );

  // iOS form sheets want exactly one scroll view as content, so the composer
  // lives at the end of the list there. Android is a full screen with a sticky composer.
  if (Platform.OS === 'ios') {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Stack.Screen options={{ title: total ? pluralize(total, 'Kommentar', 'Kommentare') : 'Kommentare' }} />
        <View style={styles.list}>
          <Txt variant="sectionTitle" style={{ marginBottom: space.md }}>
            {total ? pluralize(total, 'Kommentar', 'Kommentare') : 'Kommentare'}
          </Txt>
          {list}
        </View>
        <View style={{ marginTop: space.xl }}>{composer}</View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: total ? pluralize(total, 'Kommentar', 'Kommentare') : 'Kommentare' }} />
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: space.xl }]} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        {list}
      </ScrollView>
      <View style={{ backgroundColor: colors.bgElevated }}>{composer}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, paddingTop: space.lg },
});
