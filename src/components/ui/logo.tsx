import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** FieldOps wordmark: icon tile + name. */
export function Logo({ size = 56, showName = true }: { size?: number; showName?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: size * 0.3, backgroundColor: theme.primary },
        ]}>
        <Ionicons name="construct" size={size * 0.5} color={theme.onPrimary} />
      </View>
      {showName ? (
        <AppText variant="title" style={{ fontSize: size * 0.5, lineHeight: size * 0.6 }}>
          Field<AppText variant="title" color="primary" style={{ fontSize: size * 0.5, lineHeight: size * 0.6 }}>Ops</AppText>
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tile: { alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg },
});
