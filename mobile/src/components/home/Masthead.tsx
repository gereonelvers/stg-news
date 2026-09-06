import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { formatDay, greeting } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

const wordmark = require('@/assets/images/wordmark.png');
const wordmarkDark = require('@/assets/images/wordmark-dark.png');

/** Front-page header: the "Schüler texten Gedanken" wordmark, today's date and settings. */
export function Masthead() {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.wrap, { paddingTop: (Platform.OS === 'ios' ? 0 : insets.top) + space.sm }]}>
      <View style={styles.row}>
        <Image source={isDark ? wordmarkDark : wordmark} style={styles.logo} contentFit="contain" accessibilityLabel="Schüler texten Gedanken" />
        <Tap
          onPress={() => router.push('/einstellungen')}
          hitSlop={8}
          haptics="light"
          style={[styles.gear, { backgroundColor: colors.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Einstellungen">
          <Icon name="settings" size={19} color="textSecondary" />
        </Tap>
      </View>
      <View style={styles.dateRow}>
        <Txt variant="overline" color="tint">
          {formatDay()}
        </Txt>
        <Txt variant="caption" color="textTertiary">
          {greeting()}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: gutter, gap: space.md, paddingBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 168, height: 53 },
  gear: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
