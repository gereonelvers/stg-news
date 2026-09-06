import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useCategories, useSearch } from '@/api/queries';
import { PostRow } from '@/components/cards/PostRow';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { DotLoader } from '@/components/ui/Dots';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Row';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { rememberCards } from '@/lib/cardCache';
import { useRecents } from '@/store/recents';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, space } from '@/theme/tokens';

export default function SucheScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const search = useSearch(query);
  const categories = useCategories();
  const recents = useRecents();
  const active = query.trim().length >= 2;

  rememberCards(search.data?.posts);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Suche',
          headerSearchBarOptions: {
            placeholder: 'Artikel, Autor:innen, Ressorts',
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            onSearchButtonPress: (e) => recents.addSearch(e.nativeEvent.text),
            autoCapitalize: 'none',
            hideWhenScrolling: false,
            obscureBackground: false,
            tintColor: colors.tint,
            textColor: colors.text,
          },
        }}
      />
      {!active ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bg }} keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: space.xxxl }}>
          {recents.searches.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Txt variant="overline" color="textTertiary">
                  Zuletzt gesucht
                </Txt>
                <Tap onPress={recents.clearSearches} dim scaleTo={1} hitSlop={8} accessibilityRole="button">
                  <Txt variant="caption" color="tint">
                    Löschen
                  </Txt>
                </Tap>
              </View>
              {recents.searches.map((term) => (
                <Tap key={term} onPress={() => setQuery(term)} dim scaleTo={1} style={styles.recentRow} accessibilityRole="button">
                  <Icon name="history" size={16} color="textTertiary" />
                  <Txt variant="bodySmall" style={{ flex: 1 }}>
                    {term}
                  </Txt>
                  <Icon name="external" size={14} color="textTertiary" />
                </Tap>
              ))}
            </View>
          ) : null}
          <View style={styles.section}>
            <Txt variant="overline" color="textTertiary">
              Stöbern
            </Txt>
            <View style={styles.chips}>
              {(categories.data ?? []).slice(0, 14).map((c) => (
                <Chip key={c.id} category={c} size="md" emoji />
              ))}
            </View>
          </View>
          {Platform.OS === 'android' ? (
            <Txt variant="caption" color="textTertiary" style={{ paddingHorizontal: gutter, marginTop: space.lg }}>
              Tipp: Tippe oben ins Suchfeld.
            </Txt>
          ) : null}
        </ScrollView>
      ) : search.isPending ? (
        <View style={{ backgroundColor: colors.bg, flex: 1 }}>
          <DotLoader />
        </View>
      ) : search.isError ? (
        <ErrorView error={search.error} onRetry={() => search.refetch()} />
      ) : (
        <FlatList
          data={search.data?.posts ?? []}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => <PostRow post={item} />}
          ItemSeparatorComponent={() => <Separator inset={gutter} />}
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.bg }}
          contentContainerStyle={{ paddingBottom: space.xxxl }}
          ListHeaderComponent={
            <View>
              {search.data?.authors.length ? (
                <View style={styles.section}>
                  <Txt variant="overline" color="textTertiary">
                    Autor:innen
                  </Txt>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
                    {search.data.authors.map((a) => (
                      <Tap key={a.id} onPress={() => router.push({ pathname: '/autor/[id]', params: { id: String(a.id), name: a.name } })} scaleTo={0.95} style={styles.author} accessibilityRole="button">
                        <Avatar name={a.name} uri={a.avatar} size={52} />
                        <Txt variant="caption" numberOfLines={1} style={{ maxWidth: 76 }}>
                          {a.name}
                        </Txt>
                      </Tap>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
              {search.data?.categories.length ? (
                <View style={styles.section}>
                  <Txt variant="overline" color="textTertiary">
                    Ressorts
                  </Txt>
                  <View style={styles.chips}>
                    {search.data.categories.map((c) => (
                      <Chip key={c.id} category={c} size="md" emoji />
                    ))}
                  </View>
                </View>
              ) : null}
              {search.data?.posts.length ? (
                <Txt variant="overline" color="textTertiary" style={{ paddingHorizontal: gutter, paddingTop: space.lg, paddingBottom: space.xs }}>
                  {search.data.total} Artikel
                </Txt>
              ) : null}
            </View>
          }
          ListEmptyComponent={<EmptyState emoji="🔍" title="Nichts gefunden" message={`Zu „${query.trim()}“ gibt es keinen Artikel. Probier ein anderes Wort.`} />}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: gutter, paddingTop: space.lg, gap: space.sm },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  author: { alignItems: 'center', gap: 6, width: 76 },
});
