import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/providers/preferences-provider';

type StateViewProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  tone?: 'neutral' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
};

/** Centered illustration + message, used for empty and error states. */
export function StateView({ icon, title, message, tone = 'neutral', actionLabel, onAction }: StateViewProps) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : theme.primary;
  const bg = tone === 'danger' ? theme.dangerSoft : theme.primarySoft;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText color="textSecondary" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" fullWidth={false} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export function EmptyState(props: Omit<StateViewProps, 'tone'>) {
  return <StateView {...props} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <StateView
      icon="cloud-offline-outline"
      tone="danger"
      title={t('common.somethingWrong')}
      message={message}
      actionLabel={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  center: { textAlign: 'center' },
  action: { marginTop: Spacing.md },
});
