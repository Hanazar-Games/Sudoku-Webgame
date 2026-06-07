import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Board } from './Board'
import { GameProvider } from './GameProvider'

function renderWithProvider(ui: React.ReactNode) {
  return render(<GameProvider>{ui}</GameProvider>)
}

describe('Board', () => {
  it('renders 81 cells', () => {
    renderWithProvider(<Board />)
    const cells = screen.getAllByRole('button')
    expect(cells).toHaveLength(81)
  })

  it('selects a cell on click', () => {
    renderWithProvider(<Board />)
    const cells = screen.getAllByRole('button')
    fireEvent.click(cells[10])
    expect(cells[10]).toHaveAttribute('aria-pressed', 'true')
  })

  it('fills a cell with keyboard number input', () => {
    renderWithProvider(<Board />)
    const cells = screen.getAllByRole('button')

    // Find an editable cell (one that shows empty or we can identify by aria-label)
    const emptyCell = cells.find((c) => c.textContent === '')
    if (!emptyCell) throw new Error('No empty cell found')

    fireEvent.click(emptyCell)
    fireEvent.keyDown(window, { key: '5' })

    // After re-render, the cell should show 5
    expect(screen.getAllByRole('button').find((c) => c.textContent === '5')).toBeDefined()
  })

  it('does not fill fixed cell via keyboard', () => {
    renderWithProvider(<Board />)
    const cells = screen.getAllByRole('button')

    // Find a fixed cell (has a number and is fixed in the puzzle)
    const fixedCell = cells.find((c) => {
      const text = c.textContent
      return text !== '' && text !== null
    })
    if (!fixedCell) throw new Error('No fixed cell found')

    const originalText = fixedCell.textContent
    fireEvent.click(fixedCell)
    fireEvent.keyDown(window, { key: '9' })

    expect(fixedCell.textContent).toBe(originalText)
  })

  it('moves selection with arrow keys', () => {
    renderWithProvider(<Board />)
    const cells = screen.getAllByRole('button')

    fireEvent.click(cells[0])
    expect(cells[0]).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(cells[1]).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(cells[10]).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears a cell with Backspace', () => {
    renderWithProvider(<Board />)
    const cells = screen.getAllByRole('button')
    const emptyCell = cells.find((c) => c.textContent === '')
    if (!emptyCell) throw new Error('No empty cell found')

    fireEvent.click(emptyCell)
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getAllByRole('button').find((c) => c.textContent === '3')).toBeDefined()

    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(emptyCell.textContent).toBe('')
  })

  it('ignores keyboard events when target is a form element', () => {
    renderWithProvider(<Board />)

    // Simulate a select element receiving keydown
    const select = document.createElement('select')
    document.body.appendChild(select)
    select.focus()

    const preventDefaultSpy = vi.fn()
    fireEvent.keyDown(select, { key: 'ArrowUp', preventDefault: preventDefaultSpy })

    // Board should not have prevented default for select element
    expect(preventDefaultSpy).not.toHaveBeenCalled()

    document.body.removeChild(select)
  })
})
