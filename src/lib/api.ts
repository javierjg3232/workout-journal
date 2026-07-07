import { supabase } from './supabase';
import type {
  EntryWithExercises,
  Exercise,
  MuscleGroup,
  Profile,
  WeightUnit,
} from './types';

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in');
  return data.user.id;
}

/** Fetch the user's profile, creating a default one if the signup trigger missed it. */
export async function fetchProfile(): Promise<Profile> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, rest_days_per_week, preferred_unit')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;

  const fallback = { id: userId, rest_days_per_week: 2, preferred_unit: 'lb' as WeightUnit };
  const { error: insertError } = await supabase.from('profiles').insert(fallback);
  if (insertError) throw insertError;
  return fallback;
}

export async function updateProfile(
  changes: Partial<Pick<Profile, 'rest_days_per_week' | 'preferred_unit'>>
): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('profiles').update(changes).eq('id', userId);
  if (error) throw error;
}

/** All dates (YYYY-MM-DD) that have a journal entry. */
export async function fetchWorkoutDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date')
    .order('entry_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.entry_date as string);
}

export async function fetchEntryByDate(date: string): Promise<EntryWithExercises | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select(
      'id, user_id, entry_date, notes, entry_exercises(id, entry_id, exercise_id, sets, reps, weight, weight_unit, sort_order, exercise:exercises(id, owner, name, muscle_group, is_custom))'
    )
    .eq('entry_date', date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const entry = data as unknown as EntryWithExercises;
  entry.entry_exercises.sort((a, b) => a.sort_order - b.sort_order);
  return entry;
}

export interface EntryItemInput {
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number | null;
  weight_unit: WeightUnit;
}

/** Create or replace the journal entry for a date (one entry per day). */
export async function saveEntry(
  date: string,
  notes: string,
  items: EntryItemInput[]
): Promise<void> {
  const userId = await currentUserId();
  const { data: entry, error: upsertError } = await supabase
    .from('journal_entries')
    .upsert(
      { user_id: userId, entry_date: date, notes: notes.trim() || null },
      { onConflict: 'user_id,entry_date' }
    )
    .select('id')
    .single();
  if (upsertError) throw upsertError;

  const { error: clearError } = await supabase
    .from('entry_exercises')
    .delete()
    .eq('entry_id', entry.id);
  if (clearError) throw clearError;

  if (items.length > 0) {
    const rows = items.map((item, index) => ({ ...item, entry_id: entry.id, sort_order: index }));
    const { error: insertError } = await supabase.from('entry_exercises').insert(rows);
    if (insertError) throw insertError;
  }
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
  if (error) throw error;
}

/** Built-in exercises plus the user's custom ones, ordered by group then name. */
export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, owner, name, muscle_group, is_custom')
    .order('muscle_group')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Exercise[];
}

export async function createCustomExercise(
  name: string,
  muscleGroup: MuscleGroup
): Promise<Exercise> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('exercises')
    .insert({ owner: userId, name: name.trim(), muscle_group: muscleGroup, is_custom: true })
    .select('id, owner, name, muscle_group, is_custom')
    .single();
  if (error) throw error;
  return data as Exercise;
}
