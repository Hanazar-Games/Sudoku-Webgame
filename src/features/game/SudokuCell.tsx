import { memo } from 'react'
import type { Cell } from '../../types'
import type { SudokuGrid } from '../../lib/sudoku'
import styles from './SudokuCell.module.css'

interface SudokuCellProps {
  cell: Cell
  solution: SudokuGrid
  isSelected: boolean
  isHighlighted: boolean
  hasSameNumber: boolean
  onSelect: (row: number, col: number) => void
}

export const SudokuCell = memo(function SudokuCell({
  cell,
  solution,
  isSelected,
  isHighlighted,
  hasSameNumber,
  onSelect,
}: SudokuCellProps) {
  const { row, col, value, isFixed, candidates } = cell

  const isError =
    !isFixed && value !== null && solution[row][col] !== value

  const classNames = [
    styles.cell,
    isFixed && styles.fixed,
    isSelected && styles.selected,
    !isSelected && isHighlighted && styles.highlighted,
    !isSelected && hasSameNumber && styles.sameNumber,
    isError && styles.error,
    value === null && candidates.length > 0 && styles.hasCandidates,
    col === 2 || col === 5 ? styles.borderRightThick : '',
    row === 2 || row === 5 ? styles.borderBottomThick : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role="button"
      tabIndex={isSelected ? 0 : -1}
      className={classNames}
      data-testid={`cell-${row}-${col}`}
      data-empty={value === null ? 'true' : undefined}
      onClick={() => onSelect(row, col)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(row, col)
        }
      }}
      aria-label={`第 ${row + 1} 行，第 ${col + 1} 列${value ? `，数值 ${value}` : '，空白'}`}
      aria-pressed={isSelected}
    >
      {value !== null ? (
        <span className={styles.valueAppear} aria-hidden="true">
          {value}
        </span>
      ) : candidates.length > 0 ? (
        <div className={styles.candidates} aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n} className={styles.candidate}>
              {candidates.includes(n) ? n : ''}
            </span>
          ))}
        </div>
      ) : (
        ''
      )}
    </div>
  )
})
