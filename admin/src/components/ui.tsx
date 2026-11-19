import { AlertTriangle, Inbox, Loader2, X, type LucideIcon } from 'lucide-react'
import { useEffect, type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode } from 'react'

import {
  DOCUMENT_STATUS_META,
  PRIORITY_META,
  STATUS_META,
  type DocumentStatus,
  type OrderPriority,
  type OrderStatus,
} from '@/lib/constants'
import { initials } from '@/lib/format'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ------------------------------------------------------------------ Button
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: LucideIcon
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const styles = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20',
    secondary:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-200 dark:hover:bg-navy-700',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant]
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        styles,
        className,
      )}
      {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" /> : null}
      {children}
    </button>
  )
}

// ------------------------------------------------------------------ Badges
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: `${color}1f` }}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
export const StatusBadge = ({ status }: { status: OrderStatus }) => <Badge {...STATUS_META[status]} />
export const PriorityBadge = ({ priority }: { priority: OrderPriority }) => <Badge {...PRIORITY_META[priority]} />
export const DocStatusBadge = ({ status }: { status: DocumentStatus }) => <Badge {...DOCUMENT_STATUS_META[status]} />

// ------------------------------------------------------------------ Avatar
const AVATAR_COLORS = ['#2F6BFF', '#7A5AF8', '#12B76A', '#F79009', '#EE46BC', '#0BA5EC']
export function Avatar({ name, size = 32 }: { name: string | null | undefined; size?: number }) {
  const n = name ?? '?'
  const color = AVATAR_COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: color }}>
      {initials(n)}
    </span>
  )
}

// ------------------------------------------------------------------ Loading / empty / error
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-slate-200 dark:bg-navy-700', className)} />
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10">
        <Icon className="size-6" />
      </div>
      <p className="font-semibold">{title}</p>
      {message ? <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10">
        <AlertTriangle className="size-6" />
      </div>
      <p className="font-semibold">Something went wrong</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function Alert({ children }: PropsWithChildren) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

// ------------------------------------------------------------------ Form field
export function Field({ label, children, hint }: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  )
}

// ------------------------------------------------------------------ Modal
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: PropsWithChildren<{ open: boolean; title: string; onClose: () => void; footer?: ReactNode; wide?: boolean }>) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cx(
          'card animate-toast-in relative flex max-h-[92vh] w-full flex-col rounded-b-none sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-navy-700">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-navy-700">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Page header
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  )
}
