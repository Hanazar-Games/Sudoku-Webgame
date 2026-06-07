export type SudokuGrid = (number | null)[][]

export interface Position {
  row: number
  col: number
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 35,
  medium: 45,
  hard: 55,
}
