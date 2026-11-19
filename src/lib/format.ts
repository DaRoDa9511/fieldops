/** Date/time helpers. The locale follows the language chosen in Profile (see PreferencesProvider). */

let locale = 'en-US';
let timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
let dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' });

export function setFormatLocale(next: string) {
  if (next === locale) return;
  locale = next;
  timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

type DayLabels = { today: string; tomorrow: string; yesterday: string; notScheduled: string };
const EN_LABELS: DayLabels = { today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday', notScheduled: 'Not scheduled' };

/** "Today, 9:30 AM" / "Tomorrow, 2:00 PM" / "Mon, Nov 16, 8:00 AM" */
export function formatSchedule(iso: string | null, labels: DayLabels = EN_LABELS): string {
  if (!iso) return labels.notScheduled;
  const d = new Date(iso);
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  const day =
    diffDays === 0 ? labels.today : diffDays === 1 ? labels.tomorrow : diffDays === -1 ? labels.yesterday : dayFmt.format(d);
  return `${day}, ${timeFmt.format(d)}`;
}

export function formatTime(iso: string | null): string {
  return iso ? timeFmt.format(new Date(iso)) : '—';
}

/** "1h 25m" between two ISO timestamps (or until now if `end` is null). */
export function formatDuration(startIso: string | null, endIso: string | null = null): string {
  if (!startIso) return '—';
  const ms = (endIso ? new Date(endIso) : new Date()).getTime() - new Date(startIso).getTime();
  const mins = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function isToday(iso: string | null): boolean {
  return !!iso && startOfDay(new Date(iso)) === startOfDay(new Date());
}

export function initials(name: string | null | undefined) {
  return (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatMoney(value: number | null | undefined, currency = 'USD'): string {
  if (value == null) return '—';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
