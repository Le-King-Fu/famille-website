'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Renderer } from './systems/Renderer'
import { Audio } from './systems/Audio'
import { Note } from './entities/Note'
import {
  GAME_STATE,
  LEVELS,
  BONUS,
  SCORE,
  LIVES,
  LEVEL_UP,
  KEY_MAP,
  NOTES,
  CANVAS,
  NOTE_TO_KEY,
  type GameState,
  type NoteType,
} from './config'
import { useGameLoop } from './hooks/useGameLoop'
import { MobileControls } from '../common'
import type { GameMetadata } from '../common/types'

interface PianoHeroGameProps {
  onScoreSubmit?: (score: number, metadata: GameMetadata) => Promise<boolean>
  onGameOver?: (score: number, isNewRecord: boolean) => void
}

export function PianoHeroGame({ onScoreSubmit, onGameOver }: PianoHeroGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const audioRef = useRef<Audio | null>(null)

  // Game state
  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lives, setLives] = useState(LIVES.INITIAL)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // Game data refs (no re-renders during gameplay)
  const notesRef = useRef<Note[]>([])
  const lastNoteSpawnRef = useRef(0)
  const hitEffectsRef = useRef<{ lane: number; timer: number }[]>([])
  const missEffectsRef = useRef<{ lane: number; timer: number }[]>([])
  const levelUpDisplayRef = useRef<{ timer: number } | null>(null)
  const gameOverDisplayRef = useRef<{ timer: number } | null>(null)
  const lastLevelUpScoreRef = useRef(0)
  const startingLevelRef = useRef(0)
  const activeNotesRef = useRef<Set<NoteType>>(new Set())
  const scoreRef = useRef(0)
  const livesRef = useRef(LIVES.INITIAL)
  const currentLevelRef = useRef(0)

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pianoHeroV2HighScore')
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

    // Draw initial menu (highScore from ref to avoid dependency)
    rendererRef.current.drawMenu(0)

    return () => {
      audioRef.current?.destroy()
    }
  }, [])

  // Redraw menu when high score changes
  useEffect(() => {
    if (gameState === 'menu' && rendererRef.current) {
      rendererRef.current.drawMenu(highScore)
    }
  }, [highScore, gameState])

  // Keyboard input
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Space for pause/start
      if (key === ' ') {
        e.preventDefault()
        if (gameState === 'playing') {
          pause()
        } else if (gameState === 'paused') {
          resume()
        } else if (gameState === 'menu' || gameState === 'gameover') {
          start()
        }
        return
      }

      // Escape for menu
      if (key === 'escape') {
        if (gameState === 'playing' || gameState === 'paused') {
          goToMenu()
        }
        return
      }

      // Note keys
      const note = KEY_MAP[key]
      if (note && !activeNotesRef.current.has(note)) {
        activeNotesRef.current.add(note)
        handleNotePress(note)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const note = KEY_MAP[key]
      if (note) {
        activeNotesRef.current.delete(note)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState])

  // Handle note press
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleNotePress = useCallback((noteType: NoteType) => {
    if (gameState !== 'playing') return

    // Find matching note in hit zone
    for (const note of notesRef.current) {
      if (note.type === noteType && note.canBeHit()) {
        note.markAsHit()

        // Calculate score
        const points = note.isBonus ? SCORE.BONUS_HIT : SCORE.HIT
        scoreRef.current += points
        setScore(scoreRef.current)

        // Play sound
        if (note.isBonus) {
          audioRef.current?.playBonusSound()
        } else {
          audioRef.current?.playHitSound(noteType)
        }

        // Add hit effect
        hitEffectsRef.current.push({ lane: note.lane, timer: 100 })

        // Check level up
        checkLevelUp()

        return
      }
    }
  }, [gameState])

  // Check for level up
  const checkLevelUp = useCallback(() => {
    const threshold = LEVEL_UP.SCORE_THRESHOLD
    const currentThreshold = Math.floor(scoreRef.current / threshold)
    const lastThreshold = Math.floor(lastLevelUpScoreRef.current / threshold)

    if (currentThreshold > lastThreshold) {
      lastLevelUpScoreRef.current = scoreRef.current

      if (currentLevelRef.current < LEVELS.length - 1) {
        currentLevelRef.current++
        setCurrentLevel(currentLevelRef.current)
        levelUpDisplayRef.current = { timer: LEVEL_UP.DISPLAY_DURATION }
      }
    }
  }, [])

  // Lose a life
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loseLife = useCallback((lane: number) => {
    livesRef.current--
    setLives(livesRef.current)
    audioRef.current?.playMissSound()
    missEffectsRef.current.push({ lane, timer: 150 })

    if (livesRef.current <= 0) {
      triggerGameOver()
    }
  }, [])

  // Trigger game over
  const triggerGameOver = useCallback(() => {
    audioRef.current?.stopMelody()
    gameOverDisplayRef.current = { timer: 1000 }
  }, [])

  // Stop game and finalize
  const stopGame = useCallback(async () => {
    audioRef.current?.stopMelody()

    const finalScore = scoreRef.current
    let newHighScore = highScore
    const isNewRecord = finalScore > highScore

    if (isNewRecord) {
      newHighScore = finalScore
      setHighScore(newHighScore)
      try {
        localStorage.setItem('pianoHeroV2HighScore', newHighScore.toString())
      } catch {
        // Ignore
      }
    }

    // Reset level
    currentLevelRef.current = startingLevelRef.current
    setCurrentLevel(currentLevelRef.current)

    setGameState('gameover')

    // Submit score to API
    if (onScoreSubmit && finalScore > 0) {
      await onScoreSubmit(finalScore, {
        level: currentLevelRef.current,
        startingLevel: startingLevelRef.current,
      })
    }

    onGameOver?.(finalScore, isNewRecord)
  }, [highScore, onScoreSubmit, onGameOver])

  // Start game
  const start = useCallback(() => {
    audioRef.current?.init()

    // Reset state
    notesRef.current = []
    scoreRef.current = 0
    livesRef.current = LIVES.INITIAL
    lastNoteSpawnRef.current = 0
    hitEffectsRef.current = []
    missEffectsRef.current = []
    lastLevelUpScoreRef.current = 0
    levelUpDisplayRef.current = null
    gameOverDisplayRef.current = null
    startingLevelRef.current = currentLevelRef.current

    setScore(0)
    setLives(LIVES.INITIAL)
    setGameState('playing')

    audioRef.current?.startMelody()
  }, [])

  // Pause game
  const pause = useCallback(() => {
    if (gameState !== 'playing') return
    audioRef.current?.stopMelody()
    setGameState('paused')
  }, [gameState])

  // Resume game
  const resume = useCallback(() => {
    if (gameState !== 'paused') return
    audioRef.current?.startMelody()
    setGameState('playing')
  }, [gameState])

  // Go to menu
  const goToMenu = useCallback(() => {
    audioRef.current?.stopMelody()
    notesRef.current = []
    setGameState('menu')
    rendererRef.current?.drawMenu(highScore)
  }, [highScore])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = audioRef.current?.toggleMute() ?? false
    setIsMuted(newMuted)
  }, [])

  // Game update logic
  const onUpdate = useCallback((deltaTime: number) => {
    if (gameState !== 'playing') return

    const level = LEVELS[currentLevelRef.current]

    // Handle game over display
    if (gameOverDisplayRef.current) {
      gameOverDisplayRef.current.timer -= deltaTime
      if (gameOverDisplayRef.current.timer <= 0) {
        gameOverDisplayRef.current = null
        stopGame()
      }
      return
    }

    // Spawn notes
    lastNoteSpawnRef.current += deltaTime
    if (lastNoteSpawnRef.current >= level.spawnInterval) {
      notesRef.current.push(Note.createRandom(BONUS.CHANCE))
      lastNoteSpawnRef.current = 0
    }

    // Update notes
    for (let i = notesRef.current.length - 1; i >= 0; i--) {
      const note = notesRef.current[i]
      const isVisible = note.update(level.speed, deltaTime)

      if (!isVisible) {
        if (note.missed) {
          loseLife(note.lane)
        }
        notesRef.current.splice(i, 1)
      }
    }

    // Update effects
    for (let i = hitEffectsRef.current.length - 1; i >= 0; i--) {
      hitEffectsRef.current[i].timer -= deltaTime
      if (hitEffectsRef.current[i].timer <= 0) {
        hitEffectsRef.current.splice(i, 1)
      }
    }

    for (let i = missEffectsRef.current.length - 1; i >= 0; i--) {
      missEffectsRef.current[i].timer -= deltaTime
      if (missEffectsRef.current[i].timer <= 0) {
        missEffectsRef.current.splice(i, 1)
      }
    }

    // Update level up display
    if (levelUpDisplayRef.current) {
      levelUpDisplayRef.current.timer -= deltaTime
      if (levelUpDisplayRef.current.timer <= 0) {
        levelUpDisplayRef.current = null
      }
    }
  }, [gameState, stopGame, loseLife])

  // Game render logic
  const onRender = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    if (gameState === 'menu') {
      renderer.drawMenu(highScore)
      return
    }

    if (gameState === 'gameover') {
      const isNewRecord = scoreRef.current === highScore && scoreRef.current > 0
      renderer.drawGameOver(scoreRef.current, highScore, isNewRecord)
      return
    }

    // Clear and draw game
    renderer.clear()
    renderer.drawLanes()

    // Draw effects
    for (const effect of hitEffectsRef.current) {
      renderer.drawHitEffect(effect.lane)
    }
    for (const effect of missEffectsRef.current) {
      renderer.drawMissEffect(effect.lane)
    }

    // Draw hit zone
    renderer.drawHitZone(Array.from(activeNotesRef.current))

    // Draw notes
    for (const note of notesRef.current) {
      renderer.drawNote(note.getRenderData())
    }

    // Draw piano
    renderer.drawPiano(Array.from(activeNotesRef.current))

    // Draw UI
    renderer.drawUI({
      score: scoreRef.current,
      highScore,
      level: currentLevelRef.current,
      levelName: LEVELS[currentLevelRef.current].name,
      lives: livesRef.current,
      maxLives: LIVES.MAX,
    })

    // Draw level up
    if (levelUpDisplayRef.current) {
      renderer.drawLevelUp()
    }

    // Draw game over text
    if (gameOverDisplayRef.current) {
      renderer.drawGameOverText()
    }

    // Draw pause overlay
    if (gameState === 'paused') {
      renderer.drawPauseOverlay()
    }
  }, [gameState, highScore])

  // Game loop
  useGameLoop(gameState === 'playing' ? 'playing' : 'menu', { onUpdate, onRender })

  // Render paused/gameover screens
  useEffect(() => {
    if (gameState === 'paused') {
      onRender()
    }
  }, [gameState, onRender])

  // Mobile touch controls
  const mobileKeys = NOTES.map((note) => ({
    note,
    label: NOTE_TO_KEY[note],
  }))

  const handleMobilePress = useCallback((note: string) => {
    const noteType = note as NoteType
    activeNotesRef.current.add(noteType)
    handleNotePress(noteType)
  }, [handleNotePress])

  const handleMobileRelease = useCallback((note: string) => {
    activeNotesRef.current.delete(note as NoteType)
  }, [])

  // Canvas click to start
  const handleCanvasClick = useCallback(() => {
    if (gameState === 'menu' || gameState === 'gameover') {
      start()
    }
  }, [gameState, start])

  return (
    <div className="piano-hero-game flex flex-col items-center">
      {/* Level selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Niveau:</span>
        <div className="flex gap-1">
          {LEVELS.map((level, index) => (
            <button
              key={index}
              onClick={() => {
                if (gameState !== 'playing') {
                  currentLevelRef.current = index
                  setCurrentLevel(index)
                }
              }}
              disabled={gameState === 'playing'}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                index === currentLevel
                  ? 'bg-[var(--game-primary)] text-[var(--game-text)]'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } disabled:opacity-50`}
              title={level.name}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Game canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="rounded-lg border-4 border-[var(--game-primary)] shadow-lg cursor-pointer max-w-full"
          style={{
            width: `${CANVAS.WIDTH}px`,
            height: `${CANVAS.HEIGHT}px`,
            boxShadow: '0 0 20px rgba(193, 119, 103, 0.3)',
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={gameState === 'playing' ? pause : gameState === 'paused' ? resume : start}
          className="px-4 py-2 rounded-lg font-medium transition-colors
            bg-[var(--game-bg-secondary)] text-[var(--game-text)]
            hover:bg-[var(--game-bg)] border border-[var(--game-primary)]/30"
        >
          {gameState === 'playing' ? 'Pause' : gameState === 'paused' ? 'Reprendre' : 'Jouer'}
        </button>
        <button
          onClick={toggleMute}
          className="px-4 py-2 rounded-lg font-medium transition-colors
            bg-[var(--game-bg-secondary)] text-[var(--game-text)]
            hover:bg-[var(--game-bg)] border border-[var(--game-primary)]/30"
        >
          Son: {isMuted ? 'OFF' : 'ON'}
        </button>
      </div>

      {/* Mobile controls */}
      <MobileControls
        keys={mobileKeys}
        onKeyPress={handleMobilePress}
        onKeyRelease={handleMobileRelease}
        disabled={gameState !== 'playing'}
      />

      {/* Keyboard instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center hidden md:block">
        Touches: A S D F G H J | Espace: Pause | Échap: Menu
      </p>
    </div>
  )
}
