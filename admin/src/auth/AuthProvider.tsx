import type { Session } from '@supabase/supabase-js'
import { createContext, use, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import type { Profile } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function loadProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

/**
 * Admin-only auth. A technician account can authenticate against Supabase, but we sign it
 * straight back out — and even if this check were bypassed, RLS (`is_admin()`) would still
 * hide every other technician's data.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      const p = data.session ? await loadProfile(data.session.user.id) : null
      if (!active) return
      if (data.session && p?.role !== 'admin') {
        await supabase.auth.signOut()
      } else {
        setSession(data.session)
        setProfile(p)
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(next)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    // Known errors are returned as i18n keys; the login screen translates them.
    if (error) return error.message === 'Invalid login credentials' ? 'login.wrong' : error.message
    const p = await loadProfile(data.user.id)
    if (p?.role !== 'admin') {
      await supabase.auth.signOut()
      return 'login.notAdmin'
    }
    setSession(data.session)
    setProfile(p)
    return null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(() => ({ session, profile, loading, signIn, signOut }), [session, profile, loading, signIn, signOut])
  return <AuthContext value={value}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
