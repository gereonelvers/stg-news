import { Linking, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/Txt';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

type Props = {
  email: string;
  /** What the server does with the comment next. */
  next: 'verify' | 'moderate' | 'live';
  onDone: () => void;
};

/** Replaces the old "Danke!" alert: says what happens next, right where the comment was written. */
export function SentCard({ email, next, onDone }: Props) {
  const { colors } = useTheme();
  const title = next === 'live' ? 'Dein Kommentar ist online' : next === 'verify' ? 'Fast geschafft!' : 'Danke dir!';
  const body =
    next === 'verify'
      ? `Wir haben eine Mail an ${email} geschickt. Tipp auf den Link darin – dann ist dein Kommentar online.`
      : next === 'moderate'
        ? 'Die Redaktion schaut kurz drüber, dann erscheint dein Kommentar hier.'
        : 'Danke, dass du mitdiskutierst.';
  const canOpenMail = Platform.OS === 'ios' && next === 'verify';

  return (
    <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOut.duration(150)} style={[styles.card, { backgroundColor: colors.tintSoft }]}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: colors.tint }]}>
          <Icon name={next === 'verify' ? 'mail' : 'check'} size={18} color={colors.textOnTint} weight="bold" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{title}</Txt>
          <Txt variant="caption" color="textSecondary">
            {body}
          </Txt>
        </View>
      </View>
      <View style={styles.actions}>
        {canOpenMail ? <Button label="Mail-App öffnen" icon="external" size="sm" onPress={() => Linking.openURL('message://').catch(() => undefined)} /> : null}
        <Button label={canOpenMail ? 'Später' : 'Alles klar'} variant="ghost" size="sm" onPress={onDone} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end', alignItems: 'center' },
});
