export type Inline =
  | {
      kind: 'text';
      text: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strike?: boolean;
      code?: boolean;
      mark?: boolean;
      sup?: boolean;
      sub?: boolean;
      href?: string;
    }
  | { kind: 'br' };

export type BlockImage = {
  src: string;
  full: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: Inline[];
};

export type ListItem = { inlines: Inline[]; children: Block[] };

export type EmbedProvider = 'youtube' | 'vimeo' | 'instagram' | 'twitter' | 'spotify' | 'tiktok' | 'other';

export type Block =
  | { type: 'paragraph'; inlines: Inline[]; align?: 'left' | 'center' | 'right'; dropCap?: boolean }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; inlines: Inline[]; align?: 'left' | 'center' | 'right' }
  | { type: 'image'; image: BlockImage; href?: string; wide?: boolean }
  | { type: 'gallery'; images: BlockImage[]; caption?: Inline[] }
  | { type: 'quote'; blocks: Block[]; cite?: Inline[]; pull?: boolean }
  | { type: 'list'; ordered: boolean; items: ListItem[]; start?: number }
  | { type: 'embed'; provider: EmbedProvider; url: string; embedUrl?: string; aspect: number; caption?: Inline[] }
  | { type: 'video'; src: string; poster?: string; caption?: Inline[] }
  | { type: 'audio'; src: string; caption?: Inline[] }
  | { type: 'file'; href: string; label: string }
  | { type: 'button'; label: string; href: string }
  | { type: 'table'; rows: Inline[][][]; hasHeader: boolean }
  | { type: 'separator' }
  | { type: 'cover'; image?: BlockImage; blocks: Block[] }
  | { type: 'details'; summary: Inline[]; blocks: Block[] }
  | { type: 'code'; text: string }
  | { type: 'html'; html: string };

export type ParsedArticle = {
  blocks: Block[];
  images: BlockImage[];
  wordCount: number;
};
