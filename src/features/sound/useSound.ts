import { useRef, useCallback, useEffect, useState } from 'react'

export type SoundType = 'fill' | 'clear' | 'error' | 'hint' | 'complete' | 'toggle'

const SOUND_KEY = 'sudoku-sound-enabled'
const MUSIC_KEY = 'sudoku-music-enabled'
const soundSubscribers = new Set<(enabled: boolean) => void>()
const musicSubscribers = new Set<(enabled: boolean) => void>()
let cachedEnabled: boolean | null = null
let cachedMusicEnabled: boolean | null = null
let sharedAudioContext: AudioContext | null = null
let musicTimer: ReturnType<typeof setTimeout> | null = null
let musicGeneration = 0
let musicBlockedByPageLifecycle = false
const activeMusicOscillators = new Set<OscillatorNode>()

function createAudioContext(): AudioContext | null {
  if (sharedAudioContext) return sharedAudioContext
  try {
    sharedAudioContext = new AudioContext()
    return sharedAudioContext
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

function playMusicTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume = 0.018
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.frequency.value = frequency
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.12)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
  activeMusicOscillators.add(osc)
  osc.onended = () => {
    activeMusicOscillators.delete(osc)
  }
}

function scheduleMusicLoop(ctx: AudioContext, generation: number): void {
  if (generation !== musicGeneration || !cachedMusicEnabled || musicBlockedByPageLifecycle) return

  const now = ctx.currentTime
  const chords = [
    [261.63, 329.63, 392.0],
    [293.66, 349.23, 440.0],
    [246.94, 329.63, 392.0],
    [261.63, 349.23, 415.3],
  ]
  chords.forEach((chord, chordIndex) => {
    const start = now + chordIndex * 1.6
    chord.forEach((frequency, noteIndex) => {
      playMusicTone(ctx, frequency, start + noteIndex * 0.04, 1.35)
    })
  })

  musicTimer = setTimeout(() => scheduleMusicLoop(ctx, generation), 6400)
}

function startMusic(): void {
  if (musicBlockedByPageLifecycle) return
  const ctx = createAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      // Ignore
    })
  }
  if (musicTimer) return
  musicGeneration++
  scheduleMusicLoop(ctx, musicGeneration)
}

function stopMusic(): void {
  musicGeneration++
  if (musicTimer) {
    clearTimeout(musicTimer)
    musicTimer = null
  }
  activeMusicOscillators.forEach((osc) => {
    try {
      osc.stop()
    } catch {
      // Already stopped or not yet started
    }
  })
  activeMusicOscillators.clear()
}

function pauseMusicForPageLifecycle(): void {
  musicBlockedByPageLifecycle = true
  stopMusic()
}

function resumeMusicForPageLifecycle(): void {
  musicBlockedByPageLifecycle = false
  if (cachedMusicEnabled) {
    startMusic()
  }
}

function getInitialEnabled(): boolean {
  if (cachedEnabled !== null) return cachedEnabled

  try {
    const raw = localStorage.getItem(SOUND_KEY)
    cachedEnabled = raw !== 'false'
  } catch {
    cachedEnabled = true
  }

  return cachedEnabled
}

function setGlobalEnabled(enabled: boolean): void {
  cachedEnabled = enabled
  try {
    localStorage.setItem(SOUND_KEY, String(enabled))
  } catch {
    // Ignore
  }
  soundSubscribers.forEach((subscriber) => subscriber(enabled))
}

function getInitialMusicEnabled(): boolean {
  if (cachedMusicEnabled !== null) return cachedMusicEnabled

  try {
    cachedMusicEnabled = localStorage.getItem(MUSIC_KEY) === 'true'
  } catch {
    cachedMusicEnabled = false
  }

  return cachedMusicEnabled
}

function setGlobalMusicEnabled(enabled: boolean): void {
  cachedMusicEnabled = enabled
  try {
    localStorage.setItem(MUSIC_KEY, String(enabled))
  } catch {
    // Ignore
  }
  if (enabled && !musicBlockedByPageLifecycle) {
    startMusic()
  } else {
    stopMusic()
  }
  musicSubscribers.forEach((subscriber) => subscriber(enabled))
}

function subscribeToSoundEnabled(subscriber: (enabled: boolean) => void): () => void {
  soundSubscribers.add(subscriber)
  return () => {
    soundSubscribers.delete(subscriber)
  }
}

function subscribeToMusicEnabled(subscriber: (enabled: boolean) => void): () => void {
  musicSubscribers.add(subscriber)
  return () => {
    musicSubscribers.delete(subscriber)
  }
}

export function useSound() {
  const [enabled, setEnabled] = useState(() => getInitialEnabled())
  const [musicEnabled, setMusicEnabled] = useState(() => getInitialMusicEnabled())
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => subscribeToSoundEnabled(setEnabled), [])
  useEffect(() => subscribeToMusicEnabled(setMusicEnabled), [])
  useEffect(() => {
    if (musicEnabled) {
      startMusic()
    }
  }, [musicEnabled])
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        pauseMusicForPageLifecycle()
      } else {
        resumeMusicForPageLifecycle()
      }
    }

    function handlePageHide() {
      pauseMusicForPageLifecycle()
    }

    function handlePageShow() {
      if (document.visibilityState !== 'hidden') {
        resumeMusicForPageLifecycle()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

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
    setGlobalEnabled(!getInitialEnabled())
  }, [])

  const toggleMusic = useCallback(() => {
    setGlobalMusicEnabled(!getInitialMusicEnabled())
  }, [])

  return { enabled, musicEnabled, play, toggle, toggleMusic }
}
