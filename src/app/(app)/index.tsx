import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { confirmAction } from '@/lib/alert';
import { fetchProfile, fetchWorkoutDates } from '@/lib/api';
import { todayKey } from '@/lib/dates';
import { currentStreak, workoutsThisYear } from '@/lib/stats';
import { useTheme } from '@/lib/theme';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [workoutDates, setWorkoutDates] = useState<string[] | null>(null);
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(2);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayKey();

  const load = useCallback(async () => {
    try {
      setError(null);
      const [dates, profile] = await Promise.all([fetchWorkoutDates(), fetchProfile()]);
      setWorkoutDates(dates);
      setRestDaysPerWeek(profile.rest_days_per_week);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your journal.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const dateSet = useMemo(() => new Set(workoutDates ?? []), [workoutDates]);
  const streak = useMemo(
    () => currentStreak(dateSet, restDaysPerWeek, today),
    [dateSet, restDaysPerWeek, today]
  );
  const yearCount = useMemo(() => workoutsThisYear(dateSet, today), [dateSet, today]);

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    for (const date of dateSet) {
      marks[date] = {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: colors.primaryText,
      };
    }
    if (!dateSet.has(today)) {
      marks[today] = { marked: true, dotColor: colors.primary };
    }
    return marks;
  }, [dateSet, today, colors]);

  function handleDayPress(day: DateData) {
    const date = day.dateString;
    if (dateSet.has(date)) {
      router.push(`/entry/${date}`);
      return;
    }
    if (date > today) return;
    const label = date === today ? 'today' : date;
    confirmAction({
      title: 'No entry yet',
      message: `Create a journal entry for ${label}?`,
      confirmText: 'Create',
      onConfirm: () => router.push(`/entry/${date}/edit`),
    });
  }

  if (workoutDates === null && !error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
              <Text style={styles.gear}>⚙️</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.textMuted}
          />
        }
      >
        {error && (
          <Card style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger }}>
            <Text style={{ color: colors.danger }}>{error}</Text>
            <Button title="Retry" variant="secondary" onPress={load} style={styles.retry} />
          </Card>
        )}

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {streak.days} {streak.days === 1 ? 'day' : 'days'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Current streak</Text>
            {streak.atRisk && (
              <Text style={[styles.atRisk, { color: colors.warning }]}>
                Work out today to keep it!
              </Text>
            )}
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{yearCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Workouts in {today.slice(0, 4)}
            </Text>
          </Card>
        </View>

        <Card style={styles.calendarCard}>
          <Calendar
            key={isDark ? 'dark' : 'light'}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            enableSwipeMonths
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.textMuted,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              monthTextColor: colors.text,
              todayTextColor: colors.primary,
              arrowColor: colors.primary,
              textMonthFontWeight: '700',
            }}
          />
        </Card>

        {dateSet.size === 0 && !error && (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No workouts yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Log your first workout and it’ll show up on the calendar above.
            </Text>
          </Card>
        )}

        <Button title="＋ New Entry" onPress={() => router.push(`/entry/${today}/edit`)} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  gear: { fontSize: 20, ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : null) },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  atRisk: { fontSize: 12, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  calendarCard: { padding: 8 },
  emptyCard: { alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyBody: { fontSize: 14, textAlign: 'center' },
  retry: { marginTop: 12 },
});
