/** Formatting helpers. The locale follows the language picked in the sidebar (I18nProvider). */

let locale = 'en-US'
let dateTime = makeDateTime()
let time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
let day = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' })
let longDate = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' })

function makeDateTime() {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function setFormatLocale(next: string) {
  if (next === locale) return
  locale = next
  dateTime = makeDateTime()
  time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
  day = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  longDate = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isSameDay(iso: string | null, ref = new Date()) {
  return !!iso && startOfDay(new Date(iso)).getTime() === startOfDay(ref).getTime()
}

export type DayLabels = { today: string; tomorrow: string; yesterday: string; notScheduled: string }
const EN: DayLabels = { today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday', notScheduled: 'Not scheduled' }

/** "Today, 9:30 AM" · "Tomorrow, 2:00 PM" · "Nov 16, 8:00 AM" */
export function formatSchedule(iso: string | null, labels: DayLabels = EN) {
  if (!iso) return labels.notScheduled
  const d = new Date(iso)
  const diff = Math.round((startOfDay(d).getTime() - startOfDay().getTime()) / 86_400_000)
  if (diff === 0) return `${labels.today}, ${time.format(d)}`
  if (diff === 1) return `${labels.tomorrow}, ${time.format(d)}`
  if (diff === -1) return `${labels.yesterday}, ${time.format(d)}`
  return dateTime.format(d)
}

export const formatTime = (iso: string | null) => (iso ? time.format(new Date(iso)) : '—')
export const formatDateTime = (iso: string | null) => (iso ? dateTime.format(new Date(iso)) : '—')
export const formatDay = (d: Date) => day.format(d)
export const formatLongDate = (d: Date) => longDate.format(d)

export function formatMinutes(mins: number | null) {
  if (mins == null || Number.isNaN(mins)) return '—'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

export function minutesBetween(a: string | null, b: string | null) {
  if (!a || !b) return null
  return (new Date(b).getTime() - new Date(a).getTime()) / 60_000
}

export function formatMoney(value: number | null, currency = 'USD') {
  if (value == null) return '—'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

/** "5m", "2h", "3d" ago — compact and language-neutral. */
export function timeAgo(iso: string, justNow = 'just now') {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return justNow
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export const initials = (name: string | null | undefined) =>
  (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

/** Convert ISO → value for <input type="datetime-local"> (local time, no seconds). */
export function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
