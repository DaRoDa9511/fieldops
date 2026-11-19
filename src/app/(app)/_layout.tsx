import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Signed-in area: list → detail, with "complete job" and profile as modals. */
export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.primary,
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'My work orders' }} />
      <Stack.Screen name="orders/[id]/index" options={{ title: '', headerBackTitle: 'Orders' }} />
      <Stack.Screen
        name="orders/[id]/complete"
        options={{ presentation: 'modal', title: 'Complete job' }}
      />
      <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Profile' }} />
    </Stack>
  );
}
