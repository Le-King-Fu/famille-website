'use client'

import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import { GameType } from '@prisma/client'

interface GameWrapperProps {
  gameId: string
  gameName: string
  gameType: GameType
  children: React.ReactNode
}

export function GameWrapper({ gameName, children }: GameWrapperProps) {
  return (
    <div className="game-page min-h-[calc(100vh-12rem)]">
      <header className="flex items-center justify-between mb-4">
        <Link
          href="/jeux"
          className="flex items-center gap-2 text-gray-600 hover:text-bleu transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour aux jeux</span>
        </Link>
        <Link
          href="/jeux/classement"
          className="flex items-center gap-2 text-gray-600 hover:text-terracotta transition-colors"
        >
          <Trophy className="h-5 w-5" />
          <span className="hidden sm:inline">Classement</span>
        </Link>
      </header>

      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{gameName}</h1>
      </div>

      <div className="game-container flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
