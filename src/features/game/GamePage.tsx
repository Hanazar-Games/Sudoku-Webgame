import { Board } from './Board'
import { GameControls } from './GameControls'
import { GameProvider } from './GameProvider'
import { useGame } from './useGame'
import styles from './GamePage.module.css'

function GameContent() {
  const { state } = useGame()
  const { isPaused } = state

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sudoku</h1>
      </header>

      <div className={styles.boardWrapper} inert={isPaused || undefined}>
        <Board />
        {isPaused && (
          <div className={styles.pauseOverlay} role="dialog" aria-label="Game paused">
            <span className={styles.pauseText}>Paused</span>
            <span className={styles.resumeHint}>点击“继续”恢复游戏</span>
          </div>
        )}
      </div>

      <p className={styles.status}>
        点击或按方向键选中格子，按 1-9 填数，退格或 Delete 清除。ESC 暂停。
      </p>

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
