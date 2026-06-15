'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/types'

type ExerciseType = 'warmup' | 'main' | 'stretch' | 'fst7' | 'cardio' | 'core'

type TemplateExercise = {
  id: string
  template_id: string
  name: string
  exercise_type: ExerciseType
  sets: number | null
  reps_min: number | null
  reps_max: number | null
  weight_unit: string
  duration_minutes: number | null
  rest_seconds: number | null
  notes: string | null
  sort_order: number
}

type WorkoutTemplate = {
  id: string
  owner_role: string
  day_of_week: number
  focus: string | null
  notes: string | null
}

type Exercise = {
  id: string
  workout_log_id: string
  name: string
  exercise_type: ExerciseType
  sets: number | null
  reps: number | null
  weight: number | null
  weight_unit: string
  duration_minutes: number | null
  rest_seconds: number | null
  notes: string | null
  done: boolean
  sort_order: number
}

type WorkoutLog = {
  id: string
  owner_role: string
  date: string
  intensity: number | null
  quality: number | null
  notes: string | null
}

const SECTION_LABELS: Record<ExerciseType, { label: string; emoji: string }> = {
  warmup:  { label: 'Warm Up',              emoji: '🔥' },
  main:    { label: 'Main Workout',          emoji: '💪' },
  fst7:    { label: 'FST-7 Finisher',        emoji: '🔆' },
  core:    { label: 'Core',                  emoji: '⚡' },
  cardio:  { label: 'Cardio',               emoji: '🏃' },
  stretch: { label: 'Cool Down / Stretch',   emoji: '🧘' },
}

const SECTION_ORDER: ExerciseType[] = ['warmup', 'main', 'fst7', 'core', 'cardio', 'stretch']

type ExerciseModalProps = {
  logId: string
  exercise?: Exercise
  defaultType?: ExerciseType
  onSave: () => void
  onClose: () => void
}

