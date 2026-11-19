import { Building2, Mail, MapPin, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { Alert, Button, EmptyState, ErrorState, Field, Modal, PageHeader, Skeleton } from '@/components/ui'
import { errorMessage, useQuery } from '@/hooks/useQuery'
import { deleteCustomer, fetchCustomers, fetchWorkOrders, saveCustomer, type Customer } from '@/lib/api'
import { useRealtime } from '@/realtime/RealtimeProvider'

export function Customers() {
  const { version } = useRealtime()
  const customers = useQuery(fetchCustomers, [])
  const orders = useQuery(fetchWorkOrders, [version])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Customer | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const openCounts = useMemo(() => {
    const m = new Map<string, { open: number; total: number }>()
    for (const o of orders.data ?? []) {
      if (!o.customer_id) continue
      const c = m.get(o.customer_id) ?? { open: 0, total: 0 }
      c.total += 1
      if (o.status === 'pending' || o.status === 'in_progress') c.open += 1
      m.set(o.customer_id, c)
    }
    return m
  }, [orders.data])

  const filtered = (customers.data ?? []).filter((c) =>
    [c.name, c.address, c.email].some((v) => v?.toLowerCase().includes(q.trim().toLowerCase())),
  )

  async function remove(c: Customer) {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteCustomer(c.id)
      customers.reload()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={customers.data ? `${customers.data.length} customers` : 'Loading…'}
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            Add customer
          </Button>
        }
      />
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <div className="relative mb-4 max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {customers.status === 'error' ? (
        <ErrorState message={customers.error ?? ''} onRetry={customers.retry} />
      ) : customers.status === 'loading' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Building2} title={q ? 'No matches' : 'No customers yet'} message={q ? 'Try another search.' : 'Add your first customer to start creating work orders.'} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const counts = openCounts.get(c.id)
            return (
              <div key={c.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                      <Building2 className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {counts?.open ?? 0} open · {counts?.total ?? 0} total jobs
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <button aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-navy-800">
                      <Pencil className="size-4" />
                    </button>
                    <button aria-label={`Delete ${c.name}`} onClick={() => remove(c)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  {c.address ? (
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0" /> {c.address}
                    </p>
                  ) : null}
                  {c.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="size-4" /> {c.phone}
                    </p>
                  ) : null}
                  {c.email ? (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="size-4 shrink-0" /> {c.email}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing ? (
        <CustomerModal
          key={editing === 'new' ? 'new' : editing.id}
          customer={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            customers.reload()
          }}
        />
      ) : null}
    </>
  )
}

function CustomerModal({ customer, onClose, onSaved }: { customer: Customer | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    address: customer?.address ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    latitude: customer?.latitude?.toString() ?? '',
    longitude: customer?.longitude?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await saveCustomer(
        {
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        },
        customer?.id,
      )
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? `Edit ${customer.name}` : 'Add customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={saving}>
            Save
          </Button>
        </>
      }>
      <form id="customer-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {error ? (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Field label="Company / customer name">
            <input className="input" required value={form.name} onChange={set('name')} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input className="input" value={form.address} onChange={set('address')} />
          </Field>
        </div>
        <Field label="Phone">
          <input className="input" type="tel" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Latitude" hint="Optional — used for the map view">
          <input className="input" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={set('latitude')} />
        </Field>
        <Field label="Longitude">
          <input className="input" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={set('longitude')} />
        </Field>
      </form>
    </Modal>
  )
}
