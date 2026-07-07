import { Stack } from 'expo-router';

import { useTheme } from '@/lib/theme';

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="entry/[date]/index" options={{ title: 'Entry' }} />
      <Stack.Screen name="entry/[date]/edit" options={{ title: 'Edit Entry' }} />
    </Stack>
  );
}
