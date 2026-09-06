import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { kvStorage } from './storage';

export type Appearance = 'system' | 'light' | 'dark';

export type SettingsState = {
  installId: string;
  appearance: Appearance;
  textScale: number;
  notificationsEnabled: boolean;
  /** null = all categories */
  notificationCategories: number[] | null;
  pushToken: string | null;
  commenter: { name: string; email: string };
  onboardingDone: boolean;
  setAppearance: (a: Appearance) => void;
  setTextScale: (s: number) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNotificationCategories: (ids: number[] | null) => void;
  setPushToken: (t: string | null) => void;
  setCommenter: (c: { name: string; email: string }) => void;
  setOnboardingDone: () => void;
};

export const TEXT_SCALES = [0.9, 1, 1.1, 1.25, 1.4] as const;

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      installId: randomUUID(),
      appearance: 'system',
      textScale: 1,
      notificationsEnabled: false,
      notificationCategories: null,
      pushToken: null,
      commenter: { name: '', email: '' },
      onboardingDone: false,
      setAppearance: (appearance) => set({ appearance }),
      setTextScale: (textScale) => set({ textScale }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationCategories: (notificationCategories) => set({ notificationCategories }),
      setPushToken: (pushToken) => set({ pushToken }),
      setCommenter: (commenter) => set({ commenter }),
      setOnboardingDone: () => set({ onboardingDone: true }),
    }),
    {
      name: 'stg-settings-v1',
      storage: createJSONStorage(() => kvStorage),
    },
  ),
);
