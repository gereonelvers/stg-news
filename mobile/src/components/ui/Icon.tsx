import { SymbolView, type SymbolViewProps, type SymbolWeight } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

type SymbolName = Extract<SymbolViewProps['name'], object>;

/** App-wide icon vocabulary mapped to SF Symbols (iOS) and Material Symbols (Android). */
export const ICONS = {
  home: { ios: 'newspaper', android: 'newspaper' },
  homeFill: { ios: 'newspaper.fill', android: 'newspaper' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view' },
  gridFill: { ios: 'square.grid.2x2.fill', android: 'grid_view' },
  bookmark: { ios: 'bookmark', android: 'bookmark_border' },
  bookmarkFill: { ios: 'bookmark.fill', android: 'bookmark' },
  search: { ios: 'magnifyingglass', android: 'search' },
  team: { ios: 'person.2', android: 'group' },
  teamFill: { ios: 'person.2.fill', android: 'group' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  comment: { ios: 'bubble.left', android: 'mode_comment' },
  commentFill: { ios: 'bubble.left.fill', android: 'mode_comment' },
  settings: { ios: 'gearshape', android: 'settings' },
  play: { ios: 'play.fill', android: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause' },
  eye: { ios: 'eye', android: 'visibility' },
  clock: { ios: 'clock', android: 'schedule' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  textSize: { ios: 'textformat.size', android: 'text_fields' },
  textUp: { ios: 'textformat.size.larger', android: 'text_increase' },
  textDown: { ios: 'textformat.size.smaller', android: 'text_decrease' },
  bell: { ios: 'bell', android: 'notifications' },
  bellFill: { ios: 'bell.fill', android: 'notifications' },
  bellOff: { ios: 'bell.slash', android: 'notifications_off' },
  link: { ios: 'link', android: 'link' },
  copy: { ios: 'doc.on.doc', android: 'content_copy' },
  shuffle: { ios: 'shuffle', android: 'shuffle' },
  person: { ios: 'person', android: 'person' },
  mail: { ios: 'envelope', android: 'mail' },
  error: { ios: 'exclamationmark.triangle', android: 'error' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  photos: { ios: 'photo.on.rectangle', android: 'photo_library' },
  quote: { ios: 'quote.opening', android: 'format_quote' },
  info: { ios: 'info.circle', android: 'info' },
  shield: { ios: 'lock.shield', android: 'shield' },
  forum: { ios: 'bubble.left.and.bubble.right', android: 'forum' },
  bolt: { ios: 'bolt.fill', android: 'bolt' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  external: { ios: 'arrow.up.right', android: 'arrow_outward' },
  star: { ios: 'star', android: 'star' },
  trash: { ios: 'trash', android: 'delete' },
  flame: { ios: 'flame', android: 'local_fire_department' },
  trending: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  send: { ios: 'paperplane.fill', android: 'send' },
  add: { ios: 'plus', android: 'add' },
  moon: { ios: 'moon', android: 'dark_mode' },
  sun: { ios: 'sun.max', android: 'light_mode' },
  auto: { ios: 'circle.lefthalf.filled', android: 'brightness_auto' },
  reply: { ios: 'arrowshape.turn.up.left', android: 'reply' },
  download: { ios: 'arrow.down.circle', android: 'download' },
  file: { ios: 'doc', android: 'description' },
  video: { ios: 'play.rectangle', android: 'videocam' },
  audio: { ios: 'waveform', android: 'audiotrack' },
  camera: { ios: 'camera', android: 'photo_camera' },
  sparkle: { ios: 'sparkles', android: 'auto_awesome' },
  party: { ios: 'party.popper', android: 'celebration' },
  tag: { ios: 'tag', android: 'label' },
  expand: { ios: 'arrow.up.left.and.arrow.down.right', android: 'zoom_out_map' },
  tune: { ios: 'slider.horizontal.3', android: 'tune' },
  instagram: { ios: 'camera.circle', android: 'photo_camera' },
  globe: { ios: 'globe', android: 'language' },
  school: { ios: 'building.columns', android: 'school' },
  pencil: { ios: 'pencil.and.scribble', android: 'edit' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: keyof ColorTokens | (string & {});
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color = 'text', weight = 'medium', style }: IconProps) {
  const { colors } = useTheme();
  const tint = ((colors as Record<string, string>)[color] ?? color) as ColorValue;
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={tint}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={[{ width: size, height: size }, style]}
    />
  );
}
