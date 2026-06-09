import { describe, it, expect } from 'vitest'
import { generateFullGrid, generatePuzzle } from './generator'
import { isBoardValid, isBoardComplete, isValidPlacement } from './validator'
import { solve, hasUniqueSolution, countSolutions } from './solver'
import { getCandidates, getAllCandidates, hasSingleCandidate, getAllSingleCandidates } from './candidates'

describe('Sudoku Engine', () => {
  describe('generateFullGrid', () => {
    it('generates a valid complete board', () => {
      const grid = generateFullGrid()
      expect(isBoardValid(grid)).toBe(true)
      expect(isBoardComplete(grid)).toBe(true)
    })

    it('generates different boards on multiple calls', () => {
      const grid1 = generateFullGrid()
      const grid2 = generateFullGrid()
      let same = true
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid1[r][c] !== grid2[r][c]) same = false
        }
      }
      expect(same).toBe(false)
    })
  })

  describe('validator', () => {
    it('detects invalid row', () => {
      const grid = generateFullGrid()
      grid[0][0] = grid[0][1]
      expect(isBoardValid(grid)).toBe(false)
    })

    it('detects invalid column', () => {
      const grid = generateFullGrid()
      grid[0][0] = grid[1][0]
      expect(isBoardValid(grid)).toBe(false)
    })

    it('detects invalid box', () => {
      const grid = generateFullGrid()
      grid[0][0] = grid[1][1]
      expect(isBoardValid(grid)).toBe(false)
    })

    it('rejects out-of-bounds coordinates in isValidPlacement', () => {
      const grid = generateFullGrid()
      expect(isValidPlacement(grid, -1, 0, 1)).toBe(false)
      expect(isValidPlacement(grid, 0, -1, 1)).toBe(false)
      expect(isValidPlacement(grid, 9, 0, 1)).toBe(false)
      expect(isValidPlacement(grid, 0, 9, 1)).toBe(false)
    })

    it('rejects out-of-range numbers in isValidPlacement', () => {
      const grid = generateFullGrid()
      expect(isValidPlacement(grid, 0, 0, 0)).toBe(false)
      expect(isValidPlacement(grid, 0, 0, 10)).toBe(false)
      expect(isValidPlacement(grid, 0, 0, -1)).toBe(false)
    })

    it('allows placing same number back into its own cell', () => {
      const grid = generateFullGrid()
      const val = grid[4][4]
      expect(isValidPlacement(grid, 4, 4, val!)).toBe(true)
    })

    it('returns false for empty board in isBoardComplete', () => {
      const empty = Array.from({ length: 9 }, () => Array(9).fill(null))
      expect(isBoardComplete(empty)).toBe(false)
    })

    it('returns false for full but invalid board in isBoardComplete', () => {
      const grid = generateFullGrid()
      grid[0][1] = grid[0][0]
      expect(isBoardComplete(grid)).toBe(false)
    })
  })

  describe('solver', () => {
    it('solves a valid puzzle', () => {
      const { puzzle, solution } = generatePuzzle('easy')
      const solved = solve(puzzle)
      expect(solved).not.toBeNull()

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(solved![r][c]).toBe(solution[r][c])
        }
      }
    })

    it('returns null for invalid puzzle', () => {
      const grid = generateFullGrid()
      grid[0][0] = grid[0][1]
      expect(solve(grid)).toBeNull()
    })

    it('counts solutions correctly for full grid', () => {
      const grid = generateFullGrid()
      expect(countSolutions(grid)).toBe(1)
    })

    it('counts 0 solutions for impossible puzzle', () => {
      const grid = generateFullGrid()
      // Create an impossible scenario: two cells in same row forced to same value
      grid[0][0] = 5
      grid[0][1] = 5
      expect(countSolutions(grid)).toBe(0)
    })

    it('detects multiple solutions', () => {
      // A puzzle with only 1 clue must have multiple solutions
      const grid = generateFullGrid()
      const puzzle = grid.map((row) => row.map(() => null as number | null))
      puzzle[0][0] = grid[0][0]
      const solutions = countSolutions(puzzle)
      expect(solutions).toBeGreaterThan(1)
    })
  })

  describe('candidates', () => {
    it('returns empty array for filled cell', () => {
      const grid = generateFullGrid()
      expect(getCandidates(grid, 0, 0)).toEqual([])
    })

    it('returns correct candidates for empty cell', () => {
      const grid = generateFullGrid()
      const puzzle = grid.map((row) => [...row])
      puzzle[0][0] = null
      const candidates = getCandidates(puzzle, 0, 0)
      expect(candidates).toHaveLength(1)
      expect(candidates[0]).toBe(grid[0][0])
    })

    it('returns empty array for out-of-bounds', () => {
      const grid = generateFullGrid()
      expect(getCandidates(grid, -1, 0)).toEqual([])
      expect(getCandidates(grid, 0, 9)).toEqual([])
    })

    it('computes all candidates matrix', () => {
      const { puzzle } = generatePuzzle('medium')
      const all = getAllCandidates(puzzle)
      expect(all).toHaveLength(9)
      expect(all[0]).toHaveLength(9)

      // Filled cells should have empty candidates
      let filledCount = 0
      let emptyCount = 0
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle[r][c] !== null) {
            filledCount++
            expect(all[r][c]).toEqual([])
          } else {
            emptyCount++
            expect(all[r][c].length).toBeGreaterThan(0)
          }
        }
      }
      expect(filledCount + emptyCount).toBe(81)
    })

    it('finds single candidates in nearly complete board', () => {
      const grid = generateFullGrid()
      const puzzle = grid.map((row) => [...row])
      // Leave only one cell empty
      puzzle[4][4] = null
      expect(hasSingleCandidate(puzzle, 4, 4)).toBe(true)
      expect(getAllSingleCandidates(puzzle)).toEqual([
        { row: 4, col: 4, value: grid[4][4] },
      ])
    })
  })

  describe('generatePuzzle', () => {
    it('generates puzzles with unique solution for all difficulties', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const
      for (const diff of difficulties) {
        const { puzzle } = generatePuzzle(diff)
        expect(hasUniqueSolution(puzzle)).toBe(true)
        expect(isBoardValid(puzzle)).toBe(true)
      }
    }, 15000)

    it('removes different amounts of cells based on difficulty', () => {
      const easy = generatePuzzle('easy')
      const medium = generatePuzzle('medium')
      const hard = generatePuzzle('hard')

      const countEmpty = (g: (number | null)[][]) =>
        g.flat().filter((v) => v === null).length

      expect(countEmpty(easy.puzzle)).toBeLessThan(countEmpty(medium.puzzle))
      expect(countEmpty(medium.puzzle)).toBeLessThan(countEmpty(hard.puzzle))
    })

    it('falls back to medium for invalid difficulty', () => {
      const { puzzle } = generatePuzzle('invalid' as unknown as 'easy')
      expect(isBoardValid(puzzle)).toBe(true)
      expect(hasUniqueSolution(puzzle)).toBe(true)
    })
  })

  describe('stress tests', () => {
    it('generates 20 easy puzzles with unique solutions', () => {
      for (let i = 0; i < 20; i++) {
        const { puzzle } = generatePuzzle('easy')
        expect(isBoardValid(puzzle)).toBe(true)
        expect(hasUniqueSolution(puzzle)).toBe(true)
      }
    })

    it('generates 20 medium puzzles with unique solutions', () => {
      for (let i = 0; i < 20; i++) {
        const { puzzle } = generatePuzzle('medium')
        expect(isBoardValid(puzzle)).toBe(true)
        expect(hasUniqueSolution(puzzle)).toBe(true)
      }
    })

    it('generates 5 hard puzzles with unique solutions', () => {
      for (let i = 0; i < 5; i++) {
        const { puzzle } = generatePuzzle('hard')
        expect(isBoardValid(puzzle)).toBe(true)
        expect(hasUniqueSolution(puzzle)).toBe(true)
      }
    }, 15000)
  })
})
