import { useCallback, useEffect, useRef } from 'react'
import { useGame } from './useGame'
import { useSound } from '../sound/useSound'
import { SudokuCell } from './SudokuCell'
import styles from './Board.module.css'

function focusCell(row: number, col: number) {
  const el = document.querySelector<HTMLElement>(`[data-testid="cell-${row}-${col}"]`)
  if (el && document.activeElement !== el) {
    el.focus({ preventScroll: true })
  }
}

export function Board() {
  const { state, dispatch } = useGame()
  const { play } = useSound()
  const { board, solution, selectedCell, isPaused } = state

  const boardRef = useRef(board)
  const selectedCellRef = useRef(selectedCell)
  const playRef = useRef(play)
  const isPausedRef = useRef(isPaused)

  useEffect(() => { boardRef.current = board }, [board])
  useEffect(() => { selectedCellRef.current = selectedCell }, [selectedCell])
  useEffect(() => { playRef.current = play }, [play])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  const handleSelectCell = useCallback(
    (row: number, col: number) => {
      if (isPausedRef.current) return
      dispatch({ type: 'SELECT_CELL', row, col })
    },
    [dispatch]
  )

  // 键盘输入处理（只绑定一次，通过 ref 读取最新状态避免频繁重建）
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // 避免拦截表单元素内的键盘事件
      const target = e.target as HTMLElement
      const isFormElement =
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
        target.isContentEditable
      if (isFormElement) return

      // 如果焦点在棋盘外的可交互元素（按钮、链接）上，不拦截数字键/方向键
      const inBoard =
        typeof target.closest === 'function' &&
        target.closest('[role="grid"]') !== null
      const isInteractiveOutside =
        !inBoard &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          (typeof target.closest === 'function' &&
            target.closest('button, a') !== null))
      if (isInteractiveOutside) return

      // ESC 始终响应（暂停/恢复）
      if (e.key === 'Escape') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_PAUSE' })
        return
      }

      if (isPausedRef.current) return

      const currentSelected = selectedCellRef.current
      const currentBoard = boardRef.current
      const currentPlay = playRef.current

      // 数字输入 1-9
      if (e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        if (currentSelected && !currentBoard[currentSelected.row][currentSelected.col].isFixed) {
          currentPlay('fill')
        }
        dispatch({ type: 'SET_VALUE', value: parseInt(e.key, 10) })
        return
      }

      // 删除 / 退格
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        if (currentSelected && !currentBoard[currentSelected.row][currentSelected.col].isFixed) {
          currentPlay('clear')
        }
        dispatch({ type: 'CLEAR_VALUE' })
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
  }, [dispatch])

  // Focus management: move focus to selected cell on keyboard navigation
  useEffect(() => {
    if (isPaused || !selectedCell) return
    focusCell(selectedCell.row, selectedCell.col)
  }, [selectedCell, isPaused])

  const selectedValue = selectedCell
    ? board[selectedCell.row][selectedCell.col].value
    : null

  return (
    <div
      className={styles.board}
      role="grid"
      aria-label="数独棋盘"
      aria-describedby="board-instructions"
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
