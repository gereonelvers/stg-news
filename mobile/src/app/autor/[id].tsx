import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuthor, usePosts } from '@/api/queries';
import { PostList } from '@/components/lists/PostList';
import { Avatar } from '@/components/ui/Avatar';
import { Txt } from '@/components/ui/Txt';
import { pluralize } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export default function AutorScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const id = Number(params.id);
  const { colors } = useTheme();
  const author = useAuthor(id);
  const posts = usePosts({ author: id });
  const items = posts.data?.pages.flatMap((p) => p.items);
  const name = author.data?.name ?? params.name ?? '';

  return (
    <>
      <Stack.Screen options={{ title: name }} />
      <PostList
        posts={items}
        loading={posts.isPending}
        error={posts.error}
        refreshing={posts.isRefetching && !posts.isFetchingNextPage}
        onRefresh={() => {
          posts.refetch();
          author.refetch();
        }}
        onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
        fetchingMore={posts.isFetchingNextPage}
        hasMore={posts.hasNextPage}
        onRetry={() => posts.refetch()}
        showAuthor={false}
        emptyEmoji="✍️"
        emptyTitle="Noch keine Artikel"
        header={
          <View style={styles.header}>
            <Avatar name={name || '?'} uri={author.data?.avatar} size={88} />
            <Txt variant="display" align="center">
              {name}
            </Txt>
            {author.data?.bio ? (
              <Txt variant="bodySmall" color="textSecondary" align="center" style={{ maxWidth: 420 }}>
                {author.data.bio}
              </Txt>
            ) : null}
            {author.data ? (
              <Txt variant="overline" color="tint">
                {pluralize(author.data.post_count, 'Artikel', 'Artikel')}
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
  header: { alignItems: 'center', gap: space.sm, paddingHorizontal: gutter, paddingTop: space.lg, paddingBottom: space.lg },
});
