import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ExercisePicker } from '@/components/exercise-picker';
import { showAlert } from '@/lib/alert';
import { fetchEntryByDate, fetchProfile, saveEntry, type EntryItemInput } from '@/lib/api';
import { formatDisplayDate, formatShortDate } from '@/lib/dates';
import { useTheme } from '@/lib/theme';
import type { Exercise, WeightUnit } from '@/lib/types';

interface DraftItem {
  key: string;
  exercise: Exercise;
  sets: string;
  reps: string;
  weight: string;
  unit: WeightUnit;
}

let draftKeyCounter = 0;
function nextKey(): string {
  return `draft-${++draftKeyCounter}`;
}

export default function EntryEditScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [notes, setNotes] = useState('');
  const [defaultUnit, setDefaultUnit] = useState<WeightUnit>('lb');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([fetchEntryByDate(date), fetchProfile()])
      .then(([entry, profile]) => {
        if (!active) return;
        setDefaultUnit(profile.preferred_unit);
        if (entry) {
          setIsExisting(true);
          setNotes(entry.notes ?? '');
          setItems(
            entry.entry_exercises.map((row) => ({
              key: nextKey(),
              exercise: row.exercise,
              sets: String(row.sets),
              reps: String(row.reps),
              weight: row.weight != null ? String(row.weight) : '',
              unit: row.weight_unit,
            }))
          );
        }
        setLoaded(true);
      })
      .catch(() => {
        if (active) {
          showAlert('Error', 'Could not load the entry.');
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [date]);

  function addExercise(exercise: Exercise) {
    setItems((current) => [
      ...current,
      { key: nextKey(), exercise, sets: '3', reps: '10', weight: '', unit: defaultUnit },
    ]);
  }

  function updateItem(key: string, changes: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...changes } : item))
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function moveItem(key: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (items.length === 0 && !notes.trim()) {
      showAlert('Empty entry', 'Add at least one exercise or a note before saving.');
      return;
    }
    const payload: EntryItemInput[] = [];
    for (const item of items) {
      const sets = parseInt(item.sets, 10);
      const reps = parseInt(item.reps, 10);
      if (!Number.isFinite(sets) || sets <= 0 || !Number.isFinite(reps) || reps <= 0) {
        showAlert('Check your numbers', `Enter valid sets and reps for ${item.exercise.name}.`);
        return;
      }
      const weightText = item.weight.trim().replace(',', '.');
      const weight = weightText ? Number(weightText) : null;
      if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
        showAlert('Check your numbers', `Enter a valid weight for ${item.exercise.name}.`);
        return;
      }
      payload.push({
        exercise_id: item.exercise.id,
        sets,
        reps,
        weight,
        weight_unit: item.unit,
      });
    }

    setSaving(true);
    try {
      await saveEntry(date, notes, payload);
      if (isExisting) {
        router.back();
      } else {
        router.replace(`/entry/${date}`);
      }
    } catch {
      showAlert('Error', 'Could not save the entry. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const numberInputStyle = [
    styles.numberInput,
    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
  ];

  return (
    <>
      <Stack.Screen
        options={{ title: `${isExisting ? 'Edit' : 'New'} · ${formatShortDate(date)}` }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.date, { color: colors.text }]}>{formatDisplayDate(date)}</Text>

          {items.map((item, index) => (
            <Card key={item.key} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleWrap}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.exercise.name}</Text>
                  <Text style={[styles.itemGroup, { color: colors.textMuted }]}>
                    {item.exercise.muscle_group}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    onPress={() => moveItem(item.key, -1)}
                    hitSlop={8}
                    disabled={index === 0}
                    style={{ opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>↑</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => moveItem(item.key, 1)}
                    hitSlop={8}
                    disabled={index === items.length - 1}
                    style={{ opacity: index === items.length - 1 ? 0.3 : 1 }}
                  >
                    <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>↓</Text>
                  </Pressable>
                  <Pressable onPress={() => removeItem(item.key)} hitSlop={8}>
                    <Text style={[styles.actionIcon, { color: colors.danger }]}>✕</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldsRow}>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Sets</Text>
                  <TextInput
                    style={numberInputStyle}
                    value={item.sets}
                    onChangeText={(text) => updateItem(item.key, { sets: text })}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Reps</Text>
                  <TextInput
                    style={numberInputStyle}
                    value={item.reps}
                    onChangeText={(text) => updateItem(item.key, { reps: text })}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
                <View style={[styles.field, styles.weightField]}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    Weight (optional)
                  </Text>
                  <View style={styles.weightRow}>
                    <TextInput
                      style={[numberInputStyle, styles.weightInput]}
                      value={item.weight}
                      onChangeText={(text) => updateItem(item.key, { weight: text })}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={colors.textMuted}
                      maxLength={7}
                    />
                    <Pressable
                      onPress={() =>
                        updateItem(item.key, { unit: item.unit === 'lb' ? 'kg' : 'lb' })
                      }
                      style={[styles.unitToggle, { backgroundColor: colors.primarySoft }]}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>{item.unit}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Card>
          ))}

          <Button
            title="＋ Add Exercise"
            variant="secondary"
            onPress={() => setPickerVisible(true)}
          />

          <Card>
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Notes</Text>
            <TextInput
              style={[styles.notesInput, { color: colors.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it go? Energy, PRs, aches…"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </Card>

          <Button title="Save Entry" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={addExercise}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  date: { fontSize: 20, fontWeight: '700' },
  itemCard: { gap: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemTitleWrap: { flex: 1, paddingRight: 8 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemGroup: { fontSize: 13, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  actionIcon: { fontSize: 18, fontWeight: '600' },
  fieldsRow: { flexDirection: 'row', gap: 10 },
  field: { gap: 4 },
  weightField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  numberInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 60,
    textAlign: 'center',
  },
  weightRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  weightInput: { flex: 1, textAlign: 'left' },
  unitToggle: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  notesLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  notesInput: { fontSize: 15, minHeight: 90, lineHeight: 21 },
});
