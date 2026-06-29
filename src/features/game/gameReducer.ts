import type { Cell, Difficulty } from '../../types'
import { generatePuzzle, isBoardComplete, solve } from '../../lib/sudoku'
import type { SudokuGrid } from '../../lib/sudoku'
import { getDailySeed, getTodayString } from './dailyChallenge'

export interface GameState {
  board: Cell[][]
  solution: SudokuGrid
  difficulty: Difficulty
  selectedCell: { row: number; col: number } | null
  isComplete: boolean
  isPaused: boolean
  elapsedTime: number
  isNoteMode: boolean
  isDailyChallenge: boolean
  dailyChallengeDate: string | null
  moveHistory: Cell[][][]
  historyIndex: number
  errorCount: number
}

export type GameAction =
  | { type: 'NEW_GAME'; difficulty: Difficulty }
  | { type: 'NEW_DAILY_CHALLENGE' }
  | { type: 'CHANGE_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'SET_VALUE'; value: number }
  | { type: 'CLEAR_VALUE' }
  | { type: 'MOVE_SELECTION'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TICK' }
  | { type: 'USE_HINT' }
  | { type: 'TOGGLE_NOTE_MODE' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; state: GameState }

function createCell(row: number, col: number, value: number | null, isFixed: boolean): Cell {
  return {
    row,
    col,
    value,
    isFixed,
    candidates: [],
  }
}

function createBoardFromPuzzle(puzzle: SudokuGrid): Cell[][] {
  return puzzle.map((row, r) =>
    row.map((value, c) => createCell(r, c, value, value !== null))
  )
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell, candidates: [...cell.candidates] })))
}

export function extractPuzzleFromBoard(board: Cell[][]): SudokuGrid {
  return board.map((row) => row.map((cell) => (cell.isFixed ? cell.value : null)))
}

function buildInitialHistory(board: Cell[][]): Cell[][][] {
  return [cloneBoard(board)]
}

function countErrors(board: Cell[][], solution: SudokuGrid): number {
  let count = 0
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c]
      if (!cell.isFixed && cell.value !== null && cell.value !== solution[r][c]) {
        count++
      }
    }
  }
  return count
}

export function createInitialState(difficulty: Difficulty = 'medium'): GameState {
  const { solution, puzzle } = generatePuzzle(difficulty)
  const board = createBoardFromPuzzle(puzzle)
  return {
    board,
    solution,
    difficulty,
    selectedCell: null,
    isComplete: false,
    isPaused: false,
    elapsedTime: 0,
    isNoteMode: false,
    isDailyChallenge: false,
    dailyChallengeDate: null,
    moveHistory: buildInitialHistory(board),
    historyIndex: 0,
    errorCount: 0,
  }
}

