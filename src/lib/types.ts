export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Other',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type WeightUnit = 'lb' | 'kg';

export interface Profile {
  id: string;
  rest_days_per_week: number;
  preferred_unit: WeightUnit;
}

export interface Exercise {
  id: string;
  owner: string | null;
  name: string;
  muscle_group: MuscleGroup;
  is_custom: boolean;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string; // YYYY-MM-DD
  notes: string | null;
}

export interface EntryExercise {
  id: string;
  entry_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number | null;
  weight_unit: WeightUnit;
  sort_order: number;
  exercise: Exercise;
}

export interface EntryWithExercises extends JournalEntry {
  entry_exercises: EntryExercise[];
}
