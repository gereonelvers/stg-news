import { unstable_getMaterialSymbolSourceAsync, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { type ImageSourcePropType, Platform } from 'react-native';

import { ICONS, type IconName } from '@/components/ui/Icon';

type Sf = NonNullable<Extract<SymbolViewProps['name'], object>['ios']>;

/**
 * Header/toolbar items take an SF Symbol name on iOS and an image on Android.
 * This resolves the Material Symbol into an image source on Android.
 */
export function useHeaderIcon(name: IconName, color: string, size = 24): Sf | ImageSourcePropType | undefined {
  const [source, setSource] = useState<ImageSourcePropType | undefined>();
  const md = ICONS[name].android;
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let live = true;
    unstable_getMaterialSymbolSourceAsync(md, size, color).then((s) => {
      if (live && s) setSource(s);
    });
    return () => {
      live = false;
    };
  }, [md, color, size]);
  if (Platform.OS === 'ios') return ICONS[name].ios as Sf;
  return source;
}
