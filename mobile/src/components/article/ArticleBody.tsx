import { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { parseArticle } from '@/api/html/parse';
import type { BlockImage } from '@/api/html/types';
import { gutter, maxContentWidth } from '@/theme/tokens';
import { Lightbox } from './Lightbox';
import { Blocks } from './blocks';
import { ArticleContext, type ArticleContextValue } from './context';
import { useLinkHandler } from './useLinkHandler';

type Props = { html: string };

/** Native article renderer. Parses once, renders blocks, hosts the lightbox. */
export function ArticleBody({ html }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, maxContentWidth) - gutter * 2;
  const parsed = useMemo(() => parseArticle(html), [html]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const onLink = useLinkHandler();

  const ctx = useMemo<ArticleContextValue>(
    () => ({
      contentWidth,
      inverted: false,
      onLink,
      openImage: (image: BlockImage) => {
        const idx = parsed.images.findIndex((i) => i.src === image.src || i.full === image.full);
        setLightboxIndex(idx >= 0 ? idx : 0);
      },
    }),
    [contentWidth, onLink, parsed.images],
  );

  return (
    <ArticleContext.Provider value={ctx}>
      <View style={{ paddingHorizontal: gutter, alignSelf: 'center', width: Math.min(width, maxContentWidth) }}>
        <Blocks blocks={parsed.blocks} />
      </View>
      <Lightbox images={parsed.images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
    </ArticleContext.Provider>
  );
}
