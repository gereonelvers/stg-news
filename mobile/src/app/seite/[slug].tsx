import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { usePage } from '@/api/queries';
import { ArticleBody } from '@/components/article/ArticleBody';
import { DotLoader } from '@/components/ui/Dots';
import { ErrorView } from '@/components/ui/ErrorView';
import { Txt } from '@/components/ui/Txt';
import { formatLong } from '@/lib/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';

export default function SeiteScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const page = usePage(slug);
  return (
    <>
      <Stack.Screen options={{ title: page.data?.title ?? '' }} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: space.xxxl, paddingTop: space.md }}>
        {page.isPending ? (
          <DotLoader />
        ) : page.isError ? (
          <ErrorView error={page.error} onRetry={() => page.refetch()} />
        ) : page.data ? (
          <View style={{ gap: space.lg }}>
            <ArticleBody html={page.data.content} />
            <Txt variant="caption" color="textTertiary" style={{ paddingHorizontal: gutter }}>
              Zuletzt aktualisiert am {formatLong(page.data.modified)}
            </Txt>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
