export type UserRole = 'jeff' | 'lindsay' | 'gianna' | 'shared'

export type TaskFrequency = 'daily' | 'weekly' | 'monthly'
export type TaskType = 'simple' | 'nutrition' | 'workout'

export type Task = {
  id: string
  owner_role: UserRole
  text: string
  frequency: TaskFrequency
  type: TaskType
  streak: number
  last_completed_date: string | null
  created_at: string
}

export type TaskCompletion = {
  id: string
  task_id: string
  date: string
  done: boolean
}

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  all_day: boolean
  owner_role: UserRole
  is_shared: boolean
  color: string
  created_at: string
}

export type FrequencyType = 'daily' | 'specific_days' | 'every_n_days' | 'as_needed'

export type Medication = {
  id: string
  owner_role: UserRole
  name: string
  dosage: string | null
  unit: string | null
  frequency: FrequencyType
  frequency_days: number[] | null  // 0=Sun, 1=Mon, ..., 6=Sat
  frequency_interval: number | null // for every_n_days
  notes: string | null
  active: boolean
  created_at: string
}

export type MedicationLog = {
  id: string
  medication_id: string
  date: string
  taken: boolean
  taken_at: string | null
  notes: string | null
}

export type Goal = {
  id: string
  owner_role: UserRole
  text: string
  progress: number
  target: number
  unit: string | null
  period: string
}
