import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import type { CategoryFull, PostCard } from '@/api/types';
import { PostTile } from '@/components/cards/PostTile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { rememberCards } from '@/lib/cardCache';
import { accentFor } from '@/lib/colors';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export function SectionRail({ category, posts }: { category: CategoryFull; posts: PostCard[] }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const layout = useLayout();
  rememberCards(posts);
  const accent = accentFor(category.color, isDark);
  return (
    <>
      <SectionHeader
        title={category.name}
        emoji={category.emoji}
        accent={accent}
        subtitle={category.count ? `${category.count} Artikel` : undefined}
        onAction={() => router.push({ pathname: '/ressort/[id]', params: { id: String(category.id), name: category.name, color: category.color, emoji: category.emoji } })}
      />
      <FlatList
        horizontal
        data={posts}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <PostTile post={item} accent={accent} />}
        showsHorizontalScrollIndicator={false}
        style={layout.isWide ? { width: Math.min(layout.width, layout.containerWidth + layout.gutter * 2), alignSelf: 'center' } : undefined}
        contentContainerStyle={[styles.rail, layout.isWide && { paddingHorizontal: layout.gutter, width: Math.max(layout.width, layout.containerWidth + layout.gutter * 2) }]}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={236 + space.md}
      />
    </>
  );
}

const styles = StyleSheet.create({
  rail: { paddingHorizontal: gutter, gap: space.md },
});
