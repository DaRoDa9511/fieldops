import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = PropsWithChildren<{ title?: string; style?: StyleProp<ViewStyle> }>;

/** Surface container with optional overline title — the building block of detail screens. */
export function Card({ title, style, children }: CardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      {title ? (
        <AppText variant="overline" color="textSecondary">
          {title.toUpperCase()}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, gap: Spacing.md },
});
