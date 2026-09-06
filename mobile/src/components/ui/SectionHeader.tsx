import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';
import { Icon } from './Icon';
import { Tap } from './Tap';
import { Txt } from './Txt';

type Props = {
  title: string;
  emoji?: string;
  accent?: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
};

export function SectionHeader({ title, emoji, accent, actionLabel = 'Alle', onAction, subtitle }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          {accent ? <View style={[styles.bar, { backgroundColor: accent }]} /> : null}
          <Txt variant="sectionTitle" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ flexShrink: 1 }}>
            {emoji ? `${emoji} ` : ''}
            {title}
          </Txt>
        </View>
        {subtitle ? (
          <Txt variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {onAction ? (
        <Tap onPress={onAction} dim hitSlop={10} accessibilityRole="button" style={styles.action}>
          <Txt variant="label" style={{ color: accent ?? colors.tint }}>
            {actionLabel}
          </Txt>
          <Icon name="chevronRight" size={14} color={accent ?? colors.tint} weight="bold" />
        </Tap>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: gutter, marginTop: space.xxl, marginBottom: space.md, gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bar: { width: 5, height: 24, borderRadius: 3 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
});
