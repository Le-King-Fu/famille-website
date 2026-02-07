'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Renderer } from './systems/Renderer'
import { Audio } from './systems/Audio'
import { Paddle } from './entities/Paddle'
import { Ball, spawnExtraBall } from './entities/Ball'
import { Brick, createBricksFromGrid } from './entities/Brick'
import {
  CANVAS,
  BALL,
  GAME,
  KEYS,
  PADDLE,
  BrickType,
  type ActivePowerUp,
} from './config'
import { LEVELS, generateBonusLevel, type Level } from './levels'
import type { GameMetadata } from '../common/types'

// =============================================================================
// TYPES
// =============================================================================

type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'levelTransition'

interface Tear {
  x: number
  y: number
  active: boolean
}

interface TeteDeSoccerGameProps {
  onScoreSubmit?: (score: number, metadata: GameMetadata) => Promise<boolean>
}

// =============================================================================
// CUSTOM HOOK: useGameLoop
// =============================================================================

function useGameLoop(
  active: boolean,
  callbacks: { onUpdate: (deltaTime: number) => void; onRender: () => void }
) {
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  const loop = useCallback((timestamp: number) => {
    let deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    if (deltaTime > 100) deltaTime = 16.67

    callbacksRef.current.onUpdate(deltaTime)
    callbacksRef.current.onRender()

    frameRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    if (!active) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = 0
      }
      return
    }

    lastTimeRef.current = performance.now()
    frameRef.current = requestAnimationFrame(loop)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [active, loop])
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TeteDeSoccerGame({ onScoreSubmit }: TeteDeSoccerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const audioRef = useRef<Audio | null>(null)

  // React state (for UI)
  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // Game data refs (no re-renders during gameplay)
  const paddleRef = useRef<Paddle | null>(null)
  const ballsRef = useRef<Ball[]>([])
  const bricksRef = useRef<Brick[]>([])
  const tearsRef = useRef<Tear[]>([])

  const scoreRef = useRef(0)
  const livesRef = useRef(GAME.INITIAL_LIVES)
  const currentLevelRef = useRef(0)
  const levelNameRef = useRef('')
  const gameStateRef = useRef<GameState>('menu')
  const powerUpsRef = useRef<ActivePowerUp[]>([])
  const tearsTimerRef = useRef(0)
  const levelTransitionTimerRef = useRef(0)
  const gameOverTimerRef = useRef(0)

  // Mouse/touch tracking
  const movingLeftRef = useRef(false)
  const movingRightRef = useRef(false)

  // Sync gameState to ref
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('teteDeSoccerHighScore')
      if (saved) setHighScore(parseInt(saved, 10))
    } catch { /* ignore */ }
  }, [])

  // Initialize renderer and audio
  useEffect(() => {
    if (!canvasRef.current) return

    rendererRef.current = new Renderer(canvasRef.current)
    audioRef.current = new Audio()

    rendererRef.current.drawMenu()

    return () => {
      audioRef.current?.destroy()
    }
  }, [])

  // Redraw menu when state changes
  useEffect(() => {
    if (gameState === 'menu' && rendererRef.current) {
      rendererRef.current.drawMenu()
    }
  }, [gameState])

  // =========================================================================
  // LEVEL MANAGEMENT
  // =========================================================================

  const loadLevel = useCallback((levelIndex: number) => {
    let level: Level
    if (levelIndex < LEVELS.length) {
      level = LEVELS[levelIndex]
    } else {
      level = generateBonusLevel(levelIndex)
    }

    currentLevelRef.current = levelIndex
    levelNameRef.current = level.name

    // Create bricks
    bricksRef.current = createBricksFromGrid(level.grid)

    // Reset balls - single ball stuck to paddle
    const paddle = paddleRef.current!
    const ballSpeed = BALL.BASE_SPEED + levelIndex * BALL.SPEED_INCREMENT
    const ball = new Ball(paddle.x, PADDLE.Y - PADDLE.HEIGHT / 2 - BALL.RADIUS - 1, ballSpeed)
    ballsRef.current = [ball]

    // Reset tears
    tearsRef.current = []
    tearsTimerRef.current = 0

    // Clear power-ups (except keep bonus head across levels)
    powerUpsRef.current = powerUpsRef.current.filter(p => p.type === 'bonushead')

    // Update paddle bonus head from power-ups
    paddle.hasBonusHead = powerUpsRef.current.some(p => p.type === 'bonushead')
  }, [])

  const checkLevelComplete = useCallback((): boolean => {
    // All destructible bricks must be destroyed
    return bricksRef.current.every(b => !b.active || !b.isDestructible())
  }, [])

  // =========================================================================
  // GAME FLOW
  // =========================================================================

  const startGame = useCallback(() => {
    audioRef.current?.init()

    // Reset everything
    paddleRef.current = new Paddle()
    scoreRef.current = 0
    livesRef.current = GAME.INITIAL_LIVES
    powerUpsRef.current = []
    gameOverTimerRef.current = 0
    levelTransitionTimerRef.current = 0

    setScore(0)

    loadLevel(0)
    setGameState('playing')
    audioRef.current?.playSelect()
  }, [loadLevel])

  const nextLevel = useCallback(() => {
    const nextLevelIndex = currentLevelRef.current + 1

    // Check for victory (after level 5)
    if (nextLevelIndex >= LEVELS.length && currentLevelRef.current < LEVELS.length) {
      audioRef.current?.playVictory()
      setGameState('victory')
      return
    }

    audioRef.current?.playLevelUp()
    levelTransitionTimerRef.current = GAME.LEVEL_TRANSITION_TIME
    loadLevel(nextLevelIndex)
    setGameState('levelTransition')
  }, [loadLevel])

  const continueBonusLevels = useCallback(() => {
    const nextLevelIndex = currentLevelRef.current + 1
    audioRef.current?.playLevelUp()
    loadLevel(nextLevelIndex)
    setGameState('playing')
  }, [loadLevel])

  const pause = useCallback(() => {
    if (gameStateRef.current !== 'playing') return
    setGameState('paused')
  }, [])

  const resume = useCallback(() => {
    if (gameStateRef.current !== 'paused') return
    setGameState('playing')
  }, [])

  const goToMenu = useCallback(() => {
    setGameState('menu')
  }, [])

  const toggleMute = useCallback(() => {
    const newMuted = audioRef.current?.toggleMute() ?? false
    setIsMuted(newMuted)
  }, [])

  // =========================================================================
  // POWER-UP MANAGEMENT
  // =========================================================================

  const activatePowerUp = useCallback((brickType: BrickType) => {
    const paddle = paddleRef.current
    if (!paddle) return

    switch (brickType) {
      case BrickType.ORANGE: {
        // Multi-ball: spawn an extra ball
        const existingBall = ballsRef.current.find(b => b.active && b.launched)
        if (existingBall) {
          const speed = existingBall.getSpeed()
          const newBall = spawnExtraBall(existingBall.x, existingBall.y, speed)
          ballsRef.current.push(newBall)
        }
        break
      }
      case BrickType.RED: {
        // Explosive: make all active balls explosive
        ballsRef.current.forEach(b => {
          if (b.active) {
            b.isExplosive = true
            b.explosiveTimer = GAME.EXPLOSIVE_DURATION
          }
        })
        // Track power-up
        const existing = powerUpsRef.current.find(p => p.type === 'explosive')
        if (existing) {
          existing.timer = GAME.EXPLOSIVE_DURATION
        } else {
          powerUpsRef.current.push({ type: 'explosive', timer: GAME.EXPLOSIVE_DURATION })
        }
        break
      }
      case BrickType.GREEN: {
        // Bonus head
        paddle.hasBonusHead = true
        if (!powerUpsRef.current.some(p => p.type === 'bonushead')) {
          powerUpsRef.current.push({ type: 'bonushead', timer: -1 })
        }
        break
      }
      case BrickType.BLUE: {
        // Tears
        const existingTears = powerUpsRef.current.find(p => p.type === 'tears')
        if (existingTears) {
          existingTears.timer = GAME.TEARS_DURATION
        } else {
          powerUpsRef.current.push({ type: 'tears', timer: GAME.TEARS_DURATION })
        }
        break
      }
    }
  }, [])

  // =========================================================================
  // GAME OVER
  // =========================================================================

  const triggerGameOver = useCallback(async () => {
    audioRef.current?.playGameOver()

    const finalScore = scoreRef.current
    let newHighScore = highScore
    const isNewRecord = finalScore > highScore

    if (isNewRecord) {
      newHighScore = finalScore
      setHighScore(newHighScore)
      try {
        localStorage.setItem('teteDeSoccerHighScore', newHighScore.toString())
      } catch { /* ignore */ }
    }

    setGameState('gameover')

    if (onScoreSubmit && finalScore > 0) {
      await onScoreSubmit(finalScore, {
        level: currentLevelRef.current + 1,
        levelName: levelNameRef.current,
        livesRemaining: livesRef.current,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore, onScoreSubmit])

  // =========================================================================
  // MOUSE / TOUCH HANDLERS
  // =========================================================================

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas || !paddleRef.current) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS.NATIVE_WIDTH / rect.width
    const nativeX = (e.clientX - rect.left) * scaleX
    paddleRef.current.setPosition(nativeX)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== 'playing') return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas || !paddleRef.current) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS.NATIVE_WIDTH / rect.width
    const touch = e.touches[0]
    const nativeX = (touch.clientX - rect.left) * scaleX
    paddleRef.current.setPosition(nativeX)
  }, [])

  const handleCanvasClick = useCallback(() => {
    const state = gameStateRef.current
    if (state === 'menu') {
      startGame()
    } else if (state === 'playing') {
      // Launch ball if not launched
      const unlaunchedBall = ballsRef.current.find(b => b.active && !b.launched)
      if (unlaunchedBall) {
        const speed = BALL.BASE_SPEED + currentLevelRef.current * BALL.SPEED_INCREMENT
        unlaunchedBall.launch(speed)
        audioRef.current?.playLaunch()
      }
    } else if (state === 'gameover') {
      startGame()
    } else if (state === 'victory') {
      continueBonusLevels()
    }
  }, [startGame, continueBonusLevels])

  // =========================================================================
  // KEYBOARD INPUT
  // =========================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code
      const state = gameStateRef.current

      if (state === 'menu') {
        if (KEYS.LAUNCH.includes(code)) {
          e.preventDefault()
          startGame()
        }
        return
      }

      if (state === 'gameover') {
        if (KEYS.LAUNCH.includes(code)) {
          e.preventDefault()
          startGame()
        } else if (KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          goToMenu()
        }
        return
      }

      if (state === 'victory') {
        if (KEYS.LAUNCH.includes(code)) {
          e.preventDefault()
          continueBonusLevels()
        } else if (KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          goToMenu()
        }
        return
      }

      if (state === 'paused') {
        if (KEYS.LAUNCH.includes(code) || KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          resume()
        }
        return
      }

      if (state === 'levelTransition') {
        return // Don't accept input during transition
      }

      // Playing
      if (state === 'playing') {
        if (KEYS.LEFT.includes(code)) {
          e.preventDefault()
          movingLeftRef.current = true
        } else if (KEYS.RIGHT.includes(code)) {
          e.preventDefault()
          movingRightRef.current = true
        } else if (KEYS.LAUNCH.includes(code)) {
          e.preventDefault()
          // Launch ball
          const unlaunchedBall = ballsRef.current.find(b => b.active && !b.launched)
          if (unlaunchedBall) {
            const speed = BALL.BASE_SPEED + currentLevelRef.current * BALL.SPEED_INCREMENT
            unlaunchedBall.launch(speed)
            audioRef.current?.playLaunch()
          }
        } else if (KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          pause()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (KEYS.LEFT.includes(e.code)) {
        movingLeftRef.current = false
      } else if (KEYS.RIGHT.includes(e.code)) {
        movingRightRef.current = false
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startGame, goToMenu, resume, pause, continueBonusLevels])

  // =========================================================================
  // GAME UPDATE
  // =========================================================================

  const onUpdate = useCallback((deltaTime: number) => {
    const state = gameStateRef.current
    if (state !== 'playing' && state !== 'levelTransition') return

    const dt = deltaTime / 16.67 // Normalize to ~60fps

    // Handle level transition timer
    if (state === 'levelTransition') {
      levelTransitionTimerRef.current -= deltaTime
      if (levelTransitionTimerRef.current <= 0) {
        setGameState('playing')
      }
      return
    }

    const paddle = paddleRef.current
    if (!paddle) return

    // Handle game over delay
    if (gameOverTimerRef.current > 0) {
      gameOverTimerRef.current -= deltaTime
      if (gameOverTimerRef.current <= 0) {
        triggerGameOver()
      }
      return
    }

    // Move paddle with keyboard
    if (movingLeftRef.current) paddle.moveLeft(dt)
    if (movingRightRef.current) paddle.moveRight(dt)

    // Update balls
    for (let i = ballsRef.current.length - 1; i >= 0; i--) {
      const ball = ballsRef.current[i]

      // Stick unlaunched ball to paddle
      if (!ball.launched) {
        ball.stickToPaddle(paddle.x)
        continue
      }

      ball.update(dt)

      if (!ball.active) {
        ballsRef.current.splice(i, 1)
        continue
      }

      // Paddle collision
      const pb = paddle.getBounds()
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= pb.top &&
        ball.y - ball.radius <= pb.bottom &&
        ball.x >= pb.left &&
        ball.x <= pb.right
      ) {
        ball.bounceOffPaddle(paddle.x, paddle.width)
        audioRef.current?.playPaddleBounce()
      }

      // Bonus head collision
      if (paddle.hasBonusHead) {
        const bh = paddle.getBonusHeadBounds()
        if (
          bh &&
          ball.vy > 0 &&
          ball.y + ball.radius >= bh.top &&
          ball.y - ball.radius <= bh.bottom &&
          ball.x >= bh.left &&
          ball.x <= bh.right
        ) {
          ball.bounceOffPaddle((bh.left + bh.right) / 2, bh.right - bh.left)
          audioRef.current?.playPaddleBounce()
        }
      }

      // Wall bounces - audio
      if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS.NATIVE_WIDTH) {
        audioRef.current?.playWallBounce()
      }
      if (ball.y - ball.radius <= 0) {
        audioRef.current?.playWallBounce()
      }

      // Brick collisions
      for (const brick of bricksRef.current) {
        if (!brick.active || brick.destroying) continue

        if (brick.checkCollision(ball.x, ball.y, ball.radius)) {
          const bounds = brick.getBounds()

          // If ball is explosive, destroy nearby bricks too
          if (ball.isExplosive) {
            const explosiveRadius = 40 // native pixels
            for (const otherBrick of bricksRef.current) {
              if (otherBrick === brick) continue
              if (otherBrick.checkExplosiveRadius(ball.x, ball.y, explosiveRadius)) {
                const destroyed = otherBrick.hit()
                if (destroyed) {
                  scoreRef.current += otherBrick.config.points
                  activatePowerUp(otherBrick.type)
                }
              }
            }
          }

          // Bounce off brick
          ball.bounceOffBrick(bounds.left, bounds.right, bounds.top, bounds.bottom)

          const destroyed = brick.hit()
          if (destroyed) {
            scoreRef.current += brick.config.points
            setScore(scoreRef.current)
            audioRef.current?.playBrickDestroy(brick.type)
            activatePowerUp(brick.type)
          } else {
            audioRef.current?.playBrickHit()
          }

          break // Only one brick collision per frame per ball
        }
      }
    }

    // Update bricks (destruction animation)
    bricksRef.current.forEach(b => b.update(dt))

    // Check if all balls are gone
    if (ballsRef.current.length === 0) {
      livesRef.current--
      audioRef.current?.playLifeLost()

      if (livesRef.current <= 0) {
        gameOverTimerRef.current = GAME.GAME_OVER_DELAY
      } else {
        // Respawn a ball
        const ball = new Ball(
          paddle.x,
          PADDLE.Y - PADDLE.HEIGHT / 2 - BALL.RADIUS - 1,
          BALL.BASE_SPEED + currentLevelRef.current * BALL.SPEED_INCREMENT
        )
        ballsRef.current = [ball]

        // Remove temporary power-ups on life loss
        powerUpsRef.current = powerUpsRef.current.filter(p => p.type === 'bonushead')
        paddle.hasBonusHead = powerUpsRef.current.some(p => p.type === 'bonushead')
      }
    }

    // Update power-up timers
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pu = powerUpsRef.current[i]
      if (pu.timer > 0) {
        pu.timer -= deltaTime
        if (pu.timer <= 0) {
          // Power-up expired
          if (pu.type === 'explosive') {
            ballsRef.current.forEach(b => { b.isExplosive = false })
          }
          if (pu.type === 'tears') {
            tearsRef.current = []
          }
          powerUpsRef.current.splice(i, 1)
        }
      }
    }

    // Tears power-up: shoot tears from paddle
    if (powerUpsRef.current.some(p => p.type === 'tears')) {
      tearsTimerRef.current += deltaTime
      if (tearsTimerRef.current >= GAME.TEARS_INTERVAL) {
        tearsTimerRef.current = 0
        tearsRef.current.push({
          x: paddle.x,
          y: paddle.y - paddle.height / 2,
          active: true,
        })
      }
    }

    // Update tears
    for (let i = tearsRef.current.length - 1; i >= 0; i--) {
      const tear = tearsRef.current[i]
      tear.y -= GAME.TEARS_SPEED * dt

      // Check tear-brick collision
      for (const brick of bricksRef.current) {
        if (!brick.active || brick.destroying) continue
        if (brick.checkCollision(tear.x, tear.y, 3)) {
          const destroyed = brick.hit()
          if (destroyed) {
            scoreRef.current += brick.config.points
            setScore(scoreRef.current)
            audioRef.current?.playBrickDestroy(brick.type)
            activatePowerUp(brick.type)
          }
          tear.active = false
          break
        }
      }

      // Remove off-screen or inactive
      if (tear.y < 0 || !tear.active) {
        tearsRef.current.splice(i, 1)
      }
    }

    // Check level completion
    if (checkLevelComplete()) {
      nextLevel()
    }
  }, [triggerGameOver, activatePowerUp, checkLevelComplete, nextLevel])

  // =========================================================================
  // GAME RENDER
  // =========================================================================

  const onRender = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    const state = gameStateRef.current

    if (state === 'menu') {
      renderer.drawMenu()
      return
    }

    if (state === 'gameover') {
      const isNewRecord = scoreRef.current === highScore && scoreRef.current > 0
      renderer.drawGameOver(scoreRef.current, highScore, isNewRecord)
      return
    }

    if (state === 'victory') {
      const isNewRecord = scoreRef.current === highScore && scoreRef.current > 0
      renderer.drawVictory(scoreRef.current, highScore, isNewRecord)
      return
    }

    const paddle = paddleRef.current
    if (!paddle) return

    // Get active power-up labels
    const activePowerUpLabels = powerUpsRef.current.map(p => {
      switch (p.type) {
        case 'multiball': return `Multi-ballon`
        case 'explosive': return `Explosif ${Math.ceil(p.timer / 1000)}s`
        case 'bonushead': return `Tête bonus`
        case 'tears': return `Larmes ${Math.ceil(p.timer / 1000)}s`
      }
    })

    renderer.render(
      paddle.getRenderData(),
      ballsRef.current.filter(b => b.active).map(b => b.getRenderData()),
      bricksRef.current.filter(b => b.active).map(b => b.getRenderData()),
      tearsRef.current.filter(t => t.active).map(t => ({ x: t.x, y: t.y })),
      {
        score: scoreRef.current,
        lives: livesRef.current,
        level: currentLevelRef.current + 1,
        levelName: levelNameRef.current,
        activePowerUps: activePowerUpLabels,
      }
    )

    if (state === 'paused') {
      renderer.drawPauseOverlay()
    }

    if (state === 'levelTransition') {
      renderer.drawLevelTransition(levelNameRef.current)
    }
  }, [highScore])

  // Game loop
  const isActive = gameState === 'playing' || gameState === 'levelTransition'
  useGameLoop(isActive, { onUpdate, onRender })

  // Render static screens
  useEffect(() => {
    if (gameState === 'paused' || gameState === 'gameover' || gameState === 'victory') {
      onRender()
    }
  }, [gameState, onRender])

  // =========================================================================
  // JSX
  // =========================================================================

  return (
    <div className="tete-de-soccer-game flex flex-col items-center w-full max-w-[640px] mx-auto px-2">
      <div className="relative w-full flex justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="rounded-lg border-4 border-[#FF6B35] shadow-lg cursor-pointer
            w-full max-w-[640px] h-auto md:w-[640px] md:h-[480px]"
          style={{
            aspectRatio: `${CANVAS.WIDTH} / ${CANVAS.HEIGHT}`,
            boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4 w-full">
        <button
          onClick={gameState === 'playing' ? pause : gameState === 'paused' ? resume : startGame}
          className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
            bg-gray-800 text-white hover:bg-gray-700 border border-[#FF6B35]/30"
        >
          {gameState === 'playing' ? 'Pause' : gameState === 'paused' ? 'Reprendre' : 'Jouer'}
        </button>
        <button
          onClick={toggleMute}
          className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
            bg-gray-800 text-white hover:bg-gray-700 border border-[#FF6B35]/30"
        >
          Son: {isMuted ? 'OFF' : 'ON'}
        </button>
        {gameState !== 'menu' && (
          <button
            onClick={goToMenu}
            className="px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
              bg-gray-800 text-white hover:bg-gray-700 border border-[#FF6B35]/30"
          >
            Menu
          </button>
        )}
      </div>

      {/* Keyboard instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center hidden md:block">
        Souris ou ← → : Déplacer | Espace : Lancer le ballon | Échap : Pause
      </p>
    </div>
  )
}
