import { type RefObject } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { CommentNode } from '@/api/types';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useTheme } from '@/theme/ThemeProvider';
import { space, systemFont } from '@/theme/tokens';
import { IdentityRow, type Identity } from './Identity';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  replyTo: CommentNode | null;
  onCancelReply: () => void;
  identity: Identity | null;
  onEditIdentity: () => void;
  inputRef: RefObject<TextInput | null>;
  /** Inline error from the last attempt, if any. */
  error: string | null;
  hint: string;
  /** Slot above the input: identity form, "sent" card, … */
  children?: React.ReactNode;
};

const MAX_LENGTH = 2000;

/** Messages-style composer: one growing field with the send button inside. */
export function Composer({ value, onChange, onSend, sending, replyTo, onCancelReply, identity, onEditIdentity, inputRef, error, hint, children }: Props) {
  const { colors } = useTheme();
  const canSend = value.trim().length >= 2 && !sending;

  return (
    <View style={styles.wrap}>
      {children}
      {replyTo ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={[styles.replyBar, { backgroundColor: colors.tintSoft }]}>
          <Icon name="reply" size={14} color="tint" weight="semibold" />
          <Txt variant="caption" color="tint" style={{ flex: 1 }} numberOfLines={1}>
            Antwort an{' '}
            <Txt variant="caption" color="tint" weight="700">
              {replyTo.authorName}
            </Txt>
            {' · '}
            <Txt variant="caption" color="tint" style={{ opacity: 0.8 }}>
              „{replyTo.text.replace(/\s+/g, ' ').slice(0, 60)}“
            </Txt>
          </Txt>
          <Tap onPress={onCancelReply} hitSlop={10} accessibilityRole="button" accessibilityLabel="Antwort abbrechen">
            <Icon name="close" size={14} color="tint" weight="bold" />
          </Tap>
        </Animated.View>
      ) : null}
      {identity ? <IdentityRow identity={identity} onEdit={onEditIdentity} /> : null}
      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={replyTo ? 'Deine Antwort …' : 'Was denkst du?'}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, systemFont, { color: colors.text }]}
          multiline
          maxLength={MAX_LENGTH}
          textAlignVertical="center"
          accessibilityLabel="Kommentar"
        />
        <Tap
          onPress={onSend}
          disabled={!canSend}
          haptics={canSend ? 'light' : 'none'}
          scaleTo={0.9}
          style={[styles.send, { backgroundColor: canSend || sending ? colors.tint : colors.surface2 }]}
          accessibilityRole="button"
          accessibilityLabel="Kommentar senden">
          {sending ? <ActivityIndicator size="small" color={colors.textOnTint} /> : <Icon name="send" size={15} color={canSend ? colors.textOnTint : colors.textTertiary} weight="semibold" />}
        </Tap>
      </View>
      {error ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.status}>
          <Icon name="error" size={13} color="danger" />
          <Txt variant="caption" color="danger" style={{ flex: 1 }}>
            {error}
          </Txt>
        </Animated.View>
      ) : (
        <Txt variant="caption" color="textTertiary" numberOfLines={2}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  replyBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 12 },
  pill: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, paddingLeft: 16, paddingRight: 5, paddingVertical: 5, minHeight: 46 },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    maxHeight: 132,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingRight: space.sm,
  },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
