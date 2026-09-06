import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from './storage';

/**
 * Comments written on this device that the server has not published yet
 * (they wait for the e-mail confirmation and/or moderation). Keeping them
 * locally lets the thread show them immediately instead of "sending into the void".
 */
export type PendingComment = {
  key: string;
  post: number;
  parent: number;
  name: string;
  email: string;
  text: string;
  createdAt: string;
};

const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

type CommentsState = {
  pending: PendingComment[];
  add: (c: Omit<PendingComment, 'key' | 'createdAt'>) => PendingComment;
  remove: (keys: string[]) => void;
  prune: () => void;
};

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set, get) => ({
      pending: [],
      add: (c) => {
        const item: PendingComment = { ...c, key: `${c.post}-${Date.now()}`, createdAt: new Date().toISOString() };
        set({ pending: [...get().pending, item] });
        return item;
      },
      remove: (keys) => {
        if (!keys.length) return;
        set({ pending: get().pending.filter((p) => !keys.includes(p.key)) });
      },
      prune: () => {
        const cutoff = Date.now() - MAX_AGE_MS;
        const kept = get().pending.filter((p) => new Date(p.createdAt).getTime() > cutoff);
        if (kept.length !== get().pending.length) set({ pending: kept });
      },
    }),
    { name: 'stg-comments-v1', storage: createJSONStorage(() => kvStorage) },
  ),
);
