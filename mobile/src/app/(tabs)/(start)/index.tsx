import { useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useConfig, useHome } from '@/api/queries';
import { HeroCard } from '@/components/cards/HeroCard';
import { PopularRow } from '@/components/cards/PopularRow';
import { PostRow } from '@/components/cards/PostRow';
import { BreakingBanner } from '@/components/home/BreakingBanner';
import { JoinCard } from '@/components/home/JoinCard';
import { Masthead } from '@/components/home/Masthead';
import { SectionRail } from '@/components/home/SectionRail';
import { ErrorView } from '@/components/ui/ErrorView';
import { Separator } from '@/components/ui/Row';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonHero, SkeletonList } from '@/components/ui/Skeleton';
import { StatusBarScrim } from '@/components/ui/StatusBarScrim';
import { Txt } from '@/components/ui/Txt';
import { rememberCards } from '@/lib/cardCache';
import { haptic } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export default function StartScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const client = useQueryClient();
  const home = useHome();
  const config = useConfig();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([home.refetch(), client.invalidateQueries({ queryKey: ['posts'] })]);
    setRefreshing(false);
    haptic.soft();
  }, [client, home]);

  const data = home.data;
  rememberCards(data?.latest);
  rememberCards(data?.popular);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBarScrim />
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.tint} colors={[colors.tint]} progressViewOffset={80} />}
        contentContainerStyle={{ paddingBottom: space.xxxl }}>
        <Masthead />

        {home.isPending && !data ? (
          <View style={{ gap: space.xl, marginTop: space.md }}>
            <SkeletonHero />
            <SkeletonList count={4} />
          </View>
        ) : home.isError && !data ? (
          <ErrorView error={home.error} onRetry={() => home.refetch()} />
        ) : data ? (
          <Animated.View entering={FadeIn.duration(250)}>
            {data.breaking ? <BreakingBanner post={data.breaking} /> : null}
            {data.hero ? (
              <View style={{ paddingHorizontal: gutter, marginTop: space.xs }}>
                <HeroCard post={data.hero} label={data.hero.sticky ? 'Top-Story' : 'Neueste Story'} />
              </View>
            ) : null}

            <SectionHeader title="Neu" subtitle="Frisch aus der Redaktion" onAction={() => router.push({ pathname: '/ressort/[id]', params: { id: 'alle', name: 'Alle Artikel' } })} />
            {data.latest.slice(0, 5).map((post, i) => (
              <View key={post.id}>
                {i > 0 ? <Separator inset={gutter} /> : null}
                <PostRow post={post} />
              </View>
            ))}

            {data.sections.map((section) => (
              <SectionRail key={section.category.id} category={section.category} posts={section.posts} />
            ))}

            {data.popular.length ? (
              <>
                <SectionHeader title="Meistgelesen" emoji="🔥" subtitle="Was gerade alle lesen" />
                {data.popular.map((post, i) => (
                  <PopularRow key={post.id} post={post} rank={i + 1} />
                ))}
              </>
            ) : null}

            <JoinCard instagram={config.data?.site.instagram} />

            <View style={styles.footer}>
              <Txt variant="overline" color="textTertiary" align="center">
                Schüler texten Gedanken
              </Txt>
              <Txt variant="caption" color="textTertiary" align="center">
                Schülerzeitung des Städtischen Gymnasiums Bad Segeberg · {data.counts.posts} Artikel seit 2018
              </Txt>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: space.xs, paddingHorizontal: gutter, paddingTop: space.xxxl },
});
