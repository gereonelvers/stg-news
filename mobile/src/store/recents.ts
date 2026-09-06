import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from './storage';

type RecentsState = {
  searches: string[];
  readIds: number[];
  addSearch: (q: string) => void;
  removeSearch: (q: string) => void;
  clearSearches: () => void;
  markRead: (id: number) => void;
};

export const useRecents = create<RecentsState>()(
  persist(
    (set, get) => ({
      searches: [],
      readIds: [],
      addSearch: (q) => {
        const term = q.trim();
        if (term.length < 2) return;
        set({ searches: [term, ...get().searches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 8) });
      },
      removeSearch: (q) => set({ searches: get().searches.filter((s) => s !== q) }),
      clearSearches: () => set({ searches: [] }),
      markRead: (id) => {
        const ids = get().readIds;
        if (ids[0] === id) return;
        set({ readIds: [id, ...ids.filter((x) => x !== id)].slice(0, 200) });
      },
    }),
    { name: 'stg-recents-v1', storage: createJSONStorage(() => kvStorage) },
  ),
);
