'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import OverviewTab from '@/components/OverviewTab'
import PersonTab from '@/components/PersonTab'

export type UserRole = 'jeff' | 'lindsay' | 'gianna' | 'shared'

const TABS: { role: UserRole; label: string }[] = [
  { role: 'jeff', label: 'Overview' },
  { role: 'jeff', label: 'Jeff' },
  { role: 'lindsay', label: 'Lindsay' },
  { role: 'gianna', label: 'Gianna' },
  { role: 'shared', label: 'Shared' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-semibold text-gray-900">🏠 Home</h1>
      </header>

      {/* Tab bar */}
      <nav className="flex gap-1 px-4 pb-2 overflow-x-auto">
        {['Overview', 'Jeff', 'Lindsay', 'Gianna', 'Shared'].map((label, i) => (
          <button
            key={label}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === i
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 px-4 pb-8">
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <PersonTab role="jeff" name="Jeff" />}
        {activeTab === 2 && <PersonTab role="lindsay" name="Lindsay" />}
        {activeTab === 3 && <PersonTab role="gianna" name="Gianna" />}
        {activeTab === 4 && <PersonTab role="shared" name="Shared" />}
      </main>
    </div>
  )
}
