/** Date helpers that work on local-timezone YYYY-MM-DD keys. */

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Parse a YYYY-MM-DD key to a Date at local noon (avoids DST edge cases). */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(key: string, delta: number): string {
  const date = keyToDate(key);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function yearOf(key: string): number {
  return Number(key.slice(0, 4));
}

export function formatDisplayDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
