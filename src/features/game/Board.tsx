import { useCallback, useEffect } from 'react'
import { useGame } from './useGame'
import { SudokuCell } from './SudokuCell'
import styles from './Board.module.css'

export function Board() {
  const { state, dispatch } = useGame()
  const { board, solution, selectedCell, isPaused } = state

  const handleSelectCell = useCallback(
    (row: number, col: number) => {
      if (isPaused) return
      dispatch({ type: 'SELECT_CELL', row, col })
    },
    [dispatch, isPaused]
  )

  // 键盘输入处理
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isPaused) return

      // 避免拦截表单元素内的键盘事件
      const target = e.target as HTMLElement
      const isFormElement =
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
        target.isContentEditable
      if (isFormElement) return

      // 数字输入 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        dispatch({ type: 'SET_VALUE', value: parseInt(e.key, 10) })
        return
      }

      // 删除 / 退格
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        dispatch({ type: 'CLEAR_VALUE' })
        return
      }

      // 暂停/恢复
      if (e.key === 'Escape') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_PAUSE' })
        return
      }

      // 方向键
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          dispatch({ type: 'MOVE_SELECTION', direction: 'up' })
          break
        case 'ArrowDown':
          e.preventDefault()
          dispatch({ type: 'MOVE_SELECTION', direction: 'down' })
          break
        case 'ArrowLeft':
          e.preventDefault()
          dispatch({ type: 'MOVE_SELECTION', direction: 'left' })
          break
        case 'ArrowRight':
          e.preventDefault()
          dispatch({ type: 'MOVE_SELECTION', direction: 'right' })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, isPaused])

  const selectedValue = selectedCell
    ? board[selectedCell.row][selectedCell.col].value
    : null

  return (
    <div
      className={styles.board}
      role="grid"
      aria-label="Sudoku board"
      inert={isPaused || undefined}
    >
      {board.map((row) =>
        row.map((cell) => {
          const isSelected =
            selectedCell?.row === cell.row && selectedCell?.col === cell.col

          const isHighlighted =
            selectedCell !== null &&
            !isSelected &&
            (selectedCell.row === cell.row ||
              selectedCell.col === cell.col ||
              (Math.floor(selectedCell.row / 3) === Math.floor(cell.row / 3) &&
                Math.floor(selectedCell.col / 3) === Math.floor(cell.col / 3)))

          const hasSameNumber =
            selectedValue !== null &&
            !isSelected &&
            cell.value === selectedValue

          return (
            <SudokuCell
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              solution={solution}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              hasSameNumber={hasSameNumber}
              onSelect={handleSelectCell}
            />
          )
        })
      )}
    </div>
  )
}