function pushHistory(
  state: GameState,
  newBoard: Cell[][],
  isComplete?: boolean
): GameState {
  // 截断 redo 栈
  const newHistory = state.moveHistory.slice(0, state.historyIndex + 1)
  newHistory.push(cloneBoard(newBoard))

  // 限制历史长度，防止内存无限增长
  const MAX_HISTORY = 500
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift()
  }

  return {
    ...state,
    board: newBoard,
    moveHistory: newHistory,
    historyIndex: newHistory.length - 1,
    isComplete: isComplete !== undefined ? isComplete : state.isComplete,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME': {
      const { solution, puzzle } = generatePuzzle(action.difficulty)
      const board = createBoardFromPuzzle(puzzle)
      return {
        board,
        solution,
        difficulty: action.difficulty,
        selectedCell: null,
        isComplete: false,
        isPaused: false,
        elapsedTime: 0,
        isNoteMode: false,
        isDailyChallenge: false,
        dailyChallengeDate: null,
        moveHistory: buildInitialHistory(board),
        historyIndex: 0,
        errorCount: 0,
      }
    }

    case 'NEW_DAILY_CHALLENGE': {
      const { solution, puzzle } = generatePuzzle('medium', getDailySeed())
      const board = createBoardFromPuzzle(puzzle)
      return {
        board,
        solution,
        difficulty: 'medium',
        selectedCell: null,
        isComplete: false,
        isPaused: false,
        elapsedTime: 0,
        isNoteMode: false,
        isDailyChallenge: true,
        dailyChallengeDate: getTodayString(),
        moveHistory: buildInitialHistory(board),
        historyIndex: 0,
        errorCount: 0,
      }
    }

    case 'LOAD_STATE': {
      const saved = action.state
      // Re-derive solution from fixed cells to avoid storing/cheating
      const puzzle = extractPuzzleFromBoard(saved.board)
      const solution = solve(puzzle)
      if (!solution) {
        // Corrupted save, fallback to new game
        return createInitialState(saved.difficulty)
      }
      return {
        ...saved,
        solution,
        selectedCell: null,
        isPaused: false,
        isDailyChallenge: saved.isDailyChallenge ?? false,
        dailyChallengeDate: saved.dailyChallengeDate ?? null,
      }
    }

    case 'SELECT_CELL': {
      if (state.isPaused) return state
      return {
        ...state,
        selectedCell: { row: action.row, col: action.col },
      }
    }

    case 'SET_VALUE': {
      if (state.isComplete || state.isPaused) return state
      if (!state.selectedCell) return state
      const { row, col } = state.selectedCell
      const cell = state.board[row][col]
      if (cell.isFixed) return state
      if (action.value < 1 || action.value > 9) return state

      const newBoard = cloneBoard(state.board)

      if (state.isNoteMode) {
        if (cell.value !== null) return state
        // Toggle candidate
        const idx = newBoard[row][col].candidates.indexOf(action.value)
        if (idx >= 0) {
          newBoard[row][col].candidates.splice(idx, 1)
        } else {
          newBoard[row][col].candidates.push(action.value)
          newBoard[row][col].candidates.sort((a, b) => a - b)
        }
        return pushHistory(state, newBoard)
      }

      // Normal mode: set value and clear candidates
      newBoard[row][col].value = action.value
      newBoard[row][col].candidates = []
      const isComplete = isBoardComplete(newBoard.map((r) => r.map((c) => c.value)))
      const isCorrect = action.value === state.solution[row][col]

      return {
        ...pushHistory(state, newBoard, isComplete),
        errorCount: state.errorCount + (isCorrect ? 0 : 1),
      }
    }

    case 'CLEAR_VALUE': {
      if (state.isComplete || state.isPaused) return state
      if (!state.selectedCell) return state
      const { row, col } = state.selectedCell
      const cell = state.board[row][col]
      if (cell.isFixed) return state

      const newBoard = cloneBoard(state.board)

      if (state.isNoteMode && cell.value === null) {
        newBoard[row][col].candidates = []
        return pushHistory(state, newBoard)
      }

      newBoard[row][col].value = null
      newBoard[row][col].candidates = []
      return pushHistory(state, newBoard, false)
    }

    case 'MOVE_SELECTION': {
      if (state.isPaused) return state
      const current = state.selectedCell ?? { row: 0, col: 0 }
      let { row, col } = current

      switch (action.direction) {
        case 'up':
          row = Math.max(0, row - 1)
          break
        case 'down':
          row = Math.min(8, row + 1)
          break
        case 'left':
          col = Math.max(0, col - 1)
          break
        case 'right':
          col = Math.min(8, col + 1)
          break
      }

      return {
        ...state,
        selectedCell: { row, col },
      }
    }

    case 'TOGGLE_PAUSE': {
      if (state.isComplete) return state
      return {
        ...state,
        isPaused: !state.isPaused,
      }
    }

    case 'TICK': {
      if (state.isPaused || state.isComplete) return state
      return {
        ...state,
        elapsedTime: state.elapsedTime + 1,
      }
    }

    case 'USE_HINT': {
      if (state.isComplete || state.isPaused) return state
      if (!state.selectedCell) return state
      const { row, col } = state.selectedCell
      const cell = state.board[row][col]
      if (cell.isFixed) return state
      if (cell.value !== null && cell.value === state.solution[row][col]) return state

      const newBoard = cloneBoard(state.board)
      newBoard[row][col].value = state.solution[row][col]
      newBoard[row][col].candidates = []
      const isComplete = isBoardComplete(newBoard.map((r) => r.map((c) => c.value)))

      return pushHistory(state, newBoard, isComplete)
    }

    case 'TOGGLE_NOTE_MODE': {
      return {
        ...state,
        isNoteMode: !state.isNoteMode,
      }
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      const newBoard = cloneBoard(state.moveHistory[newIndex])
      return {
        ...state,
        board: newBoard,
        historyIndex: newIndex,
        isComplete: false,
        errorCount: countErrors(newBoard, state.solution),
      }
    }

    case 'REDO': {
      if (state.historyIndex >= state.moveHistory.length - 1) return state
      const newIndex = state.historyIndex + 1
      const newBoard = cloneBoard(state.moveHistory[newIndex])
      const isComplete = isBoardComplete(newBoard.map((r) => r.map((c) => c.value)))
      return {
        ...state,
        board: newBoard,
        historyIndex: newIndex,
        isComplete,
        errorCount: countErrors(newBoard, state.solution),
      }
    }

    case 'CHANGE_DIFFICULTY': {
      return {
        ...state,
        difficulty: action.difficulty,
      }
    }

    default:
      return state
  }
}
