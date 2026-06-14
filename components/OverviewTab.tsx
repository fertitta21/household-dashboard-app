'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PersonSummary = {
  role: string
  name: string
  done: number
  total: number
}

type Goal = {
  id: string
  owner_role: string
  text: string
  progress: number
  target: number
  unit: string | null
  period: string
}

const PEOPLE = [
  { role: 'jeff', name: 'Jeff' },
  { role: 'lindsay', name: 'Lindsay' },
  { role: 'gianna', name: 'Gianna' },
  { role: 'shared', name: 'Shared' },
]

function statusBadge(progress: number, target: number) {
  const pct = target > 0 ? progress / target : 0
  if (pct >= 1) return { label: 'On track', cls: 'bg-green-100 text-green-700' }
  if (pct >= 0.5) return { label: 'In progress', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Behind', cls: 'bg-red-100 text-red-700' }
}

export default function OverviewTab() {
  const [summaries, setSummaries] = useState<PersonSummary[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: tasks } = await supabase.from('tasks').select('owner_role, done')
      const { data: goalsData } = await supabase.from('goals').select('*')

      const sums = PEOPLE.map(({ role, name }) => {
        const mine = (tasks ?? []).filter((t) => t.owner_role === role)
        return { role, name, done: mine.filter((t) => t.done).length, total: mine.length }
      })

      setSummaries(sums)
      setGoals(goalsData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="mt-8 text-center text-gray-400 text-sm">Loading…</div>

  return (
    <div className="mt-4 space-y-6">
      {/* Per-person task summary */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          {summaries.map(({ role, name, done, total }) => (
            <div key={role} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-700">{name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {done}<span className="text-base font-normal text-gray-400">/{total}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">tasks done</p>
            </div>
          ))}
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
              const person = PEOPLE.find((p) => p.role === goal.owner_role)
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400">{person?.name} · {goal.period}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">{goal.text}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {goal.progress}{goal.unit ? ` ${goal.unit}` : ''} / {goal.target}{goal.unit ? ` ${goal.unit}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {goals.length === 0 && summaries.every((s) => s.total === 0) && (
        <p className="text-center text-gray-400 text-sm mt-12">No tasks or goals yet. Add some from each person's tab.</p>
      )}
    </div>
  )
}
