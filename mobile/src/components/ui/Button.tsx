import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { textOn } from '@/lib/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Tap } from './Tap';
import { Txt } from './Txt';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, variant = 'primary', size = 'md', color, disabled, style }: Props) {
  const { colors } = useTheme();
  const accent = color ?? colors.tint;
  const bg = variant === 'primary' ? accent : variant === 'secondary' ? colors.surface : 'transparent';
  const fg = variant === 'primary' ? (color ? textOn(color) : colors.textOnTint) : accent;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      haptics="light"
      accessibilityRole="button"
      style={[styles.base, size === 'sm' && styles.sm, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}>
      <View style={styles.inner}>
        {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={fg} weight="semibold" /> : null}
        <Txt variant="label" style={{ color: fg }}>
          {label}
        </Txt>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: space.lg, paddingVertical: 12, borderRadius: radius.pill, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: space.md, paddingVertical: 8 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
