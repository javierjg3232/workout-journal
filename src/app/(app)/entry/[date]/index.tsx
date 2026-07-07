import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
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
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No entry for this day.
            </Text>
            <Button title="Create Entry" onPress={() => router.replace(`/entry/${date}/edit`)} />
          </Card>
        )}

        {entry && (
          <>
            <Card style={styles.exercisesCard}>
              {entry.entry_exercises.length === 0 ? (
                <Text style={{ color: colors.textMuted }}>No exercises logged.</Text>
              ) : (
                entry.entry_exercises.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.exerciseRow,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
                    ]}
                  >
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
            </Card>

            {entry.notes ? (
              <Card>
                <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Notes</Text>
                <Text style={[styles.notes, { color: colors.text }]}>{entry.notes}</Text>
              </Card>
            ) : null}

            <Button title="Edit Entry" onPress={() => router.push(`/entry/${date}/edit`)} />
            <Button
              title="Delete Entry"
              variant="destructive"
              onPress={handleDelete}
              loading={deleting}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  date: { fontSize: 20, fontWeight: '700' },
  loader: { marginTop: 24 },
  emptyCard: { alignItems: 'center', gap: 14 },
  emptyText: { fontSize: 15 },
  exercisesCard: { paddingVertical: 4 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseGroup: { fontSize: 13, marginTop: 2 },
  exerciseStats: { fontSize: 15, fontWeight: '500' },
  notesLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  notes: { fontSize: 15, lineHeight: 22 },
});
