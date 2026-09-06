import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import type { CommentNode } from '@/api/types';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { schoolEmailFor } from '@/lib/text';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, systemFont } from '@/theme/tokens';

type Props = {
  replyTo: CommentNode | null;
  onCancelReply: () => void;
  onSubmit: (input: { name: string; email: string; text: string }) => Promise<void>;
  submitting: boolean;
  emailDomain: string;
  moderated: boolean;
};

export function Composer({ replyTo, onCancelReply, onSubmit, submitting, emailDomain, moderated }: Props) {
  const { colors } = useTheme();
  const commenter = useSettings((s) => s.commenter);
  const setCommenter = useSettings((s) => s.setCommenter);
  const [name, setName] = useState(commenter.name);
  const [email, setEmail] = useState(commenter.email);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && /.+@.+\..+/.test(email.trim()) && text.trim().length >= 3;

  const submit = async () => {
    if (!valid || submitting) return;
    setError(null);
    try {
      setCommenter({ name: name.trim(), email: email.trim() });
      await onSubmit({ name: name.trim(), email: email.trim(), text: text.trim() });
      setText('');
      haptic.success();
    } catch (e) {
      haptic.warning();
      setError(e instanceof Error ? e.message : 'Senden fehlgeschlagen.');
    }
  };

  const inputStyle = [styles.input, systemFont, { backgroundColor: colors.surface, color: colors.text }];

  return (
    <View style={[styles.wrap, { borderTopColor: colors.separator, backgroundColor: colors.bgElevated }]}>
      {replyTo ? (
        <View style={[styles.replyBar, { backgroundColor: colors.tintSoft }]}>
          <Icon name="reply" size={14} color="tint" />
          <Txt variant="caption" color="tint" style={{ flex: 1 }} numberOfLines={1}>
            Antwort an {replyTo.authorName}
          </Txt>
          <Tap onPress={onCancelReply} hitSlop={8} accessibilityRole="button" accessibilityLabel="Antwort abbrechen">
            <Icon name="close" size={14} color="tint" weight="bold" />
          </Tap>
        </View>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Dein Name"
          placeholderTextColor={colors.textTertiary}
          style={[inputStyle, { flex: 1 }]}
          autoCapitalize="words"
          textContentType="name"
          returnKeyType="next"
        />
        <View style={{ flex: 1.3, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-Mail"
            placeholderTextColor={colors.textTertiary}
            style={[inputStyle, { flex: 1 }]}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Tap
            onPress={() => {
              const guess = schoolEmailFor(name, emailDomain);
              if (guess) {
                setEmail(guess);
                haptic.selection();
              }
            }}
            hitSlop={6}
            style={[styles.wand, { backgroundColor: colors.tintSoft }]}
            accessibilityRole="button"
            accessibilityLabel="Schul-E-Mail aus dem Namen erzeugen">
            <Icon name="sparkle" size={16} color="tint" />
          </Tap>
        </View>
      </View>
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? 'Deine Antwort …' : 'Was denkst du?'}
          placeholderTextColor={colors.textTertiary}
          style={[inputStyle, { flex: 1, minHeight: 44, maxHeight: 140, paddingTop: 11 }]}
          multiline
        />
        <Button label="" icon="send" onPress={submit} disabled={!valid || submitting} style={styles.send} />
      </View>
      {error ? (
        <Txt variant="caption" color="danger">
          {error}
        </Txt>
      ) : (
        <Txt variant="caption" color="textTertiary">
          {moderated ? 'Du bekommst eine E-Mail zum Bestätigen. Danach schaut die Redaktion kurz drüber.' : 'Bitte nutze deinen echten Namen und bleib freundlich.'}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  input: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, fontSize: 15, lineHeight: 20 },
  wand: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: space.xs },
  replyBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.sm },
  send: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0, alignItems: 'center', justifyContent: 'center' },
});
