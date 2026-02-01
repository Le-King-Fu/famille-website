'use client'

import type { GameState } from './types'

interface GameOverlayProps {
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

export function GameOverlay({
  state,
  score,
  highScore,
  isNewRecord,
  onStart,
  onResume,
  onRestart,
  onMenu,
  renderMenu,
  renderGameOver,
}: GameOverlayProps) {
  if (state === 'playing') return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--game-bg)]/90 backdrop-blur-sm z-10">
      <div className="text-center p-8">
        {state === 'menu' && (
          renderMenu?.() ?? (
            <div className="space-y-6">
              <h2
                className="text-4xl font-bold text-[var(--game-text)] drop-shadow-[0_0_10px_var(--game-primary)]"
              >
                PRÊT ?
              </h2>
              {highScore > 0 && (
                <p className="text-[var(--game-secondary)]">
                  Record: <span className="font-bold">{highScore.toLocaleString()}</span>
                </p>
              )}
              <button
                onClick={onStart}
                className="px-8 py-3 text-xl font-bold text-[var(--game-bg)] bg-[var(--game-primary)] rounded-lg
                  hover:bg-[var(--game-primary-dark)] transition-colors
                  shadow-[0_0_20px_var(--game-primary)]"
              >
                JOUER
              </button>
            </div>
          )
        )}

        {state === 'paused' && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-[var(--game-text)]">
              PAUSE
            </h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onResume}
                className="px-6 py-2 font-bold text-[var(--game-bg)] bg-[var(--game-secondary)] rounded-lg
                  hover:opacity-90 transition-opacity"
              >
                REPRENDRE
              </button>
              <button
                onClick={onMenu}
                className="px-6 py-2 font-bold text-[var(--game-text)] border-2 border-[var(--game-text)] rounded-lg
                  hover:bg-[var(--game-text)]/10 transition-colors"
              >
                MENU
              </button>
            </div>
          </div>
        )}

        {state === 'gameover' && (
          renderGameOver?.() ?? (
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-[var(--game-accent)]">
                GAME OVER
              </h2>
              <div className="space-y-2">
                <p className="text-2xl text-[var(--game-text)]">
                  Score: <span className="font-bold text-[var(--game-primary)]">{score.toLocaleString()}</span>
                </p>
                {isNewRecord && (
                  <p className="text-lg text-[var(--game-gold)] animate-pulse">
                    NOUVEAU RECORD !
                  </p>
                )}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={onRestart}
                  className="px-6 py-2 font-bold text-[var(--game-bg)] bg-[var(--game-primary)] rounded-lg
                    hover:bg-[var(--game-primary-dark)] transition-colors"
                >
                  REJOUER
                </button>
                <button
                  onClick={onMenu}
                  className="px-6 py-2 font-bold text-[var(--game-text)] border-2 border-[var(--game-text)] rounded-lg
                    hover:bg-[var(--game-text)]/10 transition-colors"
                >
                  MENU
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
