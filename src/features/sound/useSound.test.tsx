import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSound } from './useSound'

const oscillatorStarts: number[] = []
const oscillatorStops: Array<number | undefined> = []

class MockGain {
  gain = {
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
  }
  connect = vi.fn()
}

class MockOscillator {
  frequency = { value: 0 }
  type: OscillatorType = 'sine'
  connect = vi.fn()
  start = vi.fn((time?: number) => {
    oscillatorStarts.push(time ?? 0)
  })
  stop = vi.fn((time?: number) => {
    oscillatorStops.push(time)
  })
}

class MockAudioContext {
  currentTime = 10
  destination = {}
  state: AudioContextState = 'running'
  createGain = vi.fn(() => new MockGain())
  createOscillator = vi.fn(() => new MockOscillator())
  resume = vi.fn(() => Promise.resolve())
}

function SoundHarness() {
  const first = useSound()
  const second = useSound()

  return (
    <>
      <button type="button" onClick={first.toggle}>
        Toggle first
      </button>
      <button type="button" onClick={first.toggleMusic}>
        Toggle music
      </button>
      <button type="button" onClick={() => first.play('complete')}>
        Play complete
      </button>
      <span data-testid="first">{first.enabled ? 'on' : 'off'}</span>
      <span data-testid="second">{second.enabled ? 'on' : 'off'}</span>
      <span data-testid="first-music">{first.musicEnabled ? 'on' : 'off'}</span>
      <span data-testid="second-music">{second.musicEnabled ? 'on' : 'off'}</span>
    </>
  )
}

function setDocumentVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  })
}

describe('useSound', () => {
  beforeEach(() => {
    localStorage.clear()
    oscillatorStarts.length = 0
    oscillatorStops.length = 0
    setDocumentVisibility('visible')
    vi.stubGlobal('AudioContext', MockAudioContext)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps multiple hook instances in sync and schedules clean audio cues', () => {
    render(<SoundHarness />)

    expect(screen.getByTestId('first')).toHaveTextContent('on')
    expect(screen.getByTestId('second')).toHaveTextContent('on')
    expect(screen.getByTestId('first-music')).toHaveTextContent('off')
    expect(screen.getByTestId('second-music')).toHaveTextContent('off')

    fireEvent.click(screen.getByRole('button', { name: 'Play complete' }))

    expect(oscillatorStarts).toEqual([10, 10.08, 10.16, 10.24])

    fireEvent.click(screen.getByRole('button', { name: 'Toggle music' }))

    expect(screen.getByTestId('first-music')).toHaveTextContent('on')
    expect(screen.getByTestId('second-music')).toHaveTextContent('on')

    fireEvent.click(screen.getByRole('button', { name: 'Toggle music' }))

    expect(screen.getByTestId('first-music')).toHaveTextContent('off')
    expect(screen.getByTestId('second-music')).toHaveTextContent('off')
    expect(oscillatorStops.filter((time) => time === undefined)).toHaveLength(12)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle first' }))

    expect(screen.getByTestId('first')).toHaveTextContent('off')
    expect(screen.getByTestId('second')).toHaveTextContent('off')
  })

  it('pauses background music while the page is hidden and resumes when visible', () => {
    render(<SoundHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle music' }))

    expect(screen.getByTestId('first-music')).toHaveTextContent('on')
    expect(oscillatorStarts).toHaveLength(12)

    setDocumentVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(screen.getByTestId('first-music')).toHaveTextContent('on')
    expect(oscillatorStops.filter((time) => time === undefined)).toHaveLength(12)

    setDocumentVisibility('visible')
    document.dispatchEvent(new Event('visibilitychange'))

    expect(screen.getByTestId('first-music')).toHaveTextContent('on')
    expect(oscillatorStarts).toHaveLength(24)

    window.dispatchEvent(new Event('pagehide'))

    expect(screen.getByTestId('first-music')).toHaveTextContent('on')
    expect(oscillatorStops.filter((time) => time === undefined)).toHaveLength(24)

    window.dispatchEvent(new Event('pageshow'))

    expect(screen.getByTestId('first-music')).toHaveTextContent('on')
    expect(oscillatorStarts).toHaveLength(36)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle music' }))
    expect(screen.getByTestId('first-music')).toHaveTextContent('off')
  })

  it('shares page lifecycle listeners across hook instances', () => {
    const documentAdd = vi.spyOn(document, 'addEventListener')
    const documentRemove = vi.spyOn(document, 'removeEventListener')
    const windowAdd = vi.spyOn(window, 'addEventListener')
    const windowRemove = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<SoundHarness />)

    expect(documentAdd.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1)
    expect(windowAdd.mock.calls.filter(([type]) => type === 'pagehide')).toHaveLength(1)
    expect(windowAdd.mock.calls.filter(([type]) => type === 'pageshow')).toHaveLength(1)

    unmount()

    expect(documentRemove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1)
    expect(windowRemove.mock.calls.filter(([type]) => type === 'pagehide')).toHaveLength(1)
    expect(windowRemove.mock.calls.filter(([type]) => type === 'pageshow')).toHaveLength(1)

    documentAdd.mockRestore()
    documentRemove.mockRestore()
    windowAdd.mockRestore()
    windowRemove.mockRestore()
  })
})
