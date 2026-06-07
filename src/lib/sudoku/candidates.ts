import type { SudokuGrid } from './types'
import { getRowUsed, getColUsed, getBoxUsed } from './validator'

/**
 * 计算指定格子的候选数（可填入的数字集合）
 * 如果格子已有值，返回空数组
 */
export function getCandidates(grid: SudokuGrid, row: number, col: number): number[] {
  if (row < 0 || row > 8 || col < 0 || col > 8) return []
  if (grid[row][col] !== null) return []

  const used = new Set<number>([
    ...getRowUsed(grid, row),
    ...getColUsed(grid, col),
    ...getBoxUsed(grid, row, col),
  ])

  const candidates: number[] = []
  for (let num = 1; num <= 9; num++) {
    if (!used.has(num)) candidates.push(num)
  }
  return candidates
}

/**
 * 获取整个棋盘的候选数矩阵
 * @returns 9x9 数组，每个元素是该格子的候选数数组
 */
export function getAllCandidates(grid: SudokuGrid): number[][][] {
  const result: number[][][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [])
  )

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      result[row][col] = getCandidates(grid, row, col)
    }
  }

  return result
}

/**
 * 检查某格是否只有一个候选数（唯一候选）
 */
export function hasSingleCandidate(grid: SudokuGrid, row: number, col: number): boolean {
  return getCandidates(grid, row, col).length === 1
}

/**
 * 获取所有只有一个候选数的格子列表
 */
export function getAllSingleCandidates(
  grid: SudokuGrid
): Array<{ row: number; col: number; value: number }> {
  const singles: Array<{ row: number; col: number; value: number }> = []

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const candidates = getCandidates(grid, row, col)
      if (candidates.length === 1) {
        singles.push({ row, col, value: candidates[0] })
      }
    }
  }

  return singles
}
