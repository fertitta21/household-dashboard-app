'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, TaskCompletion, UserRole } from '@/lib/types'

const TODAY = new Date().toISOString().split('T')[0]

const FREQ_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

type TaskWithCompletion = Task & { done: boolean }

export default function DailyTasks({ role, name }: { role: UserRole; name: string }) {
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: taskData } = await supabase.from('tasks').select('*').eq('owner_role', role).order('created_at')
    const ids = (taskData ?? []).map(t => t.id)
    const { data: completions } = ids.length
      ? await supabase.from('task_completions').select('*').in('task_id', ids).eq('date', TODAY)
      : { data: [] }
    const completionMap = new Map((completions ?? []).map((c: TaskCompletion) => [c.task_id, c.done]))
    setTasks((taskData ?? []).map(t => ({ ...t, done: completionMap.get(t.id) ?? false })))
    setLoading(false)
  }, [role])

  useEffect(() => { load() }, [load])

  async function toggleTask(task: TaskWithCompletion) {
    const newDone = !task.done
    // upsert completion record
    await supabase.from('task_completions').upsert({ task_id: task.id, date: TODAY, done: newDone }, { onConflict: 'task_id,date' })
    // update streak on task
    const newStreak = newDone ? task.streak + 1 : Math.max(0, task.streak - 1)
    await supabase.from('tasks').update({ streak: newStreak, last_completed_date: newDone ? TODAY : task.last_completed_date }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone, streak: newStreak } : t))
  }

  async function addTask() {
    if (!newText.trim()) return
    setAdding(true)
    const { data } = await supabase.from('tasks').insert({ owner_role: role, text: newText.trim(), frequency: newFreq, type: 'simple' }).select().single()
    if (data) setTasks(prev => [...prev, { ...data, done: false }])
    setNewText('')
    setShowAdd(false)
    setAdding(false)
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const byFreq = {
    daily: tasks.filter(t => t.frequency === 'daily'),
    weekly: tasks.filter(t => t.frequency === 'weekly'),
    monthly: tasks.filter(t => t.frequency === 'monthly'),
  }
  const done = tasks.filter(t => t.done).length

  if (loading) return <div className="mt-8 text-center text-gray-400 text-sm">Loading…</div>

  return (
    <div className="p-4 space-y-5">
      {/* Summary bar */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-900">
            {done}<span className="text-lg font-normal text-gray-400">/{tasks.length}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{name}'s tasks today</p>
            {done === tasks.length && tasks.length > 0 && <p className="text-xs text-green-600 font-medium mt-0.5">All done! 🎉</p>}
          </div>
        </div>
      )}

      {/* Task sections by frequency */}
      {(['daily', 'weekly', 'monthly'] as const).map(freq => (
        byFreq[freq].length > 0 && (
          <section key={freq}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{FREQ_LABELS[freq]}</h2>
            <div className="space-y-2">
              {byFreq[freq].map(task => (
                <div key={task.id} className={`bg-white rounded-2xl px-4 py-3 border flex items-center gap-3 shadow-sm transition-all ${task.done ? 'border-green-100 opacity-70' : 'border-gray-100'}`}>
                  <button
                    onClick={() => toggleTask(task)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'}`}
                  >
                    {task.done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.text}</span>
                  {task.streak > 1 && <span className="text-xs text-orange-500 font-medium shrink-0">🔥 {task.streak}</span>}
                  <button onClick={() => deleteTask(task.id)} className="text-gray-200 hover:text-red-400 text-xl leading-none shrink-0">×</button>
                </div>
              ))}
            </div>
          </section>
        )
      ))}

      {/* Add task */}
      {showAdd ? (
        <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm space-y-3">
          <input
            autoFocus
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Task description"
            className="w-full text-sm text-gray-900 outline-none placeholder-gray-300"
          />
          <div className="flex items-center gap-2">
            <select value={newFreq} onChange={e => setNewFreq(e.target.value as typeof newFreq)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none text-gray-700">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="flex-1" />
            <button onClick={() => setShowAdd(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
            <button onClick={addTask} disabled={adding || !newText.trim()} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">Add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full bg-white rounded-2xl px-4 py-3 border border-dashed border-gray-200 shadow-sm text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 flex items-center gap-2 transition-colors">
          <span className="text-lg leading-none">+</span> Add task for {name}
        </button>
      )}
    </div>
  )
}
