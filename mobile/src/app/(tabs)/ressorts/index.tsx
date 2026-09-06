import { Stack, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useCategories, useHome, useRandomPost } from '@/api/queries';
import { CategoryTile } from '@/components/cards/CategoryTile';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { useOpenPost } from '@/lib/navigation';
import { useLayout } from '@/theme/layout';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, maxContentWidth, space } from '@/theme/tokens';

export default function RessortsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const categories = useCategories();
  const home = useHome();
  const random = useRandomPost();
  const open = useOpenPost();

  const layout = useLayout();
  const contentWidth = layout.isWide ? layout.containerWidth : Math.min(width, maxContentWidth) - gutter * 2;
  const columns = layout.isXWide ? 4 : layout.isWide ? 3 : 2;
  const tileWidth = (contentWidth - space.md * (columns - 1)) / columns;
  const tileHeight = layout.isWide ? 190 : 150;

  const header = (
    <View style={styles.header}>
      <Txt variant="bodySmall" color="textSecondary">
        {home.data ? `${home.data.counts.posts} Artikel in ${home.data.counts.categories} Ressorts.` : 'Alle Themen der Schülerzeitung.'} Kein Plan, wo du anfangen sollst?
      </Txt>
      <View style={styles.actions}>
        <Button
          label={random.isPending ? 'Suche …' : 'Überrasch mich'}
          icon="shuffle"
          variant="primary"
          disabled={random.isPending}
          onPress={() => {
            haptic.medium();
            random.mutate(undefined, { onSuccess: (post) => open(post) });
          }}
        />
        <Button label="Alle Artikel" variant="secondary" onPress={() => router.push({ pathname: '/ressort/[id]', params: { id: 'alle', name: 'Alle Artikel' } })} />
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Ressorts' }} />
      {categories.isError && !categories.data ? (
        <ErrorView error={categories.error} onRetry={() => categories.refetch()} />
      ) : (
        <FlatList
          key={columns}
          data={categories.data ?? []}
          numColumns={columns}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => <CategoryTile category={item} width={tileWidth} height={tileHeight} />}
          columnWrapperStyle={{ gap: space.md }}
          contentContainerStyle={[styles.grid, { width: contentWidth + (layout.isWide ? layout.gutter : gutter) * 2, alignSelf: 'center', paddingHorizontal: layout.isWide ? layout.gutter : gutter }]}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={{ gap: space.md }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
                  <Skeleton width={tileWidth} height={150} radius={20} />
                  <Skeleton width={tileWidth} height={150} radius={20} />
                </View>
              ))}
            </View>
          }
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.bg }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: gutter, gap: space.md, paddingBottom: space.xxxl },
  header: { gap: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
