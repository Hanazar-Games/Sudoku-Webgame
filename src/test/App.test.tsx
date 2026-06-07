import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../app/App'

describe('App', () => {
  it('renders title and new game button', () => {
    render(<App />)
    expect(screen.getByText('Sudoku')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /新游戏/ })).toBeInTheDocument()
  })
})
