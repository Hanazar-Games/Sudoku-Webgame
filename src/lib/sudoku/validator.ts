import type { SudokuGrid } from './types'

/**
 * 检查在指定位置放置数字是否违反数独规则（同行、同列、同宫）
 */
export function isValidPlacement(
  grid: SudokuGrid,
  row: number,
  col: number,
  num: number
): boolean {
  if (row < 0 || row > 8 || col < 0 || col > 8) return false
  if (num < 1 || num > 9) return false

  // 检查行
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false
  }

  // 检查列
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false
  }

  // 检查 3x3 宫
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return false
    }
  }

  return true
}

/**
 * 检查当前棋盘上已填的所有数字是否都符合规则
 * 注意：空格（null）不参与检查
 */
export function isBoardValid(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col]
      if (value !== null && !isValidPlacement(grid, row, col, value)) {
        return false
      }
    }
  }
  return true
}

/**
 * 检查棋盘是否已完成（无空格且全部合法）
 */
export function isBoardComplete(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) return false
    }
  }
  return isBoardValid(grid)
}

/**
 * 获取某行已使用的数字集合
 */
export function getRowUsed(grid: SudokuGrid, row: number): Set<number> {
  const used = new Set<number>()
  for (let c = 0; c < 9; c++) {
    const val = grid[row][c]
    if (val !== null) used.add(val)
  }
  return used
}

/**
 * 获取某列已使用的数字集合
 */
export function getColUsed(grid: SudokuGrid, col: number): Set<number> {
  const used = new Set<number>()
  for (let r = 0; r < 9; r++) {
    const val = grid[r][col]
    if (val !== null) used.add(val)
  }
  return used
}

/**
 * 获取某宫已使用的数字集合
 */
export function getBoxUsed(grid: SudokuGrid, row: number, col: number): Set<number> {
  const used = new Set<number>()
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const val = grid[r][c]
      if (val !== null) used.add(val)
    }
  }
  return used
}
