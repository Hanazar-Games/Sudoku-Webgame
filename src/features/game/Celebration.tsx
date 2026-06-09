import { useState, useEffect, useMemo } from 'react'
import styles from './Celebration.module.css'

interface Particle {
  id: number
  tx: number
  ty: number
  color: string
  size: number
  duration: number
  delay: number
  shape: 'circle' | 'square'
}

function createParticles(count: number): Particle[] {
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#c7ceea', '#ffd93d', '#6bcb77']
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 120 + Math.random() * 280
    return {
      id: i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      duration: 1.2 + Math.random() * 1.2,
      delay: Math.random() * 0.4,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }
  })
}

export function Celebration({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false)
  const particles = useMemo(() => createParticles(50), [])

  useEffect(() => {
    if (active) {
      queueMicrotask(() => setVisible(true))
      const timer = setTimeout(() => setVisible(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [active])

  if (!visible) return null

  return (
    <div className={styles.overlay} aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`${styles.particle} ${p.shape === 'square' ? styles.square : ''}`}
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--color': p.color,
            '--size': `${p.size}px`,
            '--duration': `${p.duration}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
      <div className={styles.centerText}>🎉</div>
    </div>
  )
}
