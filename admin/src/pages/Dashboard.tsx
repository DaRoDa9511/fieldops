import { AlertCircle, CheckCircle2, Clock, Hourglass, PlayCircle, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
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

import { Avatar, ErrorState, PageHeader, PriorityBadge, Skeleton, StatusBadge, cx } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { fetchWorkOrders, type WorkOrder } from '@/lib/api'
import { STATUSES, STATUS_META } from '@/lib/constants'
import { formatDay, formatMinutes, formatSchedule, isSameDay, minutesBetween, startOfDay } from '@/lib/format'
import { useRealtime } from '@/realtime/RealtimeProvider'

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 },
  cursor: { fill: 'rgba(47,107,255,0.06)' },
}

export function Dashboard() {
  const { version, lastChangedId } = useRealtime()
  const orders = useQuery(fetchWorkOrders, [version])

  const stats = useMemo(() => computeStats(orders.data ?? []), [orders.data])

  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  if (orders.status === 'error') return <ErrorState message={orders.error ?? ''} onRetry={orders.retry} />
  const loading = orders.status === 'loading'

  return (
    <>
      <PageHeader title="Operations overview" subtitle={today} />

      {stats.unassigned > 0 && !loading ? (
        <Link
          to="/orders?assignee=unassigned"
          className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertCircle className="size-4" />
          <span>
            <b>{stats.unassigned}</b> open work order{stats.unassigned > 1 ? 's are' : ' is'} not assigned to a technician.
          </span>
          <span className="ml-auto font-semibold">Assign →</span>
        </Link>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Kpi loading={loading} icon={Hourglass} color="#F79009" label="Open" value={stats.pending} hint="Pending, not started" />
        <Kpi loading={loading} icon={PlayCircle} color="#2F6BFF" label="In progress" value={stats.inProgress} hint="Technicians on site" />
        <Kpi
          loading={loading}
          icon={CheckCircle2}
          color="#12B76A"
          label="Completed today"
          value={stats.completedToday}
          hint={`of ${stats.scheduledToday} scheduled today`}
        />
        <Kpi
          loading={loading}
          icon={Clock}
          color="#7A5AF8"
          label="Avg. time on site"
          value={formatMinutes(stats.avgMinutes)}
          hint="Start → complete, last 30 days"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">Jobs per day</h2>
          <p className="mb-4 text-xs text-slate-500">Scheduled vs. completed, last 7 days</p>
          <div className="h-64">
            {loading ? (
              <Skeleton className="size-full" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={stats.perDay} barGap={4}>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="scheduled" name="Scheduled" fill="#C7D7FE" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#2F6BFF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Status breakdown</h2>
          <p className="mb-4 text-xs text-slate-500">All work orders</p>
          <div className="relative h-64">
            {loading ? (
              <Skeleton className="size-full" />
            ) : (
              <>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
                      {stats.byStatus.map((s) => (
                        <Cell key={s.name} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle.contentStyle} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-slate-500">orders</p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <TodayList loading={loading} orders={stats.todayOrders} highlightId={lastChangedId} />

        <section className="card p-5">
          <h2 className="font-semibold">Technician workload</h2>
          <p className="mb-4 text-xs text-slate-500">Open jobs per technician</p>
          <div className="h-64">
            {loading ? (
              <Skeleton className="size-full" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={stats.workload} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={96} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="in_progress" name="In progress" stackId="a" fill="#2F6BFF" />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#F79009" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function Kpi({
  icon: Icon,
  color,
  label,
  value,
  hint,
  loading,
}: {
  icon: LucideIcon
  color: string
  label: string
  value: number | string
  hint: string
  loading: boolean
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1a`, color }}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>}
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  )
}

function TodayList({ orders, loading, highlightId }: { orders: WorkOrder[]; loading: boolean; highlightId: string | null }) {
  const navigate = useNavigate()
  return (
    <section className="card overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="font-semibold">Today&apos;s jobs</h2>
          <p className="text-xs text-slate-500">Updates live as technicians work</p>
        </div>
        <Link to="/orders" className="text-sm font-medium text-brand-500 hover:text-brand-600">
          View all
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3 p-5 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="px-5 pb-6 text-sm text-slate-500">No jobs scheduled for today.</p>
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
              <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{formatSchedule(o.scheduled_for).replace('Today, ', '')}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.title}</p>
                <p className="truncate text-xs text-slate-500">{o.customer?.name}</p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {o.assignee ? <Avatar name={o.assignee.full_name} size={26} /> : <span className="text-xs text-amber-600">Unassigned</span>}
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
      day: i === 6 ? 'Today' : formatDay(d).split(',')[0],
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
      name: STATUS_META[s].label,
      value: orders.filter((o) => o.status === s).length,
      color: STATUS_META[s].color,
    })).filter((s) => s.value > 0),
    workload: [...techs.values()].map((t) => ({ ...t, name: t.name.split(' ')[0] })),
    todayOrders,
  }
}
