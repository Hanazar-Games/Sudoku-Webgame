import type { Difficulty, SudokuGrid } from './types'
import { DIFFICULTY_CELLS_TO_REMOVE } from './types'
import { isValidPlacement } from './validator'
import { hasUniqueSolution } from './solver'

export type Rng = () => number

function createSeededRng(seed: number): Rng {
  let s = seed >>> 0
  if (s === 0) s = 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * 生成一个完整的有效数独解
 */
export function generateFullGrid(seed?: number): SudokuGrid {
  const rng = seed !== undefined ? createSeededRng(seed) : Math.random
  const grid: SudokuGrid = Array.from({ length: 9 }, () => Array(9).fill(null))

  // 填充对角线的 3 个 3x3 宫（它们互不干扰）
  fillDiagonalBoxes(grid, rng)

  // 回溯填充剩余格子
  backtrackFill(grid, rng)

  return grid
}

function fillDiagonalBoxes(grid: SudokuGrid, rng: Rng): void {
  for (let box = 0; box < 3; box++) {
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
    let idx = 0
    for (let r = box * 3; r < box * 3 + 3; r++) {
      for (let c = box * 3; c < box * 3 + 3; c++) {
        grid[r][c] = nums[idx++]
      }
    }
  }
}

function backtrackFill(grid: SudokuGrid, rng: Rng): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] !== null) continue

      const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)
      for (const num of nums) {
        if (isValidPlacement(grid, row, col, num)) {
          grid[row][col] = num
          if (backtrackFill(grid, rng)) return true
          grid[row][col] = null
        }
      }
      return false
    }
  }
  return true
}

/**
 * 根据难度生成数独题目
 * 保证每个题目有唯一解
 */
export function generatePuzzle(difficulty: Difficulty, seed?: number): {
  solution: SudokuGrid
  puzzle: SudokuGrid
} {
  const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard']
  const safeDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium'

  const solution = generateFullGrid(seed)
  const puzzle = solution.map((row) => [...row])

  const cellsToRemove = DIFFICULTY_CELLS_TO_REMOVE[safeDifficulty]
  const rng = seed !== undefined ? createSeededRng(seed) : Math.random
  const positions = shuffleArray(
    Array.from({ length: 81 }, (_, i) => ({
      row: Math.floor(i / 9),
      col: i % 9,
    })),
    rng
  )

  let removed = 0
  for (const { row, col } of positions) {
    if (removed >= cellsToRemove) break
    if (puzzle[row][col] === null) continue

    const original = puzzle[row][col]
    puzzle[row][col] = null

    if (hasUniqueSolution(puzzle)) {
      removed++
    } else {
      puzzle[row][col] = original
    }
  }

  return { solution, puzzle }
}

function shuffleArray<T>(array: T[], rng: Rng): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
