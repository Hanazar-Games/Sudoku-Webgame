import { Board } from './Board'
import { GameControls } from './GameControls'
import { GameProvider } from './GameProvider'
import { Onboarding } from './Onboarding'
import { Celebration } from './Celebration'
import { useGame } from './useGame'
import { useTheme } from '../theme/useTheme'
import { useSound } from '../sound/useSound'
import styles from './GamePage.module.css'

function GameContent() {
  const { state } = useGame()
  const { theme, toggle } = useTheme()
  const {
    enabled: soundEnabled,
    musicEnabled,
    toggle: toggleSound,
    toggleMusic,
  } = useSound()
  const { isPaused } = state

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sudoku</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? '关闭音效' : '开启音效'}
            title={soundEnabled ? '关闭音效' : '开启音效'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            className={styles.iconButton}
            type="button"
            onClick={toggleMusic}
            aria-label={musicEnabled ? '关闭背景音乐' : '开启背景音乐'}
            title={musicEnabled ? '关闭背景音乐' : '开启背景音乐'}
          >
            {musicEnabled ? '🎵' : '🎼'}
          </button>
          <button
            className={styles.iconButton}
            type="button"
            onClick={toggle}
            aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className={styles.boardWrapper}>
        <Board />
        {isPaused && (
          <div className={styles.pauseOverlay} role="dialog" aria-modal="true" aria-label="游戏已暂停">
            <span className={styles.pauseText}>已暂停</span>
            <span className={styles.resumeHint}>点击“继续”恢复游戏</span>
          </div>
        )}
      </div>

      <Onboarding />

      <p id="board-instructions" className={styles.visuallyHidden}>
        数独棋盘共 9 行 9 列。使用方向键在格子间移动焦点，数字键 1 到 9 填入数值，退格键清除。
        按 ESC 暂停或继续游戏。
      </p>

      <p className={styles.status} aria-hidden="true">
        点击或按方向键选中格子，使用键盘或下方数字键填数，方向键移动，ESC 暂停/继续。
      </p>

      <Celebration active={state.isComplete} />

      <GameControls />
    </main>
  )
}

export function GamePage() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}
