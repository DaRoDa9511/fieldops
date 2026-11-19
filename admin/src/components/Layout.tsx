import { Building2, ClipboardList, HardHat, LayoutDashboard, LogOut, Menu, Moon, Sun, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'

import { useAuth } from '@/auth/AuthProvider'
import { Avatar, cx } from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'
import type { Language } from '@/i18n/translations'
import { useRealtime } from '@/realtime/RealtimeProvider'

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cx(
          'flex size-9 items-center justify-center rounded-xl text-white shadow-lg',
          inverted ? 'bg-white/15 ring-1 ring-white/25' : 'bg-gradient-to-br from-brand-400 to-brand-600 shadow-brand-500/30',
        )}>
        <Wrench className="size-5" />
      </div>
      <span className={cx('text-lg font-bold tracking-tight', inverted && 'text-white')}>
        Field<span className={inverted ? 'text-brand-100' : 'text-brand-500'}>Ops</span>
      </span>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('fieldops-theme', next ? 'dark' : 'light')
    } catch {
      /* private mode — theme just won't persist */
    }
    setDark(next)
  }
  return { dark, toggle }
}

/** Language + theme switches, shared by the sidebar and the login screen. */
export function Preferences({ variant = 'sidebar' }: { variant?: 'sidebar' | 'floating' }) {
  const { language, setLanguage, t } = useI18n()
  const { dark, toggle } = useThemeToggle()
  const onDark = variant === 'sidebar'
  return (
    <div className="flex items-center gap-2">
      <div
        className={cx('flex rounded-lg p-0.5 text-xs font-semibold', onDark ? 'bg-white/10' : 'bg-slate-100 dark:bg-navy-800')}
        role="radiogroup"
        aria-label="Language">
        {(['en', 'es'] as Language[]).map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={language === l}
            onClick={() => setLanguage(l)}
            className={cx(
              'rounded-md px-2.5 py-1 transition',
              language === l
                ? onDark
                  ? 'bg-white text-navy-900'
                  : 'bg-white text-slate-900 shadow-sm dark:bg-navy-600 dark:text-white'
                : onDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
            )}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={toggle}
        className={cx(
          'flex size-8 items-center justify-center rounded-lg transition',
          onDark ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300',
        )}
        aria-label={dark ? t('nav.lightMode') : t('nav.darkMode')}
        title={dark ? t('nav.lightMode') : t('nav.darkMode')}>
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </div>
  )
}

export function Layout() {
  const { profile, signOut } = useAuth()
  const { live } = useRealtime()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const NAV = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/orders', label: t('nav.orders'), icon: ClipboardList },
    { to: '/customers', label: t('nav.customers'), icon: Building2 },
    { to: '/technicians', label: t('nav.technicians'), icon: HardHat },
  ]

  // The sidebar is always dark navy: a strong brand anchor in both light and dark mode.
  const sidebar = (
    <nav className="relative flex h-full flex-col gap-1 overflow-hidden bg-navy-900 p-4 text-slate-300">
      <div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="relative mb-8 flex items-center justify-between px-2 pt-1">
        <Logo inverted />
        <button className="text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cx(
              'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
            )
          }>
          <Icon className="size-[18px]" />
          {label}
        </NavLink>
      ))}

      <div className="relative mt-auto flex flex-col gap-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between px-2">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-400" title="Supabase Realtime">
            <span className="relative flex size-2.5">
              {live ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" /> : null}
              <span className={cx('relative inline-flex size-2.5 rounded-full', live ? 'bg-emerald-400' : 'bg-slate-500')} />
            </span>
            {live ? t('nav.live') : t('nav.connecting')}
          </span>
          <Preferences />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <Avatar name={profile?.full_name} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="text-xs text-slate-400">{t('nav.admin')}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={t('nav.signOut')}
            title={t('nav.signOut')}>
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 flex items-center gap-3 bg-navy-900 px-4 py-3 text-white lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Logo inverted />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
