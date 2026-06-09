import { useReducer, useEffect, useRef, type ReactNode } from 'react'
import { GameContext } from './GameContext'
import { gameReducer, createInitialState, extractPuzzleFromBoard } from './gameReducer'
import type { GameState } from './gameReducer'
import type { Cell } from '../../types'
import { solve } from '../../lib/sudoku'

const SAVE_KEY = 'sudoku-game-save-v1'

function isValidBoard(board: unknown): board is Cell[][] {
  if (!Array.isArray(board) || board.length !== 9) return false
  return board.every((row) => {
    if (!Array.isArray(row) || row.length !== 9) return false
    return row.every((cell) => {
      return (
        cell &&
        typeof cell === 'object' &&
        typeof cell.row === 'number' &&
        typeof cell.col === 'number' &&
        (cell.value === null || typeof cell.value === 'number') &&
        typeof cell.isFixed === 'boolean' &&
        Array.isArray(cell.candidates)
      )
    })
  })
}

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Omit<GameState, 'solution'>>
    if (!isValidBoard(parsed.board)) return null
    if (!parsed.difficulty) return null

    // Re-derive solution from fixed cells
    const puzzle = extractPuzzleFromBoard(parsed.board)
    const solution = solve(puzzle)
    if (!solution) return null

    // Clone board to ensure moveHistory has its own reference
    const board = parsed.board.map((row) =>
      row.map((cell) => ({ ...cell, candidates: [...cell.candidates] }))
    )

    return {
      board,
      solution,
      difficulty: parsed.difficulty,
      selectedCell: null,
      isComplete: parsed.isComplete ?? false,
      isPaused: false,
      elapsedTime: parsed.elapsedTime ?? 0,
      isNoteMode: parsed.isNoteMode ?? false,
      moveHistory: [board],
      historyIndex: 0,
      errorCount: parsed.errorCount ?? 0,
    }
  } catch {
    return null
  }
}

function saveState(state: GameState) {
  try {
    // Exclude solution (anti-cheat), moveHistory (quota), and historyIndex (rebuilt on load)
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(state, (key, value) => {
        if (key === 'solution' || key === 'moveHistory' || key === 'historyIndex') {
          return undefined
        }
        return value
      })
    )
  } catch {
    // Ignore quota exceeded or private mode errors
  }
}

function initState(): GameState {
  const saved = loadSavedState()
  if (saved) return saved
  return createInitialState('medium')
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initState)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSaveKeyRef = useRef<string>('')

  // Timer
  useEffect(() => {
    if (state.isPaused || state.isComplete) return
    const id = setInterval(() => {
      dispatch({ type: 'TICK' })
    }, 1000)
    return () => clearInterval(id)
  }, [state.isPaused, state.isComplete])

  // Auto-save with debounce (3s) to reduce localStorage writes
  // Exclude elapsedTime to avoid resetting the debounce timer every second
  useEffect(() => {
    const saveKey = JSON.stringify({
      board: state.board,
      difficulty: state.difficulty,
      isComplete: state.isComplete,
      isNoteMode: state.isNoteMode,
      selectedCell: state.selectedCell,
    })

    if (prevSaveKeyRef.current === saveKey) {
      // Only elapsedTime changed (TICK); keep existing debounce timer
      return
    }
    prevSaveKeyRef.current = saveKey

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = setTimeout(() => {
      saveState(state)
    }, 3000)
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [state])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}
