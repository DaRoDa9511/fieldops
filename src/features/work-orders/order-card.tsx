import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Radius, Spacing, StatusColors } from '@/constants/theme';
import type { WorkOrder } from '@/features/work-orders/api';
import { useTheme } from '@/hooks/use-theme';
import { formatSchedule } from '@/lib/format';

export function OrderCard({ order }: { order: WorkOrder }) {
  const theme = useTheme();
  const accent = StatusColors[order.status].color;
  const done = order.status === 'completed' || order.status === 'cancelled';

  return (
      <Pressable
        onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
        accessibilityRole="button"
        accessibilityLabel={`${order.title}, ${StatusColors[order.status].label}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: theme.border,
            opacity: done ? 0.75 : 1,
          },
        ]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.body}>
          <View style={styles.row}>
            <AppText variant="caption" color="textMuted" style={styles.code}>
              {order.code}
            </AppText>
            <PriorityBadge priority={order.priority} />
          </View>

          <AppText variant="bodyStrong" numberOfLines={2}>
            {order.title}
          </AppText>

          {order.customer ? (
            <View style={styles.meta}>
              <Ionicons name="business-outline" size={15} color={theme.textSecondary} />
              <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.flex}>
                {order.customer.name}
              </AppText>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
              <AppText variant="caption" color="textSecondary">
                {formatSchedule(order.scheduled_for)}
              </AppText>
            </View>
            <StatusBadge status={order.status} />
          </View>
        </View>
      </Pressable>
  );
}

export function OrderCardSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.accent, { backgroundColor: theme.skeleton }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Skeleton width={110} height={12} />
          <Skeleton width={60} height={18} radius={Radius.pill} />
        </View>
        <Skeleton width="85%" height={18} />
        <Skeleton width="55%" height={12} />
        <View style={styles.row}>
          <Skeleton width={120} height={12} />
          <Skeleton width={80} height={18} radius={Radius.pill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: { width: 4 },
  body: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2, flexShrink: 1 },
  code: { fontFamily: undefined, letterSpacing: 0.5 },
  flex: { flex: 1 },
});
