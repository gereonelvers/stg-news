import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { PostCard } from '@/api/types';
import { Chip } from '@/components/ui/Chip';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { useOpenPost } from '@/lib/navigation';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, maxContentWidth, radius, space } from '@/theme/tokens';
import { BookmarkButton } from './BookmarkButton';
import { Meta } from './Meta';

/** Front-page lead story: full-bleed photo with the title set over a gradient. */
export function HeroCard({ post, label, width: fixedWidth, height: fixedHeight }: { post: PostCard; label?: string; width?: number; height?: number }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const open = useOpenPost();
  const w = fixedWidth ?? Math.min(width, maxContentWidth) - gutter * 2;
  const h = fixedHeight ?? Math.round(w * 1.15);
  const image = post.image?.sizes?.large?.src ?? post.image?.src;

  return (
    <Tap onPress={() => open(post)} scaleTo={0.98} haptics="light" style={[styles.wrap, { width: w, height: h, backgroundColor: colors.surface2 }]} accessibilityRole="button" accessibilityLabel={post.title}>
      {image ? <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} cachePolicy="disk" priority="high" /> : null}
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']} locations={[0.25, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.top}>
        {label ? (
          <View style={styles.label}>
            <Txt variant="chip" style={{ color: '#FFF' }}>
              {label}
            </Txt>
          </View>
        ) : (
          <View />
        )}
        <BookmarkButton post={post} onImage />
      </View>
      <View style={styles.bottom}>
        {post.primary_category ? <Chip category={post.primary_category} variant="onImage" navigable={false} /> : null}
        <Txt variant="hero" style={styles.title} numberOfLines={4}>
          {post.title}
        </Txt>
        <Meta post={post} onImage />
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: 'hidden', alignSelf: 'center' },
  top: { position: 'absolute', top: space.lg, left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { backgroundColor: 'rgba(153,24,63,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  bottom: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl, gap: space.md },
  title: { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } },
});
