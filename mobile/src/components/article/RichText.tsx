import { Text, type StyleProp, type TextStyle } from 'react-native';

import type { Inline } from '@/api/html/types';
import { useTheme } from '@/theme/ThemeProvider';
import { monoFont } from '@/theme/tokens';
import { type TypeVariant, type } from '@/theme/typography';
import { useArticle } from './context';

type Props = {
  inlines: Inline[];
  variant?: TypeVariant;
  scaled?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
};

/** Renders inline runs (bold, links, code …) as nested Text nodes. */
export function RichText({ inlines, variant = 'body', scaled = true, color, style, numberOfLines, selectable = true }: Props) {
  const { colors, textScale } = useTheme();
  const { inverted, onLink } = useArticle();
  const base = type[variant];
  const scale = scaled ? textScale : 1;
  const fontSize = Math.round(base.fontSize * scale);
  const lineHeight = base.lineHeight ? Math.round(base.lineHeight * scale) : undefined;
  const textColor = color ?? (inverted ? '#FFFFFF' : colors.text);
  const linkColor = inverted ? '#FFFFFF' : colors.tint;

  return (
    <Text style={[base, { color: textColor, fontSize, lineHeight }, style]} numberOfLines={numberOfLines} selectable={selectable} maxFontSizeMultiplier={1.6}>
      {inlines.map((run, i) => {
        if (run.kind === 'br') return '\n';
        const s: TextStyle = {};
        if (run.bold) s.fontWeight = '700';
        if (run.italic) s.fontStyle = 'italic';
        if (run.underline && !run.href) s.textDecorationLine = 'underline';
        if (run.strike) s.textDecorationLine = run.underline ? 'underline line-through' : 'line-through';
        if (run.code) {
          Object.assign(s, monoFont, { backgroundColor: colors.surface2, fontSize: fontSize - 2 });
        }
        if (run.mark) s.backgroundColor = colors.tintSoft;
        if (run.sup || run.sub) s.fontSize = Math.round(fontSize * 0.7);
        if (run.href) {
          s.color = linkColor;
          s.textDecorationLine = 'underline';
          s.textDecorationColor = inverted ? 'rgba(255,255,255,0.6)' : colors.tintSoft;
        }
        const href = run.href;
        return (
          <Text key={i} style={s} onPress={href ? () => onLink(href) : undefined} accessibilityRole={href ? 'link' : undefined} suppressHighlighting={!href}>
            {run.text}
          </Text>
        );
      })}
    </Text>
  );
}
