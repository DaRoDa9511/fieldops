import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ExternalLink,
  FileScan,
  ImageIcon,
  MapPin,
  Pencil,
  Phone,
  PlayCircle,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'

import { OrderFormModal } from '@/components/OrderFormModal'
import {
  Alert,
  Avatar,
  Button,
  DocStatusBadge,
  EmptyState,
  ErrorState,
  PriorityBadge,
  Skeleton,
  StatusBadge,
} from '@/components/ui'
import { useDayLabels } from '@/hooks/useLabels'
import { errorMessage, useQuery } from '@/hooks/useQuery'
import { useT } from '@/i18n/I18nProvider'
import {
  fetchDocuments,
  fetchPhotos,
  fetchWorkOrder,
  signedUrl,
  updateDocument,
  updateWorkOrder,
  type LineItem,
  type ScannedDocument,
} from '@/lib/api'
import { formatDateTime, formatMinutes, formatMoney, formatSchedule, minutesBetween, timeAgo } from '@/lib/format'
import { useRealtime } from '@/realtime/RealtimeProvider'

export function WorkOrderDetail() {
  const { id = '' } = useParams()
  const t = useT()
  const labels = useDayLabels()
  const { version } = useRealtime()
  const order = useQuery(() => fetchWorkOrder(id), [id, version])
  const photos = useQuery(() => fetchPhotos(id), [id, version])
  const docs = useQuery(() => fetchDocuments(id), [id, version])
  const signature = useQuery(
    async () => (order.data?.signature_path ? signedUrl('signatures', order.data.signature_path) : null),
    [order.data?.signature_path],
  )

  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  if (order.status === 'loading') return <DetailSkeleton />
  if (order.status === 'error' || !order.data) return <ErrorState message={order.error ?? 'Not found'} onRetry={order.retry} />
  const o = order.data

  async function cancelOrder() {
    if (!window.confirm(t('detail.confirmCancel', { code: o.code }))) return
    setCancelling(true)
    setActionError(null)
    try {
      order.setData(await updateWorkOrder(o.id, { status: 'cancelled' }))
    } catch (e) {
      setActionError(errorMessage(e))
    } finally {
      setCancelling(false)
    }
  }

  const onSite = minutesBetween(o.started_at, o.completed_at ?? (o.status === 'in_progress' ? new Date().toISOString() : null))
  const editable = o.status === 'pending' || o.status === 'in_progress'

  return (
    <>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="size-4" /> {t('detail.back')}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400">{o.code}</span>
            <StatusBadge status={o.status} />
            <PriorityBadge priority={o.priority} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{o.title}</h1>
        </div>
        {editable ? (
          <div className="flex gap-2">
            <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
              {t('detail.edit')}
            </Button>
            <Button variant="ghost" icon={Ban} loading={cancelling} onClick={cancelOrder}>
              {t('detail.cancelOrder')}
            </Button>
          </div>
        ) : null}
      </div>
      {actionError ? (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title={t('detail.description')}>
            <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">{o.description || t('detail.noDescription')}</p>
          </Section>

          {o.technician_notes ? (
            <Section title={t('detail.notes')}>
              <p className="text-sm whitespace-pre-line text-slate-700 dark:text-slate-300">{o.technician_notes}</p>
            </Section>
          ) : null}

          <Section title={`${t('detail.photos')}${photos.data?.length ? ` · ${photos.data.length}` : ''}`}>
            {photos.status === 'loading' ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : photos.data?.length ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => p.url && setLightbox(p.url)}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-navy-800">
                    {p.url ? (
                      <img src={p.url} alt={p.caption ?? 'Job photo'} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-left text-[11px] text-white">
                      {timeAgo(p.created_at, t('date.justNow'))}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <ImageIcon className="size-4" /> {t('detail.noPhotos')}
              </p>
            )}
          </Section>

          <Section title={t('detail.docs')} subtitle={t('detail.docsSub')}>
            {docs.status === 'loading' ? (
              <Skeleton className="h-20" />
            ) : docs.data?.length ? (
              <div className="space-y-3">
                {docs.data.map((d) => (
                  <DocumentRow key={d.id} doc={d} onChange={docs.reload} />
                ))}
              </div>
            ) : (
              <EmptyState icon={FileScan} title={t('detail.noDocs')} message={t('detail.noDocsMsg')} />
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title={t('detail.details')}>
            <dl className="space-y-4 text-sm">
              <Row icon={Building2} label={t('detail.customer')}>
                <p className="font-semibold">{o.customer?.name ?? '—'}</p>
                {o.customer?.address ? (
                  <a
                    className="mt-0.5 flex items-start gap-1 text-slate-500 hover:text-brand-500"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customer.address)}`}>
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    {o.customer.address}
                  </a>
                ) : null}
                {o.customer?.phone ? (
                  <a className="mt-0.5 flex items-center gap-1 text-slate-500 hover:text-brand-500" href={`tel:${o.customer.phone}`}>
                    <Phone className="size-3.5" /> {o.customer.phone}
                  </a>
                ) : null}
              </Row>
              <Row icon={CircleDot} label={t('detail.technician')}>
                {o.assignee ? (
                  <span className="flex items-center gap-2 font-semibold">
                    <Avatar name={o.assignee.full_name} size={24} /> {o.assignee.full_name}
                  </span>
                ) : (
                  <button onClick={() => setEditing(true)} className="font-semibold text-amber-600 hover:underline">
                    {t('detail.assignNow')}
                  </button>
                )}
              </Row>
              <Row icon={CalendarClock} label={t('detail.scheduled')}>
                <p className="font-semibold">{formatSchedule(o.scheduled_for, labels)}</p>
              </Row>
            </dl>
          </Section>

          <Section title={t('detail.timeline')}>
            <ol className="relative space-y-5 border-l border-slate-200 pl-5 text-sm dark:border-navy-700">
              <TimelineItem icon={CircleDot} color="#98A2B3" title={t('detail.created')} pendingLabel={t('detail.pendingStep')} time={formatDateTime(o.created_at)} done />
              <TimelineItem icon={PlayCircle} color="#2F6BFF" title={t('detail.started')} pendingLabel={t('detail.pendingStep')} time={formatDateTime(o.started_at)} done={!!o.started_at} />
              {o.status === 'cancelled' ? (
                <TimelineItem icon={Ban} color="#98A2B3" title={t('detail.cancelled')} pendingLabel={t('detail.pendingStep')} time={formatDateTime(o.updated_at)} done />
              ) : (
                <TimelineItem icon={CheckCircle2} color="#12B76A" title={t('detail.completed')} pendingLabel={t('detail.pendingStep')} time={formatDateTime(o.completed_at)} done={!!o.completed_at} />
              )}
            </ol>
            {onSite != null ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-navy-800">
                {t('detail.timeOnSite')} <b>{formatMinutes(onSite)}</b>
                {o.status === 'in_progress' ? ` ${t('detail.ongoing')}` : ''}
              </p>
            ) : null}
          </Section>

          {o.status === 'completed' ? (
            <Section title={t('detail.signature')}>
              {signature.data ? (
                <img src={signature.data} alt="Customer signature" className="h-36 w-full rounded-lg border border-slate-200 bg-white object-contain dark:border-navy-700" />
              ) : o.signature_path ? (
                <Skeleton className="h-36" />
              ) : (
                <p className="text-sm text-slate-500">{t('detail.noSignature')}</p>
              )}
            </Section>
          ) : null}
        </div>
      </div>

      {editing ? (
        <OrderFormModal
          open
          order={o}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            order.setData(saved)
            setEditing(false)
          }}
        />
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white" aria-label="Close">
            <X className="size-7" />
          </button>
          <img src={lightbox} alt="Job photo" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      ) : null}
    </>
  )
}

function DocumentRow({ doc, onChange }: { doc: ScannedDocument; onChange: () => void }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const items = (Array.isArray(doc.line_items) ? doc.line_items : []) as LineItem[]

  async function openImage() {
    const url = await signedUrl('documents', doc.storage_path)
    window.open(url, '_blank', 'noopener')
  }

  async function verify() {
    setBusy(true)
    try {
      await updateDocument(doc.id, { status: 'verified' })
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-navy-700">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 px-4 py-3 text-left">
        <FileScan className="size-5 shrink-0 text-violet-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{doc.vendor_name ?? (doc.status === 'processing' ? t('detail.readingDoc') : t('detail.unknownVendor'))}</p>
          <p className="text-xs text-slate-500">
            {doc.invoice_number ? `#${doc.invoice_number} · ` : ''}
            {doc.invoice_date ?? timeAgo(doc.created_at, t('date.justNow'))}
          </p>
        </div>
        <span className="text-sm font-semibold">{formatMoney(doc.total_amount, doc.currency ?? 'USD')}</span>
        {(doc.ai_raw as { mode?: string } | null)?.mode === 'demo' ? (
          <span
            title={t('detail.demoHint')}
            className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 sm:inline dark:bg-amber-500/10 dark:text-amber-300">
            {t('detail.demo')}
          </span>
        ) : null}
        <DocStatusBadge status={doc.status} />
        <ChevronDown className={`size-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-navy-700">
          {items.length ? (
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-1 text-left font-medium">{t('detail.item')}</th>
                  <th className="py-1 text-right font-medium">{t('detail.qty')}</th>
                  <th className="py-1 text-right font-medium">{t('detail.unit')}</th>
                  <th className="py-1 text-right font-medium">{t('detail.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-navy-800">
                    <td className="py-1.5">{it.description ?? '—'}</td>
                    <td className="py-1.5 text-right">{it.quantity ?? '—'}</td>
                    <td className="py-1.5 text-right">{formatMoney(it.unit_price ?? null, doc.currency ?? 'USD')}</td>
                    <td className="py-1.5 text-right">{formatMoney(it.amount ?? null, doc.currency ?? 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">{t('detail.noItems')}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">
              {t('detail.subtotal')} {formatMoney(doc.subtotal, doc.currency ?? 'USD')} · {t('detail.tax')} {formatMoney(doc.tax, doc.currency ?? 'USD')}
              {doc.confidence != null ? ` · ${t('detail.confidence')} ${Math.round(Number(doc.confidence) * 100)}%` : ''}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={ExternalLink} onClick={openImage}>
                {t('detail.original')}
              </Button>
              {doc.status === 'extracted' ? (
                <Button size="sm" icon={ShieldCheck} loading={busy} onClick={verify}>
                  {t('detail.verify')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Row({ icon: Icon, label, children }: { icon: typeof Building2; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  )
}

function TimelineItem({
  icon: Icon,
  color,
  title,
  time,
  done,
  pendingLabel,
}: {
  icon: typeof Building2
  color: string
  title: string
  time: string
  done: boolean
  pendingLabel: string
}) {
  return (
    <li className="relative">
      <span
        className="absolute top-0 -left-[31px] flex size-5 items-center justify-center rounded-full bg-white dark:bg-navy-900"
        style={{ color: done ? color : '#CBD5E1' }}>
        <Icon className="size-5" />
      </span>
      <p className={done ? 'font-medium' : 'text-slate-400'}>{title}</p>
      <p className="text-xs text-slate-500">{done ? time : pendingLabel}</p>
    </li>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}
