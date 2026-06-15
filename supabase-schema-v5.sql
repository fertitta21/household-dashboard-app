-- ============================================================
-- Schema v5: Jeff's 13-Week Strength + Hypertrophy + Fat Loss Plan
-- ============================================================

-- JEFF'S NUTRITION TARGETS (Training day calories — most days)
insert into nutrition_targets (owner_role, calorie_target, protein_target, carbs_target, fat_target)
values ('jeff', 3000, 240, 300, 80)
on conflict (owner_role) do update set
  calorie_target = 3000,
  protein_target = 240,
  carbs_target   = 300,
  fat_target     = 80,
  updated_at     = now();

-- JEFF'S SUPPLEMENT STACK AS MEDICATIONS
insert into medications (owner_role, name, dosage, unit, frequency, frequency_days, notes) values
  ('jeff', 'Creatine Monohydrate', '5',    'g',    'daily',         null,       'Take any time, consistently daily'),
  ('jeff', 'Fish Oil',             '2-3',  'g',    'daily',         null,       '2-3g EPA/DHA. Take with a meal'),
  ('jeff', 'Vitamin D3',           '2000', 'IU',   'daily',         null,       '2000-5000 IU. Take with fat-containing meal'),
  ('jeff', 'Magnesium Glycinate',  '300',  'mg',   'daily',         null,       'Take before bed. Supports sleep and recovery'),
  ('jeff', 'Whey Protein',         null,   null,   'as_needed',     null,       'Use to hit daily 240g protein target'),
  ('jeff', 'Electrolytes',         null,   null,   'specific_days', array[2,4,6], 'Take during/after basketball (Tue, Thu, Sat)'),
  ('jeff', 'Collagen + Vitamin C', '15',   'g',    'specific_days', array[2,4], 'Optional: 15g collagen + 50mg Vit C, 60 min before lower-body training (Tue, Thu)');

-- JEFF'S WEEKLY TASKS
insert into tasks (owner_role, text, frequency, type) values
  ('jeff', 'LISS cardio — 20-30 min incline treadmill (Mon)',   'weekly', 'simple'),
  ('jeff', 'LISS cardio — 30 min incline treadmill (Fri)',      'weekly', 'simple'),
  ('jeff', 'Normatec boots — 60 min after basketball (Tue)',    'weekly', 'simple'),
  ('jeff', 'Normatec boots — 60 min after basketball (Thu)',    'weekly', 'simple'),
  ('jeff', '10,000-12,000 steps today',                         'daily',  'simple'),
  ('jeff', 'Log weekly check-in (weight, measurements, photos)','weekly', 'simple');

-- ============================================================
-- JEFF'S WORKOUT TEMPLATES
-- ============================================================

