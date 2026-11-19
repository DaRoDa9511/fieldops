import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { PreferencesProvider, usePreferences } from '@/providers/preferences-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PreferencesProvider>
  );
}

/**
 * Auth gate: Expo Router's `Stack.Protected` only exposes the routes whose guard is true,
 * so signed-out users can never deep-link into the app and signed-in users skip the login.
 */
function RootNavigator() {
  const { session, isLoading } = useAuth();
  const { ready } = usePreferences();
  const theme = useTheme();
  const booting = isLoading || !ready;

  useEffect(() => {
    if (!booting) SplashScreen.hideAsync();
  }, [booting]);

  // Native splash stays visible while the session and saved preferences are restored,
  // so the user never sees a flash of the wrong theme or the login screen.
  if (booting) return null;

  const navTheme = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navTheme,
        colors: {
          ...navTheme.colors,
          primary: theme.primary,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
        },
      }}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
