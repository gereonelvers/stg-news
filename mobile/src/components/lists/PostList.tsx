import { FlatList, type FlatListProps, RefreshControl, StyleSheet, View } from 'react-native';

import type { PostCard } from '@/api/types';
import { PostRow } from '@/components/cards/PostRow';
import { DotLoader } from '@/components/ui/Dots';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorView } from '@/components/ui/ErrorView';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/Row';
import { rememberCards } from '@/lib/cardCache';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

type Props = Omit<FlatListProps<PostCard>, 'data' | 'renderItem'> & {
  posts: PostCard[] | undefined;
  loading: boolean;
  error?: unknown;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  fetchingMore?: boolean;
  hasMore?: boolean;
  showCategory?: boolean;
  showAuthor?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyEmoji?: string;
  onRetry?: () => void;
  header?: React.ReactElement | null;
};

/** Infinite, refreshable list of compact rows with the usual states handled. */
export function PostList({
  posts,
  loading,
  error,
  refreshing = false,
  onRefresh,
  onEndReached,
  fetchingMore,
  hasMore,
  showCategory,
  showAuthor,
  emptyTitle = 'Nichts gefunden',
  emptyMessage,
  emptyEmoji,
  onRetry,
  header,
  ...rest
}: Props) {
  const { colors } = useTheme();
  rememberCards(posts);

  if (loading && !posts?.length) {
    return (
      <View>
        {header}
        <SkeletonList />
      </View>
    );
  }
  if (error && !posts?.length) {
    return (
      <View>
        {header}
        <ErrorView error={error} onRetry={onRetry} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts ?? []}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item }) => <PostRow post={item} showCategory={showCategory} showAuthor={showAuthor} />}
      ItemSeparatorComponent={() => <Separator inset={gutter} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState emoji={emptyEmoji} title={emptyTitle} message={emptyMessage} />}
      ListFooterComponent={
        fetchingMore ? (
          <DotLoader />
        ) : hasMore === false && posts && posts.length > 8 ? (
          <View style={styles.end}>
            <View style={[styles.endDot, { backgroundColor: colors.textTertiary }]} />
          </View>
        ) : (
          <View style={{ height: space.xxl }} />
        )
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} /> : undefined}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  end: { alignItems: 'center', paddingVertical: space.xxl },
  endDot: { width: 6, height: 6, borderRadius: 3 },
});
