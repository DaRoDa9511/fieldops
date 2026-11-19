import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { EmptyState, ErrorState } from '@/components/ui/state-view';
import { MaxContentWidth, PriorityColors, Radius, Spacing } from '@/constants/theme';
import { fetchMyWorkOrders, type OrderPriority, type WorkOrder } from '@/features/work-orders/api';
import { OrderCard, OrderCardSkeleton } from '@/features/work-orders/order-card';
import { useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { isToday } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type StatusFilter = 'active' | 'pending' | 'in_progress' | 'completed' | 'all';

const STATUS_FILTERS: { key: StatusFilter; label: string; match: (o: WorkOrder) => boolean }[] = [
  { key: 'active', label: 'Active', match: (o) => o.status === 'pending' || o.status === 'in_progress' },
  { key: 'in_progress', label: 'In progress', match: (o) => o.status === 'in_progress' },
  { key: 'pending', label: 'Pending', match: (o) => o.status === 'pending' },
  { key: 'completed', label: 'Completed', match: (o) => o.status === 'completed' },
  { key: 'all', label: 'All', match: () => true },
];

const PRIORITIES: OrderPriority[] = ['urgent', 'high', 'medium', 'low'];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function MyWorkOrdersScreen() {
  const theme = useTheme();
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
  const firstName = profile?.full_name?.split(' ')[0];

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <AppText variant="caption" color="textSecondary">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </AppText>
          <AppText variant="title">My work orders</AppText>
        </View>
        <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
            <AppText variant="bodyStrong" color="primary">
              {(profile?.full_name ?? '?')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </AppText>
          </Pressable>
      </View>

      {orders.status === 'success' ? (
        <View style={[styles.today, { backgroundColor: theme.primary }]}>
          <View style={styles.flex}>
            <AppText variant="overline" style={{ color: theme.onPrimary, opacity: 0.8 }}>
              TODAY
            </AppText>
            <AppText variant="heading" style={{ color: theme.onPrimary }}>
              {doneToday} of {todayJobs.length} jobs done
            </AppText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.onPrimary,
                  width: `${todayJobs.length ? (doneToday / todayJobs.length) * 100 : 0}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            count={orders.data ? counts[f.key] : undefined}
            selected={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Any priority" selected={priorityFilter === null} onPress={() => setPriorityFilter(null)} />
        {PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={PriorityColors[p].label}
            selected={priorityFilter === p}
            onPress={() => setPriorityFilter(priorityFilter === p ? null : p)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      {orders.status === 'loading' ? (
        <View style={styles.content}>
          {header}
          <View style={styles.list}>
            {[0, 1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </View>
        </View>
      ) : orders.status === 'error' ? (
        <View style={styles.content}>
          {header}
          <ErrorState message={orders.error ?? ''} onRetry={orders.retry} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            all.length === 0 ? (
              <EmptyState
                icon="clipboard-outline"
                title="No work orders yet"
                message="When your dispatcher assigns you a job it will show up here instantly."
              />
            ) : (
              <EmptyState
                icon="checkmark-done-outline"
                title={statusFilter === 'active' ? 'All caught up!' : 'Nothing here'}
                message="No orders match these filters."
                actionLabel="Show all orders"
                onAction={() => {
                  setStatusFilter('all');
                  setPriorityFilter(null);
                }}
              />
            )
          }
          contentContainerStyle={[styles.content, styles.list]}
          refreshControl={
            <RefreshControl
              refreshing={orders.refreshing}
              onRefresh={orders.refresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  list: { gap: Spacing.md },
  header: { gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  chips: { gap: Spacing.sm, paddingRight: Spacing.lg },
});
