import { useRef, useEffect } from 'react'
import { useGame } from './useGame'
import { useStats } from './useStats'
import { Timer } from './Timer'
import { formatTime } from './utils'
import type { Difficulty } from '../../types'
import styles from './GameControls.module.css'

export function GameControls() {
  const { state, dispatch } = useGame()
  const { stats, recordWin, resetStreak } = useStats()
  const {
    difficulty,
    isComplete,
    isPaused,
    isNoteMode,
    historyIndex,
    moveHistory,
    elapsedTime,
  } = state

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < moveHistory.length - 1
  const diffStats = stats[difficulty]

  // Detect game completion and record stats (once per game)
  const prevIsCompleteRef = useRef(isComplete)

  useEffect(() => {
    // Reset tracking on new game (elapsedTime resets to 0 while not complete)
    if (elapsedTime === 0 && !isComplete) {
      prevIsCompleteRef.current = false
    }

    if (!prevIsCompleteRef.current && isComplete) {
      recordWin(difficulty, elapsedTime)
      prevIsCompleteRef.current = true
    }
  }, [isComplete, elapsedTime, difficulty, recordWin])

  return (
    <div className={styles.controls}>
      <div className={styles.topRow}>
        <select
          className={styles.select}
          value={difficulty}
          disabled={isPaused}
          onChange={(e) => {
            const value = e.target.value
            const validDifficulties: readonly string[] = ['easy', 'medium', 'hard']
            if (validDifficulties.includes(value)) {
              dispatch({ type: 'CHANGE_DIFFICULTY', difficulty: value as Difficulty })
            }
          }}
          aria-label="难度"
        >
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>

        <Timer />

        <button
          className={styles.buttonPrimary}
          type="button"
          onClick={() => {
            if (!isComplete) {
              resetStreak()
            }
            dispatch({ type: 'NEW_GAME', difficulty })
          }}
        >
          新游戏
        </button>
      </div>

      <div className={styles.actionRow}>
        <button
          className={`${styles.button} ${isNoteMode ? styles.buttonActive : ''}`}
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_NOTE_MODE' })}
          aria-pressed={isNoteMode}
        >
          笔记
        </button>

        <button
          className={styles.button}
          type="button"
          onClick={() => dispatch({ type: 'USE_HINT' })}
          disabled={isPaused || isComplete}
        >
          提示
        </button>

        <button
          className={styles.button}
          type="button"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
          aria-label="撤销"
        >
          撤销
        </button>

        <button
          className={styles.button}
          type="button"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
          aria-label="重做"
        >
          重做
        </button>

        <button
          className={styles.button}
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
          disabled={isComplete}
        >
          {isPaused ? '继续' : '暂停'}
        </button>
      </div>

      <div className={styles.noteHint} aria-live="polite">
        {isNoteMode ? '笔记模式：按数字键标记或取消候选数' : ''}
      </div>

      {/* 虚拟数字键盘 */}
      <div className={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            className={styles.key}
            type="button"
            onClick={() => dispatch({ type: 'SET_VALUE', value: n })}
            disabled={isPaused || isComplete}
            aria-label={`输入 ${n}`}
          >
            {n}
          </button>
        ))}
        <button
          className={`${styles.key} ${styles.keyClear}`}
          type="button"
          onClick={() => dispatch({ type: 'CLEAR_VALUE' })}
          disabled={isPaused || isComplete}
          aria-label="清除"
        >
          ⌫
        </button>
      </div>

      {isComplete && (
        <span className={styles.completed} role="status" aria-live="polite">
          恭喜完成！用时：{formatTime(elapsedTime)}
        </span>
      )}

      <div className={styles.statsRow}>
        <span className={styles.statItem}>
          <span className={styles.statLabel}>已完成</span>
          <span className={styles.statValue}>{diffStats.gamesWon}</span>
        </span>
        <span className={styles.statItem}>
          <span className={styles.statLabel}>最佳用时</span>
          <span className={styles.statValue}>
            {diffStats.bestTime !== null ? formatTime(diffStats.bestTime) : '--:--'}
          </span>
        </span>
        <span className={styles.statItem}>
          <span className={styles.statLabel}>连胜</span>
          <span className={styles.statValue}>{stats.currentStreak}</span>
        </span>
        <span className={styles.statItem}>
          <span className={styles.statLabel}>最佳连胜</span>
          <span className={styles.statValue}>{stats.bestStreak}</span>
        </span>
      </div>
    </div>
  )
}
