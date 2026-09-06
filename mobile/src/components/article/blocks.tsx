import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import type { Block, BlockImage, Inline } from '@/api/html/types';
import { inlineText } from '@/api/html/parse';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Tap } from '@/components/ui/Tap';
import { Txt } from '@/components/ui/Txt';
import { withAlpha } from '@/lib/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { brand, displayFont, monoFont, radius, space } from '@/theme/tokens';
import { RichText } from './RichText';
import { useArticle } from './context';

/* ------------------------------------------------------------------ */

export function BlockView({ block, index }: { block: Block; index: number }) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} first={index === 0} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'image':
      return <ImageBlock image={block.image} href={block.href} wide={block.wide} />;
    case 'gallery':
      return <GalleryBlock images={block.images} caption={block.caption} />;
    case 'quote':
      return <QuoteBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    case 'embed':
      return <EmbedBlock block={block} />;
    case 'video':
      return <VideoBlock src={block.src} poster={block.poster} caption={block.caption} />;
    case 'audio':
      return <AudioBlock src={block.src} caption={block.caption} />;
    case 'file':
      return <LinkCard icon="file" title={block.label} subtitle="Datei öffnen" href={block.href} />;
    case 'button':
      return <ButtonBlock label={block.label} href={block.href} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'separator':
      return <SeparatorBlock />;
    case 'cover':
      return <CoverBlock block={block} />;
    case 'details':
      return <DetailsBlock block={block} />;
    case 'code':
      return <CodeBlock text={block.text} />;
    case 'html':
      return <HtmlBlock html={block.html} />;
    default:
      return null;
  }
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <View style={styles.stack}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} index={i} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */

function ParagraphBlock({ block, first }: { block: Extract<Block, { type: 'paragraph' }>; first: boolean }) {
  const { colors, textScale } = useTheme();
  const { inverted } = useArticle();
  if (block.dropCap || (first && false)) {
    const text = inlineText(block.inlines);
    const firstChar = text.charAt(0);
    const rest: Inline[] = [...block.inlines];
    const head = rest[0];
    if (head && head.kind === 'text') rest[0] = { ...head, text: head.text.slice(1) };
    return (
      <View style={styles.dropCapRow}>
        <Txt style={[displayFont(800), { fontSize: 62 * textScale, lineHeight: 58 * textScale, color: inverted ? '#FFF' : colors.tint, marginTop: 6, marginRight: 6 }]}>
          {firstChar}
        </Txt>
        <View style={{ flex: 1 }}>
          <RichText inlines={rest} style={{ textAlign: block.align }} />
        </View>
      </View>
    );
  }
  return <RichText inlines={block.inlines} style={block.align ? { textAlign: block.align } : undefined} />;
}

function HeadingBlock({ block }: { block: Extract<Block, { type: 'heading' }> }) {
  const variant = block.level <= 2 ? 'headline' : block.level === 3 ? 'headlineSmall' : 'title';
  return (
    <RichText
      inlines={block.inlines}
      variant={variant}
      scaled
      style={[{ marginTop: block.level <= 2 ? space.md : space.sm }, block.align ? { textAlign: block.align } : null]}
    />
  );
}

/* ---------------------------- images ------------------------------ */

function useAspect(image: BlockImage) {
  const initial = image.width && image.height ? image.width / image.height : undefined;
  const [aspect, setAspect] = useState(initial ?? 4 / 3);
  const onLoad = useCallback(
    (e: { source: { width: number; height: number } }) => {
      if (!initial && e.source.width && e.source.height) setAspect(e.source.width / e.source.height);
    },
    [initial],
  );
  return { aspect, onLoad };
}

export function ImageBlock({ image, href, wide }: { image: BlockImage; href?: string; wide?: boolean }) {
  const { colors } = useTheme();
  const { contentWidth, openImage, onLink } = useArticle();
  const { aspect, onLoad } = useAspect(image);
  // Small inline images (icons, emoji-sized pictures) should not be blown up.
  const natural = image.width && image.width < contentWidth * 0.6 ? image.width : contentWidth;
  const width = natural;
  const height = Math.round(width / aspect);
  const caption = image.caption ? <Caption inlines={image.caption} /> : null;

  return (
    <View style={{ alignItems: 'center' }}>
      <Tap onPress={() => (href ? onLink(href) : openImage(image))} scaleTo={0.985} accessibilityRole="imagebutton" accessibilityLabel={image.alt ?? 'Bild vergrößern'}>
        <Image
          source={{ uri: image.src }}
          style={{ width, height, borderRadius: wide ? 0 : radius.md, backgroundColor: colors.skeleton }}
          contentFit="cover"
          transition={250}
          cachePolicy="disk"
          onLoad={onLoad}
          accessibilityLabel={image.alt}
        />
      </Tap>
      {caption}
    </View>
  );
}

