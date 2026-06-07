import type { SudokuGrid } from './types'
import { isValidPlacement, isBoardValid } from './validator'

/**
 * 使用回溯法求解数独
 * @returns 若有解返回完整棋盘，若无解返回 null
 */
export function solve(grid: SudokuGrid): SudokuGrid | null {
  const copy = grid.map((row) => [...row])

  // 先检查当前棋盘是否已有冲突
  if (!isBoardValid(copy)) return null

  function backtrack(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (copy[row][col] !== null) continue

        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(copy, row, col, num)) {
            copy[row][col] = num
            if (backtrack()) return true
            copy[row][col] = null
          }
        }
        return false
      }
    }
    return true
  }

  if (backtrack()) return copy
  return null
}

/**
 * 计算数独解的数量（用于验证唯一解）
 * 上限设为 2，超过 2 即停止，用于性能优化
 */
export function countSolutions(grid: SudokuGrid): number {
  if (!isBoardValid(grid)) return 0

  let count = 0

  function backtrack(): void {
    if (count >= 2) return

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== null) continue

        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            grid[row][col] = num
            backtrack()
            grid[row][col] = null
          }
        }
        return
      }
    }
    count++
  }

  backtrack()
  return count
}

/**
 * 检查数独是否有且仅有一个解
 */
export function hasUniqueSolution(grid: SudokuGrid): boolean {
  const copy = grid.map((row) => [...row])
  return countSolutions(copy) === 1
}
