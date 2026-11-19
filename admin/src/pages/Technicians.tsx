import { HardHat, Phone } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'

import { Avatar, EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { fetchTechnicians, fetchWorkOrders } from '@/lib/api'
import { formatMinutes, isSameDay, minutesBetween } from '@/lib/format'
import { useRealtime } from '@/realtime/RealtimeProvider'

export function Technicians() {
  const { version } = useRealtime()
  const techs = useQuery(fetchTechnicians, [])
  const orders = useQuery(fetchWorkOrders, [version])

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86_400_000
    return new Map(
      (techs.data ?? []).map((t) => {
        const mine = (orders.data ?? []).filter((o) => o.assigned_to === t.id)
        const done = mine.filter((o) => o.status === 'completed')
        const durations = done.map((o) => minutesBetween(o.started_at, o.completed_at)).filter((m): m is number => m != null)
        const current = mine.find((o) => o.status === 'in_progress')
        return [
          t.id,
          {
            pending: mine.filter((o) => o.status === 'pending').length,
            today: mine.filter((o) => isSameDay(o.scheduled_for) && o.status !== 'cancelled').length,
            doneWeek: done.filter((o) => o.completed_at && new Date(o.completed_at).getTime() > weekAgo).length,
            avg: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
            current,
          },
        ] as const
      }),
    )
  }, [techs.data, orders.data])

  return (
    <>
      <PageHeader
        title="Technicians"
        subtitle="Field team status and performance, updated live."
      />
      {techs.status === 'error' ? (
        <ErrorState message={techs.error ?? ''} onRetry={techs.retry} />
      ) : techs.status === 'loading' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : !techs.data?.length ? (
        <div className="card">
          <EmptyState icon={HardHat} title="No technicians yet" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {techs.data.map((t) => {
            const s = stats.get(t.id)
            return (
              <div key={t.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={t.full_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t.full_name}</p>
                    {t.phone ? (
                      <a href={`tel:${t.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-500">
                        <Phone className="size-3" /> {t.phone}
                      </a>
                    ) : null}
                  </div>
                  <span
                    className={
                      s?.current
                        ? 'rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-navy-800'
                    }>
                    {s?.current ? 'On a job' : 'Available'}
                  </span>
                </div>

                {s?.current ? (
                  <Link
                    to={`/orders/${s.current.id}`}
                    className="mt-4 block rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-sm hover:bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/5">
                    <span className="text-xs text-slate-500">Currently at {s.current.customer?.name}</span>
                    <p className="truncate font-medium">{s.current.title}</p>
                  </Link>
                ) : null}

                <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    ['Today', s?.today ?? 0],
                    ['Pending', s?.pending ?? 0],
                    ['Done 7d', s?.doneWeek ?? 0],
                    ['Avg time', formatMinutes(s?.avg ?? null)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 px-1 py-2 dark:bg-navy-800">
                      <dd className="text-base font-bold">{value}</dd>
                      <dt className="text-[11px] text-slate-500">{label}</dt>
                    </div>
                  ))}
                </dl>
                <Link to={`/orders?assignee=${t.id}`} className="mt-4 inline-block text-sm font-medium text-brand-500 hover:text-brand-600">
                  View work orders →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
