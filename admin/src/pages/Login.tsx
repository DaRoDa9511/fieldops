import { ArrowRight, BarChart3, CheckCircle2, Lock, Mail, Radio, ScanLine, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { Logo, Preferences } from '@/components/Layout'
import { Alert, Avatar, Button, Field } from '@/components/ui'
import { useI18n } from '@/i18n/I18nProvider'
import { en, type TranslationKey } from '@/i18n/translations'

export function Login() {
  const { signIn } = useAuth()
  const { t } = useI18n()
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

  const errorText = error ? (error in en ? t(error as TranslationKey) : error) : null

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Form */}
      <div className="relative flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Preferences variant="floating" />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <span className="size-1.5 rounded-full bg-brand-500" /> Admin
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">{t('login.title')}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('login.subtitle')}</p>
            </div>
            {errorText ? <Alert>{errorText}</Alert> : null}
            <Field label={t('login.email')}>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input h-11 pl-9"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Field>
            <Field label={t('login.password')}>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input h-11 pl-9"
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
            <Button type="submit" loading={loading} className="h-11 w-full">
              {t('login.submit')} <ArrowRight className="size-4" />
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="size-3.5" /> {t('login.secure')}
            </p>
          </form>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} FieldOps · DRD Software</p>
      </div>

      {/* Brand panel with a live product preview */}
      <div className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(47,107,255,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.35),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative w-full max-w-lg space-y-10 p-12 text-white">
          <h2 className="text-4xl leading-tight font-bold tracking-tight">{t('login.heroTitle')}</h2>

          {/* Mock dashboard preview */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['9', t('dash.open'), 'text-amber-300'],
                  ['3', t('dash.inProgress'), 'text-brand-400'],
                  ['1h 50m', t('dash.avgTime'), 'text-violet-300'],
                ].map(([v, l, c]) => (
                  <div key={l} className="rounded-xl bg-white/5 p-3">
                    <p className={`text-xl font-bold ${c}`}>{v}</p>
                    <p className="truncate text-[11px] text-slate-400">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex h-20 items-end gap-2">
                {[35, 55, 40, 70, 60, 85, 50].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="absolute -right-6 -bottom-8 flex w-72 items-start gap-3 rounded-xl border border-white/10 bg-navy-800/95 p-4 shadow-2xl">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t('login.previewToast')}</p>
                <p className="truncate text-xs text-slate-400">{t('login.previewToastBody')}</p>
              </div>
              <Avatar name="Marcus Reed" size={24} />
            </div>
          </div>

          <div className="space-y-5 pt-4">
            {[
              { icon: Radio, t: t('login.f1'), d: t('login.f1d') },
              { icon: ScanLine, t: t('login.f2'), d: t('login.f2d') },
              { icon: BarChart3, t: t('login.f3'), d: t('login.f3d') },
            ].map(({ icon: Icon, t: title, d }) => (
              <div key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-slate-400">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
