import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { BrandGradient } from '@/components/ui/gradient';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { fetchMyWorkOrders } from '@/features/work-orders/api';
import { useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import type { Language } from '@/i18n/translations';
import { initials, isToday } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { usePreferences, type ThemeMode } from '@/providers/preferences-provider';

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, session, signOut } = useAuth();
  const { t, themeMode, setThemeMode, language, setLanguage } = usePreferences();
  const [signingOut, setSigningOut] = useState(false);
  const [weekAgo] = useState(() => Date.now() - 7 * 86_400_000);

  const userId = session!.user.id;
  const orders = useQuery(() => fetchMyWorkOrders(userId), [userId]);

  const stats = useMemo(() => {
    const list = orders.data ?? [];
    return {
      today: list.filter((o) => isToday(o.scheduled_for) && o.status !== 'cancelled').length,
      pending: list.filter((o) => o.status === 'pending' || o.status === 'in_progress').length,
      done: list.filter((o) => o.completed_at && new Date(o.completed_at).getTime() > weekAgo).length,
    };
  }, [orders.data, weekAgo]);

  const isAdmin = profile?.role === 'admin';

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandGradient style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.heroInner}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.close}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.avatarRing}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <AppText variant="display" style={styles.white}>
                  {initials(profile?.full_name)}
                </AppText>
              </View>
            </View>
            <AppText variant="title" style={styles.white}>
              {profile?.full_name ?? '—'}
            </AppText>
            <View style={styles.roleChip}>
              <Ionicons name={isAdmin ? 'shield-checkmark' : 'construct'} size={13} color="#FFFFFF" />
              <AppText variant="caption" style={[styles.white, { fontWeight: '700' }]}>
                {isAdmin ? t('profile.admin') : t('profile.technician')}
              </AppText>
            </View>
          </SafeAreaView>
        </BrandGradient>

        <View style={styles.content}>
          {/* Stats overlapping the hero */}
          <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {(
              [
                ['today', t('profile.statToday'), stats.today, theme.primary],
                ['pending', t('profile.statPending'), stats.pending, theme.warning],
                ['done', t('profile.statDone'), stats.done, theme.success],
              ] as const
            ).map(([key, label, value, color], i) => (
              <View key={key} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                {orders.status === 'loading' ? (
                  <Skeleton width={28} height={26} />
                ) : (
                  <AppText variant="title" style={{ color }}>
                    {value}
                  </AppText>
                )}
                <AppText variant="caption" color="textSecondary">
                  {label}
                </AppText>
              </View>
            ))}
          </View>

          <Section title={t('profile.preferences')}>
            <SettingBlock icon="contrast-outline" label={t('profile.appearance')}>
              <SegmentedControl<ThemeMode>
                value={themeMode}
                onChange={setThemeMode}
                options={[
                  { value: 'system', label: t('profile.theme.system'), icon: 'phone-portrait-outline' },
                  { value: 'light', label: t('profile.theme.light'), icon: 'sunny-outline' },
                  { value: 'dark', label: t('profile.theme.dark'), icon: 'moon-outline' },
                ]}
              />
            </SettingBlock>
            <Divider />
            <SettingBlock icon="language-outline" label={t('profile.language')}>
              <SegmentedControl<Language>
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                ]}
              />
            </SettingBlock>
          </Section>

          <Section title={t('profile.account')}>
            <Row icon="mail-outline" label={t('profile.email')} value={session?.user.email ?? '—'} />
            <Divider />
            <Row icon="call-outline" label={t('profile.phone')} value={profile?.phone ?? '—'} />
          </Section>

          <Section title={t('profile.about')}>
            <Row icon="information-circle-outline" label={t('profile.version')} value={`FieldOps ${Constants.expoConfig?.version ?? '1.0.0'}`} />
          </Section>

          <Button
            title={t('profile.signOut')}
            variant="secondary"
            icon="log-out-outline"
            loading={signingOut}
            onPress={async () => {
              setSigningOut(true);
              await signOut();
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </AppText>
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

function SettingBlock({
  icon,
  label,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.settingBlock}>
      <View style={styles.rowLabel}>
        <View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={icon} size={17} color={theme.primary} />
        </View>
        <AppText variant="bodyStrong">{label}</AppText>
      </View>
      {children}
    </View>
  );
}

function Row({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: theme.surfaceMuted }]}>
        <Ionicons name={icon} size={17} color={theme.textSecondary} />
      </View>
      <AppText color="textSecondary" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" numberOfLines={1} style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  white: { color: '#FFFFFF' },
  scroll: { paddingBottom: Spacing.xxxl },
  hero: { borderBottomLeftRadius: Radius.xl + 4, borderBottomRightRadius: Radius.xl + 4 },
  heroInner: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl + Spacing.lg,
  },
  close: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  avatarRing: { padding: 4, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: Spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
    marginTop: -Spacing.xxxl,
  },
  stats: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  stat: { flex: 1, alignItems: 'center', gap: Spacing.xxs },
  section: { gap: Spacing.sm },
  sectionTitle: { paddingHorizontal: Spacing.xs },
  sectionCard: { borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: Spacing.lg },
  settingBlock: { gap: Spacing.md, paddingVertical: Spacing.lg },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md + 2 },
  rowIcon: { width: 32, height: 32, borderRadius: Radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  rowValue: { maxWidth: '55%' },
  divider: { height: 1 },
});
