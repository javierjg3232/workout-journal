import { Ionicons } from '@expo/vector-icons';
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
import { MuscleAvatar } from '@/components/muscle-avatar';
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

  // Reset the form each time the picker opens (state-during-render, not an effect).
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setSearch('');
      setAdding(false);
    }
  }

  useEffect(() => {
    if (!visible) return;
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
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Exercise</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close exercise picker"
          >
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
          ]}
        >
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search or type a new exercise…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setAdding(false);
            }}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {exercises === null ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              search.trim() ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No matches for “{search.trim()}” — add it as a custom exercise below.
                </Text>
              ) : null
            }
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
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <MuscleAvatar group={item.muscle_group} size={36} />
                <Text style={[styles.rowText, { color: colors.text }]}>{item.name}</Text>
                {item.is_custom && (
                  <Text style={[styles.customBadge, { color: colors.textMuted }]}>custom</Text>
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
                              backgroundColor: newGroup === group ? colors.primary : 'transparent',
                              borderColor: newGroup === group ? colors.primary : colors.inputBorder,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: newGroup === group ? colors.primaryText : colors.text,
                              fontSize: 13,
                              fontWeight: newGroup === group ? '600' : '400',
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
                  <Pressable
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
                    style={styles.addAction}
                    hitSlop={8}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.addActionText, { color: colors.primary }]}>
                      {search.trim()
                        ? `Add “${search.trim()}” as custom exercise`
                        : 'Add custom exercise'}
                    </Text>
                  </Pressable>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  loader: { marginTop: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 18,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
  },
  rowText: { flex: 1, fontSize: 15 },
  customBadge: { fontSize: 12 },
  emptyText: { fontSize: 14, marginTop: 20, lineHeight: 20 },
  footer: { marginTop: 20 },
  addAction: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addActionText: { fontSize: 15, fontWeight: '600' },
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
