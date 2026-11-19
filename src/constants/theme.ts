/**
 * FieldOps design tokens.
 * Every screen pulls colors/spacing/typography from here so the app stays visually consistent
 * and dark mode "just works" (components read the palette through `useTheme()`).
 */
import { Platform } from 'react-native';

import type { Enums } from '@/types/database';

const palette = {
  brand50: '#EEF3FF',
  brand100: '#DCE6FF',
  brand400: '#5B8CFF',
  brand500: '#2F6BFF',
  brand600: '#1F55E0',
  navy950: '#070B14',
  navy900: '#0B1220',
  navy800: '#121B2E',
  navy700: '#1C2740',
  navy600: '#2A3654',
  slate50: '#F7F8FB',
  slate100: '#EEF1F6',
  slate200: '#E1E6EF',
  slate400: '#98A2B3',
  slate500: '#667085',
  slate700: '#344054',
  slate900: '#101828',
  white: '#FFFFFF',
};

export const Colors = {
  light: {
    background: palette.slate50,
    surface: palette.white,
    surfaceMuted: palette.slate100,
    border: palette.slate200,
    text: palette.slate900,
    textSecondary: palette.slate500,
    textMuted: palette.slate400,
    primary: palette.brand500,
    primaryPressed: palette.brand600,
    primarySoft: palette.brand50,
    onPrimary: palette.white,
    danger: '#D92D20',
    dangerSoft: '#FEF3F2',
    success: '#079455',
    successSoft: '#ECFDF3',
    warning: '#DC6803',
    warningSoft: '#FFFAEB',
    skeleton: palette.slate200,
  },
  dark: {
    background: palette.navy950,
    surface: palette.navy900,
    surfaceMuted: palette.navy800,
    border: palette.navy700,
    text: '#F2F4F7',
    textSecondary: '#A6B0C3',
    textMuted: '#6B7690',
    primary: palette.brand400,
    primaryPressed: palette.brand500,
    primarySoft: '#16224A',
    onPrimary: palette.white,
    danger: '#F97066',
    dangerSoft: '#3A1414',
    success: '#47CD89',
    successSoft: '#0E2A1C',
    warning: '#FDB022',
    warningSoft: '#33240A',
    skeleton: palette.navy700,
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

/** Semantic colors for work-order status chips (same hue in both modes, alpha backgrounds). */
export const StatusColors: Record<Enums<'order_status'>, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#F79009' },
  in_progress: { label: 'In progress', color: '#2F6BFF' },
  completed: { label: 'Completed', color: '#12B76A' },
  cancelled: { label: 'Cancelled', color: '#98A2B3' },
};

export const PriorityColors: Record<Enums<'order_priority'>, { label: string; color: string }> = {
  low: { label: 'Low', color: '#98A2B3' },
  medium: { label: 'Medium', color: '#2F6BFF' },
  high: { label: 'High', color: '#F79009' },
  urgent: { label: 'Urgent', color: '#F04438' },
};

/** 4-pt spacing scale. */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'System', mono: 'Menlo' },
  web: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  default: { sans: 'sans-serif', mono: 'monospace' },
});

export const Typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.8 },
} as const;

export type TypographyVariant = keyof typeof Typography;

export const MaxContentWidth = 640;
