import { Stack } from 'expo-router';

/** Signed-in area. Phase 2 adds the work-order list/detail screens here. */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