function Caption({ inlines }: { inlines: Inline[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.caption}>
      <RichText inlines={inlines} variant="caption" scaled={false} color={colors.textSecondary} />
    </View>
  );
}

function GalleryBlock({ images, caption }: { images: BlockImage[]; caption?: Inline[] }) {
  const { colors } = useTheme();
  const { contentWidth, openImage } = useArticle();
  const [page, setPage] = useState(0);
  const width = contentWidth;
  const height = Math.round(width * 0.68);
  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(img, i) => `${img.src}-${i}`}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ width, borderRadius: radius.md, overflow: 'hidden' }}
        renderItem={({ item }) => (
          <Tap onPress={() => openImage(item)} scaleTo={0.99} accessibilityRole="imagebutton" accessibilityLabel={item.alt ?? 'Bild vergrößern'}>
            <Image source={{ uri: item.src }} style={{ width, height, backgroundColor: colors.skeleton }} contentFit="cover" transition={200} cachePolicy="disk" />
          </Tap>
        )}
      />
      <View style={styles.galleryFooter}>
        <View style={styles.dots}>
          {images.slice(0, 12).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === page ? colors.tint : colors.surface2 }]} />
          ))}
        </View>
        <Txt variant="micro" color="textTertiary">
          {page + 1}/{images.length}
        </Txt>
      </View>
      {images[page]?.caption ? <Caption inlines={images[page].caption!} /> : caption ? <Caption inlines={caption} /> : null}
    </View>
  );
}

/* --------------------------- quotes/lists ------------------------- */

function QuoteBlock({ block }: { block: Extract<Block, { type: 'quote' }> }) {
  const { colors, textScale } = useTheme();
  const { inverted } = useArticle();
  if (block.pull) {
    const text = block.blocks.map((b) => (b.type === 'paragraph' ? inlineText(b.inlines) : '')).join(' ');
    return (
      <View style={styles.pullquote}>
        <Icon name="quote" size={28} color={inverted ? '#FFF' : colors.tint} />
        <Txt style={[displayFont(700), { fontSize: 26 * textScale, lineHeight: 30 * textScale, color: inverted ? '#FFF' : colors.text, textAlign: 'center' }]}>
          {text}
        </Txt>
        {block.cite ? <RichText inlines={block.cite} variant="caption" scaled={false} color={colors.textSecondary} style={{ textAlign: 'center' }} /> : null}
      </View>
    );
  }
  return (
    <View style={[styles.quote, { borderLeftColor: inverted ? '#FFF' : colors.tint, backgroundColor: inverted ? 'rgba(255,255,255,0.12)' : colors.surface }]}>
      {block.blocks.map((b, i) =>
        b.type === 'paragraph' ? (
          <RichText key={i} inlines={b.inlines} style={{ fontStyle: 'italic' }} />
        ) : (
          <BlockView key={i} block={b} index={i} />
        ),
      )}
      {block.cite ? <RichText inlines={block.cite} variant="caption" scaled={false} color={colors.textSecondary} style={{ marginTop: space.xs }} /> : null}
    </View>
  );
}

function ListBlock({ block, depth = 0 }: { block: Extract<Block, { type: 'list' }>; depth?: number }) {
  const { colors, textScale } = useTheme();
  const { inverted } = useArticle();
  const start = block.start ?? 1;
  return (
    <View style={{ gap: space.sm, paddingLeft: depth ? space.lg : 0 }}>
      {block.items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          {block.ordered ? (
            <Txt style={[displayFont(700), { color: inverted ? '#FFF' : colors.tint, fontSize: 18 * textScale, lineHeight: 26 * textScale, minWidth: 24, textAlign: 'right' }]}>
              {start + i}.
            </Txt>
          ) : (
            <View style={[styles.bullet, { backgroundColor: inverted ? '#FFF' : colors.tint, marginTop: 11 * textScale }]} />
          )}
          <View style={{ flex: 1, gap: space.sm }}>
            {item.inlines.length ? <RichText inlines={item.inlines} /> : null}
            {item.children.map((c, j) => (c.type === 'list' ? <ListBlock key={j} block={c} depth={depth + 1} /> : <BlockView key={j} block={c} index={j} />))}
          </View>
        </View>
      ))}
    </View>
  );
}

/* ----------------------------- media ------------------------------ */

