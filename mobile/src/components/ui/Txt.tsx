import { forwardRef } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { type TypeVariant, type } from '@/theme/typography';

export type TxtProps = TextProps & {
  variant?: TypeVariant;
  color?: keyof ColorTokens | (string & {});
  /** Apply the user's article text-size preference (body copy only). */
  scaled?: boolean;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
};

const DISPLAY_VARIANTS: TypeVariant[] = ['hero', 'display', 'headline', 'headlineSmall', 'title', 'sectionTitle', 'overline', 'chip'];

export const Txt = forwardRef<Text, TxtProps>(function Txt(
  { variant = 'body', color = 'text', scaled = false, align, weight, style, ...rest },
  ref,
) {
  const { colors, textScale } = useTheme();
  const base = type[variant];
  const resolved = (colors as Record<string, string>)[color] ?? color;
  const scale = scaled ? textScale : 1;
  const sized: TextStyle =
    scale === 1
      ? {}
      : {
          fontSize: Math.round(base.fontSize * scale),
          lineHeight: base.lineHeight ? Math.round(base.lineHeight * scale) : undefined,
        };
  return (
    <Text
      ref={ref}
      maxFontSizeMultiplier={DISPLAY_VARIANTS.includes(variant) ? 1.25 : 1.6}
      {...rest}
      style={[base, { color: resolved }, sized, align ? { textAlign: align } : null, weight ? { fontWeight: weight } : null, style]}
    />
  );
});
