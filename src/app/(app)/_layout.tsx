import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/providers/preferences-provider';

/** Signed-in area: list → detail, with "complete job" and profile as modals. */
export default function AppLayout() {
  const theme = useTheme();
  const t = useT();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.primary,
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, title: t('orders.title') }} />
      <Stack.Screen name="orders/[id]/index" options={{ title: '', headerBackTitle: t('detail.back') }} />
      <Stack.Screen name="orders/[id]/complete" options={{ presentation: 'modal', title: t('complete.title') }} />
      <Stack.Screen name="orders/[id]/scan" options={{ presentation: 'modal', title: t('scan.title') }} />
      <Stack.Screen name="profile"options={{ presentation: 'modal', headerShown: false, title: t('profile.title') }} />
    </Stack>
  );
}
