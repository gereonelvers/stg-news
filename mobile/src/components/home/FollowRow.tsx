import { Platform, StyleSheet, View } from 'react-native';

import { useLinkHandler } from '@/components/article/useLinkHandler';
import { Button } from '@/components/ui/Button';
import { Txt } from '@/components/ui/Txt';
import { gutter, space } from '@/theme/tokens';

type Props = {
  instagram?: string;
  podcastName?: string;
  podcastSpotify?: string;
  podcastApple?: string;
};

/** Quiet "find us elsewhere" row above the footer: Instagram and the podcast. */
export function FollowRow({ instagram, podcastName, podcastSpotify, podcastApple }: Props) {
  const openLink = useLinkHandler();
  // Apple Podcasts on iOS, Spotify elsewhere – whichever link the site actually gave us.
  const podcast = Platform.OS === 'ios' ? (podcastApple ?? podcastSpotify) : (podcastSpotify ?? podcastApple);

  if (!instagram && !podcast) return null;

  return (
    <View style={styles.wrap}>
      <Txt variant="overline" color="textTertiary" align="center">
        Auch hier zu finden
      </Txt>
      <View style={styles.row}>
        {instagram ? (
          <Button label="Instagram" icon="instagram" variant="secondary" size="sm" onPress={() => openLink(instagram, { system: true })} />
        ) : null}
        {podcast ? (
          <Button label={podcastName ?? 'Podcast'} icon="audio" variant="secondary" size="sm" onPress={() => openLink(podcast, { system: true })} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: gutter, marginTop: space.xxl, gap: space.sm, alignItems: 'center' },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', justifyContent: 'center' },
});
