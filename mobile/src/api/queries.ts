import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type {
  AppConfig,
  AuthorFull,
  AuthorPage,
  CategoryFull,
  HomeFeed,
  Page,
  Paged,
  PostCard,
  PostFull,
  PostsQuery,
  Resolved,
  SearchResult,
} from './types';

export const keys = {
  config: ['config'] as const,
  home: ['home'] as const,
  posts: (q: PostsQuery) => ['posts', q] as const,
  post: (id: number) => ['post', id] as const,
  categories: ['categories'] as const,
  authors: ['authors'] as const,
  author: (id: number) => ['author', id] as const,
  page: (slug: string) => ['page', slug] as const,
  search: (q: string) => ['search', q] as const,
  resolve: (url: string) => ['resolve', url] as const,
};

export function useConfig() {
  return useQuery({
    queryKey: keys.config,
    queryFn: () => api.get<AppConfig>('/stg/v1/config'),
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useHome() {
  return useQuery({
    queryKey: keys.home,
    queryFn: () => api.get<HomeFeed>('/stg/v1/home'),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePosts(q: PostsQuery, enabled = true) {
  const perPage = q.per_page ?? 20;
  return useInfiniteQuery({
    queryKey: keys.posts({ ...q, per_page: perPage }),
    queryFn: ({ pageParam, signal }) =>
      api.get<Paged<PostCard>>(
        '/stg/v1/posts',
        {
          page: pageParam,
          per_page: perPage,
          category: q.category,
          author: q.author,
          tag: q.tag,
          search: q.search,
          include: q.include,
          exclude: q.exclude,
          orderby: q.orderby,
        },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePost(id: number, initial?: PostCard) {
  return useQuery({
    queryKey: keys.post(id),
    queryFn: () => api.get<PostFull>(`/stg/v1/posts/${id}`),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 24 * 60 * 60 * 1000, // keep articles around for offline reading
    placeholderData: initial ? ({ ...initial, content: '', tags: [], related: [], comments_open: true } as PostFull) : undefined,
    enabled: id > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: async () => (await api.get<{ items: CategoryFull[] }>('/stg/v1/categories')).items,
    staleTime: 30 * 60 * 1000,
  });
}

export function useAuthors() {
  return useQuery({
    queryKey: keys.authors,
    queryFn: async () => (await api.get<{ items: AuthorFull[] }>('/stg/v1/authors')).items,
    staleTime: 30 * 60 * 1000,
  });
}

export function useAuthor(id: number) {
  return useQuery({
    queryKey: keys.author(id),
    queryFn: () => api.get<AuthorPage>(`/stg/v1/authors/${id}`),
    staleTime: 10 * 60 * 1000,
    enabled: id > 0,
  });
}

export function usePage(slug: string) {
  return useQuery({
    queryKey: keys.page(slug),
    queryFn: () => api.get<Page>(`/stg/v1/pages/${slug}`),
    staleTime: 60 * 60 * 1000,
  });
}

export function useSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: keys.search(query),
    queryFn: ({ signal }) => api.get<SearchResult>('/stg/v1/search', { q: query }, signal),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useResolveUrl(url: string | null) {
  return useQuery({
    queryKey: keys.resolve(url ?? ''),
    queryFn: () => api.get<Resolved>('/stg/v1/resolve', { url: url! }),
    enabled: !!url,
    staleTime: Infinity,
  });
}

export function useRandomPost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const home = client.getQueryData<HomeFeed>(keys.home);
      const total = home?.counts.posts ?? 400;
      const page = 1 + Math.floor(Math.random() * Math.max(1, total));
      const res = await api.get<Paged<PostCard>>('/stg/v1/posts', { page, per_page: 1 });
      const post = res.items[0];
      if (!post) throw new Error('Kein Artikel gefunden');
      return post;
    },
  });
}

/** Fire-and-forget view counter; one count per install and day is enforced server-side. */
export function reportView(id: number) {
  api.post(`/stg/v1/posts/${id}/view`).catch(() => undefined);
}

export function prefetchPost(client: ReturnType<typeof useQueryClient>, id: number) {
  return client.prefetchQuery({
    queryKey: keys.post(id),
    queryFn: () => api.get<PostFull>(`/stg/v1/posts/${id}`),
    staleTime: 10 * 60 * 1000,
  });
}
