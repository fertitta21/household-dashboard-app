-- ============================================================
-- Schema v4: Workout templates + Lindsay's full coaching plan
-- ============================================================

-- Template header (one per person per day of week)
create table if not exists workout_templates (
  id uuid primary key default gen_random_uuid(),
  owner_role user_role not null,
  day_of_week integer not null, -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  focus text,
  notes text,
  created_at timestamptz default now(),
  unique(owner_role, day_of_week)
);

-- Template exercises
create table if not exists workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references workout_templates(id) on delete cascade,
  name text not null,
  exercise_type text not null default 'main', -- 'warmup', 'main', 'stretch', 'fst7', 'cardio', 'core'
  sets integer,
  reps_min integer,
  reps_max integer,
  weight_unit text not null default 'lbs',
  duration_minutes integer,
  rest_seconds integer,
  notes text,
  sort_order integer not null default 0
);

-- ============================================================
-- LINDSAY'S NUTRITION TARGETS (Phase 1: weeks 1-4, 1900 kcal)
-- ============================================================
insert into nutrition_targets (owner_role, calorie_target, protein_target, carbs_target, fat_target)
values ('lindsay', 1900, 170, 165, 60)
on conflict (owner_role) do update set
  calorie_target = 1900,
  protein_target = 170,
  carbs_target   = 165,
  fat_target     = 60,
  updated_at     = now();

-- ============================================================
-- LINDSAY'S CARDIO TASKS
-- ============================================================
-- Clear existing cardio tasks for lindsay to avoid duplicates
delete from tasks where owner_role = 'lindsay' and text ilike '%cardio%' or owner_role = 'lindsay' and text ilike '%walk%' or owner_role = 'lindsay' and text ilike '%hiit%';

insert into tasks (owner_role, text, frequency, type) values
  ('lindsay', 'Incline walk – 30 min (Mon)', 'weekly', 'simple'),
  ('lindsay', 'HIIT cardio – 20s sprint / 100s recovery × 10 rounds (Tue)', 'weekly', 'simple'),
  ('lindsay', 'Recovery walk – 45 min (Wed)', 'weekly', 'simple'),
  ('lindsay', 'Incline walk – 30 min (Thu)', 'weekly', 'simple'),
  ('lindsay', 'Incline walk – 30 min (Fri)', 'weekly', 'simple'),
  ('lindsay', 'Log weekly check-in (weight, photos, measurements)', 'weekly', 'simple');

-- ============================================================
-- LINDSAY'S WORKOUT TEMPLATES
-- ============================================================

-- Monday: Glutes + Hamstrings (Strength)
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('lindsay', 1, 'Glutes + Hamstrings — Strength', 'Primary compounds 6-10 reps. Progressive overload: add 2.5-5 lbs when all target reps achieved. FST-7 finisher: Hip Abductor.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Hip Thrust',             'main',  4, 6,  10, 120, 'Primary compound. Drive through heels, full hip extension at top.',       1),
  ('Romanian Deadlift',      'main',  4, 6,  10, 120, 'Hinge at hips, soft bend in knees. Feel hamstring stretch.',              2),
  ('Bulgarian Split Squat',  'main',  3, 8,  10, 90,  'Rear foot elevated. Front heel stays down. Leans slightly forward.',     3),
  ('Seated Ham Curl',        'main',  3, 10, 15, 60,  'Full range of motion. Pause and squeeze at peak contraction.',           4),
  ('Cable Pull Through',     'main',  3, 12, 15, 60,  'Hip hinge movement. Keep arms straight, drive hips forward.',            5),
  ('Hip Abductor (FST-7)',   'fst7',  7, 10, 15, 35,  'FST-7 finisher: 7 sets × 10-15 reps, 30-45 sec rest. Maximum pump.',   6)
) as ex(name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order);

-- Tuesday: Shoulders + Glute Pump
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('lindsay', 2, 'Shoulders + Glute Pump', 'Focus on lateral and rear delts. Minimize bicep/tricep involvement. FST-7: Cable Lateral Raise. HIIT cardio today.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Dumbbell Lateral Raise',     'main', 4, 12, 15, 60,  'Lead with elbows, slight forward lean. No momentum.',                   1),
  ('Machine Shoulder Press',     'main', 3, 8,  10, 90,  'Controlled eccentric. Do not lock out at top.',                         2),
  ('Cable Y Raise',              'main', 3, 12, 15, 60,  'Arms at Y-angle (30° forward). Targets rear delt + mid trap.',          3),
  ('Rear Delt Fly',              'main', 3, 12, 15, 60,  'Bent over or face down on incline bench. Squeeze at peak.',             4),
  ('Smith Machine Glute Bridge', 'main', 3, 12, 15, 60,  'Bar pad across hips. Full hip extension, 1-sec pause at top.',          5),
  ('Cable Lateral Raise (FST-7)','fst7', 7, 10, 15, 35,  'FST-7 finisher: 7 sets × 10-15 reps, 30-45 sec rest. Max pump.',      6)
) as ex(name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order);

