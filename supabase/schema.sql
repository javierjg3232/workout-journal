-- Workout Journal — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

-- ============================================================ tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rest_days_per_week int not null default 2
    check (rest_days_per_week between 0 and 6),
  preferred_unit text not null default 'lb'
    check (preferred_unit in ('lb', 'kg')),
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users (id) on delete cascade, -- null = built-in
  name text not null check (length(trim(name)) > 0),
  muscle_group text not null
    check (muscle_group in ('Chest','Back','Legs','Shoulders','Arms','Core','Cardio','Other')),
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table public.entry_exercises (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  sets int not null check (sets > 0),
  reps int not null check (reps > 0),
  weight numeric check (weight is null or weight >= 0),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  sort_order int not null default 0
);

create index journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);
create index entry_exercises_entry_idx on public.entry_exercises (entry_id);
create index exercises_owner_idx on public.exercises (owner);

-- ============================================================ auto-create profile on signup

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================ row level security

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.journal_entries enable row level security;
alter table public.entry_exercises enable row level security;

create policy "read own profile" on public.profiles
  for select using (id = auth.uid());
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

create policy "read built-in and own exercises" on public.exercises
  for select using (owner is null or owner = auth.uid());
create policy "insert own exercises" on public.exercises
  for insert with check (owner = auth.uid() and is_custom = true);
create policy "update own exercises" on public.exercises
  for update using (owner = auth.uid());
create policy "delete own exercises" on public.exercises
  for delete using (owner = auth.uid());

create policy "manage own entries" on public.journal_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "manage own entry exercises" on public.entry_exercises
  for all using (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.journal_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

-- ============================================================ seed: common exercises

insert into public.exercises (name, muscle_group) values
  -- Chest
  ('Bench Press', 'Chest'),
  ('Incline Dumbbell Press', 'Chest'),
  ('Chest Fly', 'Chest'),
  ('Push-Ups', 'Chest'),
  ('Dips', 'Chest'),
  -- Back
  ('Deadlift', 'Back'),
  ('Pull-Ups', 'Back'),
  ('Barbell Row', 'Back'),
  ('Lat Pulldown', 'Back'),
  ('Seated Cable Row', 'Back'),
  -- Legs
  ('Squat', 'Legs'),
  ('Leg Press', 'Legs'),
  ('Lunges', 'Legs'),
  ('Romanian Deadlift', 'Legs'),
  ('Leg Curl', 'Legs'),
  ('Leg Extension', 'Legs'),
  ('Calf Raises', 'Legs'),
  -- Shoulders
  ('Overhead Press', 'Shoulders'),
  ('Lateral Raises', 'Shoulders'),
  ('Front Raises', 'Shoulders'),
  ('Face Pulls', 'Shoulders'),
  ('Shrugs', 'Shoulders'),
  -- Arms
  ('Bicep Curls', 'Arms'),
  ('Hammer Curls', 'Arms'),
  ('Tricep Pushdown', 'Arms'),
  ('Skull Crushers', 'Arms'),
  -- Core
  ('Plank', 'Core'),
  ('Crunches', 'Core'),
  ('Russian Twists', 'Core'),
  ('Hanging Leg Raises', 'Core'),
  -- Cardio
  ('Running', 'Cardio'),
  ('Cycling', 'Cardio'),
  ('Rowing Machine', 'Cardio'),
  ('Jump Rope', 'Cardio');
