import { useReducer, useEffect, useRef, type ReactNode } from 'react'
import { GameContext } from './GameContext'
import { gameReducer, createInitialState } from './gameReducer'
import type { GameState } from './gameReducer'
import { solve } from '../../lib/sudoku'

const SAVE_KEY = 'sudoku-game-save-v1'

function extractPuzzle(board: GameState['board']): GameState['solution'] {
  return board.map((row) => row.map((cell) => (cell.isFixed ? cell.value : null)))
}

function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Omit<GameState, 'solution'>
    if (!parsed.board || !parsed.difficulty) return null

    // Re-derive solution from fixed cells
    const puzzle = extractPuzzle(parsed.board)
    const solution = solve(puzzle)
    if (!solution) return null

    return {
      ...parsed,
      solution,
      selectedCell: null,
      isPaused: false,
    }
  } catch {
    return null
  }
}

function saveState(state: GameState) {
  try {
    // Exclude solution from storage to prevent cheating
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(state, (key, value) => (key === 'solution' ? undefined : value))
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
      historyIndex: state.historyIndex,
      moveHistoryLength: state.moveHistory.length,
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
