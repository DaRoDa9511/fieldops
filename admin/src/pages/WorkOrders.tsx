import { ClipboardList, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { OrderFormModal } from '@/components/OrderFormModal'
import { Avatar, Button, EmptyState, ErrorState, PageHeader, PriorityBadge, Skeleton, StatusBadge, cx } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { fetchTechnicians, fetchWorkOrders } from '@/lib/api'
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META } from '@/lib/constants'
import { formatSchedule } from '@/lib/format'
import { useRealtime } from '@/realtime/RealtimeProvider'

export function WorkOrders() {
  const navigate = useNavigate()
  const { version, lastChangedId } = useRealtime()
  const orders = useQuery(fetchWorkOrders, [version])
  const techs = useQuery(fetchTechnicians, [])

  // Filters live in the URL so a filtered view can be bookmarked / linked (e.g. from the dashboard).
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const priority = params.get('priority') ?? ''
  const assignee = params.get('assignee') ?? ''
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (orders.data ?? []).filter(
      (o) =>
        (!status || o.status === status) &&
        (!priority || o.priority === priority) &&
        (!assignee || (assignee === 'unassigned' ? !o.assigned_to : o.assigned_to === assignee)) &&
        (!needle ||
          [o.code, o.title, o.customer?.name, o.assignee?.full_name].some((v) => v?.toLowerCase().includes(needle))),
    )
  }, [orders.data, q, status, priority, assignee])

  const hasFilters = !!(q || status || priority || assignee)

  return (
    <>
      <PageHeader
        title="Work orders"
        subtitle={orders.data ? `${filtered.length} of ${orders.data.length} orders` : 'Loading…'}
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            New work order
          </Button>
        }
      />

      <div className="card mb-4 flex flex-wrap gap-3 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search code, title, customer, technician…"
            value={q}
            onChange={(e) => setParam('q', e.target.value)}
          />
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={priority} onChange={(e) => setParam('priority', e.target.value)} aria-label="Priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={assignee} onChange={(e) => setParam('assignee', e.target.value)} aria-label="Technician">
          <option value="">All technicians</option>
          <option value="unassigned">Unassigned</option>
          {techs.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
        {hasFilters ? (
          <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
            Clear
          </Button>
        ) : null}
      </div>

      <div className="card overflow-hidden">
        {orders.status === 'error' ? (
          <ErrorState message={orders.error ?? ''} onRetry={orders.retry} />
        ) : orders.status === 'loading' ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={hasFilters ? 'No matching work orders' : 'No work orders yet'}
            message={hasFilters ? 'Try a different search or clear the filters.' : 'Create the first job and assign it to a technician.'}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Clear filters
                </Button>
              ) : (
                <Button icon={Plus} onClick={() => setCreating(true)}>
                  New work order
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:border-navy-700 dark:bg-navy-800/50">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Technician</th>
                  <th className="px-5 py-3">Scheduled</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                {filtered.map((o) => (
                  <tr
                    key={`${o.id}-${o.updated_at}`}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className={cx(
                      'cursor-pointer transition hover:bg-slate-50 dark:hover:bg-navy-800',
                      o.id === lastChangedId && 'animate-row-flash',
                    )}>
                    <td className="max-w-72 px-5 py-3">
                      <p className="truncate font-semibold">{o.title}</p>
                      <p className="font-mono text-xs text-slate-400">{o.code}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{o.customer?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      {o.assignee ? (
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={o.assignee.full_name} size={24} />
                          {o.assignee.full_name}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{formatSchedule(o.scheduled_for)}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={o.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
