import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { MuscleAvatar } from '@/components/muscle-avatar';
import { confirmAction, showAlert } from '@/lib/alert';
import { deleteEntry, fetchEntryByDate } from '@/lib/api';
import { formatDisplayDate, formatShortDate } from '@/lib/dates';
import { useTheme } from '@/lib/theme';
import type { EntryWithExercises } from '@/lib/types';

export default function EntryDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { colors } = useTheme();
  const [entry, setEntry] = useState<EntryWithExercises | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchEntryByDate(date)
        .then((result) => active && setEntry(result))
        .catch(() => active && showAlert('Error', 'Could not load this entry.'));
      return () => {
        active = false;
      };
    }, [date])
  );

  function handleDelete() {
    if (!entry) return;
    confirmAction({
      title: 'Delete entry?',
      message: 'This removes the whole day from your journal.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteEntry(entry.id);
          router.back();
        } catch {
          showAlert('Error', 'Could not delete the entry.');
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: formatShortDate(date) }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.date, { color: colors.text }]}>{formatDisplayDate(date)}</Text>

        {entry === undefined && <ActivityIndicator color={colors.primary} style={styles.loader} />}

        {entry === null && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No entry for this day.
            </Text>
            <Button title="Create Entry" onPress={() => router.replace(`/entry/${date}/edit`)} />
          </View>
        )}

        {entry && (
          <>
            <View style={[styles.section, { borderTopColor: colors.separator }]}>
              {entry.entry_exercises.length === 0 ? (
                <Text style={[styles.noExercises, { color: colors.textMuted }]}>
                  No exercises logged.
                </Text>
              ) : (
                entry.entry_exercises.map((item) => (
                  <View key={item.id} style={styles.exerciseRow}>
                    <MuscleAvatar group={item.exercise.muscle_group} />
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, { color: colors.text }]}>
                        {item.exercise.name}
                      </Text>
                      <Text style={[styles.exerciseGroup, { color: colors.textMuted }]}>
                        {item.exercise.muscle_group}
                      </Text>
                    </View>
                    <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                      {item.sets} × {item.reps}
                      {item.weight != null ? ` @ ${item.weight} ${item.weight_unit}` : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {entry.notes ? (
              <View style={[styles.section, { borderTopColor: colors.separator }]}>
                <Text style={[styles.notes, { color: colors.text }]}>
                  <Text style={styles.notesAuthor}>notes </Text>
                  {entry.notes}
                </Text>
              </View>
            ) : null}

            <View style={[styles.actions, { borderTopColor: colors.separator }]}>
              <Button title="Edit Entry" onPress={() => router.push(`/entry/${date}/edit`)} />
              <Button
                title="Delete Entry"
                variant="destructive"
                onPress={handleDelete}
                loading={deleting}
              />
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  date: { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 14 },
  loader: { marginTop: 24 },
  empty: { alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 24 },
  emptyText: { fontSize: 15 },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  noExercises: { paddingVertical: 8 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600' },
  exerciseGroup: { fontSize: 13, marginTop: 1 },
  exerciseStats: { fontSize: 14, fontWeight: '500' },
  notes: { fontSize: 14, lineHeight: 20, paddingVertical: 4 },
  notesAuthor: { fontWeight: '700' },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 6,
  },
});
