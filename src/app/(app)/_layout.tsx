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
      <Stack.Screen name="index" options={{ title: 'Workout Journal' }} />
      <Stack.Screen name="entry/[date]/index" options={{ title: 'Entry' }} />
      <Stack.Screen name="entry/[date]/edit" options={{ title: 'Edit Entry' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
