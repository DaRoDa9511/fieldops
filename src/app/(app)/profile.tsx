import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.head}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <AppText variant="title" style={{ color: theme.onPrimary }}>
              {initials}
            </AppText>
          </View>
          <AppText variant="heading">{profile?.full_name ?? '—'}</AppText>
          <AppText color="textSecondary">{session?.user.email}</AppText>
        </View>

        <Card>
          <Row label="Role" value={profile?.role === 'admin' ? 'Administrator' : 'Field technician'} />
          <Row label="Phone" value={profile?.phone ?? '—'} />
        </Card>

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  head: { alignItems: 'center', gap: Spacing.xs },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
