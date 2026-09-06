import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useSettings } from '@/store/settings';

export { SITE_URL } from '@/lib/linking';

export const API_BASE: string = Constants.expoConfig?.extra?.apiBase ?? 'https://stg-sz.net/wp-json';
export const APP_VERSION: string = Constants.expoConfig?.version ?? '2.0.0';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type Params = Record<string, string | number | boolean | undefined | null | (string | number)[]>;

function buildUrl(path: string, params?: Params): string {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  return url.toString();
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, params?: Params, body?: unknown, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  signal?.addEventListener('abort', () => controller.abort());
  try {
    const res = await fetch(buildUrl(path, params), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': `STG-Schuelerzeitung/${APP_VERSION} (${Platform.OS})`,
        'X-STG-Install': useSettings.getState().installId,
        'X-STG-App': APP_VERSION,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      if (!res.ok) throw new ApiError(`Serverfehler (${res.status})`, res.status);
      throw new ApiError('Ungültige Antwort vom Server.', res.status);
    }
    if (!res.ok) {
      const err = json as { message?: string; code?: string } | null;
      throw new ApiError(err?.message ?? `Fehler ${res.status}`, res.status, err?.code);
    }
    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string, params?: Params, signal?: AbortSignal) => request<T>('GET', path, params, undefined, signal),
  post: <T>(path: string, body?: unknown, params?: Params) => request<T>('POST', path, params, body),
  delete: <T>(path: string, params?: Params) => request<T>('DELETE', path, params),
};
