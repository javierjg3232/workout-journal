import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { showAlert } from '@/lib/alert';
import { createCustomExercise, fetchExercises } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '@/lib/types';

interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ visible, onClose, onSelect }: ExercisePickerProps) {
  const { colors } = useTheme();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [newGroup, setNewGroup] = useState<MuscleGroup>('Other');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSearch('');
    setAdding(false);
    fetchExercises()
      .then(setExercises)
      .catch(() => showAlert('Error', 'Could not load the exercise list.'));
  }, [visible]);

  const sections = useMemo(() => {
    if (!exercises) return [];
    const query = search.trim().toLowerCase();
    const filtered = query
      ? exercises.filter((e) => e.name.toLowerCase().includes(query))
      : exercises;
    return MUSCLE_GROUPS.map((group) => ({
      title: group,
      data: filtered.filter((e) => e.muscle_group === group),
    })).filter((section) => section.data.length > 0);
  }, [exercises, search]);

  async function handleAddCustom() {
    const name = search.trim();
    if (!name) {
      showAlert('Name required', 'Type the exercise name in the search box first.');
      return;
    }
    setSaving(true);
    try {
      const exercise = await createCustomExercise(name, newGroup);
      onSelect(exercise);
      onClose();
    } catch {
      showAlert('Error', 'Could not save the custom exercise.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Exercise</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.close, { color: colors.primary }]}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          style={[
            styles.search,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="Search or type a new exercise…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setAdding(false);
          }}
          autoCorrect={false}
        />

        {exercises === null ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: pressed ? colors.primarySoft : colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.rowText, { color: colors.text }]}>{item.name}</Text>
                {item.is_custom && (
                  <Text style={[styles.customBadge, { color: colors.primary }]}>custom</Text>
                )}
              </Pressable>
            )}
            ListFooterComponent={
              <View style={styles.footer}>
                {adding ? (
                  <View style={styles.addForm}>
                    <Text style={[styles.addLabel, { color: colors.textSecondary }]}>
                      Muscle group for “{search.trim()}”:
                    </Text>
                    <View style={styles.chips}>
                      {MUSCLE_GROUPS.map((group) => (
                        <Pressable
                          key={group}
                          onPress={() => setNewGroup(group)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: newGroup === group ? colors.primary : colors.card,
                              borderColor: newGroup === group ? colors.primary : colors.inputBorder,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: newGroup === group ? colors.primaryText : colors.text,
                              fontSize: 13,
                            }}
                          >
                            {group}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Button title="Save custom exercise" onPress={handleAddCustom} loading={saving} />
                  </View>
                ) : (
                  <Button
                    title={
                      search.trim()
                        ? `＋ Add “${search.trim()}” as custom exercise`
                        : '＋ Add custom exercise'
                    }
                    variant="secondary"
                    onPress={() => {
                      if (!search.trim()) {
                        showAlert(
                          'Type a name first',
                          'Enter the exercise name in the search box, then tap add.'
                        );
                        return;
                      }
                      setAdding(true);
                    }}
                  />
                )}
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '700' },
  close: { fontSize: 16, fontWeight: '600' },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  loader: { marginTop: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  rowText: { fontSize: 16 },
  customBadge: { fontSize: 12, fontWeight: '600' },
  footer: { marginTop: 16 },
  addForm: { gap: 12 },
  addLabel: { fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
