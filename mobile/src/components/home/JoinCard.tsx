import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Txt } from '@/components/ui/Txt';
import { useLinkHandler } from '@/components/article/useLinkHandler';
import { brand, gutter, radius, space } from '@/theme/tokens';

export function JoinCard({ instagram }: { instagram?: string }) {
  const router = useRouter();
  const openLink = useLinkHandler();
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Txt style={styles.emoji}>✍️</Txt>
        <Txt variant="headline" style={{ color: '#FFF' }}>
          Du willst mitschreiben?
        </Txt>
        <Txt variant="bodySmall" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Die Schülerzeitung sucht immer Leute, die Lust auf Texte, Fotos, Interviews oder Memes haben. Egal welche Klasse.
        </Txt>
        <View style={styles.actions}>
          <Button label="Mehr erfahren" variant="primary" color="#FFFFFF" onPress={() => router.push({ pathname: '/seite/[slug]', params: { slug: 'ueber-uns' } })} />
          {instagram ? <Button label="Instagram" variant="ghost" color="#FFFFFF" icon="camera" onPress={() => openLink(instagram)} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: gutter, marginTop: space.xxl },
  card: { backgroundColor: brand.crimson, borderRadius: radius.xl, padding: space.xl, gap: space.sm },
  emoji: { fontSize: 34, lineHeight: 40 },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' },
});
