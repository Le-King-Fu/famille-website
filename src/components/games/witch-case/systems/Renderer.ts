// Witch Case - Renderer System
// Canvas 2D rendering for Snake game

import {
  CANVAS,
  GRID,
  COLORS,
  PATTERN,
  BONUS,
  type DifficultyLevel,
} from '../config'
import type { SnakeSegment } from '../entities/Snake'

// =============================================================================
// TYPES
// =============================================================================

export interface Letter {
  x: number
  y: number
  letter: string
  isTarget: boolean
  isDecoy: boolean // PASCAL decoy in hard mode
}

export interface RenderState {
  snake: SnakeSegment[]
  letters: Letter[]
  targetLetter: string
  score: number
  highScore: number
  landryCount: number // Number of times LANDRY completed
  difficulty: DifficultyLevel
}

// =============================================================================
// RENDERER CLASS
// =============================================================================

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private bonusImage: HTMLImageElement | null = null
  private bonusImageLoaded = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')
    this.ctx = ctx

    this.setupCanvas()
    this.loadBonusImage()
  }

  // ===========================================================================
  // SETUP
  // ===========================================================================

  private setupCanvas(): void {
    this.canvas.width = CANVAS.WIDTH
    this.canvas.height = CANVAS.HEIGHT
  }

  private loadBonusImage(): void {
    this.bonusImage = new Image()
    this.bonusImage.onload = () => {
      this.bonusImageLoaded = true
    }
    this.bonusImage.onerror = () => {
      console.warn('Failed to load bonus image')
      this.bonusImageLoaded = false
    }
    this.bonusImage.src = BONUS.IMAGE
  }

  // ===========================================================================
  // GRID RENDERING
  // ===========================================================================

  private drawGrid(): void {
    const { CELL_SIZE, SIZE, OFFSET_X, OFFSET_Y } = GRID

    // Background
    this.ctx.fillStyle = COLORS.BG_PRIMARY
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Play area background (slightly different)
    this.ctx.fillStyle = COLORS.BG_SECONDARY
    this.ctx.fillRect(
      OFFSET_X,
      OFFSET_Y,
      SIZE * CELL_SIZE,
      SIZE * CELL_SIZE
    )

    // Grid lines
    this.ctx.strokeStyle = COLORS.GRID_LINE
    this.ctx.lineWidth = 1

    for (let i = 0; i <= SIZE; i++) {
      // Vertical lines
      this.ctx.beginPath()
      this.ctx.moveTo(OFFSET_X + i * CELL_SIZE, OFFSET_Y)
      this.ctx.lineTo(OFFSET_X + i * CELL_SIZE, OFFSET_Y + SIZE * CELL_SIZE)
      this.ctx.stroke()

      // Horizontal lines
      this.ctx.beginPath()
      this.ctx.moveTo(OFFSET_X, OFFSET_Y + i * CELL_SIZE)
      this.ctx.lineTo(OFFSET_X + SIZE * CELL_SIZE, OFFSET_Y + i * CELL_SIZE)
      this.ctx.stroke()
    }

    // Border glow
    this.ctx.shadowColor = COLORS.SECONDARY
    this.ctx.shadowBlur = 10
    this.ctx.strokeStyle = COLORS.SECONDARY
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(
      OFFSET_X,
      OFFSET_Y,
      SIZE * CELL_SIZE,
      SIZE * CELL_SIZE
    )
    this.ctx.shadowBlur = 0
  }

  // ===========================================================================
  // SNAKE RENDERING
  // ===========================================================================

  private drawSnake(segments: SnakeSegment[]): void {
    const { CELL_SIZE, OFFSET_X, OFFSET_Y } = GRID

    segments.forEach((segment, index) => {
      const x = OFFSET_X + segment.x * CELL_SIZE
      const y = OFFSET_Y + segment.y * CELL_SIZE
      const isHead = index === 0

      // Segment background
      const padding = 2
      this.ctx.fillStyle = isHead ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY

      // Add glow to head
      if (isHead) {
        this.ctx.shadowColor = COLORS.SNAKE_HEAD
        this.ctx.shadowBlur = 8
      }

      // Rounded rectangle for segment
      this.roundRect(
        x + padding,
        y + padding,
        CELL_SIZE - padding * 2,
        CELL_SIZE - padding * 2,
        4
      )
      this.ctx.fill()
      this.ctx.shadowBlur = 0

      // Letter inside segment
      this.ctx.fillStyle = COLORS.SNAKE_LETTER
      this.ctx.font = 'bold 14px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(
        segment.letter,
        x + CELL_SIZE / 2,
        y + CELL_SIZE / 2
      )
    })
  }

  // ===========================================================================
  // LETTER RENDERING
  // ===========================================================================

  private drawLetters(letters: Letter[], showTarget: boolean): void {
    const { CELL_SIZE, OFFSET_X, OFFSET_Y } = GRID

    letters.forEach((letter) => {
      const x = OFFSET_X + letter.x * CELL_SIZE
      const y = OFFSET_Y + letter.y * CELL_SIZE

      // Choose color based on type
      let color = COLORS.LETTER_NORMAL
      let glowColor = COLORS.GOLD

      if (letter.isDecoy) {
        color = COLORS.LETTER_PASCAL_DECOY
        glowColor = COLORS.NEON_PINK
      } else if (letter.isTarget && showTarget) {
        color = COLORS.LETTER_TARGET
        glowColor = COLORS.NEON_GREEN
      }

      // Glow effect
      this.ctx.shadowColor = glowColor
      this.ctx.shadowBlur = 10

      // Letter background circle
      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.arc(
        x + CELL_SIZE / 2,
        y + CELL_SIZE / 2,
        CELL_SIZE / 2 - 4,
        0,
        Math.PI * 2
      )
      this.ctx.fill()
      this.ctx.shadowBlur = 0

      // Letter text
      this.ctx.fillStyle = COLORS.BG_PRIMARY
      this.ctx.font = 'bold 14px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(
        letter.letter,
        x + CELL_SIZE / 2,
        y + CELL_SIZE / 2
      )
    })
  }

  // ===========================================================================
  // UI RENDERING
  // ===========================================================================

  private drawUI(
    score: number,
    highScore: number,
    targetLetter: string,
    landryCount: number,
    difficulty: DifficultyLevel
  ): void {
    // Score panel (left side)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(4, 8, 72, 90)

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 10px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('SCORE', 10, 24)
    this.ctx.font = 'bold 14px monospace'
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.fillText(`${score}`, 10, 42)

    this.ctx.font = '10px monospace'
    this.ctx.fillStyle = COLORS.TEXT_DIM
    this.ctx.fillText('MAX', 10, 60)
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.fillText(`${highScore}`, 10, 74)

    this.ctx.fillStyle = COLORS.TEXT_DIM
    this.ctx.fillText(`×${landryCount}`, 10, 92)

    // Target letter panel (right side)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(CANVAS.WIDTH - 76, 8, 72, 70)

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 10px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('SUIVANT', CANVAS.WIDTH - 40, 24)

    // Large target letter
    this.ctx.shadowColor = COLORS.NEON_GREEN
    this.ctx.shadowBlur = 15
    this.ctx.fillStyle = COLORS.LETTER_TARGET
    this.ctx.font = 'bold 28px monospace'
    this.ctx.fillText(targetLetter, CANVAS.WIDTH - 40, 55)
    this.ctx.shadowBlur = 0

    // Difficulty indicator
    this.ctx.fillStyle = COLORS.TEXT_DIM
    this.ctx.font = '8px monospace'
    this.ctx.fillText(difficulty.name, CANVAS.WIDTH - 40, 72)

    // Pattern progress at bottom
    this.drawPatternProgress(targetLetter)
  }

  private drawPatternProgress(targetLetter: string): void {
    const { OFFSET_X, CELL_SIZE, SIZE } = GRID
    const y = CANVAS.HEIGHT - 20

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(OFFSET_X, y - 12, SIZE * CELL_SIZE, 24)

    // Pattern letters
    const patternDisplay = PATTERN.slice(0, -1).toUpperCase() // Remove underscore, show "LANDRY"
    const letterWidth = 24
    const startX = CANVAS.WIDTH / 2 - (patternDisplay.length * letterWidth) / 2

    this.ctx.font = 'bold 16px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    patternDisplay.split('').forEach((letter, index) => {
      const x = startX + index * letterWidth + letterWidth / 2
      const isTarget = letter === targetLetter

      if (isTarget) {
        this.ctx.shadowColor = COLORS.NEON_GREEN
        this.ctx.shadowBlur = 10
        this.ctx.fillStyle = COLORS.LETTER_TARGET
      } else {
        this.ctx.shadowBlur = 0
        this.ctx.fillStyle = COLORS.TEXT_DIM
      }

      this.ctx.fillText(letter, x, y)
    })

    this.ctx.shadowBlur = 0
  }

  // ===========================================================================
  // MENU SCREENS
  // ===========================================================================

  drawMenu(highScore: number, selectedDifficulty: number, difficulties: DifficultyLevel[]): void {
    this.clear()

    // Title
    this.ctx.shadowColor = COLORS.NEON_GREEN
    this.ctx.shadowBlur = 20
    this.ctx.fillStyle = COLORS.NEON_GREEN
    this.ctx.font = 'bold 32px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('WITCH CASE', CANVAS.WIDTH / 2, 80)
    this.ctx.shadowBlur = 0

    // Subtitle
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = '14px monospace'
    this.ctx.fillText('Collectez L-A-N-D-R-Y', CANVAS.WIDTH / 2, 120)

    // Snake preview (draw a mini snake spelling LANDRY)
    this.drawMenuSnake()

    // Difficulty selection
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = '12px monospace'
    this.ctx.fillText('DIFFICULTÉ', CANVAS.WIDTH / 2, 250)

    difficulties.forEach((diff, index) => {
      const y = 280 + index * 40
      const isSelected = index === selectedDifficulty

      // Background
      this.ctx.fillStyle = isSelected ? 'rgba(74, 144, 164, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      this.ctx.fillRect(CANVAS.WIDTH / 2 - 100, y - 12, 200, 30)

      if (isSelected) {
        this.ctx.strokeStyle = COLORS.SECONDARY
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(CANVAS.WIDTH / 2 - 100, y - 12, 200, 30)
      }

      // Difficulty name
      this.ctx.fillStyle = isSelected ? COLORS.TEXT : COLORS.TEXT_DIM
      this.ctx.font = isSelected ? 'bold 14px monospace' : '14px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(diff.name, CANVAS.WIDTH / 2, y + 5)
    })

    // Instructions
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '11px monospace'
    this.ctx.fillText('↑ ↓ POUR CHOISIR', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 60)
    this.ctx.fillText('ESPACE POUR JOUER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 40)

    // High score
    if (highScore > 0) {
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.fillText(`RECORD: ${highScore}`, CANVAS.WIDTH / 2, CANVAS.HEIGHT - 15)
    }
  }

  private drawMenuSnake(): void {
    const letters = 'LANDRY'.split('')
    const startX = CANVAS.WIDTH / 2 - (letters.length * 30) / 2
    const y = 180

    letters.forEach((letter, index) => {
      const x = startX + index * 30

      // Snake segment style
      this.ctx.fillStyle = index === 0 ? COLORS.SNAKE_HEAD : COLORS.SNAKE_BODY
      this.ctx.shadowColor = COLORS.SNAKE_HEAD
      this.ctx.shadowBlur = index === 0 ? 8 : 0
      this.roundRect(x, y - 12, 26, 26, 4)
      this.ctx.fill()
      this.ctx.shadowBlur = 0

      // Letter
      this.ctx.fillStyle = COLORS.SNAKE_LETTER
      this.ctx.font = 'bold 14px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(letter, x + 13, y + 1)
    })
  }

  drawPauseOverlay(): void {
    // Darken background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Pause text
    this.ctx.shadowColor = COLORS.NEON_CYAN
    this.ctx.shadowBlur = 15
    this.ctx.fillStyle = COLORS.NEON_CYAN
    this.ctx.font = 'bold 36px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('PAUSE', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2)
    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = '14px monospace'
    this.ctx.fillText('ESPACE POUR REPRENDRE', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 50)
  }

  drawGameOver(score: number, highScore: number, isNewRecord: boolean, landryCount: number): void {
    // Darken background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Game Over text
    this.ctx.shadowColor = COLORS.ACCENT
    this.ctx.shadowBlur = 20
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.font = 'bold 32px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('GAME OVER', CANVAS.WIDTH / 2, 140)
    this.ctx.shadowBlur = 0

    // Score
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 20px monospace'
    this.ctx.fillText(`SCORE: ${score}`, CANVAS.WIDTH / 2, 200)

    // LANDRY count
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = '14px monospace'
    this.ctx.fillText(`LANDRY ×${landryCount}`, CANVAS.WIDTH / 2, 240)

    // New record
    if (isNewRecord) {
      this.ctx.shadowColor = COLORS.GOLD
      this.ctx.shadowBlur = 15
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.font = 'bold 18px monospace'
      this.ctx.fillText('NOUVEAU RECORD!', CANVAS.WIDTH / 2, 290)
      this.ctx.shadowBlur = 0
    }

    // High score
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = '14px monospace'
    this.ctx.fillText(`MEILLEUR: ${highScore}`, CANVAS.WIDTH / 2, 330)

    // Instructions
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '12px monospace'
    this.ctx.fillText('ESPACE POUR REJOUER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 60)
    this.ctx.fillText('ÉCHAP POUR LE MENU', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 40)
  }

  drawBonusOverlay(landryCount: number): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Bonus text
    const text = landryCount === 1 ? BONUS.TEXT_FIRST : BONUS.TEXT_SUBSEQUENT

    this.ctx.shadowColor = COLORS.GOLD
    this.ctx.shadowBlur = 20
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.font = 'bold 24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(text, CANVAS.WIDTH / 2, 80)
    this.ctx.shadowBlur = 0

    // Bonus image
    if (this.bonusImageLoaded && this.bonusImage) {
      const imgWidth = Math.min(400, this.bonusImage.width)
      const imgHeight = (imgWidth / this.bonusImage.width) * this.bonusImage.height
      const maxHeight = 300
      const finalHeight = Math.min(imgHeight, maxHeight)
      const finalWidth = (finalHeight / imgHeight) * imgWidth

      const x = (CANVAS.WIDTH - finalWidth) / 2
      const y = 120

      // Add glow effect around image
      this.ctx.shadowColor = COLORS.GOLD
      this.ctx.shadowBlur = 20
      this.ctx.drawImage(this.bonusImage, x, y, finalWidth, finalHeight)
      this.ctx.shadowBlur = 0
    } else {
      // Fallback if image not loaded
      this.ctx.fillStyle = COLORS.SECONDARY
      this.ctx.font = '16px monospace'
      this.ctx.fillText('🎉 LANDRY! 🎉', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2)
    }

    // LANDRY count
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 16px monospace'
    this.ctx.fillText(`×${landryCount}`, CANVAS.WIDTH / 2, CANVAS.HEIGHT - 40)
  }

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================

  clear(): void {
    this.ctx.fillStyle = COLORS.BG_PRIMARY
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
  }

  render(state: RenderState): void {
    this.drawGrid()
    this.drawLetters(state.letters, state.difficulty.showTarget)
    this.drawSnake(state.snake)
    this.drawUI(
      state.score,
      state.highScore,
      state.targetLetter,
      state.landryCount,
      state.difficulty
    )
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }
}