-- MONDAY: Upper Strength (Chest Priority)
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('jeff', 1, 'Upper Strength — Chest Priority', 'Strength focus: heavy compounds first. FST-7 finisher: Dual Cable Fly. LISS cardio after lifting. Progressive overload: add 5 lbs/DB when all 5×6 reps achieved on flat DB press.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Bike Warm-Up',              'warmup', null, null, null, 5,    null, 'Easy spin, 5 minutes.',                                                         1),
  ('Banded Lateral Walks',      'warmup', 1,    15,   15,   null, 30,   'Activate glutes pre-session.',                                                  2),
  ('Glute Bridges',             'warmup', 1,    15,   15,   null, 30,   'Bodyweight or banded.',                                                         3),
  ('Band Pull-Aparts',          'warmup', 1,    20,   20,   null, 30,   'Warm up rear delts and scapular retractors.',                                   4),
  ('Flat Dumbbell Bench Press', 'main',   5,    5,    6,    null, 120,  'PRIMARY LIFT. Add 5 lbs/DB when all 5 sets hit 6 reps. Full ROM, controlled descent.',5),
  ('Incline Dumbbell Press',    'main',   4,    8,    8,    null, 90,   '30-45° incline. Upper chest emphasis.',                                         6),
  ('Weighted Pull-Ups',         'main',   4,    6,    8,    null, 90,   'Alt: Neutral Grip Pulldown. Full hang at bottom, chin over bar.',               7),
  ('Standing Overhead Press',   'main',   3,    6,    6,    null, 90,   'Strict press. No leg drive.',                                                   8),
  ('Chest Supported Row',       'main',   3,    8,    8,    null, 75,   'Elbows flared. Squeeze upper back at peak.',                                    9),
  ('Incline Dumbbell Curl',     'main',   3,    10,   10,   null, 60,   'Full stretch at bottom. Slow eccentric.',                                      10),
  ('Dual Cable Fly (FST-7)',    'fst7',   7,    10,   12,   null, 35,   'FST-7 FINISHER: 7 sets × 10-12 reps, 30-45 sec rest. Maximum chest contraction and stretch.',11),
  ('Incline Treadmill',         'cardio', null, null, null, 25,   null, '120-135 bpm. 20-30 min. After lifting.',                                       12)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- TUESDAY: Lower Strength + Basketball + Normatec
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('jeff', 2, 'Lower Strength + Basketball', 'Strength-focused lower body. Knee rehab circuit included. Basketball = high-intensity conditioning (no HIIT needed). Normatec boots 60 min after basketball.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Bike Warm-Up',              'warmup', null, null, null, 5,    null, 'Easy spin.',                                                                    1),
  ('Banded Lateral Walks',      'warmup', 1,    15,   15,   null, 30,   '15 each direction.',                                                            2),
  ('Glute Bridges',             'warmup', 1,    15,   15,   null, 30,   'Banded or bodyweight.',                                                         3),
  ('Bird Dogs',                 'warmup', 1,    10,   10,   null, 20,   '10 each side. Core activation.',                                               4),
  ('Dead Bugs',                 'warmup', 1,    10,   10,   null, 20,   '10 each side. Slow and controlled.',                                            5),
  ('Terminal Knee Extensions',  'warmup', 2,    15,   20,   null, 30,   'Banded. Knee activation pre-session.',                                          6),
  ('Spanish Squat Hold',        'warmup', 2,    null, null, null, 45,   'Hold 30 sec. Knee health — VMO activation.',                                   7),
  ('Ankle Mobility',            'warmup', 1,    10,   10,   null, 20,   '10 each side.',                                                                 8),
  ('Trap Bar Deadlift',         'main',   4,    5,    5,    null, 150,  'PRIMARY LIFT. Neutral spine. Drive floor away. Pain-free range.',               9),
  ('Bulgarian Split Squat',     'main',   3,    8,    8,    null, 90,   '8 each leg. Rear foot elevated. Front heel stays down.',                       10),
  ('Leg Press',                 'main',   3,    10,   10,   null, 75,   'Controlled range. Pain-free depth. No locking out.',                           11),
  ('Romanian Deadlift',         'main',   3,    8,    8,    null, 75,   'Hip hinge. Feel hamstring stretch. Soft knee bend.',                           12),
  ('Seated Hamstring Curl',     'main',   4,    10,   10,   null, 60,   'Slow eccentric. Pause at peak contraction.',                                   13),
  ('Standing Calf Raise',       'main',   4,    12,   12,   null, 60,   'Full ROM. Pause at top.',                                                      14),
  ('Tibialis Raise',            'main',   3,    15,   15,   null, 45,   'Toes up, heels on floor. Knee health.',                                        15),
  ('Terminal Knee Extensions',  'core',   3,    20,   20,   null, 30,   'KNEE REHAB. Banded. Full extension and squeeze.',                              16),
  ('Spanish Squat Hold',        'core',   3,    null, null, null, 45,   'KNEE REHAB. Hold 30 sec. VMO and patellar tendon.',                            17),
  ('Single Leg Balance',        'core',   3,    null, null, null, 45,   'KNEE REHAB. Hold 30 sec each leg. Eyes open, then closed.',                   18),
  ('Basketball',                'cardio', null, null, null, 90,  null,  'High-intensity conditioning. Counts as cardio for the day.',                   19),
  ('Normatec Recovery Boots',   'stretch',null, null, null, 60,  null,  'After basketball. Full 60 minutes.',                                           20)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- WEDNESDAY: Back + Biceps Hypertrophy
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('jeff', 3, 'Back + Biceps Hypertrophy', 'Hypertrophy rep ranges. FST-7 finisher: Cable Curl. Optional 15-min easy bike at end.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Bike Warm-Up',              'warmup', null, null, null, 5,    null, 'Easy spin.',                                                                   1),
  ('Banded Lateral Walks',      'warmup', 1,    15,   15,   null, 30,   '15 each direction.',                                                           2),
  ('Band Pull-Aparts',          'warmup', 1,    20,   20,   null, 30,   'Scapular health warm-up.',                                                     3),
  ('Chest Supported T-Bar Row', 'main',   4,    10,   10,   null, 90,   'Chest on pad. Full stretch at bottom. Squeeze at top.',                        4),
  ('Neutral Grip Pulldown',     'main',   4,    10,   10,   null, 75,   'Close neutral grip. Full ROM. Lat focus.',                                     5),
  ('Seated Cable Row',          'main',   3,    12,   12,   null, 75,   'Upright torso. Drive elbows back. Squeeze.',                                   6),
  ('Rear Delt Fly',             'main',   3,    15,   15,   null, 60,   'Bent over or machine. Slow and controlled.',                                   7),
  ('EZ Bar Curl',               'main',   4,    10,   10,   null, 75,   'Strict form. No swinging. Full ROM.',                                          8),
  ('Incline Dumbbell Curl',     'main',   3,    12,   12,   null, 60,   'Incline bench. Arms behind body for full stretch.',                            9),
  ('Hammer Curl',               'main',   3,    12,   12,   null, 60,   'Neutral grip. Brachialis emphasis.',                                          10),
  ('Cable Curl (FST-7)',        'fst7',   7,    10,   12,   null, 35,   'FST-7 FINISHER: 7 × 10-12, 30-45 sec rest. Maximum pump in biceps.',         11),
  ('Easy Bike (Optional)',      'cardio', null, null, null, 15,  null,  'Optional. Easy pace, active recovery.',                                       12)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- THURSDAY: Lower Hypertrophy + Basketball + Normatec
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('jeff', 4, 'Lower Hypertrophy + Basketball', 'Higher volume, hypertrophy rep ranges. FST-7 alternates weekly: Week A = Leg Extension, Week B = Leg Curl. Basketball after. Normatec 60 min post-basketball.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Bike Warm-Up',              'warmup', null, null, null, 5,    null, 'Easy spin.',                                                                   1),
  ('Banded Lateral Walks',      'warmup', 1,    15,   15,   null, 30,   '15 each direction.',                                                           2),
  ('Glute Bridges',             'warmup', 1,    15,   15,   null, 30,   'Activation.',                                                                  3),
  ('Terminal Knee Extensions',  'warmup', 2,    15,   20,   null, 30,   'Banded. Knee activation.',                                                     4),
  ('Spanish Squat Hold',        'warmup', 2,    null, null, null, 35,   'Hold 30 sec. VMO activation.',                                                 5),
  ('Ankle Mobility',            'warmup', 1,    10,   10,   null, 20,   '10 each side.',                                                                6),
  ('Hack Squat',                'main',   4,    10,   10,   null, 90,   'Alt: Pendulum Squat. Pain-free range only. Track knees over toes.',            7),
  ('Walking Lunges',            'main',   3,    12,   12,   null, 75,   '12 each leg. Long stride. Upright torso.',                                     8),
  ('Romanian Deadlift',         'main',   4,    10,   10,   null, 75,   'Hip hinge. Feel the hamstring stretch.',                                       9),
  ('Lying Leg Curl',            'main',   4,    12,   12,   null, 60,   'Full ROM. Slow negative. Squeeze at peak.',                                   10),
  ('Leg Extension',             'main',   3,    15,   15,   null, 60,   'Pain-free range. 1-sec pause at top.',                                        11),
  ('Seated Calf Raise',         'main',   5,    15,   15,   null, 45,   'Full ROM. Slow eccentric.',                                                   12),
  ('FST-7 Leg Extension or Curl','fst7',  7,    10,   12,   null, 35,   'FST-7 FINISHER: Alternates weekly. WEEK A = Leg Extension. WEEK B = Leg Curl. 7 × 10-12, 30-45 sec rest.',13),
  ('Basketball',                'cardio', null, null, null, 90,  null,  'High-intensity conditioning.',                                                14),
  ('Normatec Recovery Boots',   'stretch',null, null, null, 60,  null,  'After basketball. Full 60 minutes.',                                          15)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- FRIDAY: Chest + Arms Specialization
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('jeff', 5, 'Chest + Arms Specialization', 'Two FST-7 finishers: Low-to-High Cable Fly (chest) then Cable Curl (biceps). LISS cardio 30 min after.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Bike Warm-Up',               'warmup', null, null, null, 5,    null, 'Easy spin.',                                                                   1),
  ('Band Pull-Aparts',           'warmup', 1,    20,   20,   null, 30,   'Shoulder warm-up.',                                                            2),
  ('Glute Bridges',              'warmup', 1,    15,   15,   null, 30,   'General activation.',                                                          3),
  ('Incline Barbell Press',      'main',   4,    8,    8,    null, 120,  'Alt: Incline Smith Machine Press. 30-45° incline. Controlled descent.',         4),
  ('Flat Dumbbell Press',        'main',   3,    10,   10,   null, 90,   'Full ROM. Slow eccentric.',                                                    5),
  ('Machine Chest Press',        'main',   3,    12,   12,   null, 75,   'Constant tension. Do not lock out.',                                           6),
  ('Close Grip Bench Press',     'main',   3,    8,    8,    null, 90,   'Elbows tucked. Tricep emphasis.',                                              7),
  ('Rope Pushdown',              'main',   3,    12,   12,   null, 60,   'Split rope at bottom. Squeeze triceps.',                                       8),
  ('Alternating DB Curl',        'main',   3,    12,   12,   null, 60,   'Supinate at top. Full ROM.',                                                   9),
  ('Preacher Curl',              'main',   3,    12,   12,   null, 60,   'Full stretch at bottom. No swinging.',                                        10),
  ('Low-to-High Cable Fly (FST-7)','fst7', 7,    10,   12,   null, 35,   'FST-7 CHEST FINISHER: 7 × 10-12, 30-45 sec rest. Maximum stretch and contraction.',11),
  ('Cable Curl (FST-7)',         'fst7',   7,    10,   12,   null, 35,   'FST-7 BICEPS FINISHER: 7 × 10-12, 30-45 sec rest. Maximum pump.',            12),
  ('Incline Treadmill',          'cardio', null, null, null, 30,  null,  '120-135 bpm. 30 min.',                                                        13)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- SATURDAY: Basketball + Mobility
