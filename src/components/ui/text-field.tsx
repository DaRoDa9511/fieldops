import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  error?: string | null;
  /** Renders an eye toggle to show/hide the value (passwords). */
  secureToggle?: boolean;
};

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, icon, error, secureToggle, secureTextEntry, onFocus, onBlur, style, ...rest },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <View style={[styles.field, { backgroundColor: theme.surface, borderColor }]}>
        {icon ? <Ionicons name={icon} size={20} color={focused ? theme.primary : theme.textMuted} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: theme.text, fontFamily: Fonts.sans }, style]}
          {...rest}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    paddingVertical: Spacing.md,
  },
});
