import { unstable_getMaterialSymbolSourceAsync, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { type ImageSourcePropType, Platform } from 'react-native';

import { ICONS, type SymbolIconName } from '@/components/ui/Icon';

type Sf = NonNullable<Extract<SymbolViewProps['name'], object>['ios']>;

/**
 * Resolved Material Symbol images, kept for the life of the app. Without this a
 * toolbar icon that changes with state (the bookmark) would show the previous
 * image until its replacement had been rendered, because resolving is async on
 * Android – and would keep showing it for good if a resolve came back empty.
 */
const androidSources = new Map<string, ImageSourcePropType>();
const sourceKey = (md: string, size: number, color: string): string => `${md}|${size}|${color}`;

/**
 * Header/toolbar items take an SF Symbol name on iOS and an image on Android.
 * This resolves the Material Symbol into an image source on Android.
 *
 * Call it once per icon you might show, not once for "the current icon": the
 * returned value then switches synchronously, because both are already resolved.
 */
export function useHeaderIcon(name: SymbolIconName, color: string, size = 24): Sf | ImageSourcePropType | undefined {
  const md = ICONS[name].android;
  const [source, setSource] = useState<ImageSourcePropType | undefined>(() => androidSources.get(sourceKey(md, size, color)));

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const key = sourceKey(md, size, color);
    const cached = androidSources.get(key);
    if (cached) {
      setSource(cached);
      return;
    }
    let live = true;
    unstable_getMaterialSymbolSourceAsync(md, size, color).then((s) => {
      if (!s) return;
      androidSources.set(key, s);
      if (live) setSource(s);
    });
    return () => {
      live = false;
    };
  }, [md, color, size]);

  if (Platform.OS === 'ios') return ICONS[name].ios as Sf;
  return source;
}
