import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark'

const THEME_KEY = 'sudoku-theme'

function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function getSavedTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    // Ignore private mode
  }
  return null
}

function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Ignore
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() ?? getSystemTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes when no manual preference is saved
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (getSavedTheme() === null) {
        const next = e.matches ? 'dark' : 'light'
        setTheme(next)
      }
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light'
      saveTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}
