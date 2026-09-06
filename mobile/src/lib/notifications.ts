import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { APP_VERSION, api } from '@/api/client';
import type { Device as ApiDevice } from '@/api/types';
import { useSettings } from '@/store/settings';

export class PushUnavailableError extends Error {}

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('articles', {
      name: 'Neue Artikel',
      description: 'Benachrichtigung, wenn die Schülerzeitung einen neuen Artikel veröffentlicht.',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#99183F',
      vibrationPattern: [0, 120, 80, 120],
    }).catch(() => undefined);
  }
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
}

/** Ask for permission, fetch an Expo push token and register it with the site. */
export async function enablePush(categories: number[] | null): Promise<ApiDevice> {
  if (!Device.isDevice) {
    throw new PushUnavailableError('Push-Mitteilungen funktionieren nur auf einem echten Gerät.');
  }
  const id = projectId();
  if (!id) {
    throw new PushUnavailableError('Dieser Build ist noch nicht für Push-Mitteilungen eingerichtet (EAS-Projekt fehlt).');
  }
  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } })).status;
  }
  if (status !== 'granted') {
    throw new PushUnavailableError('Mitteilungen sind in den Systemeinstellungen ausgeschaltet.');
  }
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  const device = await api.post<ApiDevice>('/stg/v1/devices', {
    token,
    platform: Platform.OS,
    app_version: APP_VERSION,
    locale: getLocales()[0]?.languageTag ?? 'de-DE',
    categories,
    enabled: true,
  });
  useSettings.getState().setPushToken(token);
  return device;
}

export async function updatePushCategories(categories: number[] | null): Promise<void> {
  const token = useSettings.getState().pushToken;
  if (!token) return;
  await api.post('/stg/v1/devices', { token, platform: Platform.OS, app_version: APP_VERSION, categories, enabled: true });
}

export async function disablePush(): Promise<void> {
  const token = useSettings.getState().pushToken;
  if (token) {
    await api.delete(`/stg/v1/devices/${encodeURIComponent(token)}`).catch(() => undefined);
  }
  useSettings.getState().setPushToken(null);
}

/** Extract the post id from a notification payload, if any. */
export function postIdFromResponse(response: Notifications.NotificationResponse | null | undefined): number | null {
  const data = response?.notification.request.content.data as { postId?: number | string } | undefined;
  const id = Number(data?.postId);
  return Number.isFinite(id) && id > 0 ? id : null;
}