function EmbedBlock({ block }: { block: Extract<Block, { type: 'embed' }> }) {
  const { contentWidth, onLink } = useArticle();
  const { colors } = useTheme();
  const [active, setActive] = useState(false);
  const height = Math.round(contentWidth / block.aspect);

  if (block.embedUrl && (block.provider === 'youtube' || block.provider === 'vimeo' || block.provider === 'spotify')) {
    return (
      <View>
        <View style={{ width: contentWidth, height, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' }}>
          {active ? (
            <WebView
              source={{ uri: block.embedUrl }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
            />
          ) : (
            <Tap onPress={() => setActive(true)} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Video abspielen">
              {block.provider === 'youtube' && (
                <Image
                  source={{ uri: `https://i.ytimg.com/vi/${block.embedUrl.split('/embed/')[1]?.split('?')[0]}/hqdefault.jpg` }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Icon name="play" size={26} color="#FFF" weight="bold" />
                </View>
                <Txt variant="micro" style={{ color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {block.provider}
                </Txt>
              </View>
            </Tap>
          )}
        </View>
        {block.caption ? <Caption inlines={block.caption} /> : null}
      </View>
    );
  }
  const label = { instagram: 'Instagram-Beitrag', twitter: 'Beitrag auf X', tiktok: 'TikTok', other: 'Externer Inhalt' }[block.provider as 'instagram' | 'twitter' | 'tiktok' | 'other'] ?? 'Externer Inhalt';
  return <LinkCard icon="external" title={label} subtitle={block.url.replace(/^https?:\/\//, '')} href={block.url} onPress={() => onLink(block.url)} accent={colors.textSecondary} />;
}

function VideoBlock({ src, poster, caption }: { src: string; poster?: string; caption?: Inline[] }) {
  const { contentWidth } = useArticle();
  const player = useVideoPlayer(src, (p) => {
    p.loop = false;
  });
  return (
    <View>
      <VideoView
        player={player}
        style={{ width: contentWidth, height: Math.round(contentWidth * 0.5625), borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' }}
        nativeControls
        allowsPictureInPicture
        contentFit="contain"
      />
      {caption ? <Caption inlines={caption} /> : null}
    </View>
  );
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function AudioBlock({ src, caption }: { src: string; caption?: Inline[] }) {
  const { colors } = useTheme();
  const player = useAudioPlayer({ uri: src });
  const status = useAudioPlayerStatus(player);
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  return (
    <View>
      <View style={[styles.audio, { backgroundColor: colors.surface }]}>
        <Tap
          onPress={() => (status.playing ? player.pause() : player.play())}
          haptics="light"
          style={[styles.audioButton, { backgroundColor: colors.tint }]}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? 'Pause' : 'Abspielen'}>
          <Icon name={status.playing ? 'pause' : 'play'} size={20} color="#FFF" weight="bold" />
        </Tap>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="label">Audio</Txt>
          <View style={[styles.audioTrack, { backgroundColor: colors.surface2 }]}>
            <View style={[styles.audioFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.tint }]} />
          </View>
          <Txt variant="micro" color="textTertiary">
            {fmtTime(status.currentTime)} / {fmtTime(status.duration)}
          </Txt>
        </View>
      </View>
      {caption ? <Caption inlines={caption} /> : null}
    </View>
  );
}

/* ---------------------------- misc -------------------------------- */

export function LinkCard({ icon, title, subtitle, href, onPress, accent }: { icon: IconName; title: string; subtitle?: string; href: string; onPress?: () => void; accent?: string }) {
  const { colors } = useTheme();
  const { onLink } = useArticle();
  return (
    <Tap onPress={onPress ?? (() => onLink(href))} style={[styles.linkCard, { backgroundColor: colors.surface }]} haptics="light" accessibilityRole="link">
      <View style={[styles.linkIcon, { backgroundColor: withAlpha(accent ?? colors.tint, 0.14) }]}>
        <Icon name={icon} size={20} color={accent ?? colors.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="label" numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      <Icon name="chevronRight" size={14} color="textTertiary" weight="semibold" />
    </Tap>
  );
}

function ButtonBlock({ label, href }: { label: string; href: string }) {
  const { colors } = useTheme();
  const { onLink } = useArticle();
  return (
    <Tap onPress={() => onLink(href)} haptics="light" style={[styles.button, { backgroundColor: colors.tint }]} accessibilityRole="link">
      <Txt variant="label" style={{ color: colors.textOnTint }}>
        {label}
      </Txt>
    </Tap>
  );
}

function TableBlock({ block }: { block: Extract<Block, { type: 'table' }> }) {
  const { colors } = useTheme();
  const cols = Math.max(...block.rows.map((r) => r.length));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
      <View>
        {block.rows.map((row, r) => (
          <View key={r} style={[styles.tableRow, { backgroundColor: r === 0 && block.hasHeader ? colors.surface : r % 2 ? colors.surface : 'transparent' }]}>
            {Array.from({ length: cols }).map((_, c) => (
              <View key={c} style={[styles.tableCell, { borderColor: colors.border }]}>
                <RichText inlines={row[c] ?? []} variant="bodySmall" style={r === 0 && block.hasHeader ? { fontWeight: '700' } : undefined} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SeparatorBlock() {
  const { colors } = useTheme();
  return (
    <View style={styles.separator}>
      <View style={[styles.sepDot, { backgroundColor: colors.textTertiary }]} />
      <View style={[styles.sepDot, { backgroundColor: brand.rust }]} />
      <View style={[styles.sepDot, { backgroundColor: colors.textTertiary }]} />
    </View>
  );
}

function CoverBlock({ block }: { block: Extract<Block, { type: 'cover' }> }) {
  const { contentWidth } = useArticle();
  const { colors } = useTheme();
  const parent = useArticle();
  return (
    <View style={{ width: contentWidth, minHeight: 220, borderRadius: radius.md, overflow: 'hidden', backgroundColor: block.image ? '#222' : colors.tint }}>
      {block.image ? <Image source={{ uri: block.image.src }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="disk" /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      <View style={{ padding: space.xl, justifyContent: 'center', flex: 1 }}>
        <InvertedProvider value={{ ...parent, inverted: true }}>
          <Blocks blocks={block.blocks} />
        </InvertedProvider>
      </View>
    </View>
  );
}

import { ArticleContext } from './context';
const InvertedProvider = ArticleContext.Provider;

function DetailsBlock({ block }: { block: Extract<Block, { type: 'details' }> }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Animated.View layout={LinearTransition.springify().damping(18)} style={[styles.details, { backgroundColor: colors.surface }]}>
      <Tap onPress={() => setOpen((o) => !o)} dim scaleTo={1} style={styles.detailsHeader} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={{ flex: 1 }}>
          <RichText inlines={block.summary} variant="label" scaled={false} />
        </View>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} color="textSecondary" weight="semibold" />
      </Tap>
      {open ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ paddingHorizontal: space.lg, paddingBottom: space.lg }}>
          <Blocks blocks={block.blocks} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function CodeBlock({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
      <Txt style={[monoFont, { fontSize: 13, lineHeight: 19, padding: space.lg }]} selectable>
        {text}
      </Txt>
    </ScrollView>
  );
}

function HtmlBlock({ html }: { html: string }) {
  const { contentWidth } = useArticle();
  const [height, setHeight] = useState(120);
  const doc = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font-family:-apple-system,Roboto,sans-serif;font-size:16px}img,iframe{max-width:100%}</style></head><body>${html}<script>window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));</script></body></html>`;
  return (
    <WebView
      source={{ html: doc, baseUrl: 'https://stg-sz.net' }}
      style={{ width: contentWidth, height, backgroundColor: 'transparent' }}
      onMessage={(e) => setHeight(Math.max(60, Number(e.nativeEvent.data) || 120))}
      scrollEnabled={false}
      originWhitelist={['*']}
    />
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.lg },
  dropCapRow: { flexDirection: 'row', alignItems: 'flex-start' },
  caption: { paddingTop: space.sm, paddingHorizontal: space.xs },
  galleryFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm, paddingHorizontal: space.xs },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  quote: { borderLeftWidth: 4, paddingLeft: space.lg, paddingRight: space.lg, paddingVertical: space.md, borderRadius: radius.sm, gap: space.sm },
  pullquote: { alignItems: 'center', gap: space.md, paddingVertical: space.lg, paddingHorizontal: space.md },
  listItem: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  bullet: { width: 7, height: 7, borderRadius: 4, marginLeft: 6, marginRight: 4 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: 'rgba(0,0,0,0.25)' },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(153,24,63,0.92)', alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
  audio: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  audioButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  audioTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  audioFill: { height: 4, borderRadius: 2 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  linkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  button: { alignSelf: 'flex-start', paddingHorizontal: space.xl, paddingVertical: 12, borderRadius: radius.pill },
  tableRow: { flexDirection: 'row' },
  tableCell: { minWidth: 120, maxWidth: 260, paddingHorizontal: space.md, paddingVertical: space.sm, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  separator: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: space.sm },
  sepDot: { width: 7, height: 7, borderRadius: 4 },
  details: { borderRadius: radius.md, overflow: 'hidden' },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
});
