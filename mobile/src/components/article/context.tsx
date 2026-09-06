import { createContext, useContext } from 'react';

import type { BlockImage } from '@/api/html/types';

export type ArticleContextValue = {
  contentWidth: number;
  inverted: boolean;
  openImage: (image: BlockImage) => void;
  onLink: (href: string) => void;
};

export const ArticleContext = createContext<ArticleContextValue>({
  contentWidth: 360,
  inverted: false,
  openImage: () => undefined,
  onLink: () => undefined,
});

export const useArticle = () => useContext(ArticleContext);
