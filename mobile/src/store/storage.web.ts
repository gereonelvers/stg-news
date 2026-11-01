import type { StateStorage } from 'zustand/middleware';

/**
 * Web-only stand-in for the expo-sqlite key/value store, which pulls a wasm
 * worker into the bundle that Metro cannot serve. Only the local web preview
 * uses this; the shipped apps keep the sqlite implementation in storage.ts.
 */
export const kvStorage: StateStorage = {
  getItem: (name) => {
    try {
      return globalThis.localStorage?.getItem(name) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      globalThis.localStorage?.setItem(name, value);
    } catch {
      // private mode / blocked storage – the preview just forgets state
    }
  },
  removeItem: (name) => {
    try {
      globalThis.localStorage?.removeItem(name);
    } catch {
      // ignore
    }
  },
};
