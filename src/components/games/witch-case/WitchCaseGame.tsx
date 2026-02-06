'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Renderer, type Letter } from './systems/Renderer'
import { Audio } from './systems/Audio'
import { Snake } from './entities/Snake'
import {
  CANVAS,
  GRID,
  PATTERN,
  KEYS,
  DIFFICULTY_LEVELS,
  BONUS,
  SCORING,
  type DifficultyLevel,
  type Direction,
} from './config'
import type { GameMetadata } from '../common/types'

// =============================================================================
// TYPES
// =============================================================================

type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

interface WitchCaseGameProps {
  onScoreSubmit?: (score: number, metadata: GameMetadata) => Promise<boolean>
  onGameOver?: (score: number, isNewRecord: boolean) => void
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRandomPosition(
  occupiedPositions: Set<string>,
  gridSize: number
): { x: number; y: number } | null {
  const availablePositions: { x: number; y: number }[] = []

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupiedPositions.has(`${x},${y}`)) {
        availablePositions.push({ x, y })
      }
    }
  }

  if (availablePositions.length === 0) return null

  return availablePositions[Math.floor(Math.random() * availablePositions.length)]
}

function generateLetters(
  snake: Snake,
  difficulty: DifficultyLevel
): Letter[] {
  const letters: Letter[] = []
  const occupiedPositions = snake.getOccupiedPositions()
  const targetLetter = snake.getTargetLetter()

  // Always spawn 1 target letter
  const targetPos = getRandomPosition(occupiedPositions, GRID.SIZE)
  if (targetPos) {
    letters.push({
      ...targetPos,
      letter: targetLetter,
      isTarget: true,
      isDecoy: false,
    })
    occupiedPositions.add(`${targetPos.x},${targetPos.y}`)
  }

  // Spawn other LANDRY letters (decoys that reset progress if wrong)
  const landryLetters = PATTERN.toUpperCase().split('') // 'LANDRY'
  const nonTargetLetters = landryLetters.filter((l) => l !== targetLetter)

  // Spawn 2-4 non-target LANDRY letters
  const numDecoys = 2 + Math.floor(Math.random() * 3)
  for (let i = 0; i < numDecoys && nonTargetLetters.length > 0; i++) {
    const pos = getRandomPosition(occupiedPositions, GRID.SIZE)
    if (pos) {
      const letter = nonTargetLetters[Math.floor(Math.random() * nonTargetLetters.length)]
      letters.push({
        ...pos,
        letter,
        isTarget: false,
        isDecoy: false,
      })
      occupiedPositions.add(`${pos.x},${pos.y}`)
    }
  }

  // In hard mode, add PASCAL letters as extra decoys
  if (difficulty.pascalDecoys) {
    const pascalLetters = 'PASCAL'.split('')
    const numPascalDecoys = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < numPascalDecoys; i++) {
      const pos = getRandomPosition(occupiedPositions, GRID.SIZE)
      if (pos) {
        const letter = pascalLetters[Math.floor(Math.random() * pascalLetters.length)]
        letters.push({
          ...pos,
          letter,
          isTarget: false,
          isDecoy: true,
        })
        occupiedPositions.add(`${pos.x},${pos.y}`)
      }
    }
  }

  return letters
}

/**
 * Count how many complete "LANDRY" patterns are in the snake body.
 * Scans the full string for non-overlapping occurrences anywhere
 * (e.g. "LAxLANDRY" → 1, "LANDRYxxLANDRY" → 2).
 */
