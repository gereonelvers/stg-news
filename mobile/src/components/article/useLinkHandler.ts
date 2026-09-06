import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { Linking } from 'react-native';

import { api } from '@/api/client';
import type { Resolved } from '@/api/types';
import { isSiteUrl, routeForUrl } from '@/lib/linking';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Opens links the way a native app should: site content in-app, everything
 * else in an in-app browser sheet, mail/tel through the system.
 */
export function useLinkHandler() {
  const router = useRouter();
  const { colors } = useTheme();

  return useCallback(
    async (href: string) => {
      if (!href) return;
      if (/^(mailto|tel|sms):/i.test(href)) {
        Linking.openURL(href).catch(() => undefined);
        return;
      }
      const route = routeForUrl(href);
      if (route) {
        router.push(route);
        return;
      }
      if (isSiteUrl(href) && !/\.(jpe?g|png|gif|webp|pdf)(\?|$)/i.test(href)) {
        try {
          const r = await api.get<Resolved>('/stg/v1/resolve', { url: href });
          if (r.type === 'post') return router.push({ pathname: '/artikel/[id]', params: { id: String(r.id) } });
          if (r.type === 'category') return router.push({ pathname: '/ressort/[id]', params: { id: String(r.id) } });
          if (r.type === 'author') return router.push({ pathname: '/autor/[id]', params: { id: String(r.id) } });
          if (r.type === 'page') return router.push({ pathname: '/seite/[slug]', params: { slug: r.slug } });
        } catch {
          // fall through to the browser
        }
      }
      WebBrowser.openBrowserAsync(href, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.tint,
        dismissButtonStyle: 'close',
        enableBarCollapsing: true,
      }).catch(() => Linking.openURL(href).catch(() => undefined));
    },
    [colors.tint, router],
  );
}
