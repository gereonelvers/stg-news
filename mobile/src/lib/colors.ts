export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Lighten a hex colour by mixing it with white (amount 0..1). */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/** Relative luminance, used to pick readable text on coloured surfaces. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function textOn(hex: string): '#FFFFFF' | '#17151A' {
  return luminance(hex) > 0.45 ? '#17151A' : '#FFFFFF';
}

const AVATAR_COLORS = ['#99183F', '#1D5FBF', '#7A3EAF', '#178A4C', '#E0721A', '#0E8A8A', '#5B4BDB', '#D4457E', '#4E8F1E', '#C0397A'];

export function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/** Category accent adjusted for dark backgrounds (brightened a little). */
export function accentFor(hex: string, isDark: boolean): string {
  return isDark ? lighten(hex, 0.22) : hex;
}
