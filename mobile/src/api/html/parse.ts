/**
 * Converts WordPress (Gutenberg) HTML into a small block model that the app
 * renders natively. The block model deliberately covers what the STG site
 * actually uses (paragraphs, headings, images, galleries, quotes, lists,
 * embeds, tables, files, covers, details) and degrades gracefully otherwise.
 */
import { type ChildNode, type Element, isTag, isText } from 'domhandler';
import { textContent } from 'domutils';
import { parseDocument } from 'htmlparser2';

import { absoluteUrl } from '../../lib/linking';
import type { Block, BlockImage, EmbedProvider, Inline, ListItem, ParsedArticle } from './types';

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'aside', 'figure', 'figcaption', 'blockquote', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'hr', 'pre', 'details', 'summary', 'video', 'audio', 'iframe', 'img', 'header', 'footer', 'main', 'nav', 'dl', 'dt', 'dd',
]);

function classes(el: Element): string[] {
  return (el.attribs?.class ?? '').split(/\s+/).filter(Boolean);
}
function hasClass(el: Element, name: string): boolean {
  return classes(el).some((c) => c === name || c.startsWith(name));
}
function children(el: Element): ChildNode[] {
  return el.children ?? [];
}
function elements(el: Element): Element[] {
  return children(el).filter(isTag);
}
function find(el: ChildNode, pred: (e: Element) => boolean): Element | null {
  if (!isTag(el)) return null;
  if (pred(el)) return el;
  for (const c of children(el)) {
    const r = find(c, pred);
    if (r) return r;
  }
  return null;
}
function findAll(el: ChildNode, pred: (e: Element) => boolean, out: Element[] = []): Element[] {
  if (!isTag(el)) return out;
  if (pred(el)) out.push(el);
  for (const c of children(el)) findAll(c, pred, out);
  return out;
}
function isWhitespace(node: ChildNode): boolean {
  return isText(node) && node.data.trim() === '';
}
function num(v: string | undefined): number | undefined {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function alignOf(el: Element): 'left' | 'center' | 'right' | undefined {
  const cls = classes(el);
  if (cls.includes('has-text-align-center') || el.attribs?.style?.includes('text-align: center') || el.attribs?.style?.includes('text-align:center')) return 'center';
  if (cls.includes('has-text-align-right')) return 'right';
  return undefined;
}

function inlinesEmpty(inlines: Inline[]): boolean {
  return inlines.every((i) => i.kind === 'br' || i.text.trim() === '');
}

/* ---------------------------------------------------------------------------
 * Inline parsing
 * ------------------------------------------------------------------------- */

type Style = Omit<Extract<Inline, { kind: 'text' }>, 'kind' | 'text'>;

function parseInlines(nodes: ChildNode[], style: Style = {}, out: Inline[] = []): Inline[] {
  for (const node of nodes) {
    if (isText(node)) {
      const text = node.data.replace(/\s+/g, ' ');
      if (text === '') continue;
      out.push({ kind: 'text', text, ...style });
      continue;
    }
    if (!isTag(node)) continue;
    const tag = node.name.toLowerCase();
    if (tag === 'br') {
      out.push({ kind: 'br' });
      continue;
    }
    if (tag === 'img' || tag === 'script' || tag === 'style' || tag === 'noscript') continue;
    const next: Style = { ...style };
    switch (tag) {
      case 'strong':
      case 'b':
        next.bold = true;
        break;
      case 'em':
      case 'i':
      case 'cite':
        next.italic = true;
        break;
      case 'u':
      case 'ins':
        next.underline = true;
        break;
      case 's':
      case 'del':
      case 'strike':
        next.strike = true;
        break;
      case 'code':
      case 'kbd':
      case 'samp':
        next.code = true;
        break;
      case 'mark':
        next.mark = true;
        break;
      case 'sup':
        next.sup = true;
        break;
      case 'sub':
        next.sub = true;
        break;
      case 'a': {
        const href = node.attribs?.href;
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) next.href = absoluteUrl(href);
        break;
      }
      default:
        break;
    }
    // Block-level element nested inside inline content: separate with a break.
    if (BLOCK_TAGS.has(tag) && out.length > 0 && out[out.length - 1].kind !== 'br') out.push({ kind: 'br' });
    parseInlines(children(node), next, out);
    if (BLOCK_TAGS.has(tag)) out.push({ kind: 'br' });
  }
  return out;
}

