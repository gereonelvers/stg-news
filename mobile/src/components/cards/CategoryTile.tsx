import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { CategoryFull } from '@/api/types';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { withAlpha } from '@/lib/colors';
import { pluralize } from '@/lib/text';
import { radius, space } from '@/theme/tokens';

export function CategoryTile({ category, width, height = 150 }: { category: CategoryFull; width: number; height?: number }) {
  const router = useRouter();
  const image = category.cover?.sizes?.medium_large?.src ?? category.cover?.src;
  return (
    <Tap
      onPress={() => router.push({ pathname: '/ressort/[id]', params: { id: String(category.id), name: category.name, color: category.color, emoji: category.emoji } })}
      scaleTo={0.96}
      haptics="light"
      style={[styles.tile, { width, height, backgroundColor: category.color }]}
      accessibilityRole="button"
      accessibilityLabel={`Ressort ${category.name}, ${pluralize(category.count, 'Artikel', 'Artikel')}`}>
      {image ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="disk" /> : null}
      <LinearGradient colors={[withAlpha(category.color, 0.15), withAlpha(category.color, 0.92)]} locations={[0.1, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.body}>
        <Txt style={styles.emoji}>{category.emoji}</Txt>
        <Txt variant="headlineSmall" style={{ color: '#FFF' }} numberOfLines={2}>
          {category.name}
        </Txt>
        <Txt variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {pluralize(category.count, 'Artikel', 'Artikel')}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.lg, overflow: 'hidden' },
  body: { flex: 1, justifyContent: 'flex-end', padding: space.md, gap: 2 },
  emoji: { fontSize: 26, lineHeight: 32, marginBottom: space.xs },
});
