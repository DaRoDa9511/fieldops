const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const money = (currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 })

export function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isSameDay(iso: string | null, ref = new Date()) {
  return !!iso && startOfDay(new Date(iso)).getTime() === startOfDay(ref).getTime()
}

/** "Today, 9:30 AM" · "Tomorrow, 2:00 PM" · "Nov 16, 8:00 AM" */
export function formatSchedule(iso: string | null) {
  if (!iso) return 'Not scheduled'
  const d = new Date(iso)
  const diff = Math.round((startOfDay(d).getTime() - startOfDay().getTime()) / 86_400_000)
  if (diff === 0) return `Today, ${time.format(d)}`
  if (diff === 1) return `Tomorrow, ${time.format(d)}`
  if (diff === -1) return `Yesterday, ${time.format(d)}`
  return dateTime.format(d)
}

export const formatDateTime = (iso: string | null) => (iso ? dateTime.format(new Date(iso)) : '—')
export const formatDay = (d: Date) => day.format(d)

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
    return money(currency).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

/** "5m ago", "2h ago", "3d ago" */
export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
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
