import { useState, type Dispatch } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GameContext } from './GameContext'
import { GameControls } from './GameControls'
import { createInitialState, type GameAction, type GameState } from './gameReducer'
import { getTodayString, loadDailyState } from './dailyChallenge'

const soundMocks = vi.hoisted(() => ({
  play: vi.fn(),
  toggle: vi.fn(),
  toggleMusic: vi.fn(),
}))

vi.mock('../sound/useSound', () => ({
  useSound: () => ({
    enabled: true,
    musicEnabled: false,
    play: soundMocks.play,
    toggle: soundMocks.toggle,
    toggleMusic: soundMocks.toggleMusic,
  }),
}))

function ControlsHarness({
  isDailyChallenge,
  dailyChallengeDate,
  initialState,
  onDispatch = vi.fn(),
}: {
  isDailyChallenge: boolean
  dailyChallengeDate?: string | null
  initialState?: Partial<GameState>
  onDispatch?: Dispatch<GameAction>
}) {
  const [state, setState] = useState<GameState>(() => ({
    ...createInitialState('easy'),
    elapsedTime: 42,
    isDailyChallenge,
    dailyChallengeDate: dailyChallengeDate ?? (isDailyChallenge ? getTodayString() : null),
    ...initialState,
  }))

  return (
    <GameContext.Provider value={{ state, dispatch: onDispatch }}>
      <button
        type="button"
        onClick={() => setState((current) => ({ ...current, isComplete: true }))}
      >
        Complete game
      </button>
      <GameControls />
    </GameContext.Provider>
  )
}

describe('GameControls', () => {
  beforeEach(() => {
    localStorage.clear()
    soundMocks.play.mockClear()
    soundMocks.toggle.mockClear()
    soundMocks.toggleMusic.mockClear()
  })

  it('does not mark the daily challenge complete when a normal game is completed', async () => {
    render(<ControlsHarness isDailyChallenge={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Complete game' }))

    await waitFor(() => {
      expect(screen.getByText(/恭喜完成/)).toBeInTheDocument()
    })

    expect(loadDailyState().completed).toBe(false)
    expect(screen.queryByText(/今日每日挑战已完成/)).not.toBeInTheDocument()
  })

  it('marks the daily challenge complete when a daily game is completed', async () => {
    render(<ControlsHarness isDailyChallenge={true} />)

    fireEvent.click(screen.getByRole('button', { name: 'Complete game' }))

    await waitFor(() => {
      expect(loadDailyState().completed).toBe(true)
    })

    expect(screen.getByText(/今日每日挑战已完成/)).toBeInTheDocument()
  })

  it('does not mark today complete when an old daily challenge is completed', async () => {
    render(<ControlsHarness isDailyChallenge={true} dailyChallengeDate="2000-01-01" />)

    fireEvent.click(screen.getByRole('button', { name: 'Complete game' }))

    await waitFor(() => {
      expect(screen.getByText(/恭喜完成/)).toBeInTheDocument()
    })

    expect(loadDailyState().completed).toBe(false)
    expect(screen.queryByText(/今日每日挑战已完成/)).not.toBeInTheDocument()
  })

  it('starts a new game when the difficulty selection changes', () => {
    const dispatch = vi.fn() as Dispatch<GameAction>
    render(<ControlsHarness isDailyChallenge={false} onDispatch={dispatch} />)

    fireEvent.change(screen.getByRole('combobox', { name: '难度' }), {
      target: { value: 'hard' },
    })

    expect(dispatch).toHaveBeenCalledWith({ type: 'NEW_GAME', difficulty: 'hard' })
  })

  it('disables value actions until an editable cell is selected', () => {
    render(<ControlsHarness isDailyChallenge={false} />)

    expect(screen.getByRole('button', { name: '提示' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '输入 1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '清除' })).toBeDisabled()
  })

  it('plays the error sound when the keypad enters an incorrect value', () => {
    const state = createInitialState('easy')
    const selectedCell = state.board.flat().find((cell) => !cell.isFixed)
    if (!selectedCell) {
      throw new Error('Expected an editable cell in the generated puzzle')
    }

    const solutionValue = state.solution[selectedCell.row][selectedCell.col]
    if (solutionValue === null) {
      throw new Error('Expected the generated puzzle to include a solution value')
    }
    const wrongValue = (solutionValue % 9) + 1
    const dispatch = vi.fn() as Dispatch<GameAction>

    render(
      <ControlsHarness
        isDailyChallenge={false}
        initialState={{ board: state.board, solution: state.solution, selectedCell }}
        onDispatch={dispatch}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: `输入 ${wrongValue}` }))

    expect(soundMocks.play).toHaveBeenCalledWith('error')
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VALUE', value: wrongValue })
  })

  it('plays the note toggle sound when the keypad edits notes', () => {
    const state = createInitialState('easy')
    const selectedCell = state.board.flat().find((cell) => !cell.isFixed)
    if (!selectedCell) {
      throw new Error('Expected an editable cell in the generated puzzle')
    }
    const dispatch = vi.fn() as Dispatch<GameAction>

    render(
      <ControlsHarness
        isDailyChallenge={false}
        initialState={{
          board: state.board,
          solution: state.solution,
          isNoteMode: true,
          selectedCell,
        }}
        onDispatch={dispatch}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '输入 1' }))

    expect(soundMocks.play).toHaveBeenCalledWith('toggle')
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VALUE', value: 1 })
  })
})
