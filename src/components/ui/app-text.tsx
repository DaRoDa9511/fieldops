import { Text, type TextProps } from 'react-native';

import { Fonts, Typography, type ThemeColor, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ThemeColor;
};

/** Text that follows the design system's type scale and the current color scheme. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[{ fontFamily: Fonts.sans, color: theme[color] }, Typography[variant], style]}
      {...rest}
    />
  );
}
