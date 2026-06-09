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

      <div className={styles.boardWrapper}>
        <Board />
        {isPaused && (
          <div className={styles.pauseOverlay} role="dialog" aria-modal="true" aria-label="游戏已暂停">
            <span className={styles.pauseText}>已暂停</span>
            <span className={styles.resumeHint}>点击“继续”恢复游戏</span>
          </div>
        )}
      </div>

      <p className={styles.status}>
        点击或按方向键选中格子，使用键盘或下方数字键填数，方向键移动，ESC 暂停/继续。
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
