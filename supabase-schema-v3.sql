-- Run in Supabase SQL Editor — adds workout detail columns and nutrition targets

-- Workout exercise enhancements
alter table workout_exercises add column if not exists exercise_type text not null default 'main'; -- 'warmup', 'main', 'stretch'
alter table workout_exercises add column if not exists rest_seconds integer;
alter table workout_exercises add column if not exists weight_unit text not null default 'lbs';
alter table workout_exercises add column if not exists notes text;

-- Nutrition targets per person (separate from daily logs)
create table if not exists nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null unique,
  calorie_target integer not null default 2000,
  protein_target integer not null default 150,
  carbs_target integer not null default 200,
  fat_target integer not null default 65,
  updated_at timestamptz default now()
);

insert into nutrition_targets (owner_role, calorie_target, protein_target, carbs_target, fat_target) values
  ('jeff', 2500, 180, 250, 80),
  ('lindsay', 1800, 130, 180, 60),
  ('gianna', 2000, 120, 220, 65),
  ('shared', 2000, 150, 200, 65)
on conflict (owner_role) do nothing;

-- workout_logs: add session notes
alter table workout_logs add column if not exists notes text;
