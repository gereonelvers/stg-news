import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { hashColor, withAlpha } from '@/lib/colors';
import { initials } from '@/lib/text';
import { displayFont } from '@/theme/tokens';
import { Txt } from './Txt';

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
};

/** Gravatar when one exists, otherwise a coloured monogram derived from the name. */
export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const color = hashColor(name);
  const showImage = !!uri && !failed;
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: withAlpha(color, 0.18) },
      ]}
      accessibilityLabel={name}>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          onError={() => setFailed(true)}
        />
      ) : (
        <Txt style={[displayFont(700), { color, fontSize: size * 0.42, lineHeight: size * 0.5, letterSpacing: 0.5 }]}>
          {initials(name)}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
