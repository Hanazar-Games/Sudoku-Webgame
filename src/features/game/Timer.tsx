import { memo } from 'react'
import { useGame } from './useGame'
import { formatTime } from './utils'
import styles from './GameControls.module.css'

export const Timer = memo(function Timer() {
  const { state } = useGame()
  return (
    <span className={styles.timer} aria-live="off">
      {formatTime(state.elapsedTime)}
    </span>
  )
})
