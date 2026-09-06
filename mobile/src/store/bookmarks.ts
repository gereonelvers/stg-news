import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PostCard } from '@/api/types';
import { kvStorage } from './storage';

type Bookmark = { post: PostCard; savedAt: number };

type BookmarksState = {
  items: Record<number, Bookmark>;
  order: number[];
  toggle: (post: PostCard) => boolean;
  remove: (id: number) => void;
  has: (id: number) => boolean;
  clear: () => void;
};

export const useBookmarks = create<BookmarksState>()(
  persist(
    (set, get) => ({
      items: {},
      order: [],
      toggle: (post) => {
        const { items, order } = get();
        if (items[post.id]) {
          const next = { ...items };
          delete next[post.id];
          set({ items: next, order: order.filter((id) => id !== post.id) });
          return false;
        }
        set({ items: { ...items, [post.id]: { post, savedAt: Date.now() } }, order: [post.id, ...order] });
        return true;
      },
      remove: (id) => {
        const { items, order } = get();
        const next = { ...items };
        delete next[id];
        set({ items: next, order: order.filter((x) => x !== id) });
      },
      has: (id) => !!get().items[id],
      clear: () => set({ items: {}, order: [] }),
    }),
    {
      name: 'stg-bookmarks-v1',
      storage: createJSONStorage(() => kvStorage),
    },
  ),
);

export function useIsBookmarked(id: number) {
  return useBookmarks((s) => !!s.items[id]);
}

export function useBookmarkList(): PostCard[] {
  const order = useBookmarks((s) => s.order);
  const items = useBookmarks((s) => s.items);
  return order.map((id) => items[id]?.post).filter((p): p is PostCard => !!p);
}
