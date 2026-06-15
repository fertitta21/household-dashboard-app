-- Run this in Supabase SQL Editor to add calendar, medication, and per-date task tracking

-- Per-date task completion (replaces the simple done boolean on tasks)
create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  date date not null default current_date,
  done boolean not null default true,
  unique(task_id, date)
);

-- Calendar events (personal or shared)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean not null default false,
  owner_role user_role not null,
  is_shared boolean not null default false,
  color text not null default 'blue',
  created_at timestamptz default now()
);

-- Medications and supplements
create type if not exists frequency_type as enum ('daily', 'specific_days', 'every_n_days', 'as_needed');

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  name text not null,
  dosage text,
  unit text,
  frequency frequency_type not null default 'daily',
  frequency_days integer[],     -- [1,3,5] = Mon/Wed/Fri for specific_days
  frequency_interval integer,   -- e.g. 7 = every 7 days
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Medication taken log (one row per med per date)
create table if not exists medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references medications(id) on delete cascade,
  date date not null default current_date,
  taken boolean not null default false,
  taken_at timestamptz,
  notes text,
  unique(medication_id, date)
);
