import { useWindowDimensions } from 'react-native';

import { gutter as phoneGutter } from './tokens';

export type Layout = {
  width: number;
  height: number;
  /** ≥ 700 pt: iPad portrait, large tablets, phones in landscape. */
  isWide: boolean;
  /** ≥ 1000 pt: iPad landscape, desktop-class widths. */
  isXWide: boolean;
  /** Horizontal page padding. */
  gutter: number;
  /** Width of the centred page container (excluding gutters). */
  containerWidth: number;
  /** Comfortable width for running text. */
  readingWidth: number;
  /** Columns for card/list grids. */
  columns: 1 | 2 | 3;
};

const MAX_CONTAINER = 1120;
const READING = 720;

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 700;
  const isXWide = width >= 1000;
  const gutter = isWide ? 32 : phoneGutter;
  const containerWidth = Math.min(width, MAX_CONTAINER) - gutter * 2;
  return {
    width,
    height,
    isWide,
    isXWide,
    gutter,
    containerWidth,
    readingWidth: Math.min(width - gutter * 2, READING),
    columns: isXWide ? 3 : isWide ? 2 : 1,
  };
}
