import { GameType } from '@prisma/client'

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

export interface GameScore {
  id: string
  game: GameType
  score: number
  metadata: GameMetadata | null
  playedAt: Date
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface GameMetadata {
  level?: number
  startingLevel?: number
  difficulty?: string
  character?: string
  [key: string]: unknown
}

export interface GameWrapperProps {
  gameId: string
  gameName: string
  gameType: GameType
  children: React.ReactNode
}

export interface GameOverlayProps {
  state: GameState
  score: number
  highScore: number
  isNewRecord?: boolean
  onStart: () => void
  onResume: () => void
  onRestart: () => void
  onMenu: () => void
  renderMenu?: () => React.ReactNode
  renderGameOver?: () => React.ReactNode
}

export interface GameControlsProps {
  state: GameState
  isMuted: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onMuteToggle: () => void
}

export interface MobileControlsProps {
  keys: Array<{ note: string; label: string }>
  onKeyPress: (note: string) => void
  onKeyRelease: (note: string) => void
  disabled?: boolean
}
