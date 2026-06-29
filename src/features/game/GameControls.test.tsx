import { useState, type Dispatch } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GameContext } from './GameContext'
import { GameControls } from './GameControls'
import { createInitialState, type GameAction, type GameState } from './gameReducer'
import { getTodayString, loadDailyState } from './dailyChallenge'

function ControlsHarness({
  isDailyChallenge,
  dailyChallengeDate,
  onDispatch = vi.fn(),
}: {
  isDailyChallenge: boolean
  dailyChallengeDate?: string | null
  onDispatch?: Dispatch<GameAction>
}) {
  const [state, setState] = useState<GameState>(() => ({
    ...createInitialState('easy'),
    elapsedTime: 42,
    isDailyChallenge,
    dailyChallengeDate: dailyChallengeDate ?? (isDailyChallenge ? getTodayString() : null),
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
})