with t as (
  insert into workout_templates (owner_role, day_of_week, focus, notes)
  values ('jeff', 6, 'Basketball + Mobility Session', 'No lifting. Basketball is the training session. 20-min mobility routine after. Optional Normatec.')
  on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes
  returning id
)
insert into workout_template_exercises (template_id, name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order)
select t.id, ex.name, ex.exercise_type, ex.sets, ex.reps_min, ex.reps_max, ex.duration_minutes, ex.rest_seconds, ex.notes, ex.sort_order
from t, (values
  ('Basketball',                  'cardio',  null, null, null, 90,  null, 'High-intensity conditioning for the week.',                                   1),
  ('Hip Flexor Stretch',          'stretch', null, null, null, 2,   null, 'Kneel on one knee. Drive hip forward. Hold 60 sec each side.',               2),
  ('90/90 Hip Rotations',         'stretch', 1,    10,   10,   null, 30,  '10 reps each side. Hip mobility.',                                            3),
  ('Ankle Dorsiflexion Mobility', 'stretch', 1,    10,   10,   null, 20,  '10 reps each side. Wall or floor drill.',                                     4),
  ('Thoracic Rotations',          'stretch', 1,    10,   10,   null, 20,  '10 each side. Seated or quadruped.',                                          5),
  ('Hamstring Flossing',          'stretch', 1,    10,   10,   null, 20,  '10 each side. Neural flossing.',                                              6),
  ('Glute Stretching',            'stretch', null, null, null, 3,   null, 'Figure-4 or pigeon. 60 sec each side.',                                      7),
  ('Foam Roll — Quads',           'stretch', null, null, null, 5,   null, 'Slow passes. Pause on tight spots.',                                         8),
  ('Normatec Boots (Optional)',   'stretch', null, null, null, 60,  null, 'Optional recovery.',                                                          9)
) as ex(name, exercise_type, sets, reps_min, reps_max, duration_minutes, rest_seconds, notes, sort_order);

-- SUNDAY: Complete Recovery
insert into workout_templates (owner_role, day_of_week, focus, notes)
values ('jeff', 0, 'Complete Recovery', 'No lifting, no structured cardio. Optional: walking, light mobility, stretching. Sleep, hydrate, refuel.')
on conflict (owner_role, day_of_week) do update set focus = excluded.focus, notes = excluded.notes;
