import type { Difficulty } from '../../types'

export interface DifficultyStats {
  gamesWon: number
  bestTime: number | null
}

export interface GameStats {
  easy: DifficultyStats
  medium: DifficultyStats
  hard: DifficultyStats
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
  }
  const diff = next[difficulty]
  diff.gamesWon += 1
  if (diff.bestTime === null || time < diff.bestTime) {
    diff.bestTime = time
  }
  saveStats(next)
  return next
}
