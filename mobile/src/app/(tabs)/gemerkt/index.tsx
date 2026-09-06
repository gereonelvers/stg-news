import { Stack, useRouter } from 'expo-router';
import { Alert, FlatList, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { PostRow } from '@/components/cards/PostRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Row';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { haptic } from '@/lib/haptics';
import { useBookmarkList, useBookmarks } from '@/store/bookmarks';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export default function GemerktScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const posts = useBookmarkList();
  const remove = useBookmarks((s) => s.remove);
  const clear = useBookmarks((s) => s.clear);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gemerkt',
          headerRight: posts.length
            ? () => (
                <Tap
                  onPress={() =>
                    Alert.alert('Alle Lesezeichen entfernen?', `${posts.length} gemerkte Artikel werden aus der Liste entfernt.`, [
                      { text: 'Abbrechen', style: 'cancel' },
                      { text: 'Entfernen', style: 'destructive', onPress: () => { clear(); haptic.warning(); } },
                    ])
                  }
                  hitSlop={8}
                  dim
                  scaleTo={1}
                  accessibilityRole="button"
                  accessibilityLabel="Alle entfernen">
                  <Icon name="trash" size={20} color="tint" />
                </Tap>
              )
            : undefined,
        }}
      />
      <FlatList
        data={posts}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <Animated.View exiting={FadeOut.duration(200)} layout={LinearTransition.springify().damping(18)}>
            <PostRow
              post={item}
              right={
                <Tap
                  onPress={() => {
                    remove(item.id);
                    haptic.light();
                  }}
                  hitSlop={10}
                  scaleTo={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Lesezeichen entfernen"
                  style={{ paddingLeft: 4 }}>
                  <Icon name="bookmarkFill" size={20} color="tint" />
                </Tap>
              }
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <Separator inset={gutter} />}
        ListHeaderComponent={
          posts.length ? (
            <Txt variant="caption" color="textTertiary" style={{ paddingHorizontal: gutter, paddingTop: space.sm, paddingBottom: space.xs }}>
              {posts.length} {posts.length === 1 ? 'Artikel' : 'Artikel'} · Auch offline lesbar, sobald einmal geöffnet
            </Txt>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ paddingTop: space.xxl }}>
            <EmptyState
              emoji="🔖"
              title="Noch nichts gemerkt"
              message="Tippe in einem Artikel auf das Lesezeichen, dann landet er hier. Zum Beispiel für die Bahnfahrt."
              actionLabel="Artikel entdecken"
              onAction={() => router.navigate('/')}
            />
          </View>
        }
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
      />
    </>
  );
}
