# Household dashboard — app spec

## Overview

A shared web app for Jeff, Lindsay, and Gianna to manage daily/weekly/monthly tasks, goals, nutrition, and workouts. Designed especially to support Lindsay's ADHD with visible streaks, completion feedback, and clear progress status, while giving Jeff a task-oriented view of what's getting done across the household.

Target platform: web app (PWA), installable to iPhone home screens, usable by both Jeff and Lindsay from their own phones with shared data.

## Users

- Jeff
- Lindsay
- Gianna
- Shared (household-level items not tied to one person)

Each user should have their own login. All users can see the "Shared" section and, ideally, an overview of everyone's status (exact visibility rules — e.g. can Gianna see Jeff's workout details? — to be decided during build, default to: everyone sees everyone's tasks/goals, but personal notes/details may be private later).

## Core data model

### User
- id, name, role (jeff / lindsay / gianna / shared — shared may just be a special pseudo-user or household-level table)

### Task
- id, owner (user or shared)
- text (description)
- frequency: daily / weekly / monthly
- type: simple / nutrition / workout
- done (boolean, resets based on frequency)
- streak (integer, increments on completion, decrements or resets on miss)
- last_completed_date

Resetting logic: daily tasks reset at midnight (local time); weekly tasks reset on a chosen day (e.g. Sunday); monthly tasks reset on the 1st. Streaks increment when completed within the period, and break (reset to 0) if a period passes without completion.

### Goal
- id, owner (user or shared)
- text (description)
- progress (number)
- target (number)
- unit (optional, e.g. "$")
- period: day / week / month
- status: derived from progress/target ratio — on track (≥100%), in progress (≥50%), behind (<50%); thresholds adjustable per goal

### Nutrition (attached to a nutrition-type task, per user per day)
- calorie_target, calorie_actual
- macros: protein/carbs/fat, each with target and actual (grams)
- Scoring: calories scored first (primary), with tolerance bands (e.g. within 5% = on target, within 10% = close, else off target); macros scored similarly per macro with their own tolerance (e.g. 10%/20%)
- Food log entries: each entry has calories, protein, carbs, fat, and timestamp — daily actuals are the sum of entries for that day

### Workout (attached to a workout-type task, per user per day)
- Plan: list of exercises, each with sets, reps, weight (or duration for time-based exercises like yoga/walking), and a done flag
- Session rating: intensity (1-5), quality (1-5)
- Progress log: list of entries, each with metric name (e.g. "Bench press", "Bodyweight", "Walk distance"), value, unit, and date — used to show trend over time per metric, supporting identity/strength goals

## Key UX behaviors (from prototype)

- Overview tab: shows each person's "X of Y tasks done today" and a combined list of all goals with status badges
- Per-person tabs (Jeff / Lindsay / Gianna / Shared): task list with checkboxes, streak flame icons, and an inline "Nice!" completion animation; goal cards with progress bars and status badges (green/amber/red)
- Nutrition and workout tasks expand inline to show detail panels (calorie/macro scores, workout plan + ratings + progress log)
- Add/delete UI for tasks, goals, exercises, food log entries, and progress log entries

## Phase 1 (MVP) — recommended scope for first real build

1. Auth: simple login for Jeff, Lindsay, Gianna (e.g. via Supabase Auth, email/password or magic link)
2. Database: tasks, goals, nutrition logs, workout plans/logs, progress logs (Postgres via Supabase)
3. Frontend: rebuild the existing prototype UI as a Next.js app, calling Supabase instead of artifact storage
4. Deploy to Vercel (free tier sufficient at this scale)
5. PWA setup: installable to iPhone home screen, basic offline caching
6. Daily/weekly/monthly reset logic via a scheduled job (Supabase Edge Function or Vercel cron)

## Phase 2 — alerts & richer tracking

- On-track/off-track push notifications (web push via service worker)
- Editable nutrition/workout plans with templates (e.g. save a "leg day" or "meal plan" template to reuse)
- Historical views/charts for goals, weight, lifts, etc.

## Phase 3 — integrations

- Apple Health: steps, sleep, calories burned — requires a small native iOS companion (e.g. Shortcuts automation pushing data to the backend, or a thin Swift app using HealthKit), since web apps can't read Apple Health directly
- Whoop API: OAuth integration to pull recovery, sleep, and strain data into the dashboard
- Voice input: likely via the iPhone's built-in dictation in form fields initially (no extra work), with a more advanced "speak to add a task" feature later using a speech-to-text API plus a small NLP step to parse intent (e.g. "laundry needs to be done by Friday" → creates a task)

## Notes for Claude Code build session

- Recommended stack: Next.js + Supabase (Postgres, Auth, Storage) + Vercel hosting — low/no cost at this scale, well-documented, good fit for a PWA
- Bring this spec plus the existing prototype (the in-chat widget code) as a starting reference for the UI/UX patterns already validated
- Decide early: visibility rules between household members, time zone handling for resets, and whether "Shared" tasks need an owner/assignee field for accountability
