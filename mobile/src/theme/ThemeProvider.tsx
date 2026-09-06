import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { useSettings } from '@/store/settings';
import { darkColors, lightColors, type ColorTokens } from './tokens';

export type Theme = {
  colors: ColorTokens;
  isDark: boolean;
  scheme: 'light' | 'dark';
  /** Multiplier applied to article body text. */
  textScale: number;
};

const ThemeContext = createContext<Theme>({
  colors: lightColors,
  isDark: false,
  scheme: 'light',
  textScale: 1,
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const appearance = useSettings((s) => s.appearance);
  const textScale = useSettings((s) => s.textScale);
  const system = useColorScheme();

  // Force the native colour scheme when the user picked one explicitly so that
  // native headers, tab bars, sheets and glass follow the in-app setting.
  useEffect(() => {
    Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
  }, [appearance]);

  const scheme: 'light' | 'dark' = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;

  const value = useMemo<Theme>(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      isDark: scheme === 'dark',
      scheme,
      textScale,
    }),
    [scheme, textScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
