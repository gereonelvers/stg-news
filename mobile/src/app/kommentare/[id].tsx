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

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
      <Stack.Screen options={{ title: total ? `${total} Kommentare` : 'Kommentare' }} />
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: space.xl }]} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        {Platform.OS === 'ios' ? (
          <Txt variant="sectionTitle" style={{ marginBottom: space.md }}>
            {total ? `${total} Kommentare` : 'Kommentare'}
          </Txt>
        ) : null}
        {comments.isPending ? (
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
        )}
      </ScrollView>
      <View style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0, backgroundColor: colors.bgElevated }}>
        <Composer
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSubmit={submit}
          submitting={post.isPending}
          emailDomain={config.data?.site.email_domain ?? 'stg-segeberg.de'}
          moderated={config.data?.comments.moderated ?? true}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: gutter, paddingTop: space.lg },
});
