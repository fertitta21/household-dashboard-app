'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type UserRole = 'jeff' | 'lindsay' | 'gianna' | 'shared'

type Task = {
  id: string
  text: string
  frequency: string
  type: string
  done: boolean
  streak: number
}

type Goal = {
  id: string
  text: string
  progress: number
  target: number
  unit: string | null
  period: string
}

function statusBadge(progress: number, target: number) {
  const pct = target > 0 ? progress / target : 0
  if (pct >= 1) return { label: 'On track', cls: 'bg-green-100 text-green-700' }
  if (pct >= 0.5) return { label: 'In progress', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Behind', cls: 'bg-red-100 text-red-700' }
}

export default function PersonTab({ role, name }: { role: UserRole; name: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [role])

  async function load() {
    setLoading(true)
    const [{ data: t }, { data: g }] = await Promise.all([
      supabase.from('tasks').select('*').eq('owner_role', role).order('created_at'),
      supabase.from('goals').select('*').eq('owner_role', role).order('created_at'),
    ])
    setTasks(t ?? [])
    setGoals(g ?? [])
    setLoading(false)
  }

  async function toggleTask(task: Task) {
    setCompleting(task.id)
    const today = new Date().toISOString().split('T')[0]
    const newDone = !task.done
    const newStreak = newDone ? task.streak + 1 : Math.max(0, task.streak - 1)
    await supabase
      .from('tasks')
      .update({ done: newDone, streak: newStreak, last_completed_date: newDone ? today : task.done ? today : null })
      .eq('id', task.id)
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: newDone, streak: newStreak } : t))
    )
    setCompleting(null)
  }

  async function addTask() {
    if (!newTask.trim()) return
    setAddingTask(true)
    const { data } = await supabase
      .from('tasks')
      .insert({ owner_role: role, text: newTask.trim(), frequency: 'daily', type: 'simple' })
      .select()
      .single()
    if (data) setTasks((prev) => [...prev, data])
    setNewTask('')
    setAddingTask(false)
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  if (loading) return <div className="mt-8 text-center text-gray-400 text-sm">Loading…</div>

  const done = tasks.filter((t) => t.done).length

  return (
    <div className="mt-4 space-y-6">
      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="text-3xl font-bold text-gray-900">
            {done}<span className="text-lg font-normal text-gray-400">/{tasks.length}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">tasks done today</p>
            {done === tasks.length && tasks.length > 0 && (
              <p className="text-xs text-green-600 font-medium mt-0.5">All done! 🎉</p>
            )}
          </div>
        </div>
      )}

      {/* Tasks */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tasks</h2>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-2xl px-4 py-3 shadow-sm border flex items-center gap-3 transition-all ${
                task.done ? 'border-green-100 opacity-70' : 'border-gray-100'
              }`}
            >
              <button
                onClick={() => toggleTask(task)}
                disabled={completing === task.id}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                {task.done && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.text}
              </span>
              {task.streak > 0 && (
                <span className="text-xs text-orange-500 font-medium">🔥 {task.streak}</span>
              )}
              <span className="text-xs text-gray-300 capitalize">{task.frequency}</span>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-200 hover:text-red-400 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add task input */}
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-dashed border-gray-200 flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 shrink-0" />
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task…"
              className="flex-1 text-sm text-gray-900 placeholder-gray-300 outline-none bg-transparent"
            />
            {newTask.trim() && (
              <button
                onClick={addTask}
                disabled={addingTask}
                className="text-xs font-medium text-gray-900 hover:text-gray-600"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Goals */}
      {goals.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Goals</h2>
          <div className="space-y-2">
            {goals.map((goal) => {
              const badge = statusBadge(goal.progress, goal.target)
              const pct = Math.min(100, goal.target > 0 ? (goal.progress / goal.target) * 100 : 0)
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{goal.text}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {goal.progress}{goal.unit ? ` ${goal.unit}` : ''} / {goal.target}{goal.unit ? ` ${goal.unit}` : ''} · {goal.period}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
