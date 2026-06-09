import { useRef, useCallback, useState } from 'react'

export type SoundType = 'fill' | 'clear' | 'error' | 'hint' | 'complete' | 'toggle'

const SOUND_KEY = 'sudoku-sound-enabled'

function createAudioContext(): AudioContext | null {
  try {
    return new AudioContext()
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.frequency.value = frequency
  osc.type = type
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playArpeggio(ctx: AudioContext): void {
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
  const now = ctx.currentTime
  notes.forEach((freq, i) => {
    playTone(ctx, freq, 0.25, 'sine', 0.06)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.06, now + i * 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.25)
    osc.start(now + i * 0.08)
    osc.stop(now + i * 0.08 + 0.25)
  })
}

function playSoundEffect(ctx: AudioContext, type: SoundType): void {
  switch (type) {
    case 'fill':
      playTone(ctx, 523, 0.1)
      break
    case 'clear':
      playTone(ctx, 330, 0.08)
      break
    case 'error':
      playTone(ctx, 180, 0.12, 'sawtooth', 0.06)
      break
    case 'hint':
      playTone(ctx, 880, 0.1)
      break
    case 'complete':
      playArpeggio(ctx)
      break
    case 'toggle':
      playTone(ctx, 440, 0.06)
      break
  }
}

function getInitialEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_KEY)
    return raw !== 'false'
  } catch {
    return true
  }
}

function saveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled))
  } catch {
    // Ignore
  }
}

export function useSound() {
  const [enabled, setEnabled] = useState(() => getInitialEnabled())
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback(
    (type: SoundType) => {
      if (!enabled) return
      if (!ctxRef.current) {
        ctxRef.current = createAudioContext()
      }
      const ctx = ctxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
          // Ignore
        })
      }
      playSoundEffect(ctx, type)
    },
    [enabled]
  )

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      saveEnabled(next)
      return next
    })
  }, [])

  return { enabled, play, toggle }
}
