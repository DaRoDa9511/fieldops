/** Date/time helpers. Uses Intl (available in Hermes) so output follows the device locale. */

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today, 9:30 AM" / "Tomorrow, 2:00 PM" / "Mon, Nov 16, 8:00 AM" */
export function formatSchedule(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  const d = new Date(iso);
  const diffDays = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  const day =
    diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : diffDays === -1 ? 'Yesterday' : dayFmt.format(d);
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
