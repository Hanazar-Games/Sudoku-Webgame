import type { Difficulty } from '../../types'

const DAILY_KEY = 'sudoku-daily-v1'

export interface DailyState {
  date: string // YYYY-MM-DD
  completed: boolean
  time: number | null
  difficulty: Difficulty
}

function getTodayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getDailySeed(): number {
  const today = getTodayString()
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    const char = today.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash) || 1
}

export function loadDailyState(): DailyState {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DailyState
      if (parsed.date === getTodayString()) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return {
    date: getTodayString(),
    completed: false,
    time: null,
    difficulty: 'medium',
  }
}

export function saveDailyState(state: Partial<DailyState>): void {
  try {
    const current = loadDailyState()
    const next: DailyState = { ...current, ...state, date: getTodayString() }
    localStorage.setItem(DAILY_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function isDailyCompleted(): boolean {
  return loadDailyState().completed
}

export function markDailyCompleted(time: number): void {
  saveDailyState({ completed: true, time })
}
