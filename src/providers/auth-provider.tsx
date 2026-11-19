import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Profile = Tables<'profiles'>;

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  /** True until the persisted session has been restored from storage. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Maps Supabase auth errors to translation keys (see src/i18n) so the UI can show an
 * actionable message in the user's language. Unknown errors pass through verbatim.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'auth.wrongCredentials';
  if (m.includes('email not confirmed')) return 'auth.unconfirmed';
  if (m.includes('network') || m.includes('fetch')) return 'common.noConnection';
  return message;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    console.warn('[auth] could not load profile', error.message);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1) Restore the persisted session (AsyncStorage) on cold start.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    // 2) Keep state in sync with sign-in / sign-out / token refresh events.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load the profile whenever the signed-in user changes (kept outside onAuthStateChange
  // because awaiting Supabase calls inside that callback can deadlock the auth lock).
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfile(userId).then((p) => {
      if (!cancelled && p) setProfile(p);
    });
    return () => {
      cancelled = true; // ignore a stale response if the user changed meanwhile
    };
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? friendlyAuthError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const p = await fetchProfile(userId);
    if (p) setProfile(p);
  }, [userId]);

  const value = useMemo(
    () => ({ session, profile, isLoading, signIn, signOut, refreshProfile }),
    [session, profile, isLoading, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
