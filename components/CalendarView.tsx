'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CalendarEvent, UserRole } from '@/lib/types'

type View = 'month' | 'week' | 'day'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const EVENT_COLORS: Record<string, string> = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white',
  orange: 'bg-orange-500 text-white',
  pink: 'bg-pink-500 text-white',
}

const OWNER_COLORS: Record<string, string> = {
  jeff: 'blue',
  lindsay: 'purple',
  gianna: 'pink',
  shared: 'green',
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

type EventModalProps = {
  date: Date
  event?: CalendarEvent
  onSave: () => void
  onClose: () => void
}

function EventModal({ date, event, onSave, onClose }: EventModalProps) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [allDay, setAllDay] = useState(event?.all_day ?? true)
  const [startTime, setStartTime] = useState(event ? event.start_time.slice(11, 16) : '09:00')
  const [endTime, setEndTime] = useState(event?.end_time ? event.end_time.slice(11, 16) : '10:00')
  const [isShared, setIsShared] = useState(event?.is_shared ?? false)
  const [owner, setOwner] = useState<UserRole>(event?.owner_role ?? 'jeff')
  const [color, setColor] = useState(event?.color ?? 'blue')
  const [saving, setSaving] = useState(false)

  const dateStr = date.toISOString().split('T')[0]

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const startISO = allDay ? `${dateStr}T00:00:00` : `${dateStr}T${startTime}:00`
    const endISO = allDay ? null : `${dateStr}T${endTime}:00`
    if (event) {
      await supabase.from('events').update({ title: title.trim(), description: description || null, all_day: allDay, start_time: startISO, end_time: endISO, is_shared: isShared, owner_role: owner, color }).eq('id', event.id)
    } else {
      await supabase.from('events').insert({ title: title.trim(), description: description || null, all_day: allDay, start_time: startISO, end_time: endISO, is_shared: isShared, owner_role: owner, color })
    }
    setSaving(false)
    onSave()
  }

  async function remove() {
    if (!event) return
    await supabase.from('events').delete().eq('id', event.id)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{event ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Event title"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
        />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
          All day
        </label>

        {!allDay && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Person</label>
            <select value={owner} onChange={e => setOwner(e.target.value as UserRole)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
              <option value="jeff">Jeff</option>
              <option value="lindsay">Lindsay</option>
              <option value="gianna">Gianna</option>
              <option value="shared">Shared</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">Color</label>
            <select value={color} onChange={e => setColor(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
              {Object.keys(EVENT_COLORS).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded" />
          Shared with household
        </label>

        <div className="flex gap-2 pt-1">
          {event && (
            <button onClick={remove} className="px-4 py-2 text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
          )}
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || !title.trim()} className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CalendarView() {
  const [view, setView] = useState<View>('month')
  const [current, setCurrent] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null | undefined>(undefined) // undefined = closed, null = new

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('start_time')
    setEvents(data ?? [])
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  function navigate(dir: -1 | 1) {
    const d = new Date(current)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCurrent(d)
  }

  function eventsOnDay(date: Date) {
    return events.filter(e => {
      const eDate = new Date(e.start_time)
      return isSameDay(eDate, date)
    })
  }

  function headerLabel() {
    if (view === 'month') return `${MONTHS[current.getMonth()]} ${current.getFullYear()}`
    if (view === 'week') {
      const ws = startOfWeek(current)
      const we = new Date(ws); we.setDate(we.getDate() + 6)
      return `${MONTHS[ws.getMonth()]} ${ws.getDate()} – ${ws.getMonth() !== we.getMonth() ? MONTHS[we.getMonth()] + ' ' : ''}${we.getDate()}, ${we.getFullYear()}`
    }
    return current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  // --- MONTH VIEW ---
  function renderMonth() {
    const year = current.getFullYear()
    const month = current.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    const cells: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

    return (
      <div>
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DOW.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="border-b border-r border-gray-100 min-h-[80px] p-1" />
            const dayEvents = eventsOnDay(date)
            const isToday = isSameDay(date, today)
            return (
              <div
                key={date.toISOString()}
                className="border-b border-r border-gray-100 min-h-[80px] p-1 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => { setSelectedDate(date); setView('day'); setCurrent(date) }}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(e => (
                    <div
                      key={e.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${EVENT_COLORS[e.color] ?? EVENT_COLORS.blue}`}
                      onClick={ev => { ev.stopPropagation(); setEditEvent(e) }}
                    >
                      {!e.all_day && <span className="opacity-80">{formatTime(e.start_time)} </span>}
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- WEEK VIEW ---
  function renderWeek() {
    const ws = startOfWeek(current)
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d })
    const today = new Date()

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 sticky top-0 bg-white z-10">
          {days.map(d => {
            const isToday = isSameDay(d, today)
            return (
              <div key={d.toISOString()} className="text-center py-2 cursor-pointer" onClick={() => { setCurrent(d); setView('day') }}>
                <div className="text-xs text-gray-400">{DOW[d.getDay()]}</div>
                <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-medium mt-0.5 ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>
        {/* Events per day */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {days.map(d => {
            const dayEvents = eventsOnDay(d)
            return (
              <div
                key={d.toISOString()}
                className="border-r border-gray-100 p-1 space-y-1 cursor-pointer hover:bg-blue-50 transition-colors min-h-[400px]"
                onClick={() => { setSelectedDate(d); setEditEvent(null) }}
              >
                {dayEvents.map(e => (
                  <div
                    key={e.id}
                    className={`text-xs px-1.5 py-1 rounded-lg ${EVENT_COLORS[e.color] ?? EVENT_COLORS.blue}`}
                    onClick={ev => { ev.stopPropagation(); setEditEvent(e) }}
                  >
                    {!e.all_day && <div className="opacity-80 text-[10px]">{formatTime(e.start_time)}</div>}
                    <div className="font-medium truncate">{e.title}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- DAY VIEW ---
  function renderDay() {
    const dayEvents = eventsOnDay(current)
    const allDayEvents = dayEvents.filter(e => e.all_day)
    const timedEvents = dayEvents.filter(e => !e.all_day).sort((a, b) => a.start_time.localeCompare(b.start_time))
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div>
        {allDayEvents.length > 0 && (
          <div className="p-3 border-b border-gray-100 space-y-1">
            <div className="text-xs text-gray-400 font-medium mb-1">All day</div>
            {allDayEvents.map(e => (
              <div key={e.id} className={`text-sm px-3 py-1.5 rounded-xl font-medium ${EVENT_COLORS[e.color] ?? EVENT_COLORS.blue}`} onClick={() => setEditEvent(e)}>
                {e.title}
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          {hours.map(h => {
            const hourEvents = timedEvents.filter(e => new Date(e.start_time).getHours() === h)
            return (
              <div key={h} className="flex border-b border-gray-100 min-h-[56px]">
                <div className="w-14 text-right pr-3 pt-1 text-xs text-gray-400 shrink-0">
                  {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                </div>
                <div
                  className="flex-1 p-1 space-y-1 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => {
                    const d = new Date(current)
                    d.setHours(h, 0, 0, 0)
                    setSelectedDate(d)
                    setEditEvent(null)
                  }}
                >
                  {hourEvents.map(e => (
                    <div
                      key={e.id}
                      className={`text-xs px-2 py-1 rounded-lg ${EVENT_COLORS[e.color] ?? EVENT_COLORS.blue}`}
                      onClick={ev => { ev.stopPropagation(); setEditEvent(e) }}
                    >
                      <span className="opacity-80">{formatTime(e.start_time)}{e.end_time ? ` – ${formatTime(e.end_time)}` : ''}</span>
                      <span className="font-medium ml-1">{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Calendar toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">‹</button>
        <button onClick={() => setCurrent(new Date())} className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Today</button>
        <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600">›</button>
        <span className="flex-1 text-sm font-semibold text-gray-900 text-center">{headerLabel()}</span>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
          {(['month', 'week', 'day'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-2.5 py-1.5 font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setSelectedDate(current); setEditEvent(null) }}
          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold"
        >+</button>
      </div>

      {/* Calendar body */}
      <div className="bg-white">
        {view === 'month' && renderMonth()}
        {view === 'week' && renderWeek()}
        {view === 'day' && renderDay()}
      </div>

      {/* Event modal */}
      {editEvent !== undefined && (
        <EventModal
          date={selectedDate ?? current}
          event={editEvent ?? undefined}
          onSave={() => { setEditEvent(undefined); loadEvents() }}
          onClose={() => setEditEvent(undefined)}
        />
      )}
    </div>
  )
}
