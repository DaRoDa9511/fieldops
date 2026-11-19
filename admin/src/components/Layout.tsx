import { Building2, ClipboardList, HardHat, LayoutDashboard, LogOut, Menu, Moon, Sun, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'

import { useAuth } from '@/auth/AuthProvider'
import { Avatar, cx } from '@/components/ui'
import { useRealtime } from '@/realtime/RealtimeProvider'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Work orders', icon: ClipboardList },
  { to: '/customers', label: 'Customers', icon: Building2 },
  { to: '/technicians', label: 'Technicians', icon: HardHat },
]

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/30">
        <Wrench className="size-5" />
      </div>
      <span className="text-lg font-bold tracking-tight">
        Field<span className="text-brand-500">Ops</span>
      </span>
    </div>
  )
}

function useThemeToggle() {
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

export function Layout() {
  const { profile, signOut } = useAuth()
  const { live } = useRealtime()
  const { dark, toggle } = useThemeToggle()
  const [open, setOpen] = useState(false)

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center justify-between px-2 pt-1">
        <Logo />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
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
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
              isActive
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800',
            )
          }>
          <Icon className="size-[18px]" />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-navy-700">
        <div
          className="flex items-center gap-2 px-2 text-xs font-medium text-slate-500"
          title="Supabase Realtime connection">
          <span className="relative flex size-2.5">
            {live ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" /> : null}
            <span className={cx('relative inline-flex size-2.5 rounded-full', live ? 'bg-emerald-500' : 'bg-slate-400')} />
          </span>
          {live ? 'Live updates on' : 'Connecting…'}
        </div>
        <div className="flex items-center gap-3 px-2">
          <Avatar name={profile?.full_name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.full_name}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
            aria-label="Sign out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-navy-700 dark:bg-navy-900">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-navy-900">{sidebar}</aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden dark:border-navy-700 dark:bg-navy-900/80">
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <Logo />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
