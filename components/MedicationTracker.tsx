'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Medication, MedicationLog, UserRole, FrequencyType } from '@/lib/types'

const TODAY = new Date().toISOString().split('T')[0]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isDueToday(med: Medication): boolean {
  if (med.frequency === 'as_needed') return false
  if (med.frequency === 'daily') return true
  if (med.frequency === 'specific_days') {
    const todayDow = new Date().getDay()
    return (med.frequency_days ?? []).includes(todayDow)
  }
  if (med.frequency === 'every_n_days' && med.frequency_interval) {
    // Show as due today (simplified — real implementation would track start date)
    return true
  }
  return false
}

function freqLabel(med: Medication): string {
  if (med.frequency === 'daily') return 'Daily'
  if (med.frequency === 'as_needed') return 'As needed'
  if (med.frequency === 'specific_days') {
    const days = (med.frequency_days ?? []).map(d => DAY_NAMES[d]).join(', ')
    return `${days}`
  }
  if (med.frequency === 'every_n_days') return `Every ${med.frequency_interval} days`
  return ''
}

type MedWithLog = Medication & { log?: MedicationLog }

type MedModalProps = {
  med?: Medication
  role: UserRole
  onSave: () => void
  onClose: () => void
}

function MedModal({ med, role, onSave, onClose }: MedModalProps) {
  const [name, setName] = useState(med?.name ?? '')
  const [dosage, setDosage] = useState(med?.dosage ?? '')
  const [unit, setUnit] = useState(med?.unit ?? '')
  const [freq, setFreq] = useState<FrequencyType>(med?.frequency ?? 'daily')
  const [freqDays, setFreqDays] = useState<number[]>(med?.frequency_days ?? [])
  const [interval, setInterval] = useState(med?.frequency_interval?.toString() ?? '7')
  const [notes, setNotes] = useState(med?.notes ?? '')
  const [saving, setSaving] = useState(false)

  function toggleDay(day: number) {
    setFreqDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort())
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      owner_role: role,
      name: name.trim(),
      dosage: dosage || null,
      unit: unit || null,
      frequency: freq,
      frequency_days: freq === 'specific_days' ? freqDays : null,
      frequency_interval: freq === 'every_n_days' ? parseInt(interval) : null,
      notes: notes || null,
    }
    if (med) {
      await supabase.from('medications').update(payload).eq('id', med.id)
    } else {
      await supabase.from('medications').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  async function remove() {
    if (!med) return
    await supabase.from('medications').delete().eq('id', med.id)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{med ? 'Edit' : 'Add Medication / Supplement'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Vitamin D, Ozempic)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Dosage</label>
            <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          <div className="w-28">
            <label className="text-xs text-gray-400 block mb-1">Unit</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="mg, mcg, mL" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Frequency</label>
          <select value={freq} onChange={e => setFreq(e.target.value as FrequencyType)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
            <option value="daily">Every day</option>
            <option value="specific_days">Specific days of the week</option>
            <option value="every_n_days">Every N days (injections, etc.)</option>
            <option value="as_needed">As needed</option>
          </select>
        </div>

        {freq === 'specific_days' && (
          <div>
            <label className="text-xs text-gray-400 block mb-2">Days</label>
            <div className="flex gap-1 flex-wrap">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${freqDays.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {freq === 'every_n_days' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Every how many days?</label>
            <input type="number" min="1" value={interval} onChange={e => setInterval(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
        )}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional — instructions, reason, etc.)" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none" />

        <div className="flex gap-2 pt-1">
          {med && <button onClick={remove} className="px-4 py-2 text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>}
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MedicationTracker({ role, name }: { role: UserRole; name: string }) {
  const [meds, setMeds] = useState<MedWithLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editMed, setEditMed] = useState<Medication | null | undefined>(undefined)
  const [logging, setLogging] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: medData } = await supabase.from('medications').select('*').eq('owner_role', role).eq('active', true).order('created_at')
    const ids = (medData ?? []).map(m => m.id)
    const { data: logs } = ids.length
      ? await supabase.from('medication_logs').select('*').in('medication_id', ids).eq('date', TODAY)
      : { data: [] }
    const logMap = new Map((logs ?? []).map((l: MedicationLog) => [l.medication_id, l]))
    setMeds((medData ?? []).map(m => ({ ...m, log: logMap.get(m.id) })))
    setLoading(false)
  }, [role])

  useEffect(() => { load() }, [load])

  async function toggleTaken(med: MedWithLog) {
    setLogging(med.id)
    const newTaken = !med.log?.taken
    await supabase.from('medication_logs').upsert(
      { medication_id: med.id, date: TODAY, taken: newTaken, taken_at: newTaken ? new Date().toISOString() : null },
      { onConflict: 'medication_id,date' }
    )
    setMeds(prev => prev.map(m => m.id === med.id ? { ...m, log: { ...(m.log ?? { id: '', medication_id: m.id, date: TODAY, notes: null }), taken: newTaken, taken_at: newTaken ? new Date().toISOString() : null } } : m))
    setLogging(null)
  }

  const dueToday = meds.filter(isDueToday)
  const asNeeded = meds.filter(m => m.frequency === 'as_needed')
  const takenCount = dueToday.filter(m => m.log?.taken).length

  if (loading) return <div className="mt-8 text-center text-gray-400 text-sm">Loading…</div>

  return (
    <div className="p-4 space-y-5">
      {/* Summary */}
      {dueToday.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-900">
            {takenCount}<span className="text-lg font-normal text-gray-400">/{dueToday.length}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{name}'s meds today</p>
            {takenCount === dueToday.length && dueToday.length > 0 && <p className="text-xs text-green-600 font-medium mt-0.5">All taken! 💊</p>}
          </div>
        </div>
      )}

      {/* Due today */}
      {dueToday.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Due Today</h2>
          <div className="space-y-2">
            {dueToday.map(med => (
              <div key={med.id} className={`bg-white rounded-2xl px-4 py-3 border flex items-center gap-3 shadow-sm ${med.log?.taken ? 'border-green-100 opacity-70' : 'border-gray-100'}`}>
                <button
                  onClick={() => toggleTaken(med)}
                  disabled={logging === med.id}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-sm transition-colors ${med.log?.taken ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  {med.log?.taken ? '✓' : '💊'}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-medium ${med.log?.taken ? 'line-through text-gray-400' : 'text-gray-900'}`}>{med.name}</span>
                    {(med.dosage || med.unit) && (
                      <span className="text-xs text-gray-400">{med.dosage}{med.unit ? ` ${med.unit}` : ''}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{freqLabel(med)}</span>
                    {med.log?.taken_at && <span className="text-xs text-green-500">Taken at {new Date(med.log.taken_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>}
                  </div>
                  {med.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{med.notes}</p>}
                </div>
                <button onClick={() => setEditMed(med)} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✏️</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* As needed */}
      {asNeeded.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">As Needed</h2>
          <div className="space-y-2">
            {asNeeded.map(med => (
              <div key={med.id} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 flex items-center gap-3 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm shrink-0">💊</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900">{med.name}</span>
                    {(med.dosage || med.unit) && <span className="text-xs text-gray-400">{med.dosage}{med.unit ? ` ${med.unit}` : ''}</span>}
                  </div>
                  {med.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{med.notes}</p>}
                </div>
                <button onClick={() => setEditMed(med)} className="text-gray-300 hover:text-gray-500 text-sm shrink-0">✏️</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {meds.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-8">No medications added yet.</p>
      )}

      {/* Add button */}
      <button
        onClick={() => setEditMed(null)}
        className="w-full bg-white rounded-2xl px-4 py-3 border border-dashed border-gray-200 shadow-sm text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 flex items-center gap-2 transition-colors"
      >
        <span className="text-lg leading-none">+</span> Add medication or supplement
      </button>

      {/* Modal */}
      {editMed !== undefined && (
        <MedModal
          med={editMed ?? undefined}
          role={role}
          onSave={() => { setEditMed(undefined); load() }}
          onClose={() => setEditMed(undefined)}
        />
      )}
    </div>
  )
}
