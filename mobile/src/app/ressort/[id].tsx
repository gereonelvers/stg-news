import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCategories, usePosts } from '@/api/queries';
import { PostList } from '@/components/lists/PostList';
import { Txt } from '@/components/ui/Txt';
import { accentFor } from '@/lib/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export default function RessortScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string; color?: string; emoji?: string }>();
  const { colors, isDark } = useTheme();
  const all = params.id === 'alle';
  const categoryId = all ? undefined : Number(params.id);
  const categories = useCategories();
  const category = useMemo(() => categories.data?.find((c) => c.id === categoryId), [categories.data, categoryId]);
  const name = category?.name ?? params.name ?? (all ? 'Alle Artikel' : 'Ressort');
  const color = category?.color ?? params.color;
  const emoji = category?.emoji ?? params.emoji;
  const accent = color ? accentFor(color, isDark) : colors.tint;

  const posts = usePosts({ category: categoryId });
  const items = posts.data?.pages.flatMap((p) => p.items);
  const total = posts.data?.pages[0]?.total;

  return (
    <>
      <Stack.Screen options={{ title: name, headerTintColor: accent, headerLargeTitleStyle: { color: colors.text } }} />
      <PostList
        posts={items}
        loading={posts.isPending}
        error={posts.error}
        refreshing={posts.isRefetching && !posts.isFetchingNextPage}
        onRefresh={() => posts.refetch()}
        onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
        fetchingMore={posts.isFetchingNextPage}
        hasMore={posts.hasNextPage}
        onRetry={() => posts.refetch()}
        showCategory={all}
        emptyEmoji={emoji ?? '📰'}
        emptyTitle="Hier ist noch nichts"
        emptyMessage="In diesem Ressort wurde noch kein Artikel veröffentlicht."
        header={
          <View style={styles.header}>
            {category?.description ? (
              <Txt variant="bodySmall" color="textSecondary">
                {category.description}
              </Txt>
            ) : null}
            {total !== undefined ? (
              <Txt variant="overline" style={{ color: accent }}>
                {emoji ? `${emoji} ` : ''}
                {total} Artikel
              </Txt>
            ) : null}
          </View>
        }
        style={{ backgroundColor: colors.bg }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.sm, gap: space.sm },
});
