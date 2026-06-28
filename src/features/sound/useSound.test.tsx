import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSound } from './useSound'

function SoundHarness() {
  const first = useSound()
  const second = useSound()

  return (
    <>
      <button type="button" onClick={first.toggle}>
        Toggle first
      </button>
      <span data-testid="first">{first.enabled ? 'on' : 'off'}</span>
      <span data-testid="second">{second.enabled ? 'on' : 'off'}</span>
    </>
  )
}

describe('useSound', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps multiple hook instances in sync', () => {
    render(<SoundHarness />)

    expect(screen.getByTestId('first')).toHaveTextContent('on')
    expect(screen.getByTestId('second')).toHaveTextContent('on')

    fireEvent.click(screen.getByRole('button', { name: 'Toggle first' }))

    expect(screen.getByTestId('first')).toHaveTextContent('off')
    expect(screen.getByTestId('second')).toHaveTextContent('off')
  })
})
