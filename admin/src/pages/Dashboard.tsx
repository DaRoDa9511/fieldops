import { AlertCircle, CheckCircle2, Clock, Hourglass, PlayCircle, Plus, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAuth } from '@/auth/AuthProvider'
import { OrderFormModal } from '@/components/OrderFormModal'
import { Avatar, Button, ErrorState, PriorityBadge, Skeleton, StatusBadge, cx } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { useI18n } from '@/i18n/I18nProvider'
import type { TranslationKey } from '@/i18n/translations'
import { fetchWorkOrders, type WorkOrder } from '@/lib/api'
import { STATUSES, STATUS_META } from '@/lib/constants'
import { formatDay, formatLongDate, formatMinutes, formatTime, isSameDay, minutesBetween, startOfDay } from '@/lib/format'
import { useRealtime } from '@/realtime/RealtimeProvider'

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, color: '#0f172a' },
  cursor: { fill: 'rgba(47,107,255,0.06)' },
}

function greetingKey(): TranslationKey {
  const h = new Date().getHours()
  return h < 12 ? 'greeting.morning' : h < 18 ? 'greeting.afternoon' : 'greeting.evening'
}

export function Dashboard() {
  const { version, lastChangedId, live } = useRealtime()
  const { profile } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const orders = useQuery(fetchWorkOrders, [version])
  const [creating, setCreating] = useState(false)

  const stats = useMemo(() => computeStats(orders.data ?? []), [orders.data])
  const statusData = stats.byStatus.map((s) => ({ ...s, name: t(`status.${s.key}`) }))
  const perDay = stats.perDay.map((d) => ({ ...d, day: d.isToday ? t('dash.todayShort') : d.day }))

  if (orders.status === 'error') return <ErrorState message={orders.error ?? ''} onRetry={orders.retry} />
  const loading = orders.status === 'loading'
  const rate = stats.scheduledToday ? Math.min(1, stats.completedToday / stats.scheduledToday) : 0
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <>
      {/* Hero */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-navy-900 p-6 text-white shadow-xl shadow-brand-900/10 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(47,107,255,0.55),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.35),transparent_55%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <span className="inline-block first-letter:uppercase">{formatLongDate(new Date())}</span>
              {live ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-300 normal-case">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
                </span>
              ) : null}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {t(greetingKey())}
              {firstName ? `, ${firstName}` : ''} 👋
            </h1>
            <p className="mt-1 text-slate-300">{t('dash.heroSub')}</p>
            <Button icon={Plus} className="mt-5 bg-white !text-navy-900 shadow-none hover:bg-brand-50" onClick={() => setCreating(true)}>
              {t('orders.new')}
            </Button>
          </div>
          <ProgressRing value={rate} label={t('dash.completionRate')} sub={`${stats.completedToday}/${stats.scheduledToday}`} loading={loading} />
        </div>
      </section>

      {stats.unassigned > 0 && !loading ? (
        <Link
          to="/orders?assignee=unassigned"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20">
          <AlertCircle className="size-4" />
          <span>{t('dash.unassigned', { n: stats.unassigned })}</span>
          <span className="ml-auto font-semibold">{t('dash.assign')}</span>
        </Link>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi loading={loading} icon={Hourglass} color="#F79009" label={t('dash.open')} value={stats.pending} hint={t('dash.openHint')} spark={stats.perDay.map((d) => d.scheduled)} />
        <Kpi loading={loading} icon={PlayCircle} color="#2F6BFF" label={t('dash.inProgress')} value={stats.inProgress} hint={t('dash.inProgressHint')} />
        <Kpi
          loading={loading}
          icon={CheckCircle2}
          color="#12B76A"
          label={t('dash.completedToday')}
          value={stats.completedToday}
          hint={t('dash.completedTodayHint', { n: stats.scheduledToday })}
          spark={stats.perDay.map((d) => d.completed)}
        />
        <Kpi loading={loading} icon={Clock} color="#7A5AF8" label={t('dash.avgTime')} value={formatMinutes(stats.avgMinutes)} hint={t('dash.avgTimeHint')} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">{t('dash.perDay')}</h2>
          <p className="mb-4 text-xs text-slate-500">{t('dash.perDaySub')}</p>
          <div className="h-64">
            {loading ? (
              <Skeleton className="size-full" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={perDay} barGap={4}>
                  <defs>
                    <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B8CFF" />
                      <stop offset="100%" stopColor="#1F55E0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="scheduled" name={t('dash.scheduled')} fill="#C7D7FE" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name={t('dash.completed')} fill="url(#barBlue)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">{t('dash.statusBreakdown')}</h2>
          <p className="mb-4 text-xs text-slate-500">{t('dash.allOrders')}</p>
          <div className="relative h-64">
            {loading ? (
              <Skeleton className="size-full" />
            ) : (
              <>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} cornerRadius={4} stroke="none">
                      {statusData.map((s) => (
                        <Cell key={s.key} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle.contentStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-slate-500">{t('dash.orders')}</p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <TodayList loading={loading} orders={stats.todayOrders} highlightId={lastChangedId} />

        <section className="card p-5">
          <h2 className="font-semibold">{t('dash.workload')}</h2>
          <p className="mb-4 text-xs text-slate-500">{t('dash.workloadSub')}</p>
          <div className="h-64">
            {loading ? (
              <Skeleton className="size-full" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={stats.workload} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={72} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="in_progress" name={t('status.in_progress')} stackId="a" fill="#2F6BFF" />
                  <Bar dataKey="pending" name={t('status.pending')} stackId="a" fill="#F79009" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {creating ? (
        <OrderFormModal
          open
          onClose={() => setCreating(false)}
          onSaved={(o) => {
            setCreating(false)
            navigate(`/orders/${o.id}`)
          }}
        />
      ) : null}
    </>
  )
}

function ProgressRing({ value, label, sub, loading }: { value: number; label: string; sub: string; loading: boolean }) {
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
      <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90">
        <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={loading ? c : c * (1 - value)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#47CD89" />
            <stop offset="100%" stopColor="#5B8CFF" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p className="text-3xl font-bold">{loading ? '—' : `${Math.round(value * 100)}%`}</p>
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  color,
  label,
  value,
  hint,
  loading,
  spark,
}: {
  icon: LucideIcon
  color: string
  label: string
  value: number | string
  hint: string
  loading: boolean
  spark?: number[]
}) {
  return (
    <div className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1a`, color }}>
          <Icon className="size-5" />
        </span>
      </div>
      {loading ? <Skeleton className="mt-3 h-9 w-16" /> : <p className="mt-2 text-4xl font-bold tracking-tight">{value}</p>}
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-xs text-slate-400">{hint}</p>
        {spark && !loading ? (
          <div className="h-8 w-20 shrink-0">
            <ResponsiveContainer>
              <AreaChart data={spark.map((v, i) => ({ i, v }))}>
                <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function TodayList({ orders, loading, highlightId }: { orders: WorkOrder[]; loading: boolean; highlightId: string | null }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  return (
    <section className="card overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="font-semibold">{t('dash.today')}</h2>
          <p className="text-xs text-slate-500">{t('dash.todaySub')}</p>
        </div>
        <Link to="/orders" className="text-sm font-medium text-brand-500 hover:text-brand-600">
          {t('common.viewAll')}
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3 p-5 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-slate-500">{t('dash.noToday')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-navy-700">
          {orders.map((o) => (
            <li
              key={`${o.id}-${o.updated_at}`}
              onClick={() => navigate(`/orders/${o.id}`)}
              className={cx(
                'flex cursor-pointer items-center gap-4 px-5 py-3 transition hover:bg-slate-50 dark:hover:bg-navy-800',
                o.id === highlightId && 'animate-row-flash',
              )}>
              <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">{formatTime(o.scheduled_for)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.title}</p>
                <p className="truncate text-xs text-slate-500">{o.customer?.name}</p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {o.assignee ? <Avatar name={o.assignee.full_name} size={26} /> : <span className="text-xs text-amber-600">{t('common.unassigned')}</span>}
              </div>
              <PriorityBadge priority={o.priority} />
              <StatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * KPI math is done client-side because the demo dataset is small. At real scale this would
 * move into a Postgres view / RPC so the browser only receives aggregates.
 */
function computeStats(orders: WorkOrder[]) {
  const now = new Date()
  const thirtyDaysAgo = now.getTime() - 30 * 86_400_000

  const durations = orders
    .filter((o) => o.status === 'completed' && o.completed_at && new Date(o.completed_at).getTime() > thirtyDaysAgo)
    .map((o) => minutesBetween(o.started_at, o.completed_at))
    .filter((m): m is number => m != null && m >= 0)

  const perDay = Array.from({ length: 7 }, (_, i) => {
    const d = startOfDay(new Date(now.getTime() - (6 - i) * 86_400_000))
    return {
      day: formatDay(d).split(',')[0],
      isToday: i === 6,
      scheduled: orders.filter((o) => o.status !== 'cancelled' && isSameDay(o.scheduled_for, d)).length,
      completed: orders.filter((o) => isSameDay(o.completed_at, d)).length,
    }
  })

  const techs = new Map<string, { name: string; pending: number; in_progress: number }>()
  for (const o of orders) {
    if (!o.assignee || (o.status !== 'pending' && o.status !== 'in_progress')) continue
    const t = techs.get(o.assignee.id) ?? { name: o.assignee.full_name ?? '—', pending: 0, in_progress: 0 }
    t[o.status] += 1
    techs.set(o.assignee.id, t)
  }

  const statusRank = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 }
  const todayOrders = orders
    .filter((o) => isSameDay(o.scheduled_for))
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''))

  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'in_progress').length,
    completedToday: orders.filter((o) => isSameDay(o.completed_at)).length,
    scheduledToday: orders.filter((o) => isSameDay(o.scheduled_for) && o.status !== 'cancelled').length,
    unassigned: orders.filter((o) => !o.assigned_to && (o.status === 'pending' || o.status === 'in_progress')).length,
    avgMinutes: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    perDay,
    byStatus: STATUSES.map((s) => ({
      key: s,
      value: orders.filter((o) => o.status === s).length,
      color: STATUS_META[s].color,
    })).filter((s) => s.value > 0),
    workload: [...techs.values()].map((t) => ({ ...t, name: t.name.split(' ')[0] })),
    todayOrders,
  }
}
