import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Language } from '@/i18n/translations';
import { usePreferences } from '@/providers/preferences-provider';

/** Compact EN | ES pill for screens shown before login (on the brand gradient). */
export function LanguageToggle() {
  const { language, setLanguage } = usePreferences();
  const langs: Language[] = ['en', 'es'];
  return (
    <View style={styles.pill} accessibilityRole="radiogroup" accessibilityLabel="Language">
      {langs.map((l) => {
        const selected = l === language;
        return (
          <Pressable
            key={l}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => setLanguage(l)}
            style={[styles.option, selected && styles.selected]}>
            <AppText variant="caption" style={{ color: selected ? '#0B1220' : '#FFFFFF', fontWeight: '700' }}>
              {l.toUpperCase()}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  option: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  selected: { backgroundColor: '#FFFFFF' },
});