function ExerciseModal({ logId, exercise, defaultType = 'main', onSave, onClose }: ExerciseModalProps) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [type, setType] = useState<ExerciseType>(exercise?.exercise_type ?? defaultType)
  const [sets, setSets] = useState(exercise?.sets?.toString() ?? '')
  const [reps, setReps] = useState(exercise?.reps?.toString() ?? '')
  const [weight, setWeight] = useState(exercise?.weight?.toString() ?? '')
  const [weightUnit, setWeightUnit] = useState(exercise?.weight_unit ?? 'lbs')
  const [duration, setDuration] = useState(exercise?.duration_minutes?.toString() ?? '')
  const [rest, setRest] = useState(exercise?.rest_seconds?.toString() ?? '')
  const [notes, setNotes] = useState(exercise?.notes ?? '')
  const [saving, setSaving] = useState(false)

  const isTimeBased = type === 'warmup' || type === 'stretch'

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      workout_log_id: logId,
      name: name.trim(),
      exercise_type: type,
      sets: sets ? parseInt(sets) : null,
      reps: reps ? parseInt(reps) : null,
      weight: weight ? parseFloat(weight) : null,
      weight_unit: weightUnit,
      duration_minutes: duration ? parseInt(duration) : null,
      rest_seconds: rest ? parseInt(rest) : null,
      notes: notes || null,
      sort_order: exercise?.sort_order ?? Date.now(),
    }
    if (exercise) {
      await supabase.from('workout_exercises').update(payload).eq('id', exercise.id)
    } else {
      await supabase.from('workout_exercises').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  async function remove() {
    if (!exercise) return
    await supabase.from('workout_exercises').delete().eq('id', exercise.id)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{exercise ? 'Edit Exercise' : 'Add Exercise'}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Exercise name (e.g. Bench Press, Yoga)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />

        {/* Type selector */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Category</label>
          <div className="flex gap-2">
            {(['warmup', 'main', 'stretch'] as ExerciseType[]).map(t => (
              <button key={t} onClick={() => setType(t)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {SECTION_LABELS[t].emoji} {SECTION_LABELS[t].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Sets / Reps / Weight for main exercises */}
        {!isTimeBased && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sets</label>
              <input type="number" min="0" value={sets} onChange={e => setSets(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-center" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Reps</label>
              <input type="number" min="0" value={reps} onChange={e => setReps(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none text-center" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Weight</label>
              <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400">
                <input type="number" min="0" value={weight} onChange={e => setWeight(e.target.value)} className="w-0 flex-1 px-2 py-2 text-sm outline-none text-center" />
                <select value={weightUnit} onChange={e => setWeightUnit(e.target.value)} className="text-xs text-gray-500 pr-1 outline-none bg-transparent">
                  <option>lbs</option>
                  <option>kg</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Duration for warmup/stretch */}
        {isTimeBased && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Duration (minutes)</label>
            <input type="number" min="0" value={duration} onChange={e => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
        )}

        {/* Also allow sets/reps on warmup if wanted */}
        {isTimeBased && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sets (optional)</label>
              <input type="number" min="0" value={sets} onChange={e => setSets(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Reps (optional)</label>
              <input type="number" min="0" value={reps} onChange={e => setReps(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        )}

        {/* Rest between sets */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Rest between sets (seconds)</label>
          <div className="flex gap-2">
            <input type="number" min="0" value={rest} onChange={e => setRest(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="e.g. 90" />
            <div className="flex gap-1">
              {[30, 60, 90, 120].map(s => (
                <button key={s} onClick={() => setRest(s.toString())} className={`px-2 py-1 text-xs rounded-lg transition-colors ${rest === s.toString() ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {s < 60 ? `${s}s` : `${s / 60}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (e.g. keep elbows tucked, incline 30°)" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />

        <div className="flex gap-2 pt-1">
          {exercise && <button onClick={remove} className="px-3 py-2 text-sm text-red-500 font-medium">Delete</button>}
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl text-sm text-gray-600 py-2">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()} className="flex-1 bg-blue-600 text-white rounded-xl text-sm font-medium py-2 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RatingPicker({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${value === n ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function WorkoutTracker({ role, name }: { role: UserRole; name: string }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [addModal, setAddModal] = useState<{ type: ExerciseType } | null>(null)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)
  const [showRating, setShowRating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const dow = new Date(date + 'T12:00:00').getDay()
    const [{ data: logData }, { data: tmpl }] = await Promise.all([
      supabase.from('workout_logs').select('*').eq('owner_role', role).eq('date', date).maybeSingle(),
      supabase.from('workout_templates').select('*').eq('owner_role', role).eq('day_of_week', dow).maybeSingle(),
    ])
    setTemplate(tmpl ?? null)
    if (logData) {
      const { data: exData } = await supabase.from('workout_exercises').select('*').eq('workout_log_id', logData.id).order('sort_order')
      setLog(logData)
      setExercises(exData ?? [])
    } else {
      setLog(null)
      setExercises([])
    }
    setLoading(false)
  }, [role, date])

  async function loadFromTemplate() {
    if (!template) return
    setLoadingTemplate(true)
    // Create the log entry
    const { data: newLog } = await supabase.from('workout_logs').insert({ owner_role: role, date }).select().single()
    setLog(newLog)
    // Load template exercises and insert them
    const { data: tmplExercises } = await supabase
      .from('workout_template_exercises')
      .select('*')
      .eq('template_id', template.id)
      .order('sort_order')
    if (tmplExercises && newLog) {
      const toInsert = tmplExercises.map((te: TemplateExercise) => ({
        workout_log_id: newLog.id,
        name: te.name,
        exercise_type: te.exercise_type,
        sets: te.sets,
        reps: te.reps_min ? Math.round((te.reps_min + (te.reps_max ?? te.reps_min)) / 2) : null,
        weight_unit: te.weight_unit,
        duration_minutes: te.duration_minutes,
        rest_seconds: te.rest_seconds,
        notes: te.notes ? `${te.notes}${te.reps_min && te.reps_max ? ` (${te.reps_min}-${te.reps_max} reps)` : ''}` : (te.reps_min && te.reps_max ? `Target: ${te.reps_min}-${te.reps_max} reps` : null),
        done: false,
        sort_order: te.sort_order,
      }))
      const { data: inserted } = await supabase.from('workout_exercises').insert(toInsert).select()
      setExercises(inserted ?? [])
    }
    setLoadingTemplate(false)
  }

  useEffect(() => { load() }, [load])

  async function ensureLog(): Promise<string> {
    if (log) return log.id
    const { data } = await supabase.from('workout_logs').insert({ owner_role: role, date }).select().single()
    setLog(data)
    return data.id
  }

  async function toggleExercise(ex: Exercise) {
    const newDone = !ex.done
    await supabase.from('workout_exercises').update({ done: newDone }).eq('id', ex.id)
    setExercises(prev => prev.map(e => e.id === ex.id ? { ...e, done: newDone } : e))
  }

  async function saveRating(intensity: number | null, quality: number | null, notes: string) {
    if (!log) return
    await supabase.from('workout_logs').update({ intensity, quality, notes: notes || null }).eq('id', log.id)
    setLog(prev => prev ? { ...prev, intensity, quality, notes } : prev)
  }

  const byType = (type: ExerciseType) => exercises.filter(e => e.exercise_type === type)
  const doneCount = exercises.filter(e => e.done).length
  const sectionsWithContent = SECTION_ORDER.filter(t => byType(t).length > 0)

  if (loading) return <div className="mt-8 text-center text-gray-400 text-sm">Loading…</div>

  return (
    <div className="p-4 space-y-5">
      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split('T')[0]) }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">‹</button>
        <span className="flex-1 text-center text-sm font-medium text-gray-700">
          {date === today ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]) }} disabled={date >= today} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30">›</button>
      </div>

      {/* Progress summary */}
      {exercises.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-900">
            {doneCount}<span className="text-lg font-normal text-gray-400">/{exercises.length}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">{name}'s exercises</p>
            {doneCount === exercises.length && <p className="text-xs text-green-600 font-medium mt-0.5">Workout complete! 🎉</p>}
          </div>
          <button onClick={() => setShowRating(true)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl font-medium transition-colors">
            {log?.intensity ? '⭐ Rated' : 'Rate session'}
          </button>
        </div>
      )}

      {/* Session rating display */}
      {log?.intensity && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex gap-4 text-sm">
          <div className="text-center"><p className="text-xs text-gray-400">Intensity</p><p className="font-bold text-gray-900 mt-0.5">{'⭐'.repeat(log.intensity)}</p></div>
          <div className="text-center"><p className="text-xs text-gray-400">Quality</p><p className="font-bold text-gray-900 mt-0.5">{'⭐'.repeat(log.quality ?? 0)}</p></div>
          {log.notes && <div className="flex-1"><p className="text-xs text-gray-400">Notes</p><p className="text-xs text-gray-600 mt-0.5">{log.notes}</p></div>}
        </div>
      )}

      {/* Exercise sections */}
      {SECTION_ORDER.map(type => (
        <section key={type}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {SECTION_LABELS[type].emoji} {SECTION_LABELS[type].label}
            </h2>
            <button
              onClick={async () => { await ensureLog(); setAddModal({ type }) }}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >+ Add</button>
          </div>

          {byType(type).length === 0 && (
            <button
              onClick={async () => { await ensureLog(); setAddModal({ type }) }}
              className="w-full bg-white rounded-2xl px-4 py-3 border border-dashed border-gray-200 shadow-sm text-sm text-gray-400 hover:text-gray-500 hover:border-gray-300 transition-colors"
            >
              Add {SECTION_LABELS[type].label.toLowerCase()} exercise
            </button>
          )}

          <div className="space-y-2">
            {byType(type).map(ex => (
              <div key={ex.id} className={`bg-white rounded-2xl px-4 py-3 border shadow-sm transition-all ${ex.done ? 'border-green-100 opacity-70' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleExercise(ex)} className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${ex.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'}`}>
                    {ex.done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${ex.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{ex.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {ex.sets && <span className="text-xs text-gray-500">{ex.sets} sets</span>}
                      {ex.reps && <span className="text-xs text-gray-500">{ex.reps} reps</span>}
                      {ex.weight && <span className="text-xs text-gray-500">{ex.weight} {ex.weight_unit}</span>}
                      {ex.duration_minutes && <span className="text-xs text-gray-500">{ex.duration_minutes} min</span>}
                      {ex.rest_seconds && <span className="text-xs text-blue-400">⏱ {ex.rest_seconds}s rest</span>}
                    </div>
                    {ex.notes && <p className="text-xs text-gray-400 italic mt-1">{ex.notes}</p>}
                  </div>
                  <button onClick={() => setEditExercise(ex)} className="text-gray-300 hover:text-gray-500 shrink-0 text-sm">✏️</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Template banner — shown when no workout yet but a template exists */}
      {exercises.length === 0 && !loading && template && template.focus !== 'Complete Rest' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div>
            <p className="text-sm font-semibold text-blue-800">📋 {template.focus}</p>
            {template.notes && <p className="text-xs text-blue-600 mt-1">{template.notes}</p>}
          </div>
          <button
            onClick={loadFromTemplate}
            disabled={loadingTemplate}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loadingTemplate ? 'Loading workout…' : '⚡ Load Today\'s Plan'}
          </button>
        </div>
      )}

      {exercises.length === 0 && !loading && template?.focus === 'Complete Rest' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-1">
          <p className="text-2xl">😴</p>
          <p className="text-sm font-semibold text-gray-700">Rest Day</p>
          <p className="text-xs text-gray-400">No lifting, no cardio. Sleep, hydrate, recover.</p>
        </div>
      )}

      {exercises.length === 0 && !loading && !template && (
        <p className="text-center text-gray-400 text-sm mt-4">No exercises yet. Add a warmup, main set, or stretch above.</p>
      )}

      {/* Exercise modals */}
      {addModal && log && (
        <ExerciseModal
          logId={log.id}
          defaultType={addModal.type}
          onSave={() => { setAddModal(null); load() }}
          onClose={() => setAddModal(null)}
        />
      )}
      {editExercise && log && (
        <ExerciseModal
          logId={log.id}
          exercise={editExercise}
          onSave={() => { setEditExercise(null); load() }}
          onClose={() => setEditExercise(null)}
        />
      )}

      {/* Rating modal */}
      {showRating && (
        <RatingModal
          log={log}
          onSave={async (intensity, quality, notes) => { await saveRating(intensity, quality, notes); setShowRating(false) }}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  )
}

function RatingModal({ log, onSave, onClose }: { log: WorkoutLog | null; onSave: (i: number | null, q: number | null, n: string) => void; onClose: () => void }) {
  const [intensity, setIntensity] = useState<number | null>(log?.intensity ?? null)
  const [quality, setQuality] = useState<number | null>(log?.quality ?? null)
  const [notes, setNotes] = useState(log?.notes ?? '')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-gray-900">Rate This Session</h2>
        <RatingPicker label="Intensity (1 = easy, 5 = max effort)" value={intensity} onChange={setIntensity} />
        <RatingPicker label="Quality (1 = rough, 5 = great)" value={quality} onChange={setQuality} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes (PRs, how you felt, injuries…)" rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl text-sm text-gray-600 py-2">Cancel</button>
          <button onClick={() => onSave(intensity, quality, notes)} className="flex-1 bg-blue-600 text-white rounded-xl text-sm font-medium py-2">Save</button>
        </div>
      </div>
    </div>
  )
}
