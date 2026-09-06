const dayFormat = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const longFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

export function parseDate(iso: string): Date {
  return new Date(iso);
}

/** "Sonntag, 6. September" */
export function formatDay(date: Date = new Date()): string {
  return dayFormat.format(date);
}

/** "6. September 2026" */
export function formatLong(iso: string): string {
  return longFormat.format(parseDate(iso));
}

/** "6. Sept. 2026" */
export function formatShort(iso: string): string {
  return shortFormat.format(parseDate(iso));
}

export function formatTime(iso: string): string {
  return timeFormat.format(parseDate(iso));
}

/** "gerade eben", "vor 5 Min.", "vor 3 Std.", "gestern", "vor 4 Tagen", else short date. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const d = parseDate(iso);
  const diff = Math.max(0, now.getTime() - d.getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 30) return `vor ${Math.floor(days / 7)} Wo.`;
  return shortFormat.format(d);
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Noch wach?';
  if (h < 11) return 'Guten Morgen';
  if (h < 14) return 'Mahlzeit';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}
