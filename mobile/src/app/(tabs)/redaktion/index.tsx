import { Stack, useRouter } from 'expo-router';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import { useAuthors, useConfig } from '@/api/queries';
import { AuthorTile } from '@/components/cards/AuthorTile';
import { useLinkHandler } from '@/components/article/useLinkHandler';
import { Button } from '@/components/ui/Button';
import { ErrorView } from '@/components/ui/ErrorView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Txt } from '@/components/ui/Txt';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, maxContentWidth, space } from '@/theme/tokens';

const PSEUDO = new Set(['gastbeitrag', 'schuelerzeitung']);

export default function RedaktionScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const authors = useAuthors();
  const config = useConfig();
  const openLink = useLinkHandler();

  const contentWidth = Math.min(width, maxContentWidth) - gutter * 2;
  const columns = width > 600 ? 4 : 3;
  const tileWidth = (contentWidth - space.sm * (columns - 1)) / columns;

  const people = (authors.data ?? []).slice().sort((a, b) => Number(PSEUDO.has(a.slug)) - Number(PSEUDO.has(b.slug)) || b.post_count - a.post_count);

  const header = (
    <View style={styles.header}>
      <Txt variant="bodySmall" color="textSecondary">
        Wir sind Schüler:innen des Städtischen Gymnasiums Bad Segeberg und schreiben über alles, was uns bewegt: Schule, Sport, Politik, Gaming, Kultur und ab und zu auch Unsinn.
      </Txt>
      <View style={styles.actions}>
        <Button label="Über uns" icon="info" onPress={() => router.push({ pathname: '/seite/[slug]', params: { slug: 'ueber-uns' } })} />
        {config.data?.site.instagram ? <Button label="Instagram" icon="camera" variant="secondary" onPress={() => openLink(config.data!.site.instagram)} /> : null}
      </View>
      {people.length ? (
        <Txt variant="overline" color="textTertiary" style={{ marginTop: space.sm }}>
          {people.length} Autor:innen
        </Txt>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Redaktion' }} />
      {authors.isError && !authors.data ? (
        <ErrorView error={authors.error} onRetry={() => authors.refetch()} />
      ) : (
        <FlatList
          key={columns}
          data={people}
          numColumns={columns}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => <AuthorTile author={item} width={tileWidth} />}
          columnWrapperStyle={{ gap: space.sm }}
          contentContainerStyle={[styles.grid, { width: Math.min(width, maxContentWidth), alignSelf: 'center' }]}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} width={tileWidth} height={160} radius={20} />
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
  grid: { paddingHorizontal: gutter, gap: space.sm, paddingBottom: space.xxxl },
  header: { gap: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
});
