import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { AuthorFull } from '@/api/types';
import { Avatar } from '@/components/ui/Avatar';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { pluralize } from '@/lib/text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export function AuthorTile({ author, width }: { author: AuthorFull; width: number }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Tap
      onPress={() => router.push({ pathname: '/autor/[id]', params: { id: String(author.id), name: author.name } })}
      scaleTo={0.96}
      haptics="light"
      style={[styles.tile, { width, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={author.name}>
      <Avatar name={author.name} uri={author.avatar} size={64} />
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Txt variant="title" numberOfLines={2} align="center">
          {author.name}
        </Txt>
        <Txt variant="caption" color="textSecondary">
          {pluralize(author.post_count, 'Artikel', 'Artikel')}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, minHeight: 160, justifyContent: 'center' },
});
