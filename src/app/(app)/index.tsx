import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

/**
 * Phase 1 home: proves auth + RLS end-to-end (the count only includes orders the
 * signed-in technician is allowed to see). Replaced by the work-order list in Phase 2.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const { profile, session, signOut } = useAuth();
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase
      .from('work_orders')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setOrderCount(count ?? 0));
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Logo size={40} />
        <View style={styles.greeting}>
          <AppText variant="title">Hi{firstName ? `, ${firstName}` : ''} 👋</AppText>
          <AppText color="textSecondary">{session?.user.email}</AppText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconTile, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="clipboard-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="overline" color="textSecondary">
              {profile?.role === 'admin' ? 'ALL WORK ORDERS' : 'ASSIGNED TO YOU'}
            </AppText>
            <AppText variant="display">{orderCount ?? '—'}</AppText>
          </View>
        </View>

        <View style={styles.flex} />
        <Button
          title="Sign out"
          variant="secondary"
          icon="log-out-outline"
          loading={signingOut}
          onPress={async () => {
            setSigningOut(true);
            await signOut();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  greeting: { gap: Spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
