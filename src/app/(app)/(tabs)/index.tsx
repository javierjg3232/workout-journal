import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { Button } from '@/components/button';
import { MuscleAvatar } from '@/components/muscle-avatar';
import { StatRing } from '@/components/stat-ring';
import { fetchEntryByDate, fetchProfile, fetchWorkoutDates } from '@/lib/api';
import { formatDisplayDate, todayKey } from '@/lib/dates';
import { currentStreak, workoutsThisMonth, workoutsThisYear } from '@/lib/stats';
import { useTheme } from '@/lib/theme';
import type { EntryWithExercises } from '@/lib/types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const [workoutDates, setWorkoutDates] = useState<string[] | null>(null);
  const [restDaysPerWeek, setRestDaysPerWeek] = useState(2);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  // undefined = loading, null = no entry for the selected day
  const [selectedEntry, setSelectedEntry] = useState<EntryWithExercises | null | undefined>(
    undefined
  );

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

  const loadEntry = useCallback(async (date: string) => {
    setSelectedEntry(undefined);
    try {
      setSelectedEntry(await fetchEntryByDate(date));
    } catch {
      setSelectedEntry(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      loadEntry(selectedDate);
    }, [load, loadEntry, selectedDate])
  );

  const dateSet = useMemo(() => new Set(workoutDates ?? []), [workoutDates]);
  const streak = useMemo(
    () => currentStreak(dateSet, restDaysPerWeek, today),
    [dateSet, restDaysPerWeek, today]
  );
  const yearCount = useMemo(() => workoutsThisYear(dateSet, today), [dateSet, today]);
  const monthCount = useMemo(() => workoutsThisMonth(dateSet, today), [dateSet, today]);

  const markedDates = useMemo(() => {
    const marks: Record<string, Record<string, unknown>> = {};
    for (const date of dateSet) {
      marks[date] = {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: colors.primaryText,
      };
    }
    // Dot on the selected day: white inside a workout day's blue fill,
    // blue on an empty day.
    const selectedMark = marks[selectedDate] ?? {};
    selectedMark.marked = true;
    selectedMark.dotColor = dateSet.has(selectedDate) ? colors.primaryText : colors.primary;
    marks[selectedDate] = selectedMark;
    return marks;
  }, [dateSet, selectedDate, colors]);

  function handleDayPress(day: DateData) {
    if (day.dateString > today) return;
    setSelectedDate(day.dateString);
  }

  if (workoutDates === null && !error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedIsToday = selectedDate === today;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await Promise.all([load(), loadEntry(selectedDate)]);
            setRefreshing(false);
          }}
          tintColor={colors.textMuted}
        />
      }
    >
      {error && (
        <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
          <Text style={{ color: colors.danger }}>{error}</Text>
          <Button title="Retry" variant="secondary" onPress={load} style={styles.retry} />
        </View>
      )}

      {/* Instagram story-style stat rings */}
      <View style={styles.ringsRow}>
        <StatRing
          value={streak.days}
          label={streak.atRisk ? 'Work out today!' : 'streak'}
          active={streak.days > 0 && !streak.atRisk}
          color={colors.danger}
          labelColor={streak.atRisk ? colors.warning : undefined}
        />
        <StatRing
          value={yearCount}
          label={`in ${today.slice(0, 4)}`}
          active={yearCount > 0}
          color={colors.primary}
        />
        <StatRing
          value={monthCount}
          label="this month"
          active={monthCount > 0}
          color={colors.success}
        />
      </View>

      <View style={[styles.hairline, { backgroundColor: colors.separator }]} />

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
          arrowColor: colors.text,
          textMonthFontWeight: '700',
        }}
      />

      <View style={[styles.hairline, { backgroundColor: colors.separator }]} />

      {/* Selected day's entry preview */}
      <View style={styles.preview}>
        <Text style={[styles.previewDate, { color: colors.text }]}>
          {formatDisplayDate(selectedDate)}
        </Text>

        {selectedEntry === undefined && (
          <ActivityIndicator color={colors.primary} style={styles.previewLoader} />
        )}

        {selectedEntry === null && (
          <View style={styles.noEntry}>
            <Text style={[styles.noEntryText, { color: colors.textSecondary }]}>
              {selectedIsToday ? 'No entry for today.' : 'No entry for this day.'}
            </Text>
            <Pressable
              onPress={() => router.push(`/entry/${selectedDate}/edit`)}
              style={styles.addAction}
              hitSlop={8}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.addActionText, { color: colors.primary }]}>
                {selectedIsToday ? 'Log today’s workout' : 'Add an entry'}
              </Text>
            </Pressable>
          </View>
        )}

        {selectedEntry && (
          <Pressable
            onPress={() => router.push(`/entry/${selectedDate}`)}
            style={({ pressed }) => [styles.entryCard, { opacity: pressed ? 0.7 : 1 }]}
          >
            {selectedEntry.entry_exercises.map((item) => (
              <View key={item.id} style={styles.exerciseRow}>
                <MuscleAvatar group={item.exercise.muscle_group} size={32} />
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                  {item.exercise.name}
                </Text>
                <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                  {item.sets} × {item.reps}
                  {item.weight != null ? ` @ ${item.weight} ${item.weight_unit}` : ''}
                </Text>
              </View>
            ))}
            {selectedEntry.notes ? (
              <Text style={[styles.notes, { color: colors.text }]} numberOfLines={2}>
                <Text style={styles.notesAuthor}>notes </Text>
                {selectedEntry.notes}
              </Text>
            ) : null}
            <View style={styles.viewRow}>
              <Text style={[styles.viewText, { color: colors.primary }]}>View entry</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 32 },
  errorBox: { margin: 16, borderRadius: 8, padding: 12 },
  retry: { marginTop: 12 },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  hairline: { height: StyleSheet.hairlineWidth },
  preview: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  previewDate: { fontSize: 16, fontWeight: '700' },
  previewLoader: { marginTop: 8, alignSelf: 'flex-start' },
  noEntry: { gap: 10 },
  noEntryText: { fontSize: 14 },
  addAction: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addActionText: { fontSize: 15, fontWeight: '600' },
  entryCard: { gap: 8 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseName: { flex: 1, fontSize: 14, fontWeight: '600' },
  exerciseStats: { fontSize: 13, fontWeight: '500' },
  notes: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  notesAuthor: { fontWeight: '700' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  viewText: { fontSize: 13, fontWeight: '600' },
});
