export function initials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatViews(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(0)} Tsd.`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} Tsd.`;
  return String(n);
}

/** Build a school e-mail address from a name, like the old app's "magic wand". */
export function schoolEmailFor(name: string, domain: string): string {
  const clean = name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z ]/g, ' ')
    .trim()
    .split(/\s+/);
  if (clean.length < 2) return '';
  const first = clean[0].slice(0, 3);
  const last = clean[clean.length - 1];
  return `${first}.${last}@${domain}`;
}
