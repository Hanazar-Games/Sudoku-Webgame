import { useGame } from './useGame'
import { Timer } from './Timer'
import { formatTime } from './utils'
import type { Difficulty } from '../../types'
import styles from './GameControls.module.css'

export function GameControls() {
  const { state, dispatch } = useGame()
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

  return (
    <div className={styles.controls}>
      <div className={styles.topRow}>
        <select
          className={styles.select}
          value={difficulty}
          onChange={(e) =>
            dispatch({ type: 'CHANGE_DIFFICULTY', difficulty: e.target.value as Difficulty })
          }
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
          onClick={() => dispatch({ type: 'NEW_GAME', difficulty })}
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
        {isNoteMode ? '笔记模式：按数字键标记或取消候选数' : '\u00A0'}
      </div>

      {isComplete && (
        <span className={styles.completed} role="status" aria-live="polite">
          恭喜完成！用时：{formatTime(elapsedTime)}
        </span>
      )}
    </div>
  )
}
