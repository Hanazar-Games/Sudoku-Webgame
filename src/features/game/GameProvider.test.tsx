import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameProvider } from './GameProvider'
import { useGame } from './useGame'

const SAVE_KEY = 'sudoku-game-save-v1'

function SaveHarness() {
  const { state, dispatch } = useGame()
  const target = state.board.flat().find((cell) => !cell.isFixed)

  return (
    <button
      type="button"
      onClick={() => {
        if (!target) return
        dispatch({ type: 'SELECT_CELL', row: target.row, col: target.col })
        dispatch({ type: 'SET_VALUE', value: 5 })
      }}
    >
      Fill editable cell
    </button>
  )
}

describe('GameProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a pending debounced save alive while the timer ticks', async () => {
    render(
      <GameProvider>
        <SaveHarness />
      </GameProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fill editable cell' }))

    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
      await Promise.resolve()
    })

    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()

    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}') as {
      board?: Array<Array<{ isFixed: boolean; value: number | null }>>
      elapsedTime?: number
    }

    expect(saved.elapsedTime).toBeGreaterThan(0)
    expect(saved.board?.flat().some((cell) => !cell.isFixed && cell.value === 5)).toBe(true)
  })
})
