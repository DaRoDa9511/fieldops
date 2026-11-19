import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** FieldOps wordmark: icon tile + name. `inverted` = white version for gradient backgrounds. */
export function Logo({ size = 56, showName = true, inverted = false }: { size?: number; showName?: boolean; inverted?: boolean }) {
  const theme = useTheme();
  const tileBg = inverted ? 'rgba(255,255,255,0.16)' : theme.primary;
  const nameColor = inverted ? '#FFFFFF' : theme.text;
  const accent = inverted ? '#9DB8FF' : theme.primary;
  const font = { fontSize: size * 0.5, lineHeight: size * 0.6 };

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: size * 0.3,
            backgroundColor: tileBg,
            borderWidth: inverted ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.25)',
          },
        ]}>
        <Ionicons name="construct" size={size * 0.5} color="#FFFFFF" />
      </View>
      {showName ? (
        <AppText variant="title" style={[font, { color: nameColor }]}>
          Field<AppText variant="title" style={[font, { color: accent }]}>Ops</AppText>
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tile: { alignItems: 'center', justifyContent: 'center' },
});
