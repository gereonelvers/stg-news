import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { gutter, space } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Tap } from './Tap';
import { Txt } from './Txt';

type Props = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Settings-style list row. */
export function Row({ title, subtitle, icon, iconColor, right, onPress, chevron, destructive, style }: Props) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconColor ? `${iconColor}22` : colors.surface2 }]}>
          <Icon name={icon} size={18} color={iconColor ?? colors.textSecondary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt variant="bodySmall" style={{ fontWeight: '500' }} color={destructive ? 'danger' : 'text'}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color="textSecondary">
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="chevronRight" size={14} color="textTertiary" weight="semibold" /> : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Tap onPress={onPress} dim scaleTo={1} accessibilityRole="button">
      {content}
    </Tap>
  );
}

export function Group({ children, title }: { children: React.ReactNode; title?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      {title ? (
        <Txt variant="overline" color="textTertiary" style={styles.groupTitle}>
          {title}
        </Txt>
      ) : null}
      <View style={[styles.groupBox, { backgroundColor: colors.surface }]}>{children}</View>
    </View>
  );
}

export function Separator({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 12, minHeight: 52 },
  iconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  group: { marginHorizontal: gutter, marginTop: space.xl },
  groupTitle: { marginBottom: space.sm, marginLeft: space.xs },
  groupBox: { borderRadius: 16, overflow: 'hidden' },
});
