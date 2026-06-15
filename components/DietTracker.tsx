'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/lib/types'

type FoodEntry = {
  id: string
  owner_role: string
  date: string
  name: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  logged_at: string
}

type NutritionTarget = {
  calorie_target: number
  protein_target: number
  carbs_target: number
  fat_target: number
}

type Totals = { calories: number; protein: number; carbs: number; fat: number }

function MacroBar({ label, actual, target, color }: { label: string; actual: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (actual / target) * 100 : 0)
  const over = actual > target
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={over ? 'text-red-500 font-medium' : 'text-gray-400'}>
          {actual}g <span className="text-gray-300">/</span> {target}g
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CalorieRing({ actual, target }: { actual: number; target: number }) {
  const pct = Math.min(1, target > 0 ? actual / target : 0)
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const over = actual > target
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={over ? '#f87171' : '#3b82f6'} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${over ? 'text-red-500' : 'text-gray-900'}`}>{actual}</span>
        <span className="text-xs text-gray-400">/ {target} cal</span>
        <span className="text-xs text-gray-400 mt-0.5">{Math.max(0, target - actual)} left</span>
      </div>
    </div>
  )
}

type AddFoodModalProps = {
  role: UserRole
  date: string
  onSave: () => void
  onClose: () => void
  entry?: FoodEntry
}

function AddFoodModal({ role, date, onSave, onClose, entry }: AddFoodModalProps) {
  const [name, setName] = useState(entry?.name ?? '')
  const [calories, setCalories] = useState(entry?.calories.toString() ?? '')
  const [protein, setProtein] = useState(entry?.protein.toString() ?? '')
  const [carbs, setCarbs] = useState(entry?.carbs.toString() ?? '')
  const [fat, setFat] = useState(entry?.fat.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const payload = {
      owner_role: role, date,
      name: name.trim() || null,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
    }
    if (entry) {
      await supabase.from('food_entries').update(payload).eq('id', entry.id)
    } else {
      await supabase.from('food_entries').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  async function remove() {
    if (!entry) return
    await supabase.from('food_entries').delete().eq('id', entry.id)
    onSave()
  }

  const num = (val: string) => val.replace(/[^0-9]/g, '')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{entry ? 'Edit Entry' : 'Log Food'}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>

        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Food name (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Calories', val: calories, set: setCalories, suffix: 'kcal' },
            { label: 'Protein', val: protein, set: setProtein, suffix: 'g' },
            { label: 'Carbs', val: carbs, set: setCarbs, suffix: 'g' },
            { label: 'Fat', val: fat, set: setFat, suffix: 'g' },
          ].map(({ label, val, set, suffix }) => (
            <div key={label}>
              <label className="text-xs text-gray-400 block mb-1">{label}</label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400">
                <input type="number" inputMode="numeric" min="0" value={val} onChange={e => set(num(e.target.value))} className="flex-1 px-3 py-2 text-sm outline-none w-0" />
                <span className="text-xs text-gray-400 pr-2">{suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          {entry && <button onClick={remove} className="px-3 py-2 text-sm text-red-500 font-medium">Delete</button>}
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl text-sm text-gray-600 py-2">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl text-sm font-medium py-2 disabled:opacity-50">
            {saving ? 'Saving…' : 'Log'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DietTracker({ role, name }: { role: UserRole; name: string }) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [targets, setTargets] = useState<NutritionTarget>({ calorie_target: 2000, protein_target: 150, carbs_target: 200, fat_target: 65 })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null)
  const [editingTargets, setEditingTargets] = useState(false)
  const [tempTargets, setTempTargets] = useState(targets)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: entriesData }, { data: targetData }] = await Promise.all([
      supabase.from('food_entries').select('*').eq('owner_role', role).eq('date', date).order('logged_at'),
      supabase.from('nutrition_targets').select('*').eq('owner_role', role).single(),
    ])
    setEntries(entriesData ?? [])
    if (targetData) setTargets(targetData)
    setLoading(false)
  }, [role, date])

  useEffect(() => { load() }, [load])

  const totals: Totals = entries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  async function saveTargets() {
    await supabase.from('nutrition_targets').upsert({ owner_role: role, ...tempTargets }, { onConflict: 'owner_role' })
    setTargets(tempTargets)
    setEditingTargets(false)
  }

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

      {/* Calorie ring */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">{name}'s Calories</h2>
          <button onClick={() => { setTempTargets(targets); setEditingTargets(true) }} className="text-xs text-blue-500 hover:text-blue-700">Edit targets</button>
        </div>
        <CalorieRing actual={totals.calories} target={targets.calorie_target} />
        <div className="mt-4 space-y-3">
          <MacroBar label="Protein" actual={totals.protein} target={targets.protein_target} color="bg-blue-500" />
          <MacroBar label="Carbs" actual={totals.carbs} target={targets.carbs_target} color="bg-yellow-400" />
          <MacroBar label="Fat" actual={totals.fat} target={targets.fat_target} color="bg-orange-400" />
        </div>
      </div>

      {/* Food log */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Food Log</h2>
          <span className="text-xs text-gray-400">{entries.length} {entries.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3" onClick={() => setEditEntry(e)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{e.name || 'Unnamed food'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  P: {e.protein}g · C: {e.carbs}g · F: {e.fat}g
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">{e.calories}</p>
                <p className="text-xs text-gray-400">cal</p>
              </div>
            </div>
          ))}

          <button onClick={() => setShowAdd(true)} className="w-full bg-white rounded-2xl px-4 py-3 border border-dashed border-gray-200 shadow-sm text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 flex items-center gap-2 transition-colors">
            <span className="text-lg leading-none">+</span> Log food
          </button>
        </div>
      </section>

      {/* Summary row */}
      {entries.length > 0 && (
        <div className="bg-gray-50 rounded-2xl px-4 py-3 grid grid-cols-4 text-center text-xs">
          {[['Cal', totals.calories], ['Pro', `${totals.protein}g`], ['Carb', `${totals.carbs}g`], ['Fat', `${totals.fat}g`]].map(([l, v]) => (
            <div key={l as string}><p className="text-gray-400">{l}</p><p className="font-semibold text-gray-800 mt-0.5">{v}</p></div>
          ))}
        </div>
      )}

      {/* Add food modal */}
      {(showAdd || editEntry) && (
        <AddFoodModal
          role={role} date={date}
          entry={editEntry ?? undefined}
          onSave={() => { setShowAdd(false); setEditEntry(null); load() }}
          onClose={() => { setShowAdd(false); setEditEntry(null) }}
        />
      )}

      {/* Edit targets modal */}
      {editingTargets && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setEditingTargets(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900">Daily Targets for {name}</h2>
            {([['Calories', 'calorie_target', 'kcal'], ['Protein', 'protein_target', 'g'], ['Carbs', 'carbs_target', 'g'], ['Fat', 'fat_target', 'g']] as const).map(([label, key, unit]) => (
              <div key={key}>
                <label className="text-xs text-gray-400 block mb-1">{label}</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-400">
                  <input type="number" min="0" value={tempTargets[key]} onChange={e => setTempTargets(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} className="flex-1 px-3 py-2 text-sm outline-none" />
                  <span className="text-xs text-gray-400 pr-3">{unit}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditingTargets(false)} className="flex-1 border border-gray-200 rounded-xl text-sm text-gray-600 py-2">Cancel</button>
              <button onClick={saveTargets} className="flex-1 bg-blue-600 text-white rounded-xl text-sm font-medium py-2">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
