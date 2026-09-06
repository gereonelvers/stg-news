import type { TextStyle } from 'react-native';

import { displayFont, monoFont, systemFont } from './tokens';

/**
 * Type scale. Display styles use Barlow Condensed, everything else the system
 * font. Sizes are tuned so long German headlines still fit on small phones.
 */
export const type = {
  hero: { ...displayFont(800), fontSize: 38, lineHeight: 40, letterSpacing: -0.4 },
  display: { ...displayFont(800), fontSize: 32, lineHeight: 34, letterSpacing: -0.3 },
  headline: { ...displayFont(700), fontSize: 24, lineHeight: 26 },
  headlineSmall: { ...displayFont(700), fontSize: 20, lineHeight: 22 },
  title: { ...displayFont(700), fontSize: 18, lineHeight: 21 },
  sectionTitle: { ...displayFont(800), fontSize: 26, lineHeight: 28, letterSpacing: -0.2 },
  overline: { ...displayFont(600), fontSize: 13, lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase' as const },
  chip: { ...displayFont(600), fontSize: 13, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  body: { ...systemFont, fontSize: 17, lineHeight: 26 },
  bodySmall: { ...systemFont, fontSize: 15, lineHeight: 21 },
  label: { ...systemFont, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { ...systemFont, fontSize: 13, lineHeight: 18 },
  micro: { ...systemFont, fontSize: 11, lineHeight: 14, fontWeight: '600' },
  mono: { ...monoFont, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
