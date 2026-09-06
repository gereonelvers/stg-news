import type { Href } from 'expo-router';

export const SITE_URL = 'https://stg-sz.net';

const HOSTS = ['stg-sz.net', 'www.stg-sz.net'];

export function isSiteUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Turn a website URL into an in-app route where the structure is unambiguous.
 * Post permalinks end with the numeric id: /posts/2026/06/09/slug/10751/
 * Anything else returns null; callers can fall back to /stg/v1/resolve.
 */
export function routeForUrl(url: string): Href | null {
  if (!isSiteUrl(url)) return null;
  const path = new URL(url).pathname;
  const post = path.match(/^\/posts\/\d{4}\/\d{2}\/\d{2}\/[^/]+\/(\d+)\/?$/);
  if (post) return { pathname: '/artikel/[id]', params: { id: post[1] } };
  const legacy = path.match(/\/(\d+)\/?$/);
  if (legacy && path.startsWith('/posts/')) return { pathname: '/artikel/[id]', params: { id: legacy[1] } };
  if (path === '/ueber-uns' || path === '/ueber-uns/') return { pathname: '/seite/[slug]', params: { slug: 'ueber-uns' } };
  if (path.startsWith('/datenschutz')) return { pathname: '/seite/[slug]', params: { slug: 'datenschutzerklaerung' } };
  return null;
}

export function absoluteUrl(href: string): string {
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `${SITE_URL}${href}`;
  return href;
}
