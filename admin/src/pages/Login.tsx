import { BarChart3, Lock, Mail, Radio, ScanLine } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { Logo } from '@/components/Layout'
import { Alert, Button, Field } from '@/components/ui'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <Logo />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dispatcher sign in</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage work orders, technicians and customers in real time.
            </p>
          </div>
          {error ? <Alert>{error}</Alert> : null}
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </div>

      <div className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:items-center lg:justify-center">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative max-w-md space-y-8 p-12 text-white">
          <h2 className="text-3xl leading-tight font-bold">
            From paper work orders to a live, AI-powered operation.
          </h2>
          {[
            { icon: Radio, t: 'Live job tracking', d: 'See jobs start and finish the moment technicians tap a button.' },
            { icon: ScanLine, t: 'AI invoice scanning', d: 'Delivery notes and invoices are read automatically — no re-typing.' },
            { icon: BarChart3, t: 'Operational KPIs', d: 'Completion times, workload and backlog at a glance.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold">{t}</p>
                <p className="text-sm text-slate-300">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
