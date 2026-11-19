import { useState, type FormEvent } from 'react'

import { Alert, Button, Field, Modal } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { createWorkOrder, fetchCustomers, fetchTechnicians, updateWorkOrder, type WorkOrder } from '@/lib/api'
import { PRIORITIES, type OrderPriority } from '@/lib/constants'
import { useT } from '@/i18n/I18nProvider'
import { toLocalInput } from '@/lib/format'

type Props = {
  open: boolean
  order?: WorkOrder | null
  onClose: () => void
  onSaved: (order: WorkOrder) => void
}

/** Create / edit a work order. Mounting with a `key` resets the form for each order. */
export function OrderFormModal({ open, order, onClose, onSaved }: Props) {
  const t = useT()
  const customers = useQuery(fetchCustomers, [])
  const techs = useQuery(fetchTechnicians, [])

  const [title, setTitle] = useState(order?.title ?? '')
  const [description, setDescription] = useState(order?.description ?? '')
  const [customerId, setCustomerId] = useState(order?.customer_id ?? '')
  const [assignedTo, setAssignedTo] = useState(order?.assigned_to ?? '')
  const [priority, setPriority] = useState<OrderPriority>(order?.priority ?? 'medium')
  const [scheduledFor, setScheduledFor] = useState(toLocalInput(order?.scheduled_for ?? null))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      customer_id: customerId || null,
      assigned_to: assignedTo || null,
      priority,
      scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    }
    try {
      const saved = order ? await updateWorkOrder(order.id, payload) : await createWorkOrder(payload)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('form.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order ? t('form.edit', { code: order.code }) : t('form.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="order-form" loading={saving}>
            {order ? t('form.saveChanges') : t('form.create')}
          </Button>
        </>
      }>
      <form id="order-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {error ? (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Field label={t('form.title')}>
            <input
              className="input"
              required
              maxLength={120}
              placeholder={t('form.titlePh')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t('form.description')}>
            <textarea
              className="input h-24 py-2"
              placeholder={t('form.descriptionPh')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('form.customer')}>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">{t('form.selectCustomer')}</option>
            {customers.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('form.assign')} hint={t('form.assignHint')}>
          <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">{t('common.unassigned')}</option>
            {techs.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('form.priority')}>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as OrderPriority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(`priority.${p}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('form.scheduled')}>
          <input
            className="input"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  )
}
