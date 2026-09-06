/** Shapes returned by the stg/v1 REST namespace (see wordpress/mu-plugins/stg-app). */

export type ImageSize = { src: string; width: number; height: number };

export type ApiImage = {
  id: number;
  src: string;
  width: number;
  height: number;
  full: string;
  sizes: Partial<Record<'thumbnail' | 'medium' | 'medium_large' | 'large' | '1536x1536' | 'full', ImageSize>>;
  alt: string;
  caption: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  color: string;
  emoji: string;
  icon: string;
};

export type CategoryFull = Category & {
  description: string;
  count: number;
  parent: number;
  cover?: ApiImage | null;
  latest?: string | null;
};

export type Author = {
  id: number;
  name: string;
  slug: string;
  avatar: string | null;
};

export type AuthorFull = Author & {
  bio: string;
  post_count: number;
  url: string;
  latest?: string | null;
};

export type Tag = { id: number; name: string; slug: string };

export type PostCard = {
  id: number;
  slug: string;
  link: string;
  title: string;
  excerpt: string;
  date: string;
  modified: string;
  author: Author | null;
  categories: Category[];
  primary_category: Category | null;
  image: ApiImage | null;
  reading_time: number;
  word_count: number;
  comment_count: number;
  views: number;
  sticky: boolean;
  flags: { gallery: boolean; video: boolean; audio: boolean };
};

export type PostFull = PostCard & {
  content: string;
  tags: Tag[];
  related: PostCard[];
  comments_open: boolean;
};

export type Paged<T> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type HomeFeed = {
  generated_at: string;
  breaking: PostCard | null;
  hero: PostCard | null;
  latest: PostCard[];
  sections: { category: CategoryFull; posts: PostCard[] }[];
  popular: PostCard[];
  counts: { posts: number; categories: number };
};

export type AuthorPage = AuthorFull & { posts: Paged<PostCard> };

export type Page = {
  id: number;
  slug: string;
  title: string;
  link: string;
  modified: string;
  content: string;
  image: ApiImage | null;
};

export type SearchResult = {
  query: string;
  posts: PostCard[];
  total: number;
  authors: AuthorFull[];
  categories: CategoryFull[];
};

export type AppConfig = {
  site: {
    name: string;
    tagline: string;
    description: string;
    url: string;
    school_url: string;
    instagram: string;
    contact_email: string;
    email_domain: string;
    timezone: string;
    language: string;
  };
  pages: { about: string; privacy: string };
  brand: { primary: string };
  home_sections: string[];
  breaking_category: string;
  comments: {
    enabled: boolean;
    moderated: boolean;
    email_verification: boolean;
    require_name_email: boolean;
    threaded: boolean;
  };
  push: { enabled: boolean };
  min_app_version: string;
  api_version: string;
};

export type Resolved =
  | { type: 'post' | 'page'; id: number; slug: string }
  | { type: 'category'; id: number; slug: string }
  | { type: 'author'; id: number; slug: string };

export type Device = {
  token: string;
  platform: string;
  app_version: string;
  locale: string;
  categories: number[] | null;
  enabled: boolean;
  updated_at: string;
};

/** WordPress core comment (wp/v2/comments). */
export type WpComment = {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_avatar_urls?: Record<string, string>;
  date: string;
  content: { rendered: string };
  status?: string;
};

export type CommentNode = {
  id: number;
  parent: number;
  authorName: string;
  date: string;
  text: string;
  children: CommentNode[];
  depth: number;
  /** Written on this device and not yet confirmed/approved on the server. */
  pending?: boolean;
};

export type PostsQuery = {
  category?: number;
  author?: number;
  tag?: number;
  search?: string;
  include?: number[];
  exclude?: number[];
  orderby?: 'date' | 'views' | 'comments' | 'modified' | 'relevance';
  per_page?: number;
};
