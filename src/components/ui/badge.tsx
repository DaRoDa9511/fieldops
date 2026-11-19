import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PriorityColors, Radius, Spacing, StatusColors } from '@/constants/theme';
import type { Enums } from '@/types/database';

/** Small pill with a colored dot; background is the same hue at low alpha so it works in both modes. */
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </AppText>
    </View>
  );
}

export function StatusBadge({ status }: { status: Enums<'order_status'> }) {
  const s = StatusColors[status];
  return <Badge label={s.label} color={s.color} />;
}

export function PriorityBadge({ priority }: { priority: Enums<'order_priority'> }) {
  const p = PriorityColors[priority];
  return <Badge label={p.label} color={p.color} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xxs + 1,
    borderRadius: Radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