/** Trim leading/trailing whitespace and breaks, collapse double breaks. */
function tidy(inlines: Inline[]): Inline[] {
  const res: Inline[] = [];
  for (const item of inlines) {
    const prev = res[res.length - 1];
    if (item.kind === 'br') {
      if (!prev || (prev.kind === 'br' && res[res.length - 2]?.kind === 'br')) continue;
      res.push(item);
      continue;
    }
    if (prev && prev.kind === 'text' && item.text.startsWith(' ') && prev.text.endsWith(' ')) {
      res.push({ ...item, text: item.text.trimStart() });
    } else {
      res.push(item);
    }
  }
  while (res.length && res[res.length - 1].kind === 'br') res.pop();
  while (res.length && res[0].kind === 'br') res.shift();
  if (res.length && res[0].kind === 'text') res[0] = { ...res[0], text: res[0].text.trimStart() };
  const last = res[res.length - 1];
  if (last && last.kind === 'text') res[res.length - 1] = { ...last, text: last.text.trimEnd() };
  return res.filter((i) => i.kind === 'br' || i.text !== '');
}

/* ---------------------------------------------------------------------------
 * Images & media
 * ------------------------------------------------------------------------- */

function parseSrcset(srcset: string | undefined): { src: string; w: number }[] {
  if (!srcset) return [];
  return srcset
    .split(',')
    .map((s) => s.trim().split(/\s+/))
    .filter((p) => p[0])
    .map(([src, d]) => ({ src, w: d?.endsWith('w') ? parseInt(d, 10) : 0 }))
    .filter((c) => Number.isFinite(c.w));
}

function imageFrom(img: Element, link?: Element | null): BlockImage | null {
  const src = img.attribs?.['data-src'] || img.attribs?.src;
  if (!src || src.startsWith('data:')) return null;
  const candidates = parseSrcset(img.attribs?.srcset).sort((a, b) => a.w - b.w);
  const display = candidates.find((c) => c.w >= 900) ?? candidates[candidates.length - 1];
  const largest = candidates[candidates.length - 1];
  const href = link?.attribs?.href;
  const full = href && /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(href) ? absoluteUrl(href) : largest?.src ?? src;
  return {
    src: absoluteUrl(display?.src ?? src),
    full: absoluteUrl(full),
    width: num(img.attribs?.width),
    height: num(img.attribs?.height),
    alt: img.attribs?.alt?.trim() || undefined,
  };
}

function captionOf(figure: Element): Inline[] | undefined {
  const cap = find(figure, (e) => e.name === 'figcaption');
  if (!cap) return undefined;
  const inl = tidy(parseInlines(children(cap)));
  return inlinesEmpty(inl) ? undefined : inl;
}

const PROVIDERS: [RegExp, EmbedProvider][] = [
  [/youtube\.com|youtu\.be|youtube-nocookie\.com/i, 'youtube'],
  [/vimeo\.com/i, 'vimeo'],
  [/instagram\.com/i, 'instagram'],
  [/twitter\.com|x\.com/i, 'twitter'],
  [/spotify\.com/i, 'spotify'],
  [/tiktok\.com/i, 'tiktok'],
];

function providerOf(url: string): EmbedProvider {
  for (const [re, p] of PROVIDERS) if (re.test(url)) return p;
  return 'other';
}

export function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ??
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function embedFrom(url: string, iframe?: Element | null, caption?: Inline[]): Block {
  const provider = providerOf(url);
  let embedUrl: string | undefined;
  let aspect = 16 / 9;
  if (provider === 'youtube') {
    const id = youtubeId(url);
    if (id) embedUrl = `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`;
  } else if (provider === 'vimeo') {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    if (id) embedUrl = `https://player.vimeo.com/video/${id}?dnt=1`;
  } else if (provider === 'spotify') {
    embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    aspect = 16 / 5;
  } else if (iframe?.attribs?.src) {
    embedUrl = absoluteUrl(iframe.attribs.src);
    const w = num(iframe.attribs.width);
    const h = num(iframe.attribs.height);
    if (w && h) aspect = w / h;
  }
  return { type: 'embed', provider, url: absoluteUrl(url), embedUrl, aspect, caption };
}

/* ---------------------------------------------------------------------------
 * Block parsing
 * ------------------------------------------------------------------------- */

function paragraphFrom(nodes: ChildNode[], el?: Element): Block | null {
  const inlines = tidy(parseInlines(nodes));
  if (inlinesEmpty(inlines)) return null;
  return {
    type: 'paragraph',
    inlines,
    align: el ? alignOf(el) : undefined,
    dropCap: el ? classes(el).includes('has-drop-cap') : undefined,
  };
}

