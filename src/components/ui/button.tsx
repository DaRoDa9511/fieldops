import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  fullWidth?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  fullWidth = true,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const colors: Record<Variant, { bg: string; bgPressed: string; fg: string; border: string }> = {
    primary: {
      bg: theme.primary,
      bgPressed: theme.primaryPressed,
      fg: theme.onPrimary,
      border: 'transparent',
    },
    secondary: {
      bg: theme.surface,
      bgPressed: theme.surfaceMuted,
      fg: theme.text,
      border: theme.border,
    },
    ghost: { bg: 'transparent', bgPressed: theme.surfaceMuted, fg: theme.primary, border: 'transparent' },
    danger: { bg: theme.danger, bgPressed: theme.danger, fg: '#FFFFFF', border: 'transparent' },
  };
  const c = colors[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          backgroundColor: state.pressed ? c.bgPressed : c.bg,
          borderColor: c.border,
          opacity: isDisabled && !loading ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          transform: [{ scale: state.pressed ? 0.98 : 1 }],
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={18} color={c.fg} /> : null}
          <AppText variant="bodyStrong" style={{ color: c.fg }}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
