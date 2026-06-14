-- Users (Jeff, Lindsay, Gianna, Shared)
create type user_role as enum ('jeff', 'lindsay', 'gianna', 'shared');

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role user_role not null unique,
  created_at timestamptz default now()
);

insert into users (name, role) values
  ('Jeff', 'jeff'),
  ('Lindsay', 'lindsay'),
  ('Gianna', 'gianna'),
  ('Shared', 'shared');

-- Tasks
create type task_frequency as enum ('daily', 'weekly', 'monthly');
create type task_type as enum ('simple', 'nutrition', 'workout');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  text text not null,
  frequency task_frequency not null,
  type task_type not null default 'simple',
  done boolean not null default false,
  streak integer not null default 0,
  last_completed_date date,
  created_at timestamptz default now()
);

-- Goals
create type goal_period as enum ('day', 'week', 'month');

create table goals (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  text text not null,
  progress numeric not null default 0,
  target numeric not null,
  unit text,
  period goal_period not null,
  created_at timestamptz default now()
);

-- Nutrition logs (one per user per day)
create table nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  date date not null default current_date,
  calorie_target integer,
  calorie_actual integer not null default 0,
  protein_target integer,
  protein_actual integer not null default 0,
  carbs_target integer,
  carbs_actual integer not null default 0,
  fat_target integer,
  fat_actual integer not null default 0,
  unique(owner_role, date)
);

-- Food log entries
create table food_entries (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  date date not null default current_date,
  name text,
  calories integer not null default 0,
  protein integer not null default 0,
  carbs integer not null default 0,
  fat integer not null default 0,
  logged_at timestamptz default now()
);

-- Workout logs (one per user per day)
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  date date not null default current_date,
  intensity integer check (intensity between 1 and 5),
  quality integer check (quality between 1 and 5),
  unique(owner_role, date)
);

-- Exercises in a workout plan
create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid references workout_logs(id) on delete cascade,
  name text not null,
  sets integer,
  reps integer,
  weight numeric,
  duration_minutes integer,
  done boolean not null default false,
  sort_order integer not null default 0
);

-- Progress log (for trends over time)
create table progress_entries (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  metric text not null,
  value numeric not null,
  unit text,
  date date not null default current_date,
  logged_at timestamptz default now()
);