function listFrom(el: Element): Block | null {
  const items: ListItem[] = [];
  for (const li of elements(el).filter((e) => e.name === 'li')) {
    const inlineNodes: ChildNode[] = [];
    const nested: Block[] = [];
    for (const c of children(li)) {
      if (isTag(c) && (c.name === 'ul' || c.name === 'ol')) {
        const sub = listFrom(c);
        if (sub) nested.push(sub);
      } else if (isTag(c) && BLOCK_TAGS.has(c.name) && c.name !== 'a') {
        nested.push(...parseNodes([c]));
      } else {
        inlineNodes.push(c);
      }
    }
    const inlines = tidy(parseInlines(inlineNodes));
    if (inlinesEmpty(inlines) && nested.length === 0) continue;
    items.push({ inlines, children: nested });
  }
  if (items.length === 0) return null;
  return { type: 'list', ordered: el.name === 'ol', items, start: num(el.attribs?.start) };
}

function tableFrom(table: Element): Block | null {
  const rows: Inline[][][] = [];
  let hasHeader = false;
  const trs = findAll(table, (e) => e.name === 'tr');
  for (const tr of trs) {
    const cells = elements(tr).filter((e) => e.name === 'td' || e.name === 'th');
    if (cells.length === 0) continue;
    if (rows.length === 0 && cells.every((c) => c.name === 'th')) hasHeader = true;
    rows.push(cells.map((c) => tidy(parseInlines(children(c)))));
  }
  return rows.length ? { type: 'table', rows, hasHeader } : null;
}

function galleryFrom(el: Element): Block | null {
  const images: BlockImage[] = [];
  for (const img of findAll(el, (e) => e.name === 'img')) {
    const link = img.parent && isTag(img.parent) && img.parent.name === 'a' ? img.parent : null;
    const fig = img.parent && isTag(img.parent) && img.parent.name === 'figure' ? img.parent : link?.parent && isTag(link.parent) ? link.parent : null;
    const image = imageFrom(img, link);
    if (!image) continue;
    if (fig && isTag(fig)) {
      const cap = elements(fig).find((e) => e.name === 'figcaption');
      if (cap) {
        const inl = tidy(parseInlines(children(cap)));
        if (!inlinesEmpty(inl)) image.caption = inl;
      }
    }
    images.push(image);
  }
  if (images.length === 0) return null;
  if (images.length === 1) return { type: 'image', image: images[0] };
  const cap = elements(el).find((e) => e.name === 'figcaption');
  const caption = cap ? tidy(parseInlines(children(cap))) : undefined;
  return { type: 'gallery', images, caption: caption && !inlinesEmpty(caption) ? caption : undefined };
}

function figureFrom(el: Element): Block[] {
  const cls = classes(el);
  if (cls.includes('wp-block-gallery') || cls.includes('gallery')) {
    const g = galleryFrom(el);
    return g ? [g] : [];
  }
  if (cls.includes('wp-block-embed')) {
    const iframe = find(el, (e) => e.name === 'iframe');
    const wrapper = find(el, (e) => hasClass(e, 'wp-block-embed__wrapper'));
    const link = find(el, (e) => e.name === 'a');
    const url = iframe?.attribs?.src || link?.attribs?.href || (wrapper ? textContent(wrapper).trim() : '');
    if (url) return [embedFrom(url, iframe, captionOf(el))];
    return [];
  }
  if (cls.includes('wp-block-video') || find(el, (e) => e.name === 'video')) {
    const video = find(el, (e) => e.name === 'video');
    const source = video ? find(video, (e) => e.name === 'source') : null;
    const src = video?.attribs?.src || source?.attribs?.src;
    if (src) return [{ type: 'video', src: absoluteUrl(src), poster: video?.attribs?.poster ? absoluteUrl(video.attribs.poster) : undefined, caption: captionOf(el) }];
    return [];
  }
  if (cls.includes('wp-block-audio') || find(el, (e) => e.name === 'audio')) {
    const audio = find(el, (e) => e.name === 'audio');
    const source = audio ? find(audio, (e) => e.name === 'source') : null;
    const src = audio?.attribs?.src || source?.attribs?.src;
    if (src) return [{ type: 'audio', src: absoluteUrl(src), caption: captionOf(el) }];
    return [];
  }
  if (cls.includes('wp-block-pullquote')) {
    const bq = find(el, (e) => e.name === 'blockquote') ?? el;
    return [quoteFrom(bq, true)];
  }
  if (cls.includes('wp-block-table')) {
    const t = find(el, (e) => e.name === 'table');
    const b = t ? tableFrom(t) : null;
    return b ? [b] : [];
  }
  const img = find(el, (e) => e.name === 'img');
  if (img) {
    const link = img.parent && isTag(img.parent) && img.parent.name === 'a' ? img.parent : null;
    const image = imageFrom(img, link);
    if (!image) return [];
    image.caption = captionOf(el);
    const href = link?.attribs?.href;
    const external = href && href !== image.full && !/\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(href) ? absoluteUrl(href) : undefined;
    return [{ type: 'image', image, href: external, wide: cls.includes('alignwide') || cls.includes('alignfull') }];
  }
  return parseNodes(children(el));
}

