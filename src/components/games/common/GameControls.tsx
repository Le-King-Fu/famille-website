'use client'

import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import type { GameState } from './types'

interface GameControlsProps {
  state: GameState
  isMuted: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onMuteToggle: () => void
}

export function GameControls({
  state,
  isMuted,
  onStart,
  onPause,
  onResume,
  onMuteToggle,
}: GameControlsProps) {
  const handlePlayPause = () => {
    if (state === 'menu' || state === 'gameover') {
      onStart()
    } else if (state === 'playing') {
      onPause()
    } else if (state === 'paused') {
      onResume()
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={handlePlayPause}
        className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg
          bg-[var(--game-bg-secondary)] text-[var(--game-text)]
          hover:bg-[var(--game-bg)] transition-colors
          border border-[var(--game-primary)]/30"
      >
        {state === 'playing' ? (
          <>
            <Pause className="h-5 w-5" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            <span>{state === 'gameover' ? 'Rejouer' : 'Jouer'}</span>
          </>
        )}
      </button>

      <button
        onClick={onMuteToggle}
        className="p-2 rounded-lg
          bg-[var(--game-bg-secondary)] text-[var(--game-text)]
          hover:bg-[var(--game-bg)] transition-colors
          border border-[var(--game-primary)]/30"
        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}
