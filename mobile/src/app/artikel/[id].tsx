import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedRef, useAnimatedStyle, useScrollOffset } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useComments } from '@/api/comments';
import { reportView, usePost } from '@/api/queries';
import type { PostCard, PostFull } from '@/api/types';
import { ArticleBody } from '@/components/article/ArticleBody';
import { BookmarkButton } from '@/components/cards/BookmarkButton';
import { Meta } from '@/components/cards/Meta';
import { PostRow } from '@/components/cards/PostRow';
import { CommentItem } from '@/components/comments/CommentItem';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DotLoader } from '@/components/ui/Dots';
import { ErrorView } from '@/components/ui/ErrorView';
import { Icon } from '@/components/ui/Icon';
import { Separator } from '@/components/ui/Row';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { getCard, rememberCards } from '@/lib/cardCache';
import { formatLong } from '@/lib/dates';
import { useHeaderIcon } from '@/lib/headerIcon';
import { sharePost } from '@/lib/share';
import { formatViews, pluralize } from '@/lib/text';
import { useBookmarks, useIsBookmarked } from '@/store/bookmarks';
import { useRecents } from '@/store/recents';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, maxContentWidth, radius, space } from '@/theme/tokens';

const HERO_RATIO = 0.8;

export default function ArticleScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const initial = getCard(id);
  const query = usePost(id, initial);
  const post = query.data;
  const comments = useComments(id);
  const saved = useIsBookmarked(id);
  const toggle = useBookmarks((s) => s.toggle);
  const markRead = useRecents((s) => s.markRead);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scrollRef);

  useEffect(() => {
    if (id > 0) {
      reportView(id);
      markRead(id);
    }
  }, [id, markRead]);

  useEffect(() => {
    rememberCards(post?.related);
  }, [post?.related]);

  const heroWidth = Math.min(width, maxContentWidth);
  const heroHeight = Math.round(width * (Platform.OS === 'ios' ? HERO_RATIO : 0.62));
  const image = post?.image?.sizes?.large?.src ?? post?.image?.src;

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(offset.value, [-heroHeight, 0, heroHeight], [-heroHeight / 2, 0, heroHeight * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(offset.value, [-heroHeight, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));

  const shareIcon = useHeaderIcon('share', colors.tint);
  const bookmarkIcon = useHeaderIcon(saved ? 'bookmarkFill' : 'bookmark', colors.tint);

  const cardForActions: PostCard | undefined = post ?? initial;
  const loaded = !!post && post.content !== '';

  const totalComments = useMemo(() => (comments.data ? countComments(comments.data) : post?.comment_count ?? 0), [comments.data, post?.comment_count]);

  if (query.isError && !post) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: Platform.OS === 'ios', headerBlurEffect: 'systemChromeMaterial' }} />
      {cardForActions && (Platform.OS === 'ios' || (bookmarkIcon && shareIcon)) ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon={bookmarkIcon} accessibilityLabel={saved ? 'Lesezeichen entfernen' : 'Merken'} onPress={() => toggle(cardForActions)} tintColor={colors.tint}>
            {bookmarkIcon ? undefined : saved ? 'Gemerkt' : 'Merken'}
          </Stack.Toolbar.Button>
          <Stack.Toolbar.Button icon={shareIcon} accessibilityLabel="Teilen" onPress={() => sharePost(cardForActions)} tintColor={colors.tint}>
            {shareIcon ? undefined : 'Teilen'}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : null}
      <Animated.ScrollView ref={scrollRef} style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }} scrollEventThrottle={16} contentInsetAdjustmentBehavior="never">
        {/* Hero */}
        <View style={{ height: image ? heroHeight : Platform.OS === 'ios' ? insets.top + 64 : space.sm, backgroundColor: colors.surface, overflow: 'hidden' }}>
          {image ? (
            <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
              <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} cachePolicy="disk" priority="high" accessibilityLabel={post?.image?.alt} />
              {Platform.OS === 'ios' ? <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']} locations={[0, 0.5]} style={StyleSheet.absoluteFill} /> : null}
            </Animated.View>
          ) : null}
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.bg, width: heroWidth, alignSelf: 'center', marginTop: image ? -radius.xl : 0 }]}>
          {/* Title block */}
          <View style={styles.head}>
            <View style={styles.chips}>
              {(post ?? initial)?.categories.map((c) => (
                <Chip key={c.id} category={c} />
              ))}
            </View>
            {post || initial ? (
              <Txt variant="display" selectable>
                {(post ?? initial)!.title}
              </Txt>
            ) : (
              <Skeleton height={32} />
            )}
            {post?.image?.caption ? (
              <Txt variant="caption" color="textTertiary">
                {post.image.caption}
              </Txt>
            ) : null}
            {(post ?? initial) ? <Byline post={(post ?? initial)!} onAuthor={() => router.push({ pathname: '/autor/[id]', params: { id: String((post ?? initial)!.author?.id ?? 0), name: (post ?? initial)!.author?.name ?? '' } })} /> : null}
          </View>

          {/* Body */}
          {loaded ? (
            <ArticleBody html={post!.content} />
          ) : (
            <View style={{ paddingHorizontal: gutter, gap: space.md, paddingTop: space.md }}>
              <Skeleton height={18} />
              <Skeleton height={18} width="92%" />
              <Skeleton height={18} width="96%" />
              <Skeleton height={18} width="60%" />
              <DotLoader />
            </View>
          )}

          {/* Tags & actions */}
          {loaded ? (
            <View style={styles.after}>
              {post!.tags.length ? (
                <View style={styles.tags}>
                  {post!.tags.map((t) => (
                    <View key={t.id} style={[styles.tag, { backgroundColor: colors.surface }]}>
                      <Txt variant="caption" color="textSecondary">
                        #{t.name}
                      </Txt>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.actionRow}>
                <Button label={saved ? 'Gemerkt' : 'Merken'} icon={saved ? 'bookmarkFill' : 'bookmark'} variant={saved ? 'primary' : 'secondary'} onPress={() => toggle(post!)} />
                <Button label="Teilen" icon="share" variant="secondary" onPress={() => sharePost(post!)} />
              </View>
              <View style={[styles.statsRow, { borderColor: colors.separator }]}>
                <Stat icon="eye" label={`${formatViews(post!.views)} Aufrufe`} />
                <Stat icon="clock" label={`${post!.reading_time} Min. Lesezeit`} />
                <Stat icon="comment" label={pluralize(totalComments, 'Kommentar', 'Kommentare')} />
              </View>
            </View>
          ) : null}

          {/* Comments */}
          {loaded ? (
            <View>
              <SectionHeader title="Kommentare" subtitle={totalComments ? `${totalComments} bisher` : 'Sei die erste Stimme'} onAction={totalComments ? () => router.push({ pathname: '/kommentare/[id]', params: { id: String(id) } }) : undefined} actionLabel="Alle" />
              <View style={{ paddingHorizontal: gutter, gap: space.lg }}>
                {comments.data?.slice(0, 2).map((c) => (
                  <CommentItem key={c.id} comment={{ ...c, children: [] }} />
                ))}
                {post!.comments_open ? (
                  <Button label={totalComments ? 'Mitdiskutieren' : 'Kommentar schreiben'} icon="comment" variant={totalComments ? 'secondary' : 'primary'} onPress={() => router.push({ pathname: '/kommentare/[id]', params: { id: String(id), compose: '1' } })} />
                ) : (
                  <Txt variant="caption" color="textTertiary">
                    Kommentare sind für diesen Artikel geschlossen.
                  </Txt>
                )}
              </View>
            </View>
          ) : null}

          {/* Related */}
          {loaded && post!.related.length ? (
            <View>
              <SectionHeader title={post!.primary_category ? `Mehr aus ${post!.primary_category.name}` : 'Mehr lesen'} emoji={post!.primary_category?.emoji} onAction={post!.primary_category ? () => router.push({ pathname: '/ressort/[id]', params: { id: String(post!.primary_category!.id), name: post!.primary_category!.name, color: post!.primary_category!.color, emoji: post!.primary_category!.emoji } }) : undefined} />
              {post!.related.map((r, i) => (
                <View key={r.id}>
                  {i > 0 ? <Separator inset={gutter} /> : null}
                  <PostRow post={r} showCategory={false} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>
    </>
  );
}

function Byline({ post, onAuthor }: { post: PostCard; onAuthor: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.byline}>
      <Tap onPress={onAuthor} dim scaleTo={1} style={styles.bylineAuthor} disabled={!post.author} accessibilityRole="button" accessibilityLabel={post.author ? `Autor:in ${post.author.name}` : undefined}>
        <Avatar name={post.author?.name ?? 'STG'} uri={post.author?.avatar} size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="label" numberOfLines={1}>
            {post.author?.name ?? 'Redaktion'}
          </Txt>
          <Txt variant="caption" color="textSecondary">
            {formatLong(post.date)} · {post.reading_time} Min.
          </Txt>
        </View>
        {post.author ? <Icon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" /> : null}
      </Tap>
      <BookmarkButton post={post} size={24} />
    </View>
  );
}

function Stat({ icon, label }: { icon: 'eye' | 'clock' | 'comment'; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={14} color="textTertiary" />
      <Txt variant="caption" color="textSecondary">
        {label}
      </Txt>
    </View>
  );
}

function countComments(nodes: { children: unknown[] }[]): number {
  return nodes.reduce((n, c) => n + 1 + countComments(c.children as { children: unknown[] }[]), 0);
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: space.xl, gap: space.xl },
  head: { paddingHorizontal: gutter, gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  byline: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
  bylineAuthor: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  after: { paddingHorizontal: gutter, gap: space.lg, marginTop: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  actionRow: { flexDirection: 'row', gap: space.sm },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});

export type { PostFull };