function quoteFrom(el: Element, pull = false): Block {
  const cite = find(el, (e) => e.name === 'cite' || e.name === 'footer');
  const inner: ChildNode[] = children(el).filter((c) => c !== cite);
  let blocks: Block[] = parseNodes(inner).filter((b) => b.type !== 'separator');
  if (blocks.length === 0) {
    const p = paragraphFrom(inner);
    blocks = p ? [p] : [];
  }
  const citeInl = cite ? tidy(parseInlines(children(cite))) : undefined;
  return { type: 'quote', blocks, cite: citeInl && !inlinesEmpty(citeInl) ? citeInl : undefined, pull };
}

function coverFrom(el: Element): Block {
  const img = find(el, (e) => e.name === 'img' && hasClass(e, 'wp-block-cover__image-background'));
  const image = img ? imageFrom(img) ?? undefined : undefined;
  const inner = find(el, (e) => hasClass(e, 'wp-block-cover__inner-container'));
  const blocks = inner ? parseNodes(children(inner)) : [];
  return { type: 'cover', image, blocks };
}

function parseElement(el: Element): Block[] {
  const tag = el.name.toLowerCase();
  const cls = classes(el);

  switch (tag) {
    case 'p': {
      const imgs = findAll(el, (e) => e.name === 'img');
      const iframe = find(el, (e) => e.name === 'iframe');
      const out: Block[] = [];
      for (const img of imgs) {
        const link = img.parent && isTag(img.parent) && img.parent.name === 'a' ? img.parent : null;
        const image = imageFrom(img, link);
        if (image) out.push({ type: 'image', image });
      }
      if (iframe?.attribs?.src) out.push(embedFrom(iframe.attribs.src, iframe));
      const p = paragraphFrom(children(el), el);
      if (p) out.push(p);
      return out;
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const inlines = tidy(parseInlines(children(el)));
      if (inlinesEmpty(inlines)) return [];
      return [{ type: 'heading', level: Number(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6, inlines, align: alignOf(el) }];
    }
    case 'figure':
      return figureFrom(el);
    case 'img': {
      const image = imageFrom(el);
      return image ? [{ type: 'image', image }] : [];
    }
    case 'blockquote':
      return [quoteFrom(el)];
    case 'ul':
    case 'ol': {
      const l = listFrom(el);
      return l ? [l] : [];
    }
    case 'hr':
      return [{ type: 'separator' }];
    case 'table': {
      const t = tableFrom(el);
      return t ? [t] : [];
    }
    case 'pre': {
      const text = textContent(el).replace(/\s+$/, '');
      return text ? [{ type: 'code', text }] : [];
    }
    case 'iframe':
      return el.attribs?.src ? [embedFrom(el.attribs.src, el)] : [];
    case 'video': {
      const source = find(el, (e) => e.name === 'source');
      const src = el.attribs?.src || source?.attribs?.src;
      return src ? [{ type: 'video', src: absoluteUrl(src), poster: el.attribs?.poster ? absoluteUrl(el.attribs.poster) : undefined }] : [];
    }
    case 'audio': {
      const source = find(el, (e) => e.name === 'source');
      const src = el.attribs?.src || source?.attribs?.src;
      return src ? [{ type: 'audio', src: absoluteUrl(src) }] : [];
    }
    case 'details': {
      const summary = find(el, (e) => e.name === 'summary');
      const rest = children(el).filter((c) => c !== summary);
      const sum = summary ? tidy(parseInlines(children(summary))) : [{ kind: 'text', text: 'Mehr anzeigen' } as Inline];
      return [{ type: 'details', summary: sum, blocks: parseNodes(rest) }];
    }
    case 'script':
    case 'style':
    case 'noscript':
    case 'template':
      return [];
    case 'br':
      return [];
    default:
      break;
  }

  if (cls.includes('wp-block-file')) {
    const a = elements(el).find((e) => e.name === 'a' && !hasClass(e, 'wp-block-file__button')) ?? find(el, (e) => e.name === 'a');
    if (a?.attribs?.href) return [{ type: 'file', href: absoluteUrl(a.attribs.href), label: textContent(a).trim() || 'Datei' }];
    return [];
  }
  if (cls.includes('wp-block-buttons') || cls.includes('wp-block-button')) {
    return findAll(el, (e) => e.name === 'a')
      .filter((a) => a.attribs?.href)
      .map((a) => ({ type: 'button' as const, label: textContent(a).trim() || 'Link', href: absoluteUrl(a.attribs.href) }));
  }
  if (cls.includes('wp-block-cover')) return [coverFrom(el)];
  if (cls.includes('wp-block-separator')) return [{ type: 'separator' }];
  if (cls.includes('wp-block-spacer')) return [];
  if (cls.includes('gallery') && find(el, (e) => e.name === 'img')) {
    const g = galleryFrom(el);
    return g ? [g] : [];
  }

  // Generic container (group, columns, media-text, divs from the classic editor …)
  const kids = children(el);
  const hasBlockChild = kids.some((c) => isTag(c) && BLOCK_TAGS.has(c.name.toLowerCase()));
  if (hasBlockChild) return parseNodes(kids);
  const p = paragraphFrom(kids, el);
  return p ? [p] : [];
}

function parseNodes(nodes: ChildNode[]): Block[] {
  const out: Block[] = [];
  let inlineRun: ChildNode[] = [];
  const flush = () => {
    if (inlineRun.length) {
      const p = paragraphFrom(inlineRun);
      if (p) out.push(p);
      inlineRun = [];
    }
  };
  for (const node of nodes) {
    if (isText(node)) {
      if (!isWhitespace(node)) inlineRun.push(node);
      continue;
    }
    if (!isTag(node)) continue;
    const tag = node.name.toLowerCase();
    if (BLOCK_TAGS.has(tag) || tag === 'details' || classes(node).some((c) => c.startsWith('wp-block-'))) {
      flush();
      out.push(...parseElement(node));
    } else {
      inlineRun.push(node);
    }
  }
  flush();
  return out;
}

/** Merge consecutive standalone images into one gallery, drop empty blocks. */
function postProcess(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.type === 'image' && prev?.type === 'image' && !prev.image.caption && !b.image.caption && !prev.href && !b.href) {
      out[out.length - 1] = { type: 'gallery', images: [prev.image, b.image] };
      continue;
    }
    if (b.type === 'image' && prev?.type === 'gallery' && !b.image.caption && !b.href && !prev.caption) {
      prev.images.push(b.image);
      continue;
    }
    if (b.type === 'quote' && b.blocks.length === 0) continue;
    if (b.type === 'cover' && !b.image && b.blocks.length === 0) continue;
    out.push(b);
  }
  return out;
}

