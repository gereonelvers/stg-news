import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConfig } from '@/api/queries';
import { useLinkHandler } from '@/components/article/useLinkHandler';
import { Icon } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { formatDay, greeting } from '@/lib/dates';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const wordmark = require('@/assets/images/wordmark.png');
const wordmarkDark = require('@/assets/images/wordmark-dark.png');

/** Front-page header: the "Schüler texten Gedanken" wordmark, today's date, where else to find us, and settings. */
export function Masthead() {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isWide, gutter: g, containerWidth } = useLayout();
  const site = useConfig().data?.site;
  const openLink = useLinkHandler();
  // Apple Podcasts on iOS, Spotify elsewhere – whichever link the site gave us.
  const podcast = Platform.OS === 'ios' ? (site?.podcast_apple ?? site?.podcast_spotify) : (site?.podcast_spotify ?? site?.podcast_apple);
  return (
    <View style={[styles.wrap, { paddingTop: (Platform.OS === 'ios' ? 0 : insets.top) + space.sm, paddingHorizontal: g, width: containerWidth + g * 2, alignSelf: 'center' }]}>
      <View style={styles.row}>
        <Image source={isDark ? wordmarkDark : wordmark} style={[styles.logo, isWide && { width: 256, height: 80 }]} contentFit="contain" accessibilityLabel="Schüler texten Gedanken" />
        <View style={styles.actions}>
          {site?.instagram ? (
            <Tap
              onPress={() => openLink(site.instagram, { system: true })}
              hitSlop={8}
              haptics="light"
              style={[styles.circle, { backgroundColor: colors.surface }]}
              accessibilityRole="link"
              accessibilityLabel="Instagram der Schülerzeitung">
              <Icon name="instagram" size={19} color="textSecondary" />
            </Tap>
          ) : null}
          {podcast ? (
            <Tap
              onPress={() => openLink(podcast, { system: true })}
              hitSlop={8}
              haptics="light"
              style={[styles.circle, { backgroundColor: colors.surface }]}
              accessibilityRole="link"
              accessibilityLabel={site?.podcast_name ? `Podcast ${site.podcast_name}` : 'Podcast'}>
              <Icon name="audio" size={19} color="textSecondary" />
            </Tap>
          ) : null}
          <Tap
            onPress={() => router.push('/einstellungen')}
            hitSlop={8}
            haptics="light"
            style={[styles.circle, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Einstellungen">
            <Icon name="settings" size={19} color="textSecondary" />
          </Tap>
        </View>
      </View>
      <View style={styles.dateRow}>
        <Txt variant="overline" color="tint" style={isWide ? { fontSize: 15, lineHeight: 18 } : undefined}>
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
  wrap: { gap: space.md, paddingBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 168, height: 53 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
