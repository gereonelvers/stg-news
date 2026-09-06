import { useRouter } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Category } from '@/api/types';
import { accentFor, textOn, withAlpha } from '@/lib/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Tap } from './Tap';
import { Txt } from './Txt';

type ChipProps = {
  category: Category;
  variant?: 'soft' | 'solid' | 'onImage';
  size?: 'sm' | 'md';
  emoji?: boolean;
  navigable?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Category label. `onImage` is for use over photos, `solid` for headers. */
export function Chip({ category, variant = 'soft', size = 'sm', emoji = false, navigable = true, style }: ChipProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const accent = accentFor(category.color, isDark);

  const bg = variant === 'solid' ? accent : variant === 'onImage' ? 'rgba(0,0,0,0.42)' : withAlpha(category.color, isDark ? 0.2 : 0.12);
  const fg = variant === 'solid' ? textOn(accent) : variant === 'onImage' ? '#FFFFFF' : accent;

  const content = (
    <View style={[styles.base, size === 'md' && styles.md, { backgroundColor: bg }, style]}>
      {emoji && (
        <Txt variant="chip" style={{ color: fg, letterSpacing: 0 }}>
          {category.emoji}{' '}
        </Txt>
      )}
      <Txt variant="chip" style={[{ color: fg }, size === 'md' && { fontSize: 15, lineHeight: 18 }]} numberOfLines={1}>
        {category.name}
      </Txt>
    </View>
  );

  if (!navigable) return content;
  return (
    <Tap
      scaleTo={0.94}
      haptics="selection"
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Ressort ${category.name}`}
      onPress={() => router.push({ pathname: '/ressort/[id]', params: { id: String(category.id), name: category.name, color: category.color, emoji: category.emoji } })}>
      {content}
    </Tap>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  md: { paddingHorizontal: space.md, paddingVertical: 6 },
});