function collectImages(blocks: Block[], out: BlockImage[] = []): BlockImage[] {
  for (const b of blocks) {
    if (b.type === 'image') out.push(b.image);
    else if (b.type === 'gallery') out.push(...b.images);
    else if (b.type === 'cover') {
      if (b.image) out.push(b.image);
      collectImages(b.blocks, out);
    } else if (b.type === 'quote' || b.type === 'details') collectImages(b.blocks, out);
  }
  return out;
}

export function inlineText(inlines: Inline[]): string {
  return inlines.map((i) => (i.kind === 'br' ? '\n' : i.text)).join('');
}

function countWords(blocks: Block[]): number {
  let n = 0;
  const count = (inl: Inline[]) => {
    n += inlineText(inl).split(/\s+/).filter(Boolean).length;
  };
  for (const b of blocks) {
    if (b.type === 'paragraph' || b.type === 'heading') count(b.inlines);
    else if (b.type === 'list') b.items.forEach((i) => count(i.inlines));
    else if (b.type === 'quote' || b.type === 'cover' || b.type === 'details') n += countWords(b.blocks);
  }
  return n;
}

export function parseArticle(html: string): ParsedArticle {
  const doc = parseDocument(html, { decodeEntities: true });
  const blocks = postProcess(parseNodes(doc.children));
  return { blocks, images: collectImages(blocks), wordCount: countWords(blocks) };
}
