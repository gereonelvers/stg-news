import { Platform, type TextStyle } from 'react-native';

/** Brand colours taken from the website theme and the original masthead artwork. */
export const brand = {
  crimson: '#99183F',
  crimsonDeep: '#6E1030',
  crimsonBright: '#C42556',
  rust: '#8B2A0E',
  ink: '#17151A',
  paper: '#FFFFFF',
} as const;

export type ColorTokens = {
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  border: string;
  separator: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnTint: string;
  tint: string;
  tintSoft: string;
  skeleton: string;
  overlay: string;
  danger: string;
  success: string;
  glassFallback: string;
};

export const lightColors: ColorTokens = {
  bg: '#FFFFFF',
  bgElevated: '#FFFFFF',
  surface: '#F4F2F5',
  surface2: '#E9E6EC',
  border: '#E4E1E8',
  separator: 'rgba(23,21,26,0.08)',
  text: '#17151A',
  textSecondary: '#5E5967',
  textTertiary: '#8F8A98',
  textOnTint: '#FFFFFF',
  tint: brand.crimson,
  tintSoft: 'rgba(153,24,63,0.10)',
  skeleton: '#ECE9EE',
  overlay: 'rgba(0,0,0,0.45)',
  danger: '#C62828',
  success: '#2E7D32',
  glassFallback: 'rgba(255,255,255,0.72)',
};

export const darkColors: ColorTokens = {
  bg: '#0E0D10',
  bgElevated: '#161519',
  surface: '#1C1A20',
  surface2: '#26232B',
  border: '#2E2B34',
  separator: 'rgba(255,255,255,0.10)',
  text: '#F6F4F8',
  textSecondary: '#ABA6B4',
  textTertiary: '#7A7583',
  textOnTint: '#FFFFFF',
  tint: '#E8477A',
  tintSoft: 'rgba(232,71,122,0.16)',
  skeleton: '#24222A',
  overlay: 'rgba(0,0,0,0.6)',
  danger: '#EF5350',
  success: '#66BB6A',
  glassFallback: 'rgba(22,21,25,0.72)',
};

export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Screen edge padding: comfortable on phones, keeps content readable on tablets. */
export const gutter = 20;
export const maxContentWidth = 720;

type DisplayWeight = 500 | 600 | 700 | 800;

/**
 * Barlow Condensed is used for headlines and labels. Body copy stays on the
 * platform system font so the app feels native on both iOS and Android.
 */
export function displayFont(weight: DisplayWeight = 700, italic = false): TextStyle {
  const names: Record<DisplayWeight, string> = {
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
  };
  if (Platform.OS === 'ios') {
    const name = italic && weight >= 700 ? 'BoldItalic' : names[weight];
    return { fontFamily: `BarlowCondensed-${name}` };
  }
  return {
    fontFamily: 'BarlowCondensed',
    fontWeight: String(weight) as TextStyle['fontWeight'],
    ...(italic ? { fontStyle: 'italic' as const } : null),
  };
}

export const systemFont = Platform.select<TextStyle>({
  ios: { fontFamily: 'System' },
  android: { fontFamily: 'sans-serif' },
  default: {},
}) as TextStyle;

export const monoFont = Platform.select<TextStyle>({
  ios: { fontFamily: 'Menlo' },
  android: { fontFamily: 'monospace' },
  default: { fontFamily: 'monospace' },
}) as TextStyle;

export const shadow = {
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 2 },
    default: {},
  }),
  floating: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
