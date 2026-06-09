import type { Difficulty } from '../../types'

export interface DifficultyStats {
  gamesWon: number
  bestTime: number | null
}

export interface GameStats {
  easy: DifficultyStats
  medium: DifficultyStats
  hard: DifficultyStats
  currentStreak: number
  bestStreak: number
}

const STATS_KEY = 'sudoku-game-stats-v1'

const DEFAULT_DIFFICULTY_STATS: DifficultyStats = {
  gamesWon: 0,
  bestTime: null,
}

const DEFAULT_STATS: GameStats = {
  easy: { ...DEFAULT_DIFFICULTY_STATS },
  medium: { ...DEFAULT_DIFFICULTY_STATS },
  hard: { ...DEFAULT_DIFFICULTY_STATS },
  currentStreak: 0,
  bestStreak: 0,
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return DEFAULT_STATS
    const parsed = JSON.parse(raw) as Partial<GameStats>
    return {
      easy: { ...DEFAULT_DIFFICULTY_STATS, ...parsed.easy },
      medium: { ...DEFAULT_DIFFICULTY_STATS, ...parsed.medium },
      hard: { ...DEFAULT_DIFFICULTY_STATS, ...parsed.hard },
      currentStreak: parsed.currentStreak ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
    }
  } catch {
    return DEFAULT_STATS
  }
}

function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {
    // Ignore quota exceeded or private mode errors
  }
}

export function recordWin(stats: GameStats, difficulty: Difficulty, time: number): GameStats {
  const next: GameStats = {
    easy: { ...stats.easy },
    medium: { ...stats.medium },
    hard: { ...stats.hard },
    currentStreak: stats.currentStreak + 1,
    bestStreak: stats.bestStreak,
  }
  if (next.currentStreak > next.bestStreak) {
    next.bestStreak = next.currentStreak
  }
  const diff = next[difficulty]
  diff.gamesWon += 1
  if (diff.bestTime === null || time < diff.bestTime) {
    diff.bestTime = time
  }
  saveStats(next)
  return next
}

export function resetStreak(stats: GameStats): GameStats {
  const next: GameStats = {
    ...stats,
    easy: { ...stats.easy },
    medium: { ...stats.medium },
    hard: { ...stats.hard },
    currentStreak: 0,
  }
  saveStats(next)
  return next
}
