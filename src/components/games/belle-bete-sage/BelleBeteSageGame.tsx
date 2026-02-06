'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Renderer } from './systems/Renderer'
import { Audio } from './systems/Audio'
import { Player } from './entities/Player'
import { Obstacle, spawnObstacle } from './entities/Obstacle'
import { Collectible, spawnCollectible } from './entities/Collectible'
import {
  CANVAS,
  DIFFICULTY_LEVELS,
  LEVEL_UP_SCORE,
  KEYS,
  TOUCH,
  OBSTACLE_SPAWN,
  MULTI_LANE_CHANCE,
  DISTANCE_SCORING,
  JUMP_BONUS_POINTS,
  PLAYER,
  type CharacterId,
} from './config'
import type { GameMetadata } from '../common/types'

// =============================================================================
// TYPES
// =============================================================================

type GameState = 'menu' | 'tutorial' | 'playing' | 'paused' | 'gameover'

interface BelleBeteSageGameProps {
  onScoreSubmit?: (score: number, metadata: GameMetadata) => Promise<boolean>
  onGameOver?: (score: number, isNewRecord: boolean) => void
}

// =============================================================================
// CUSTOM HOOK: useGameLoop
// =============================================================================

function useGameLoop(
  gameState: GameState,
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

    // Cap delta time to avoid jumps
    if (deltaTime > 100) {
      deltaTime = 16.67
    }

    callbacksRef.current.onUpdate(deltaTime)
    callbacksRef.current.onRender()

    frameRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') {
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
  }, [gameState, loop])
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BelleBeteSageGame({ onScoreSubmit, onGameOver }: BelleBeteSageGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const audioRef = useRef<Audio | null>(null)

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<number>(0)
  const [isMuted, setIsMuted] = useState(false)

  // Game data refs (no re-renders during gameplay)
  const playerRef = useRef<Player | null>(null)
  const obstaclesRef = useRef<Obstacle[]>([])
  const collectiblesRef = useRef<Collectible[]>([])
  const lastSpawnRef = useRef(0)
  const scoreRef = useRef(0)
  const currentLevelRef = useRef(0)
  const coinsCollectedRef = useRef(0)
  const bonusesCollectedRef = useRef(0)
  const hitEffectTimerRef = useRef(0)
  const levelUpDisplayRef = useRef<{ timer: number; name: string } | null>(null)
  const gameOverTimerRef = useRef(0)
  const distanceRef = useRef(0)
  const distanceAccumRef = useRef(0)
  const jumpBonusDisplayRef = useRef<{ timer: number; x: number; y: number } | null>(null)

  const characters: CharacterId[] = ['flora', 'nouki', 'laska']

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('belleBeteSageHighScore')
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

    // Draw initial menu
    rendererRef.current.drawMenu(0, characters, 0)

    return () => {
      audioRef.current?.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw menu when state changes
  useEffect(() => {
    if (gameState === 'menu' && rendererRef.current) {
      rendererRef.current.drawMenu(highScore, characters, selectedCharacter)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore, gameState, selectedCharacter])

  // Touch handling for swipe controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !playerRef.current) return

    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < TOUCH.TAP_THRESHOLD && absDy < TOUCH.TAP_THRESHOLD) {
      // Tap = jump
      if (gameState === 'playing') {
        if (playerRef.current.jump()) {
          audioRef.current?.playJumpSound()
        }
      } else if (gameState === 'tutorial') {
        startGame()
      } else if (gameState === 'menu') {
        start()
      } else if (gameState === 'gameover') {
        start()
      }
    } else if (absDx > TOUCH.SWIPE_THRESHOLD || absDy > TOUCH.SWIPE_THRESHOLD) {
      if (gameState === 'playing') {
        if (absDy > absDx) {
          // Vertical swipe
          if (dy < 0) {
            // Swipe up = jump
            if (playerRef.current.jump()) {
              audioRef.current?.playJumpSound()
            }
          }
        } else {
          // Horizontal swipe
          if (dx < 0) {
            if (playerRef.current.moveLeft()) {
              audioRef.current?.playLaneChangeSound()
            }
          } else {
            if (playerRef.current.moveRight()) {
              audioRef.current?.playLaneChangeSound()
            }
          }
        }
      } else if (gameState === 'menu') {
        // Swipe to change character
        if (dx < 0) {
          setSelectedCharacter((prev) => (prev + 1) % characters.length)
          audioRef.current?.playSelectSound()
        } else {
          setSelectedCharacter((prev) => (prev - 1 + characters.length) % characters.length)
          audioRef.current?.playSelectSound()
        }
      }
    }

    touchStartRef.current = null
  }, [gameState])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code

      // Tutorial state
      if (gameState === 'tutorial') {
        if (KEYS.JUMP.includes(code)) {
          e.preventDefault()
          startGame()
        }
        return
      }

      // Menu navigation
      if (gameState === 'menu') {
        if (KEYS.LEFT.includes(code)) {
          e.preventDefault()
          setSelectedCharacter((prev) => (prev - 1 + characters.length) % characters.length)
          audioRef.current?.playSelectSound()
        } else if (KEYS.RIGHT.includes(code)) {
          e.preventDefault()
          setSelectedCharacter((prev) => (prev + 1) % characters.length)
          audioRef.current?.playSelectSound()
        } else if (KEYS.JUMP.includes(code)) {
          e.preventDefault()
          start()
        } else if (KEYS.TUTORIAL.includes(code)) {
          e.preventDefault()
          showTutorial()
        }
        return
      }

      // Game over
      if (gameState === 'gameover') {
        if (KEYS.JUMP.includes(code)) {
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
        if (KEYS.JUMP.includes(code) || KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          resume()
        }
        return
      }

      // Playing
      if (gameState === 'playing' && playerRef.current) {
        if (KEYS.LEFT.includes(code)) {
          e.preventDefault()
          if (playerRef.current.moveLeft()) {
            audioRef.current?.playLaneChangeSound()
          }
        } else if (KEYS.RIGHT.includes(code)) {
          e.preventDefault()
          if (playerRef.current.moveRight()) {
            audioRef.current?.playLaneChangeSound()
          }
        } else if (KEYS.JUMP.includes(code)) {
          e.preventDefault()
          if (playerRef.current.jump()) {
            audioRef.current?.playJumpSound()
          }
        } else if (KEYS.PAUSE.includes(code)) {
          e.preventDefault()
          pause()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState])

  // Show tutorial
  const showTutorial = useCallback(() => {
    setGameState('tutorial')
  }, [])

  // Start game
  const start = useCallback(() => {
    audioRef.current?.init()

    // Check if tutorial should be shown on first play
    try {
      const tutorialSeen = localStorage.getItem('belleBeteSageTutorialSeen')
      if (!tutorialSeen) {
        localStorage.setItem('belleBeteSageTutorialSeen', '1')
        setGameState('tutorial')
        return
      }
    } catch {
      // Ignore localStorage errors
    }

    startGame()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter])

  // Actually start the game (after tutorial or directly)
  const startGame = useCallback(() => {
    audioRef.current?.init()

    // Create player with selected character
    const characterId = characters[selectedCharacter]
    playerRef.current = new Player(characterId)

    // Reset state
    obstaclesRef.current = []
    collectiblesRef.current = []
    scoreRef.current = 0
    currentLevelRef.current = 0
    coinsCollectedRef.current = 0
    bonusesCollectedRef.current = 0
    lastSpawnRef.current = 0
    hitEffectTimerRef.current = 0
    levelUpDisplayRef.current = null
    gameOverTimerRef.current = 0
    distanceRef.current = 0
    distanceAccumRef.current = 0
    jumpBonusDisplayRef.current = null

    setScore(0)
    setCurrentLevel(0)
    setGameState('playing')

    audioRef.current?.playConfirmSound()
    audioRef.current?.startAmbience()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter])

  // Pause game
  const pause = useCallback(() => {
    if (gameState !== 'playing') return
    audioRef.current?.stopAmbience()
    setGameState('paused')
  }, [gameState])

  // Resume game
  const resume = useCallback(() => {
    if (gameState !== 'paused') return
    audioRef.current?.startAmbience()
    setGameState('playing')
  }, [gameState])

  // Go to menu
  const goToMenu = useCallback(() => {
    audioRef.current?.stopAmbience()
    setGameState('menu')
    rendererRef.current?.drawMenu(highScore, characters, selectedCharacter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore, selectedCharacter])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = audioRef.current?.toggleMute() ?? false
    setIsMuted(newMuted)
  }, [])

  // Check level up
  const checkLevelUp = useCallback(() => {
    const newLevel = Math.min(
      Math.floor(scoreRef.current / LEVEL_UP_SCORE),
      DIFFICULTY_LEVELS.length - 1
    )

    if (newLevel > currentLevelRef.current) {
      currentLevelRef.current = newLevel
      setCurrentLevel(newLevel)
      levelUpDisplayRef.current = {
        timer: 2000,
        name: DIFFICULTY_LEVELS[newLevel].name,
      }
      audioRef.current?.playLevelUpSound()
    }
  }, [])

  // Handle collision
  const handleCollision = useCallback(() => {
    if (!playerRef.current) return

    const isDead = playerRef.current.hit()
    audioRef.current?.playHitSound()
    hitEffectTimerRef.current = 200

    if (isDead) {
      triggerGameOver()
    }
  }, [])

  // Trigger game over
  const triggerGameOver = useCallback(() => {
    audioRef.current?.stopAmbience()
    audioRef.current?.playGameOverSound()
    gameOverTimerRef.current = 1500
  }, [])

  // Stop game and finalize
  const stopGame = useCallback(async () => {
    audioRef.current?.stopAmbience()

    const finalScore = scoreRef.current
    let newHighScore = highScore
    const isNewRecord = finalScore > highScore

    if (isNewRecord) {
      newHighScore = finalScore
      setHighScore(newHighScore)
      try {
        localStorage.setItem('belleBeteSageHighScore', newHighScore.toString())
      } catch {
        // Ignore
      }
    }

    setGameState('gameover')

    // Submit score to API
    if (onScoreSubmit && finalScore > 0) {
      await onScoreSubmit(finalScore, {
        character: characters[selectedCharacter],
        level: currentLevelRef.current,
        coinsCollected: coinsCollectedRef.current,
        bonusesCollected: bonusesCollectedRef.current,
      })
    }

    onGameOver?.(finalScore, isNewRecord)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore, onScoreSubmit, onGameOver, selectedCharacter])

  // Game update logic
  const onUpdate = useCallback((deltaTime: number) => {
    if (gameState !== 'playing' || !playerRef.current) return

    const player = playerRef.current
    const level = DIFFICULTY_LEVELS[currentLevelRef.current]

    // Handle game over timer
    if (gameOverTimerRef.current > 0) {
      gameOverTimerRef.current -= deltaTime
      if (gameOverTimerRef.current <= 0) {
        stopGame()
      }
      return
    }

    // Update player
    player.update(deltaTime / 16.67) // Normalize to ~60fps

    // Distance scoring
    const distanceThisFrame = OBSTACLE_SPAWN.BASE_SPEED * level.speedMultiplier * (deltaTime / 16.67)
    distanceRef.current += distanceThisFrame
    distanceAccumRef.current += distanceThisFrame
    if (distanceAccumRef.current >= DISTANCE_SCORING.POINTS_INTERVAL) {
      const intervals = Math.floor(distanceAccumRef.current / DISTANCE_SCORING.POINTS_INTERVAL)
      distanceAccumRef.current -= intervals * DISTANCE_SCORING.POINTS_INTERVAL
      const vitesseMultiplier = player.state.character.vitesse / 3
      const distancePoints = Math.round(DISTANCE_SCORING.BASE_POINTS * intervals * vitesseMultiplier)
      scoreRef.current += distancePoints
      setScore(scoreRef.current)
      checkLevelUp()
    }

    // Spawn obstacles and collectibles
    lastSpawnRef.current += deltaTime
    if (lastSpawnRef.current >= level.spawnInterval) {
      lastSpawnRef.current = 0

      // Get occupied lanes from recent spawns (avoid clustering)
      const recentObstacles = obstaclesRef.current.filter((o) => o.state.y < 50)
      const recentCollectibles = collectiblesRef.current.filter((c) => c.state.y < 50)
      const occupiedLanes = [
        ...recentObstacles.map((o) => o.state.lane),
        ...recentCollectibles.map((c) => c.state.lane),
      ]

      // Level-dependent obstacle chance
      const obstacleChance = OBSTACLE_SPAWN.OBSTACLE_CHANCE_BY_LEVEL[currentLevelRef.current] ?? OBSTACLE_SPAWN.OBSTACLE_CHANCE

      // Spawn obstacle or collectible
      if (Math.random() < obstacleChance) {
        const obstacle = spawnObstacle(level.speedMultiplier, occupiedLanes)
        if (obstacle) {
          obstaclesRef.current.push(obstacle)
          occupiedLanes.push(obstacle.state.lane)

          // Multi-lane combo: spawn a second obstacle in a different lane
          const multiChance = MULTI_LANE_CHANCE[currentLevelRef.current] ?? 0
          if (multiChance > 0 && Math.random() < multiChance) {
            // Force at least one to be small (jumpable) for escape route
            const secondObstacle = spawnObstacle(level.speedMultiplier, occupiedLanes)
            if (secondObstacle) {
              // If the first was large, force the second to be small
              if (obstacle.state.config.isLarge && secondObstacle.state.config.isLarge) {
                // Replace with a forced-small obstacle
                const smallObstacle = new Obstacle(secondObstacle.state.lane, level.speedMultiplier, true)
                obstaclesRef.current.push(smallObstacle)
              } else {
                obstaclesRef.current.push(secondObstacle)
              }
            }
          }
        }
      }

      // Always try to spawn collectible in different lane
      const collectible = spawnCollectible(level.speedMultiplier, occupiedLanes)
      if (collectible) {
        collectiblesRef.current.push(collectible)
      }
    }

    // Update obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obstacle = obstaclesRef.current[i]
      obstacle.update(deltaTime / 16.67)

      // Check collision
      if (obstacle.checkCollision(player)) {
        handleCollision()
        obstacle.state.active = false
      }

      // Jump bonus: detect when player jumps over a small obstacle
      if (
        obstacle.state.active &&
        !obstacle.state.jumpedOver &&
        obstacle.state.config.canJumpOver &&
        obstacle.state.lane === player.state.lane &&
        obstacle.state.y > PLAYER.Y_POSITION &&
        player.canAvoidByJumping()
      ) {
        obstacle.state.jumpedOver = true
        scoreRef.current += JUMP_BONUS_POINTS
        setScore(scoreRef.current)
        checkLevelUp()
        audioRef.current?.playBonusSound()
        jumpBonusDisplayRef.current = {
          timer: 800,
          x: obstacle.state.x,
          y: PLAYER.Y_POSITION - 20,
        }
      }

      // Remove inactive
      if (!obstacle.state.active) {
        obstaclesRef.current.splice(i, 1)
      }
    }

    // Update collectibles
    for (let i = collectiblesRef.current.length - 1; i >= 0; i--) {
      const collectible = collectiblesRef.current[i]
      collectible.update(deltaTime / 16.67)

      // Check collection
      const points = collectible.checkCollection(player)
      if (points > 0) {
        scoreRef.current += points
        setScore(scoreRef.current)

        if (collectible.state.type === 'coin') {
          coinsCollectedRef.current++
          audioRef.current?.playCoinSound()
        } else {
          bonusesCollectedRef.current++
          audioRef.current?.playBonusSound()
        }

        checkLevelUp()
      }

      // Remove inactive
      if (!collectible.state.active) {
        collectiblesRef.current.splice(i, 1)
      }
    }

    // Update hit effect timer
    if (hitEffectTimerRef.current > 0) {
      hitEffectTimerRef.current -= deltaTime
    }

    // Update level up display
    if (levelUpDisplayRef.current) {
      levelUpDisplayRef.current.timer -= deltaTime
      if (levelUpDisplayRef.current.timer <= 0) {
        levelUpDisplayRef.current = null
      }
    }

    // Update jump bonus display
    if (jumpBonusDisplayRef.current) {
      jumpBonusDisplayRef.current.timer -= deltaTime
      if (jumpBonusDisplayRef.current.timer <= 0) {
        jumpBonusDisplayRef.current = null
      }
    }
  }, [gameState, stopGame, handleCollision, checkLevelUp])

  // Game render logic
  const onRender = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    if (gameState === 'tutorial') {
      renderer.drawTutorial()
      return
    }

    if (gameState === 'menu') {
      renderer.drawMenu(highScore, characters, selectedCharacter)
      return
    }

    if (gameState === 'gameover' && playerRef.current) {
      const isNewRecord = scoreRef.current === highScore && scoreRef.current > 0
      renderer.drawGameOver(
        scoreRef.current,
        highScore,
        isNewRecord,
        playerRef.current.state.character
      )
      return
    }

    if (!playerRef.current) return

    const player = playerRef.current
    const level = DIFFICULTY_LEVELS[currentLevelRef.current]

    // Render game
    renderer.render(
      player.getRenderData(),
      obstaclesRef.current.filter((o) => o.state.active).map((o) => o.getRenderData()),
      collectiblesRef.current.filter((c) => c.state.active).map((c) => c.getRenderData()),
      {
        score: scoreRef.current,
        highScore,
        level: currentLevelRef.current,
        levelName: level.name,
        lives: player.state.lives,
        maxLives: player.state.lives + 2, // Approximate max
        character: player.state.character,
        coinsCollected: coinsCollectedRef.current,
        bonusesCollected: bonusesCollectedRef.current,
      },
      level.speedMultiplier
    )

    // Draw hit effect
    if (hitEffectTimerRef.current > 0) {
      renderer.drawHitEffect()
    }

    // Draw level up
    if (levelUpDisplayRef.current) {
      renderer.drawLevelUp(levelUpDisplayRef.current.name)
    }

    // Draw jump bonus
    if (jumpBonusDisplayRef.current) {
      renderer.drawJumpBonus(
        jumpBonusDisplayRef.current.x,
        jumpBonusDisplayRef.current.y,
        jumpBonusDisplayRef.current.timer
      )
    }

    // Draw pause overlay
    if (gameState === 'paused') {
      renderer.drawPauseOverlay()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, highScore, selectedCharacter])

  // Game loop
  useGameLoop(gameState === 'playing' ? 'playing' : 'menu', { onUpdate, onRender })

  // Render paused/gameover/tutorial screens
  useEffect(() => {
    if (gameState === 'paused' || gameState === 'gameover' || gameState === 'tutorial') {
      onRender()
    }
  }, [gameState, onRender])

  // Canvas click handler
  const handleCanvasClick = useCallback(() => {
    if (gameState === 'tutorial') {
      startGame()
    } else if (gameState === 'menu') {
      start()
    } else if (gameState === 'gameover') {
      start()
    }
  }, [gameState, start, startGame])

  return (
    <div className="belle-bete-sage-game flex flex-col items-center w-full max-w-[640px] mx-auto px-2">
      {/* Game canvas */}
      <div className="relative w-full flex justify-center">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="rounded-lg border-4 border-[var(--game-secondary)] shadow-lg cursor-pointer
            w-full max-w-[640px] h-auto md:w-[640px] md:h-[480px]"
          style={{
            aspectRatio: `${CANVAS.WIDTH} / ${CANVAS.HEIGHT}`,
            boxShadow: '0 0 20px rgba(74, 144, 164, 0.3)',
          }}
        />
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

      {/* Mobile controls - arrow buttons */}
      <div className="mobile-controls flex justify-center items-center gap-4 mt-4 md:hidden w-full px-4">
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            if (gameState === 'playing' && playerRef.current?.moveLeft()) {
              audioRef.current?.playLaneChangeSound()
            } else if (gameState === 'menu') {
              setSelectedCharacter((prev) => (prev - 1 + characters.length) % characters.length)
              audioRef.current?.playSelectSound()
            }
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
            if (gameState === 'playing' && playerRef.current?.jump()) {
              audioRef.current?.playJumpSound()
            } else if (gameState === 'menu' || gameState === 'gameover') {
              start()
            }
          }}
          className="touch-control w-20 h-20 rounded-full font-bold text-2xl
            bg-[var(--game-bg-secondary)] text-[var(--game-text)]
            border-2 border-[var(--game-gold)]/50
            active:bg-[var(--game-gold)] active:border-[var(--game-gold)]
            transition-all duration-75 select-none touch-none"
        >
          ▲
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            if (gameState === 'playing' && playerRef.current?.moveRight()) {
              audioRef.current?.playLaneChangeSound()
            } else if (gameState === 'menu') {
              setSelectedCharacter((prev) => (prev + 1) % characters.length)
              audioRef.current?.playSelectSound()
            }
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

      {/* Keyboard instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center hidden md:block">
        ← → ou A D: Changer de couloir | ↑ ou Espace: Sauter | Échap: Pause/Menu
      </p>
    </div>
  )
}
