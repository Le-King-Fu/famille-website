'use client'

import { useCallback } from 'react'
import { useParams, notFound } from 'next/navigation'
import { GameWrapper } from '@/components/games/common'
import { PianoHeroGame } from '@/components/games/piano-hero-v2'
import { GameType } from '@prisma/client'
import type { GameMetadata } from '@/components/games/common/types'

// Game registry - add new games here
const GAMES = {
  'piano-hero-v2': {
    name: 'Piano Hero v2',
    gameType: 'PIANO_HERO_V2' as GameType,
    component: PianoHeroGame,
  },
  // Future games:
  // 'piano-hero': { ... },
  // 'witch-case': { ... },
  // 'belle-bete-sage': { ... },
} as const

type GameId = keyof typeof GAMES

export default function GamePage() {
  const params = useParams()
  const gameId = params.gameId as string

  // Check if game exists
  if (!Object.keys(GAMES).includes(gameId)) {
    notFound()
  }

  const game = GAMES[gameId as GameId]
  const GameComponent = game.component

  // Score submission handler
  const handleScoreSubmit = useCallback(async (score: number, metadata: GameMetadata) => {
    try {
      const res = await fetch('/api/games/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: game.gameType,
          score,
          metadata,
        }),
      })
      return res.ok
    } catch {
      return false
    }
  }, [game.gameType])

  return (
    <GameWrapper
      gameId={gameId}
      gameName={game.name}
      gameType={game.gameType}
    >
      <GameComponent onScoreSubmit={handleScoreSubmit} />
    </GameWrapper>
  )
}
