import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
};

/** Filter chip (single-select groups). */
export function Chip({ label, selected, onPress, count }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <AppText variant="caption" style={{ color: selected ? theme.onPrimary : theme.text, fontWeight: '600' }}>
        {label}
        {count !== undefined ? `  ${count}` : ''}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
