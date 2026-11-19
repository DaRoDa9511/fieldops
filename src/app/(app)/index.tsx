import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { BrandGradient } from '@/components/ui/gradient';
import { EmptyState, ErrorState } from '@/components/ui/state-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { fetchMyWorkOrders, type OrderPriority, type WorkOrder } from '@/features/work-orders/api';
import { OrderCard, OrderCardSkeleton } from '@/features/work-orders/order-card';
import { useQuery } from '@/hooks/use-query';
import { useScheduleLabels } from '@/hooks/use-schedule-labels';
import { useTheme } from '@/hooks/use-theme';
import { formatSchedule, initials, isToday } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useT } from '@/providers/preferences-provider';

type StatusFilter = 'active' | 'in_progress' | 'pending' | 'completed' | 'all';

const STATUS_FILTERS: { key: StatusFilter; match: (o: WorkOrder) => boolean }[] = [
  { key: 'active', match: (o) => o.status === 'pending' || o.status === 'in_progress' },
  { key: 'in_progress', match: (o) => o.status === 'in_progress' },
  { key: 'pending', match: (o) => o.status === 'pending' },
  { key: 'completed', match: (o) => o.status === 'completed' },
  { key: 'all', match: () => true },
];

const PRIORITIES: OrderPriority[] = ['urgent', 'high', 'medium', 'low'];

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? 'greeting.morning' : h < 18 ? 'greeting.afternoon' : 'greeting.evening';
}

export default function MyWorkOrdersScreen() {
  const theme = useTheme();
  const t = useT();
  const labels = useScheduleLabels();
  const { session, profile } = useAuth();
  const userId = session!.user.id; // this route is only mounted while signed in

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | null>(null);

  const orders = useQuery(() => fetchMyWorkOrders(userId), [userId]);
  const { reload } = orders;

  // Refetch when coming back from the detail screen (status may have changed there)…
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  // …and live, when a dispatcher assigns or edits one of my orders in the admin panel.
  useEffect(() => {
    const channel = supabase
      .channel(`my-orders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders', filter: `assigned_to=eq.${userId}` },
        () => reload(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, reload]);

  const all = useMemo(() => orders.data ?? [], [orders.data]);
  const counts = useMemo(
    () => Object.fromEntries(STATUS_FILTERS.map((f) => [f.key, all.filter(f.match).length])),
    [all],
  );
  const visible = useMemo(() => {
    const match = STATUS_FILTERS.find((f) => f.key === statusFilter)!.match;
    return all.filter((o) => match(o) && (!priorityFilter || o.priority === priorityFilter));
  }, [all, statusFilter, priorityFilter]);

  const todayJobs = all.filter((o) => isToday(o.scheduled_for) && o.status !== 'cancelled');
  const doneToday = todayJobs.filter((o) => o.status === 'completed').length;
  const progress = todayJobs.length ? doneToday / todayJobs.length : 0;
  // List is already sorted: in-progress first, then soonest pending.
  const nextUp = all.find((o) => o.status === 'in_progress' || o.status === 'pending');
  const firstName = profile?.full_name?.split(' ')[0];

  const header = (
    <View>
      <BrandGradient style={styles.hero}>
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <AppText variant="caption" style={styles.heroMuted}>
                {t(greetingKey())}
                {firstName ? `, ${firstName}` : ''} 👋
              </AppText>
              <AppText variant="title" style={styles.white}>
                {t('orders.title')}
              </AppText>
            </View>
            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.title')}
              style={styles.avatar}>
              <AppText variant="bodyStrong" style={styles.white}>
                {initials(profile?.full_name)}
              </AppText>
            </Pressable>
          </View>

          {orders.status === 'success' ? (
            <View style={styles.glass}>
              <View style={styles.todayRow}>
                <View style={styles.flex}>
                  <AppText variant="overline" style={styles.heroMuted}>
                    {t('orders.today')}
                  </AppText>
                  <AppText variant="heading" style={styles.white}>
                    {t('orders.todayProgress', { done: doneToday, total: todayJobs.length })}
                  </AppText>
                </View>
                <AppText variant="title" style={styles.white}>
                  {Math.round(progress * 100)}%
                </AppText>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              {nextUp ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/orders/[id]', params: { id: nextUp.id } })}
                  style={({ pressed }) => [styles.nextUp, pressed && { opacity: 0.85 }]}>
                  <View style={styles.nextIcon}>
                    <Ionicons
                      name={nextUp.status === 'in_progress' ? 'play' : 'navigate'}
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="caption" style={styles.heroMuted}>
                      {t('orders.nextUp')} · {formatSchedule(nextUp.scheduled_for, labels)}
                    </AppText>
                    <AppText variant="bodyStrong" numberOfLines={1} style={styles.white}>
                      {nextUp.title}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </Pressable>
              ) : (
                <AppText variant="caption" style={styles.heroMuted}>
                  {t('orders.allDone')}
                </AppText>
              )}
            </View>
          ) : null}
        </SafeAreaView>
      </BrandGradient>

      <View style={[styles.filters, styles.contentWidth]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={t(`orders.filter.${f.key}`)}
              count={orders.data ? counts[f.key] : undefined}
              selected={statusFilter === f.key}
              onPress={() => setStatusFilter(f.key)}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('orders.anyPriority')} selected={priorityFilter === null} onPress={() => setPriorityFilter(null)} />
          {PRIORITIES.map((p) => (
            <Chip
              key={p}
              label={t(`priority.${p}`)}
              selected={priorityFilter === p}
              onPress={() => setPriorityFilter(priorityFilter === p ? null : p)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {orders.status === 'loading' ? (
        <ScrollView>
          {header}
          <View style={[styles.contentWidth, styles.list]}>
            {[0, 1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      ) : orders.status === 'error' ? (
        <ScrollView>
          {header}
          <ErrorState message={orders.error ?? ''} onRetry={orders.retry} />
        </ScrollView>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <View style={styles.contentWidth}>
              <OrderCard order={item} />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            all.length === 0 ? (
              <EmptyState icon="clipboard-outline" title={t('orders.emptyTitle')} message={t('orders.emptyMessage')} />
            ) : (
              <EmptyState
                icon="checkmark-done-outline"
                title={statusFilter === 'active' ? t('orders.caughtUp') : t('orders.nothingHere')}
                message={t('orders.noMatch')}
                actionLabel={t('orders.showAll')}
                onAction={() => {
                  setStatusFilter('all');
                  setPriorityFilter(null);
                }}
              />
            )
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={orders.refreshing}
              onRefresh={orders.refresh}
              tintColor="#FFFFFF"
              colors={[theme.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  white: { color: '#FFFFFF' },
  heroMuted: { color: 'rgba(255,255,255,0.75)' },
  contentWidth: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
  },
  hero: { borderBottomLeftRadius: Radius.xl + 4, borderBottomRightRadius: Radius.xl + 4 },
  heroInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  glass: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  nextUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(7,11,20,0.35)',
  },
  nextIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: Spacing.sm, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  chips: { gap: Spacing.sm, paddingRight: Spacing.lg },
  list: { gap: Spacing.md },
  listContent: { gap: Spacing.md, paddingBottom: Spacing.xxxl },
});
