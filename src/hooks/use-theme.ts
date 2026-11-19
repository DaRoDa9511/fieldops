import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Returns the palette for the current system color scheme (light / dark). */
export function useTheme(): ThemeColors & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...Colors[scheme], scheme };
}
