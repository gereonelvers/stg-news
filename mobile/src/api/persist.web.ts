import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: 7 * 24 * 60 * 60 * 1000,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Web preview only: localStorage instead of the sqlite kv-store, whose wasm
// worker Metro cannot bundle for web. The shipped apps use persist.ts.
export const persister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // ignore
      }
    },
    removeItem: async (key) => {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // ignore
      }
    },
  },
  key: 'stg-query-cache-v1',
  throttleTime: 1500,
});

export const PERSIST_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
