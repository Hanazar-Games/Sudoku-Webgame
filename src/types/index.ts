export type CellValue = number | null

export interface Cell {
  row: number
  col: number
  value: CellValue
  isFixed: boolean
  candidates: number[]
}

export type Difficulty = 'easy' | 'medium' | 'hard'
