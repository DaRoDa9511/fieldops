import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreferences } from '@/providers/preferences-provider';

/** Palette for the active scheme: the user's choice in Profile, or the system setting. */
export function useTheme(): ThemeColors & { scheme: 'light' | 'dark' } {
  const system = useColorScheme();
  const { themeMode } = usePreferences();
  const scheme = themeMode === 'system' ? (system === 'dark' ? 'dark' : 'light') : themeMode;
  return { ...Colors[scheme], scheme };
}
