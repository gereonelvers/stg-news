import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useLayout } from '@/theme/layout';

type Props = {
  children: React.ReactNode;
  /** Use the narrower reading width instead of the full container. */
  reading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Skip horizontal padding (children handle their own). */
  flush?: boolean;
};

/** Centres content on wide screens and applies the page gutter. */
export function Container({ children, reading, style, flush }: Props) {
  const { containerWidth, readingWidth, gutter } = useLayout();
  const width = reading ? readingWidth : containerWidth;
  return <View style={[{ width: width + (flush ? 0 : gutter * 2), alignSelf: 'center', paddingHorizontal: flush ? 0 : gutter }, style]}>{children}</View>;
}
