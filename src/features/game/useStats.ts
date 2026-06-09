import { useState, useCallback } from 'react'
import type { Difficulty } from '../../types'
import { loadStats, recordWin as recordWinImpl, resetStreak as resetStreakImpl, type GameStats } from './stats'

export function useStats() {
  const [stats, setStats] = useState<GameStats>(() => loadStats())

  const recordWin = useCallback((difficulty: Difficulty, time: number) => {
    setStats((prev) => recordWinImpl(prev, difficulty, time))
  }, [])

  const resetStreak = useCallback(() => {
    setStats((prev) => resetStreakImpl(prev))
  }, [])

  return { stats, recordWin, resetStreak }
}
