-- ============================================================
-- WorkoutApp — Supabase SQL Migration
-- Colle ce script dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- exercises
-- ----------------------------------------------------------------
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  notes text,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- workouts (programmes / séances modèles)
-- ----------------------------------------------------------------
create table if not exists workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- workout_items (exercices d'une séance)
-- ----------------------------------------------------------------
create table if not exists workout_items (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  sets integer not null default 3,
  reps integer not null default 10,
  weight_kg numeric(6,2),
  rest_seconds integer default 90,
  "order" integer default 0
);

-- ----------------------------------------------------------------
-- sessions (séances réalisées)
-- ----------------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workout_id uuid references workouts(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer,
  notes text
);

-- ----------------------------------------------------------------
-- session_sets (séries réalisées)
-- ----------------------------------------------------------------
create table if not exists session_sets (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null,
  reps_done integer,
  weight_kg numeric(6,2),
  rpe integer check (rpe between 1 and 10),
  pr boolean default false,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_items enable row level security;
alter table sessions enable row level security;
alter table session_sets enable row level security;

-- exercises : lecture des défauts + les siennes, écriture des siennes
create policy "exercises_select" on exercises for select
  using (is_default = true or user_id = auth.uid());
create policy "exercises_insert" on exercises for insert
  with check (user_id = auth.uid());
create policy "exercises_update" on exercises for update
  using (user_id = auth.uid());
create policy "exercises_delete" on exercises for delete
  using (user_id = auth.uid());

-- workouts
create policy "workouts_all" on workouts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workout_items (via workout)
create policy "workout_items_all" on workout_items for all
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- sessions
create policy "sessions_all" on sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- session_sets (via session)
create policy "session_sets_all" on session_sets for all
  using (exists (select 1 from sessions s where s.id = session_id and s.user_id = auth.uid()));

-- ----------------------------------------------------------------
-- Exercices par défaut (seed)
-- ----------------------------------------------------------------
insert into exercises (name, muscle_group, is_default) values
  ('Développé couché', 'Pectoraux', true),
  ('Développé incliné', 'Pectoraux', true),
  ('Écarté poulie haute', 'Pectoraux', true),
  ('Tractions', 'Dos', true),
  ('Tirage horizontal', 'Dos', true),
  ('Rowing barre', 'Dos', true),
  ('Développé militaire', 'Épaules', true),
  ('Élévations latérales', 'Épaules', true),
  ('Curl barre', 'Biceps', true),
  ('Curl haltères', 'Biceps', true),
  ('Triceps poulie', 'Triceps', true),
  ('Dips', 'Triceps', true),
  ('Squat barre', 'Jambes', true),
  ('Presse à cuisses', 'Jambes', true),
  ('Fentes', 'Jambes', true),
  ('Leg curl', 'Jambes', true),
  ('Hip thrust', 'Fessiers', true),
  ('Soulevé de terre roumain', 'Fessiers', true),
  ('Planche', 'Abdominaux', true),
  ('Crunchs', 'Abdominaux', true),
  ('Soulevé de terre', 'Full Body', true),
  ('Burpees', 'Cardio', true),
  ('Corde à sauter', 'Cardio', true)
on conflict do nothing;
