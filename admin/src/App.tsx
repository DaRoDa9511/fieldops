import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router'

import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { Layout } from '@/components/Layout'
import { I18nProvider, useT } from '@/i18n/I18nProvider'
import { EmptyState } from '@/components/ui'
import { Login } from '@/pages/Login'
import { RealtimeProvider } from '@/realtime/RealtimeProvider'

// Pages are code-split: the login screen ships without the charting library.
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const WorkOrders = lazy(() => import('@/pages/WorkOrders').then((m) => ({ default: m.WorkOrders })))
const WorkOrderDetail = lazy(() => import('@/pages/WorkOrderDetail').then((m) => ({ default: m.WorkOrderDetail })))
const Customers = lazy(() => import('@/pages/Customers').then((m) => ({ default: m.Customers })))
const Technicians = lazy(() => import('@/pages/Technicians').then((m) => ({ default: m.Technicians })))

const spinner = (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Loader2 className="size-6 animate-spin text-brand-500" />
  </div>
)

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}

/** Signed-out users only ever see the login; signed-in admins get the realtime-enabled app. */
function Gate() {
  const { session, loading } = useAuth()
  const t = useT()

  if (loading) {
    return spinner
  }
  if (!session) return <Login />

  return (
    <RealtimeProvider>
      <Suspense fallback={spinner}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<WorkOrders />} />
          <Route path="orders/:id" element={<WorkOrderDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="technicians" element={<Technicians />} />
          <Route
            path="*"
            element={
              <EmptyState
                title={t('common.notFound')}
                message={t('common.notFoundMsg')}
                action={
                  <Link to="/" className="text-sm font-medium text-brand-500">
                    {t('common.backToDashboard')}
                  </Link>
                }
              />
            }
          />
        </Route>
      </Routes>
      </Suspense>
    </RealtimeProvider>
  )
}
