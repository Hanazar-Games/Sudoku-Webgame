import { createContext } from 'react'
import type { GameState, GameAction } from './gameReducer'

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const GameContext = createContext<GameContextValue | null>(null)