-- Wednesday: Active Recovery
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('lindsay', 3, 'Active Recovery', 'No lifting. 45-min walk + mobility + stretching. Focus on recovery.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Outdoor / Treadmill Walk',  'cardio',  null, null, null, 45, null, '120-140 bpm. Comfortable conversational pace.',                    1),
  ('Hip Flexor Stretch',        'stretch', null, null, null, 2,  null, 'Kneel on one knee, drive hip forward. Hold 60 sec each side.',     2),
  ('Pigeon Pose',               'stretch', null, null, null, 2,  null, 'Hold 60-90 sec per side. Targets glute and hip external rotator.', 3),
  ('Hamstring Stretch',         'stretch', null, null, null, 2,  null, 'Seated or standing. Hold 30-60 sec each side.',                    4),
  ('Thoracic Rotation',         'stretch', null, null, null, 2,  null, 'Mobility drill. 10 reps per side, slow and controlled.',           5),
  ('Foam Roll – Quads / IT Band','stretch', null, null, null, 5,  null, 'Slow passes on tender spots. Pause 20-30 sec on knots.',          6)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- Thursday: Quads + Glutes
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('lindsay', 4, 'Quads + Glutes', 'Quad-dominant movements. FST-7: Leg Extension. 30-min incline walk after session.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Hack Squat',              'main', 4, 6,  10, 120, 'Feet shoulder-width, slight toe flare. Full depth. Control the descent.',    1),
  ('Leg Press',               'main', 4, 8,  12, 90,  'High and wide foot placement to bias glutes. Do not lock knees at top.',     2),
  ('Walking Lunges',          'main', 3, 10, 15, 60,  'Long stride to load glutes. Keep torso upright.',                            3),
  ('Leg Extension',           'main', 3, 12, 15, 60,  'Pause 1 sec at top. Slow 3-sec eccentric.',                                  4),
  ('Cable Kickback',          'main', 3, 12, 15, 60,  'Hip extension only — no knee bend. Squeeze glute at peak.',                  5),
  ('Leg Extension (FST-7)',   'fst7', 7, 10, 15, 35,  'FST-7 finisher: 7 sets × 10-15 reps, 30-45 sec rest. Max pump.',           6)
) as ex(name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order);

-- Friday: Back + Delts
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('lindsay', 5, 'Back + Delts', 'Minimize lat width — use neutral grip. FST-7: Rear Delt Fly. 30-min incline walk after session.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Neutral Grip Pulldown',    'main', 4, 8,  10, 90,  'Neutral/close grip. Pull to upper chest. Limits lat flare.',                1),
  ('Chest Supported Row',      'main', 4, 8,  12, 90,  'Elbows flared to hit upper back. Squeeze rhomboids at peak.',               2),
  ('Single Arm Cable Row',     'main', 3, 10, 15, 60,  'Rotate slightly at top. Full stretch at bottom.',                           3),
  ('Rear Delt Machine',        'main', 3, 12, 15, 60,  'Arms parallel to floor. Pause and squeeze rear delt at peak.',              4),
  ('Lateral Raise',            'main', 3, 12, 15, 60,  'Slight forward lean. Lead with elbows. No shrugging.',                     5),
  ('Rear Delt Fly (FST-7)',    'fst7', 7, 10, 15, 35,  'FST-7 finisher: 7 sets × 10-15 reps, 30-45 sec rest. Max pump.',          6)
) as ex(name, exercise_type, sets, reps_min, reps_max, rest_seconds, notes, sort_order);

-- Saturday: Lower Body Volume
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('lindsay', 6, 'Lower Body Volume', 'Higher rep volume day. Core work included. Optional walk after.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Hip Thrust',          'main',    3, 12, 15, null, 60,   'Volume day — slightly lighter than Monday. Focus on squeeze.',             1),
  ('Goblet Squat',        'main',    3, 12, 15, null, 60,   'Hold DB at chest. Upright torso. Full depth.',                             2),
  ('Reverse Lunge',       'main',    3, 10, 15, null, 60,   'Step back. Front knee tracks over toe. Drive through front heel to stand.',3),
  ('Seated Ham Curl',     'main',    3, 12, 15, null, 60,   'Slow eccentric. Pause at full contraction.',                               4),
  ('Abductor Machine',    'main',    3, 15, 20, null, 45,   'Full range of motion. Slow and controlled.',                               5),
  ('Hanging Knee Raise',  'core',    3, 12, 15, null, 45,   'Control the swing. Tuck pelvis at top.',                                   6),
  ('Cable Crunch',        'core',    3, 15, 20, null, 45,   'Hinge at hips, not neck. Crunch into your lap.',                           7),
  ('Plank',               'core',    3, null,null,1,   60,   'Hold 45-60 sec. Neutral spine. Brace core and glutes.',                    8)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- Sunday: Rest
insert into workout_templates (owner_role, day_of_week, focus, notes)
values ('lindsay', 0, 'Complete Rest', 'No lifting, no cardio. Sleep, hydrate, recover.')
on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes;