function countLandryPatterns(snakeString: string): number {
  const str = snakeString.toUpperCase()
  let count = 0
  let pos = 0

  while (pos + 6 <= str.length) {
    if (str.substring(pos, pos + 6) === 'LANDRY') {
      count++
      pos += 6
    } else {
      pos++
    }
  }

  return count
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WitchCaseGame({ onScoreSubmit, onGameOver }: WitchCaseGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const audioRef = useRef<Audio | null>(null)
  const snakeRef = useRef<Snake | null>(null)
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [landryCount, setLandryCount] = useState(0)
  const [selectedDifficulty, setSelectedDifficulty] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // Bonus overlay state (shows while game continues)
  const [showBonus, setShowBonus] = useState(false)
  const [bonusText, setBonusText] = useState('')

  // Game data refs
  const scoreRef = useRef(0)
  const landryCountRef = useRef(0)
  const lettersRef = useRef<Letter[]>([])
  const difficultyRef = useRef<DifficultyLevel>(DIFFICULTY_LEVELS.easy)
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const difficulties = Object.values(DIFFICULTY_LEVELS)

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('witchCaseHighScore')
      if (saved) setHighScore(parseInt(saved, 10))
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Initialize renderer and audio
  useEffect(() => {
    if (!canvasRef.current) return

    rendererRef.current = new Renderer(canvasRef.current)
    audioRef.current = new Audio()
    snakeRef.current = new Snake()

    // Draw initial menu
    rendererRef.current.drawMenu(highScore, selectedDifficulty, difficulties)

    return () => {
      audioRef.current?.destroy()
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
      if (bonusTimerRef.current) {
        clearTimeout(bonusTimerRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw menu when state changes
  useEffect(() => {
    if (gameState === 'menu' && rendererRef.current) {
      rendererRef.current.drawMenu(highScore, selectedDifficulty, difficulties)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore, gameState, selectedDifficulty])

  // Render function
  const render = useCallback(() => {
    const renderer = rendererRef.current
    const snake = snakeRef.current
    if (!renderer || !snake) return

    if (gameState === 'menu') {
      renderer.drawMenu(highScore, selectedDifficulty, difficulties)
      return
    }

    if (gameState === 'gameover') {
      const isNewRecord = scoreRef.current === highScore && scoreRef.current > 0
      renderer.drawGameOver(scoreRef.current, highScore, isNewRecord, landryCountRef.current)
      return
    }

    // Playing or paused - render game state
    renderer.render({
      snake: snake.state.segments,
      letters: lettersRef.current,
      targetLetter: snake.getTargetLetter(),
      score: scoreRef.current,
      highScore,
      landryCount: landryCountRef.current,
      difficulty: difficultyRef.current,
    })

    if (gameState === 'paused') {
      renderer.drawPauseOverlay()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, highScore, selectedDifficulty])

  // Show bonus overlay (game continues running)
  const triggerBonus = useCallback((isFirst: boolean) => {
    const text = isFirst ? BONUS.TEXT_FIRST : BONUS.TEXT_SUBSEQUENT
    setBonusText(text)
    setShowBonus(true)
    audioRef.current?.playBonusSound()

    // Clear any existing timer
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
    }

    // Hide after duration
    bonusTimerRef.current = setTimeout(() => {
      setShowBonus(false)
    }, BONUS.DURATION)
  }, [])

  // Check for LANDRY bonus in snake body
  const checkForBonus = useCallback((snake: Snake) => {
    const snakeString = snake.state.segments.map(s => s.letter).join('')
    const newCount = countLandryPatterns(snakeString)

    if (newCount > landryCountRef.current) {
      const isFirst = newCount === 1
      // Add bonus points
      const bonusPoints = isFirst ? SCORING.COMPLETE_LANDRY : SCORING.COMPLETE_LANDRY * 2
      scoreRef.current += bonusPoints
      setScore(scoreRef.current)

      landryCountRef.current = newCount
      setLandryCount(newCount)

      triggerBonus(isFirst)
    }
  }, [triggerBonus])

  // Game tick function
  const gameTick = useCallback(() => {
    const snake = snakeRef.current
    if (!snake || gameState !== 'playing') return

    // Store old tail position before moving (needed for growing)
    const oldTailPos = {
      x: snake.state.segments[snake.state.segments.length - 1].x,
      y: snake.state.segments[snake.state.segments.length - 1].y,
    }

    // Move snake
    const { x: newX, y: newY, hitWall } = snake.move()

    // Check wall collision
    if (hitWall) {
      triggerGameOver()
      return
    }

    const newHead = { x: newX, y: newY }

    // Check self-collision (exclude tail as it will move away)
    if (snake.checkSelfCollision()) {
      triggerGameOver()
      return
    }

    // Check letter collection
    const headKey = `${newHead.x},${newHead.y}`
    const collectedLetterIndex = lettersRef.current.findIndex(
      (l) => `${l.x},${l.y}` === headKey
    )

    if (collectedLetterIndex !== -1) {
      const collectedLetter = lettersRef.current[collectedLetterIndex]

      // Always add points for collecting any letter
      scoreRef.current += SCORING.CORRECT_LETTER
      setScore(scoreRef.current)

      // Always grow the snake with the collected letter
      snake.addSegment(oldTailPos.x, oldTailPos.y, collectedLetter.letter)

      if (snake.isCorrectLetter(collectedLetter.letter)) {
        // Correct letter - advance pattern
        snake.advancePattern()
        audioRef.current?.playCollectSound()

        // Check if we completed a LANDRY pattern
        checkForBonus(snake)
      } else {
        // Wrong letter - reset pattern to L (but keep snake length!)
        snake.resetPattern()
        audioRef.current?.playErrorSound()
      }

      // Regenerate letters
      lettersRef.current = generateLetters(snake, difficultyRef.current)
    }

    render()
  }, [gameState, render, checkForBonus])

  // Start game loop when playing
  useEffect(() => {
    if (gameState === 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
      gameLoopRef.current = setInterval(gameTick, difficultyRef.current.speed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, gameTick])

  // Start game
  const start = useCallback(() => {
    audioRef.current?.init()

    // Reset snake
    snakeRef.current?.reset()

    // Set difficulty
    difficultyRef.current = difficulties[selectedDifficulty]

    // Reset state
    scoreRef.current = 0
    landryCountRef.current = 0
    setScore(0)
    setLandryCount(0)
    setShowBonus(false)

    // Generate initial letters
    if (snakeRef.current) {
      lettersRef.current = generateLetters(snakeRef.current, difficultyRef.current)
    }

    audioRef.current?.playConfirmSound()
    setGameState('playing')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDifficulty])

  // Pause game
  const pause = useCallback(() => {
    if (gameState !== 'playing') return
    setGameState('paused')
    render()
  }, [gameState, render])

  // Resume game
  const resume = useCallback(() => {
    if (gameState !== 'paused') return
    setGameState('playing')
  }, [gameState])

  // Go to menu
  const goToMenu = useCallback(() => {
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
    }
    setShowBonus(false)
    setGameState('menu')
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = audioRef.current?.toggleMute() ?? false
    setIsMuted(newMuted)
  }, [])

  // Trigger game over
  const triggerGameOver = useCallback(async () => {
    if (bonusTimerRef.current) {
      clearTimeout(bonusTimerRef.current)
    }
    setShowBonus(false)

    audioRef.current?.playGameOverSound()

    const finalScore = scoreRef.current
    let newHighScore = highScore
    const isNewRecord = finalScore > highScore

    if (isNewRecord) {
      newHighScore = finalScore
      setHighScore(newHighScore)
      try {
        localStorage.setItem('witchCaseHighScore', newHighScore.toString())
      } catch {
        // Ignore
      }
    }

    setGameState('gameover')

    // Submit score to API
    if (onScoreSubmit && finalScore > 0) {
      await onScoreSubmit(finalScore, {
        difficulty: difficultyRef.current.id,
        landryCount: landryCountRef.current,
        snakeLength: snakeRef.current?.getLength() || 1,
      })
    }

    onGameOver?.(finalScore, isNewRecord)

    // Re-render game over screen
    setTimeout(() => render(), 50)
  }, [highScore, onScoreSubmit, onGameOver, render])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code

      // Menu navigation
      if (gameState === 'menu') {
        if (KEYS.UP.includes(code)) {
          e.preventDefault()
          setSelectedDifficulty((prev) =>
            (prev - 1 + difficulties.length) % difficulties.length
          )
          audioRef.current?.playSelectSound()
        } else if (KEYS.DOWN.includes(code)) {
          e.preventDefault()
          setSelectedDifficulty((prev) => (prev + 1) % difficulties.length)
          audioRef.current?.playSelectSound()
        } else if (KEYS.CONFIRM.includes(code)) {
          e.preventDefault()
          start()
        }
        return
      }

      // Game over
      if (gameState === 'gameover') {
        if (KEYS.CONFIRM.includes(code)) {
          e.preventDefault()
          start()
        } else if (KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          goToMenu()
        }
        return
      }

      // Paused
      if (gameState === 'paused') {
        if (KEYS.CONFIRM.includes(code) || KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          resume()
        }
        return
      }

      // Playing - direction controls
      if (gameState === 'playing' && snakeRef.current) {
        let newDirection: Direction | null = null

        if (KEYS.UP.includes(code)) {
          e.preventDefault()
          newDirection = 'up'
        } else if (KEYS.DOWN.includes(code)) {
          e.preventDefault()
          newDirection = 'down'
        } else if (KEYS.LEFT.includes(code)) {
          e.preventDefault()
          newDirection = 'left'
        } else if (KEYS.RIGHT.includes(code)) {
          e.preventDefault()
          newDirection = 'right'
        } else if (KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          pause()
          return
        }

        if (newDirection) {
          snakeRef.current.setDirection(newDirection)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, start, pause, resume, goToMenu])

  // Canvas click handler with position detection for difficulty buttons
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState === 'menu') {
      const canvas = canvasRef.current
      if (!canvas) return

      // Convert click position to canvas coordinates
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS.WIDTH / rect.width
      const scaleY = CANVAS.HEIGHT / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      // Check if click is on a difficulty button
      // Buttons are at: x = CANVAS.WIDTH/2 - 100, width 200, y = 268 + index*40, height 30
      const btnLeft = CANVAS.WIDTH / 2 - 100
      const btnRight = btnLeft + 200
      if (x >= btnLeft && x <= btnRight) {
        for (let i = 0; i < difficulties.length; i++) {
          const btnTop = 280 + i * 40 - 12
          const btnBottom = btnTop + 30
          if (y >= btnTop && y <= btnBottom) {
            setSelectedDifficulty(i)
            audioRef.current?.playSelectSound()
            return
          }
        }
      }

      // Click outside buttons starts the game
      start()
    } else if (gameState === 'gameover') {
      start()
    }
  }, [gameState, start, difficulties.length])

  // Mobile D-pad handlers
  const handleDirection = useCallback(
    (direction: Direction) => {
      if (gameState === 'playing' && snakeRef.current) {
        snakeRef.current.setDirection(direction)
        audioRef.current?.playMoveSound()
      } else if (gameState === 'menu') {
        if (direction === 'up') {
          setSelectedDifficulty((prev) =>
            (prev - 1 + difficulties.length) % difficulties.length
          )
          audioRef.current?.playSelectSound()
        } else if (direction === 'down') {
          setSelectedDifficulty((prev) => (prev + 1) % difficulties.length)
          audioRef.current?.playSelectSound()
        }
      }
    },
    [gameState, difficulties.length]
  )

  return (
    <div className="witch-case-game flex flex-col items-center w-full max-w-[640px] mx-auto px-2">
      {/* Game canvas with bonus overlay */}
      <div className="relative w-full flex justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="rounded-lg border-4 border-[var(--game-secondary)] shadow-lg cursor-pointer
            w-full max-w-[640px] h-auto md:w-[640px] md:h-[480px]"
          style={{
            aspectRatio: '640 / 480',
            boxShadow: '0 0 20px rgba(74, 144, 164, 0.3)',
          }}
        />

        {/* Bonus overlay - shows while game continues */}
        {showBonus && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-lg pointer-events-none animate-pulse"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
            }}
          >
            {landryCount === 1 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={BONUS.IMAGE}
                alt="Bonus"
                className="max-w-[300px] max-h-[200px] mb-4 object-contain"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(247, 147, 26, 0.8))',
                }}
              />
            )}
            <span
              className="text-2xl md:text-3xl font-bold text-center px-4"
              style={{
                color: '#F7931A',
                textShadow: '0 0 20px #F7931A, 0 0 40px #F7931A',
              }}
            >
              {bonusText}
            </span>
            <span className="text-lg mt-2" style={{ color: '#FFF8F0' }}>
              ×{landryCount}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4 w-full">
        <button
          onClick={gameState === 'playing' ? pause : gameState === 'paused' ? resume : start}
          className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
            bg-[var(--game-bg-secondary)] text-[var(--game-text)]
            hover:bg-[var(--game-bg)] border border-[var(--game-secondary)]/30"
        >
          {gameState === 'playing' ? 'Pause' : gameState === 'paused' ? 'Reprendre' : 'Jouer'}
        </button>
        <button
          onClick={toggleMute}
          className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
            bg-[var(--game-bg-secondary)] text-[var(--game-text)]
            hover:bg-[var(--game-bg)] border border-[var(--game-secondary)]/30"
        >
          Son: {isMuted ? 'OFF' : 'ON'}
        </button>
        {gameState !== 'menu' && (
          <button
            onClick={goToMenu}
            className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
              bg-[var(--game-bg-secondary)] text-[var(--game-text)]
              hover:bg-[var(--game-bg)] border border-[var(--game-secondary)]/30"
          >
            Menu
          </button>
        )}
      </div>

      {/* Mobile D-pad controls */}
      <div className="mobile-controls mt-4 md:hidden w-full px-4">
        <div className="flex flex-col items-center gap-2">
          {/* Up button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault()
              handleDirection('up')
            }}
            className="touch-control w-16 h-16 rounded-full font-bold text-2xl
              bg-[var(--game-bg-secondary)] text-[var(--game-text)]
              border-2 border-[var(--game-secondary)]/50
              active:bg-[var(--game-secondary)] active:border-[var(--game-secondary)]
              transition-all duration-75 select-none touch-none"
          >
            ▲
          </button>

          {/* Left/Right row */}
          <div className="flex items-center gap-8">
            <button
              onTouchStart={(e) => {
                e.preventDefault()
                handleDirection('left')
              }}
              className="touch-control w-16 h-16 rounded-full font-bold text-2xl
                bg-[var(--game-bg-secondary)] text-[var(--game-text)]
                border-2 border-[var(--game-secondary)]/50
                active:bg-[var(--game-secondary)] active:border-[var(--game-secondary)]
                transition-all duration-75 select-none touch-none"
            >
              ◀
            </button>
            <button
              onTouchStart={(e) => {
                e.preventDefault()
                handleDirection('right')
              }}
              className="touch-control w-16 h-16 rounded-full font-bold text-2xl
                bg-[var(--game-bg-secondary)] text-[var(--game-text)]
                border-2 border-[var(--game-secondary)]/50
                active:bg-[var(--game-secondary)] active:border-[var(--game-secondary)]
                transition-all duration-75 select-none touch-none"
            >
              ▶
            </button>
          </div>

          {/* Down button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault()
              handleDirection('down')
            }}
            className="touch-control w-16 h-16 rounded-full font-bold text-2xl
              bg-[var(--game-bg-secondary)] text-[var(--game-text)]
              border-2 border-[var(--game-secondary)]/50
              active:bg-[var(--game-secondary)] active:border-[var(--game-secondary)]
              transition-all duration-75 select-none touch-none"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Keyboard instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center hidden md:block">
        ← → ↑ ↓ ou WASD: Diriger | Espace: Confirmer | Échap: Pause/Menu
      </p>
    </div>
  )
}
