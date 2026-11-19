import { CheckCircle2, FileScan, PlayCircle, X } from 'lucide-react'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'

import { useT } from '@/i18n/I18nProvider'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type Toast = { id: number; title: string; body: string; kind: 'completed' | 'started' | 'document' }

type RealtimeState = {
  /** Increments on every DB change — pages add it to their query deps to refetch. */
  version: number
  /** Id of the most recently changed work order (for row highlight). */
  lastChangedId: string | null
  live: boolean
}

const RealtimeContext = createContext<RealtimeState>({ version: 0, lastChangedId: null, live: false })

/**
 * One Supabase Realtime channel for the whole admin panel. When a technician starts or
 * completes a job (or scans a document) on the phone, every open page refetches and a toast
 * pops up — no polling, no refresh button.
 */
export function RealtimeProvider({ children }: PropsWithChildren) {
  const [version, setVersion] = useState(0)
  const [lastChangedId, setLastChangedId] = useState<string | null>(null)
  const [live, setLive] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const names = useRef(new Map<string, string>())
  const nextId = useRef(0)
  const t = useT()
  // The channel is created once; read the latest translator through a ref.
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++nextId.current
    setToasts((ts) => [...ts.slice(-3), { ...t, id }])
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000)
  }, [])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name')
      .then(({ data }) => data?.forEach((p) => p.full_name && names.current.set(p.id, p.full_name)))

    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, (payload) => {
        setVersion((v) => v + 1)
        if (payload.eventType === 'DELETE') return
        const row = payload.new as Tables<'work_orders'>
        setLastChangedId(row.id)
        const tr = tRef.current
        const who = (row.assigned_to && names.current.get(row.assigned_to)) || tr('toast.aTech')
        const fresh = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < 15_000
        if (row.status === 'completed' && fresh(row.completed_at)) {
          push({ kind: 'completed', title: tr('toast.completed', { code: row.code }), body: tr('toast.completedBody', { who, title: row.title }) })
        } else if (row.status === 'in_progress' && fresh(row.started_at)) {
          push({ kind: 'started', title: tr('toast.started', { code: row.code }), body: tr('toast.startedBody', { who, title: row.title }) })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scanned_documents' }, (payload) => {
        setVersion((v) => v + 1)
        if (payload.eventType === 'INSERT') {
          push({ kind: 'document', title: tRef.current('toast.docNew'), body: tRef.current('toast.docNewBody') })
        } else if (payload.eventType === 'UPDATE') {
          const d = payload.new as Tables<'scanned_documents'>
          if (d.status === 'extracted') {
            push({ kind: 'document', title: tRef.current('toast.docDone'), body: `${d.vendor_name ?? 'Vendor'} · ${d.invoice_number ?? ''}` })
          }
        }
      })
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [push])

  const value = useMemo(() => ({ version, lastChangedId, live }), [version, lastChangedId, live])

  return (
    <RealtimeContext value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = t.kind === 'completed' ? CheckCircle2 : t.kind === 'started' ? PlayCircle : FileScan
          const color = t.kind === 'completed' ? 'text-emerald-500' : t.kind === 'started' ? 'text-brand-500' : 'text-violet-500'
          return (
            <div key={t.id} role="status" className="card animate-toast-in pointer-events-auto flex items-start gap-3 p-4 shadow-lg">
              <Icon className={`mt-0.5 size-5 shrink-0 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{t.body}</p>
              </div>
              <button
                aria-label="Dismiss"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}>
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </RealtimeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRealtime = () => use(RealtimeContext)
