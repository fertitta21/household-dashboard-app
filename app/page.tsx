'use client'

import { useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DailyTasks from '@/components/DailyTasks'
import MedicationTracker from '@/components/MedicationTracker'
import DietTracker from '@/components/DietTracker'
import WorkoutTracker from '@/components/WorkoutTracker'
import OverviewTab from '@/components/OverviewTab'
import type { UserRole } from '@/lib/types'

const PEOPLE: { role: UserRole; label: string; emoji: string }[] = [
  { role: 'jeff', label: 'Jeff', emoji: '👤' },
  { role: 'lindsay', label: 'Lindsay', emoji: '👤' },
  { role: 'gianna', label: 'Gianna', emoji: '👤' },
  { role: 'shared', label: 'Shared', emoji: '🏠' },
]

type MainTab = 'calendar' | 'tasks' | 'meds' | 'diet' | 'workout' | 'overview'

export default function Home() {
  const [mainTab, setMainTab] = useState<MainTab>('calendar')
  const [activePerson, setActivePerson] = useState<UserRole>('jeff')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-2xl mx-auto relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-5 pb-3 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900 mb-3">🏠 Household</h1>
        {/* Person selector — shown on tasks/meds/diet/workout tabs */}
        {(mainTab === 'tasks' || mainTab === 'meds' || mainTab === 'diet' || mainTab === 'workout') && (
          <div className="flex gap-1 overflow-x-auto">
            {PEOPLE.map(({ role, label }) => (
              <button
                key={role}
                onClick={() => setActivePerson(role)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activePerson === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {mainTab === 'calendar' && <CalendarView />}
        {mainTab === 'tasks' && <DailyTasks role={activePerson} name={PEOPLE.find(p => p.role === activePerson)!.label} />}
        {mainTab === 'meds' && <MedicationTracker role={activePerson} name={PEOPLE.find(p => p.role === activePerson)!.label} />}
        {mainTab === 'diet' && <DietTracker role={activePerson} name={PEOPLE.find(p => p.role === activePerson)!.label} />}
        {mainTab === 'workout' && <WorkoutTracker role={activePerson} name={PEOPLE.find(p => p.role === activePerson)!.label} />}
        {mainTab === 'overview' && <OverviewTab />}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-gray-200 flex overflow-x-auto">
        {([
          { id: 'calendar', icon: '📅', label: 'Calendar' },
          { id: 'tasks', icon: '✅', label: 'Tasks' },
          { id: 'meds', icon: '💊', label: 'Meds' },
          { id: 'diet', icon: '🍎', label: 'Diet' },
          { id: 'workout', icon: '💪', label: 'Workout' },
          { id: 'overview', icon: '📊', label: 'Overview' },
        ] as { id: MainTab; icon: string; label: string }[]).map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              mainTab === id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl mb-0.5">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
