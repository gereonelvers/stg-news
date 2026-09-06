import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { schoolEmailFor } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, systemFont } from '@/theme/tokens';

export type Identity = { name: string; email: string };

export const isValidName = (s: string) => s.trim().length >= 2;
export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Compact "you write as …" line above the composer. */
export function IdentityRow({ identity, onEdit }: { identity: Identity; onEdit: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(180)}>
      <Tap onPress={onEdit} dim scaleTo={1} style={styles.row} accessibilityRole="button" accessibilityLabel="Name oder E-Mail ändern">
        <Avatar name={identity.name} size={22} />
        <Txt variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
          Du schreibst als{' '}
          <Txt variant="caption" color="text" weight="600">
            {identity.name}
          </Txt>
        </Txt>
        <Txt variant="caption" color="tint" weight="600">
          Ändern
        </Txt>
      </Tap>
    </Animated.View>
  );
}

type FormProps = {
  initial: Identity | null;
  emailDomain: string;
  /** Label of the primary action, e.g. "Kommentar absenden" or "Speichern". */
  cta: string;
  onSave: (identity: Identity) => void;
  onCancel?: () => void;
};

/** One-time (and rarely repeated) setup of the commenter's name and e-mail. */
export function IdentityForm({ initial, emailDomain, cta, onSave, onCancel }: FormProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [touched, setTouched] = useState(false);
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // autoFocus is unreliable inside an animated mount, so focus explicitly.
  useEffect(() => {
    const t = setTimeout(() => (initial ? emailRef : nameRef).current?.focus(), 260);
    return () => clearTimeout(t);
  }, [initial]);

  const nameOk = isValidName(name);
  const emailOk = isValidEmail(email);
  const suggestion = schoolEmailFor(name, emailDomain);

  const save = () => {
    setTouched(true);
    if (!nameOk || !emailOk) {
      haptic.warning();
      return;
    }
    onSave({ name: name.trim(), email: email.trim() });
  };

  const field = [styles.field, systemFont, { backgroundColor: colors.bgElevated, borderColor: colors.border, color: colors.text }];

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: colors.tintSoft }]}>
          <Icon name="person" size={18} color="tint" weight="semibold" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="title">{initial ? 'Wer schreibt?' : 'Kurz vorstellen'}</Txt>
          <Txt variant="caption" color="textSecondary">
            Dein Name steht beim Kommentar. Die E-Mail bleibt privat – du bekommst nur den Bestätigungslink.
          </Txt>
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <TextInput
          ref={nameRef}
          value={name}
          onChangeText={setName}
          placeholder="Vor- und Nachname"
          placeholderTextColor={colors.textTertiary}
          style={field}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
          accessibilityLabel="Name"
        />
        {touched && !nameOk ? (
          <Txt variant="caption" color="danger">
            Bitte deinen echten Namen eintragen.
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <TextInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="E-Mail-Adresse"
            placeholderTextColor={colors.textTertiary}
            style={[field, { flex: 1 }]}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel="E-Mail-Adresse"
          />
          {suggestion && suggestion !== email.trim() ? (
            <Tap
              onPress={() => {
                setEmail(suggestion);
                haptic.selection();
              }}
              style={[styles.wand, { backgroundColor: colors.tintSoft }]}
              accessibilityRole="button"
              accessibilityLabel={`Schul-Adresse ${suggestion} übernehmen`}>
              <Icon name="school" size={16} color="tint" />
              <Txt variant="micro" color="tint">
                Schule
              </Txt>
            </Tap>
          ) : null}
        </View>
        {touched && !emailOk ? (
          <Txt variant="caption" color="danger">
            Das sieht noch nicht nach einer E-Mail-Adresse aus.
          </Txt>
        ) : suggestion && suggestion !== email.trim() ? (
          <Txt variant="caption" color="textTertiary">
            Tipp: „Schule“ setzt deine Adresse bei {emailDomain} ein.
          </Txt>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onCancel ? <Button label="Abbrechen" variant="ghost" size="sm" onPress={onCancel} /> : <View />}
        <Button label={cta} icon="check" size="sm" onPress={save} disabled={touched && (!nameOk || !emailOk)} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.lg },
  head: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  field: { height: 46, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, fontSize: 16 },
  wand: { height: 46, paddingHorizontal: 12, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
