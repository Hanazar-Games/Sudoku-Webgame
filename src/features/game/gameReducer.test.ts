import { describe, it, expect } from 'vitest'
import {
  gameReducer,
  createInitialState,
} from './gameReducer'
import type { GameState } from './gameReducer'

describe('gameReducer', () => {
  function getEditableCell(state: GameState): { row: number; col: number } {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!state.board[r][c].isFixed) return { row: r, col: c }
      }
    }
    throw new Error('No editable cell found')
  }

  function getFixedCell(state: GameState): { row: number; col: number } {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.board[r][c].isFixed) return { row: r, col: c }
      }
    }
    throw new Error('No fixed cell found')
  }

  describe('SELECT_CELL', () => {
    it('sets selected cell', () => {
      const state = createInitialState('easy')
      const next = gameReducer(state, { type: 'SELECT_CELL', row: 3, col: 4 })
      expect(next.selectedCell).toEqual({ row: 3, col: 4 })
    })

    it('is blocked when paused', () => {
      const state = createInitialState('easy')
      const paused = { ...state, isPaused: true }
      const next = gameReducer(paused, { type: 'SELECT_CELL', row: 3, col: 4 })
      expect(next.selectedCell).toBeNull()
    })
  })

  describe('SET_VALUE', () => {
    it('fills value into editable cell', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const next = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      expect(next.board[row][col].value).toBe(5)
      expect(next.moveHistory.length).toBe(2)
      expect(next.historyIndex).toBe(1)
    })

    it('does not modify fixed cell', () => {
      const state = createInitialState('easy')
      const { row, col } = getFixedCell(state)
      const originalValue = state.board[row][col].value
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const next = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      expect(next.board[row][col].value).toBe(originalValue)
    })

    it('does nothing when no cell is selected', () => {
      const state = createInitialState('easy')
      const next = gameReducer(state, { type: 'SET_VALUE', value: 5 })
      expect(next.board).toEqual(state.board)
    })

    it('blocks editing after game is complete', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const completeState = { ...filled, isComplete: true }
      const next = gameReducer(completeState, { type: 'SET_VALUE', value: 3 })
      expect(next.board[row][col].value).toBe(5)
    })

    it('blocks editing when paused', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const paused = { ...selected, isPaused: true }
      const next = gameReducer(paused, { type: 'SET_VALUE', value: 5 })
      expect(next.board[row][col].value).toBeNull()
    })

    it('toggles candidate in note mode', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const noteMode = gameReducer(selected, { type: 'TOGGLE_NOTE_MODE' })

      const withNote = gameReducer(noteMode, { type: 'SET_VALUE', value: 3 })
      expect(withNote.board[row][col].candidates).toContain(3)
      expect(withNote.board[row][col].value).toBeNull()

      const toggleOff = gameReducer(withNote, { type: 'SET_VALUE', value: 3 })
      expect(toggleOff.board[row][col].candidates).not.toContain(3)
    })

    it('does not overwrite existing value in note mode', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      expect(filled.board[row][col].value).toBe(5)

      const noteMode = gameReducer(filled, { type: 'TOGGLE_NOTE_MODE' })
      const next = gameReducer(noteMode, { type: 'SET_VALUE', value: 3 })
      // Value should remain 5, not be overwritten to 3
      expect(next.board[row][col].value).toBe(5)
      expect(next.board[row][col].candidates).toEqual([])
    })

    it('ignores out-of-range values', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })

      const withZero = gameReducer(selected, { type: 'SET_VALUE', value: 0 })
      expect(withZero.board[row][col].value).toBeNull()

      const withTen = gameReducer(selected, { type: 'SET_VALUE', value: 10 })
      expect(withTen.board[row][col].value).toBeNull()

      const withNegative = gameReducer(selected, { type: 'SET_VALUE', value: -1 })
      expect(withNegative.board[row][col].value).toBeNull()
    })
  })

  describe('CLEAR_VALUE', () => {
    it('clears editable cell', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const cleared = gameReducer(filled, { type: 'CLEAR_VALUE' })
      expect(cleared.board[row][col].value).toBeNull()
    })

    it('keeps isComplete false when clearing a cell in non-complete state', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const cleared = gameReducer(filled, { type: 'CLEAR_VALUE' })
      expect(cleared.isComplete).toBe(false)
    })

    it('clears candidates in note mode', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const noteMode = gameReducer(selected, { type: 'TOGGLE_NOTE_MODE' })
      const withNote = gameReducer(noteMode, { type: 'SET_VALUE', value: 3 })
      const cleared = gameReducer(withNote, { type: 'CLEAR_VALUE' })
      expect(cleared.board[row][col].candidates).toEqual([])
    })

    it('does not clear fixed cell', () => {
      const state = createInitialState('easy')
      const { row, col } = getFixedCell(state)
      const originalValue = state.board[row][col].value
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const next = gameReducer(selected, { type: 'CLEAR_VALUE' })
      expect(next.board[row][col].value).toBe(originalValue)
    })

    it('blocks clearing after game is complete', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const completeState = { ...filled, isComplete: true }
      const next = gameReducer(completeState, { type: 'CLEAR_VALUE' })
      expect(next.board[row][col].value).toBe(5)
    })
  })

  describe('MOVE_SELECTION', () => {
    it('moves selection with arrow keys', () => {
      const state = createInitialState('easy')
      const selected = gameReducer(state, { type: 'SELECT_CELL', row: 4, col: 4 })

      const up = gameReducer(selected, { type: 'MOVE_SELECTION', direction: 'up' })
      expect(up.selectedCell).toEqual({ row: 3, col: 4 })

      const left = gameReducer(selected, { type: 'MOVE_SELECTION', direction: 'left' })
      expect(left.selectedCell).toEqual({ row: 4, col: 3 })
    })

    it('is blocked when paused', () => {
      const state = createInitialState('easy')
      const selected = gameReducer(state, { type: 'SELECT_CELL', row: 4, col: 4 })
      const paused = { ...selected, isPaused: true }
      const next = gameReducer(paused, { type: 'MOVE_SELECTION', direction: 'up' })
      expect(next.selectedCell).toEqual({ row: 4, col: 4 })
    })
  })

  describe('TOGGLE_PAUSE', () => {
    it('toggles pause state', () => {
      const state = createInitialState('easy')
      const paused = gameReducer(state, { type: 'TOGGLE_PAUSE' })
      expect(paused.isPaused).toBe(true)
      const resumed = gameReducer(paused, { type: 'TOGGLE_PAUSE' })
      expect(resumed.isPaused).toBe(false)
    })

    it('is blocked when game is complete', () => {
      const state = createInitialState('easy')
      const complete = { ...state, isComplete: true }
      const next = gameReducer(complete, { type: 'TOGGLE_PAUSE' })
      expect(next.isPaused).toBe(false)
    })
  })

  describe('TICK', () => {
    it('increments elapsed time', () => {
      const state = createInitialState('easy')
      const next = gameReducer(state, { type: 'TICK' })
      expect(next.elapsedTime).toBe(1)
    })

    it('is blocked when paused', () => {
      const state = createInitialState('easy')
      const paused = { ...state, isPaused: true, elapsedTime: 10 }
      const next = gameReducer(paused, { type: 'TICK' })
      expect(next.elapsedTime).toBe(10)
    })

    it('is blocked when complete', () => {
      const state = createInitialState('easy')
      const complete = { ...state, isComplete: true, elapsedTime: 10 }
      const next = gameReducer(complete, { type: 'TICK' })
      expect(next.elapsedTime).toBe(10)
    })
  })

  describe('USE_HINT', () => {
    it('fills correct value into selected empty cell', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const hinted = gameReducer(selected, { type: 'USE_HINT' })

      expect(hinted.board[row][col].value).toBe(state.solution[row][col])
      expect(hinted.moveHistory.length).toBe(2)
    })

    it('does nothing on fixed cell', () => {
      const state = createInitialState('easy')
      const { row, col } = getFixedCell(state)
      const originalValue = state.board[row][col].value
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const hinted = gameReducer(selected, { type: 'USE_HINT' })
      expect(hinted.board[row][col].value).toBe(originalValue)
    })

    it('is blocked when paused', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const paused = { ...selected, isPaused: true }
      const hinted = gameReducer(paused, { type: 'USE_HINT' })
      expect(hinted.board[row][col].value).toBeNull()
    })

    it('clears candidates when hinting', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const noteMode = gameReducer(selected, { type: 'TOGGLE_NOTE_MODE' })
      const withNote = gameReducer(noteMode, { type: 'SET_VALUE', value: 3 })
      expect(withNote.board[row][col].candidates).toContain(3)

      const hinted = gameReducer(withNote, { type: 'USE_HINT' })
      expect(hinted.board[row][col].candidates).toEqual([])
    })
  })

  describe('TOGGLE_NOTE_MODE', () => {
    it('toggles note mode flag', () => {
      const state = createInitialState('easy')
      expect(state.isNoteMode).toBe(false)
      const next = gameReducer(state, { type: 'TOGGLE_NOTE_MODE' })
      expect(next.isNoteMode).toBe(true)
      const off = gameReducer(next, { type: 'TOGGLE_NOTE_MODE' })
      expect(off.isNoteMode).toBe(false)
    })
  })

  describe('UNDO / REDO', () => {
    it('undoes last move', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      expect(filled.board[row][col].value).toBe(5)

      const undone = gameReducer(filled, { type: 'UNDO' })
      expect(undone.board[row][col].value).toBeNull()
      expect(undone.historyIndex).toBe(0)
    })

    it('redoes undone move', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const undone = gameReducer(filled, { type: 'UNDO' })
      expect(undone.board[row][col].value).toBeNull()

      const redone = gameReducer(undone, { type: 'REDO' })
      expect(redone.board[row][col].value).toBe(5)
      expect(redone.historyIndex).toBe(1)
    })

    it('truncates redo stack on new action after undo', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled5 = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const filled6 = gameReducer(filled5, { type: 'SET_VALUE', value: 6 })
      expect(filled6.moveHistory.length).toBe(3)

      const undone = gameReducer(filled6, { type: 'UNDO' })
      expect(undone.historyIndex).toBe(1)

      // New action should truncate redo stack
      const filled7 = gameReducer(undone, { type: 'SET_VALUE', value: 7 })
      expect(filled7.moveHistory.length).toBe(3)
      expect(filled7.historyIndex).toBe(2)
      expect(filled7.board[row][col].value).toBe(7)
    })

    it('does nothing when undo at start', () => {
      const state = createInitialState('easy')
      const next = gameReducer(state, { type: 'UNDO' })
      expect(next.historyIndex).toBe(0)
    })

    it('does nothing when redo at end', () => {
      const state = createInitialState('easy')
      const next = gameReducer(state, { type: 'REDO' })
      expect(next.historyIndex).toBe(0)
    })

    it('undo resets isComplete', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })
      const complete = { ...filled, isComplete: true }
      const undone = gameReducer(complete, { type: 'UNDO' })
      expect(undone.isComplete).toBe(false)
    })
  })

  describe('NEW_GAME', () => {
    it('generates a new board with selected difficulty', () => {
      const state = createInitialState('easy')
      const selected = gameReducer(state, { type: 'SELECT_CELL', row: 1, col: 1 })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })

      const next = gameReducer(filled, { type: 'NEW_GAME', difficulty: 'hard' })
      expect(next.difficulty).toBe('hard')
      expect(next.selectedCell).toBeNull()
      expect(next.isComplete).toBe(false)
      expect(next.isPaused).toBe(false)
      expect(next.elapsedTime).toBe(0)
      expect(next.isNoteMode).toBe(false)
      expect(next.isDailyChallenge).toBe(false)
      expect(next.moveHistory.length).toBe(1)
      expect(next.historyIndex).toBe(0)
    })
  })

  describe('NEW_DAILY_CHALLENGE', () => {
    it('marks the game as a daily challenge', () => {
      const state = createInitialState('easy')
      const next = gameReducer(state, { type: 'NEW_DAILY_CHALLENGE' })

      expect(next.difficulty).toBe('medium')
      expect(next.isDailyChallenge).toBe(true)
      expect(next.selectedCell).toBeNull()
      expect(next.isComplete).toBe(false)
      expect(next.elapsedTime).toBe(0)
      expect(next.moveHistory.length).toBe(1)
    })
  })

  describe('CHANGE_DIFFICULTY', () => {
    it('only changes difficulty without starting a new game', () => {
      const state = createInitialState('easy')
      const originalBoard = state.board
      const next = gameReducer(state, { type: 'CHANGE_DIFFICULTY', difficulty: 'hard' })
      expect(next.difficulty).toBe('hard')
      expect(next.board).toBe(originalBoard)
    })
  })

  describe('LOAD_STATE', () => {
    it('loads saved state and re-derives solution', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })
      const filled = gameReducer(selected, { type: 'SET_VALUE', value: 5 })

      // Save without solution
      const saved = { ...filled, solution: [] as unknown as GameState['solution'] }
      const loaded = gameReducer(state, { type: 'LOAD_STATE', state: saved })

      expect(loaded.board[row][col].value).toBe(5)
      expect(loaded.selectedCell).toBeNull()
      expect(loaded.isPaused).toBe(false)
      // Solution should be re-derived
      expect(loaded.solution.length).toBe(9)
    })

    it('falls back to new game when saved board has conflicting fixed cells', () => {
      const state = createInitialState('easy')
      // Create a board with two identical fixed values in the same row
      const corruptedBoard = state.board.map((row, r) =>
        row.map((cell, c) => {
          if (r === 0 && c === 0) return { ...cell, isFixed: true, value: 5 }
          if (r === 0 && c === 1) return { ...cell, isFixed: true, value: 5 }
          return cell
        })
      )
      const corrupted = { ...state, board: corruptedBoard }
      const loaded = gameReducer(state, { type: 'LOAD_STATE', state: corrupted })
      // Should create a fresh board instead of loading corrupted one
      expect(loaded.board).not.toEqual(corruptedBoard)
    })
  })

  describe('moveHistory cap', () => {
    it('truncates history to a maximum of 500 entries', () => {
      const state = createInitialState('easy')
      const { row, col } = getEditableCell(state)
      const selected = gameReducer(state, { type: 'SELECT_CELL', row, col })

      let current = selected
      for (let i = 0; i < 502; i++) {
        current = gameReducer(current, { type: 'SET_VALUE', value: (i % 9) + 1 })
      }

      expect(current.moveHistory.length).toBe(500)
      expect(current.historyIndex).toBe(499)
    })
  })
})
