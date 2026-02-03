import { CANVAS, COLORS, NOTES, HIT_ZONE, NOTE_TO_KEY, BONUS, type NoteType } from '../config'
import type { NoteRenderData } from '../entities/Note'

export interface UIData {
  score: number
  highScore: number
  level: number
  levelName: string
  lives: number
  maxLives: number
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private laneWidth: number
  private bonusImages: HTMLImageElement[] = []
  private bonusImagesLoaded = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')
    this.ctx = ctx

    this.setupCanvas()
    this.laneWidth = CANVAS.WIDTH / NOTES.length
    this.loadBonusImages()
  }

  /**
   * Load bonus images
   */
  private loadBonusImages(): void {
    let loadedCount = 0
    const totalImages = BONUS.IMAGES.length

    BONUS.IMAGES.forEach((src, index) => {
      const img = new Image()
      img.onload = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          this.bonusImagesLoaded = true
        }
      }
      img.onerror = () => {
        console.warn(`Failed to load bonus image: ${src}`)
        loadedCount++
      }
      img.src = src
      this.bonusImages[index] = img
    })
  }

  /**
   * Setup canvas for pixel art rendering
   */
  private setupCanvas(): void {
    this.canvas.width = CANVAS.WIDTH
    this.canvas.height = CANVAS.HEIGHT

    this.canvas.style.width = `${CANVAS.WIDTH * CANVAS.SCALE}px`
    this.canvas.style.height = `${CANVAS.HEIGHT * CANVAS.SCALE}px`

    this.ctx.imageSmoothingEnabled = false
    this.canvas.style.imageRendering = 'pixelated'
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.ctx.fillStyle = COLORS.BG
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
  }

  /**
   * Draw lane separators
   */
  drawLanes(): void {
    this.ctx.strokeStyle = COLORS.BG_DARK
    this.ctx.lineWidth = 2

    for (let i = 1; i < NOTES.length; i++) {
      const x = Math.floor(i * this.laneWidth)
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, CANVAS.HEIGHT)
      this.ctx.stroke()
    }
  }

  /**
   * Draw hit zone
   */
  drawHitZone(activeNotes: NoteType[] = []): void {
    // Hit zone rectangle
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.globalAlpha = 0.3
    this.ctx.fillRect(0, HIT_ZONE.Y, CANVAS.WIDTH, HIT_ZONE.HEIGHT)
    this.ctx.globalAlpha = 1

    // Hit line
    this.ctx.strokeStyle = COLORS.PRIMARY
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(0, HIT_ZONE.Y)
    this.ctx.lineTo(CANVAS.WIDTH, HIT_ZONE.Y)
    this.ctx.stroke()

    // Key labels
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '16px monospace'
    this.ctx.textAlign = 'center'

    for (let i = 0; i < NOTES.length; i++) {
      const x = i * this.laneWidth + this.laneWidth / 2
      const note = NOTES[i]
      this.ctx.fillText(NOTE_TO_KEY[note], x, HIT_ZONE.Y + HIT_ZONE.HEIGHT - 8)
    }
  }

  /**
   * Draw a note
   */
  drawNote(noteData: NoteRenderData): void {
    const { x, y, width, height, type, isBonus, bonusImageIndex, hit, alpha, scale } = noteData

    this.ctx.globalAlpha = alpha

    // Center for scale effect
    const centerX = x + width / 2 / scale
    const centerY = y + height / 2 / scale
    const drawX = centerX - width / 2
    const drawY = centerY - height / 2

    if (isBonus) {
      // Try to draw bonus image
      const bonusImg = this.bonusImages[bonusImageIndex]
      if (bonusImg && bonusImg.complete && bonusImg.naturalWidth > 0 && !hit) {
        // Draw image filling the entire note area
        this.ctx.drawImage(bonusImg, Math.floor(drawX), Math.floor(drawY), Math.floor(width), Math.floor(height))

        // Gold border
        this.ctx.strokeStyle = COLORS.GOLD
        this.ctx.lineWidth = 3
        this.ctx.strokeRect(Math.floor(drawX), Math.floor(drawY), Math.floor(width), Math.floor(height))

        // Key label at bottom
        this.ctx.fillStyle = COLORS.GOLD
        this.ctx.font = 'bold 14px monospace'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(NOTE_TO_KEY[type], Math.floor(centerX), Math.floor(drawY + height - 6))
      } else {
        // Fallback: Gold background with x3 text
        this.ctx.fillStyle = hit ? COLORS.SECONDARY : COLORS.GOLD
        this.ctx.fillRect(Math.floor(drawX), Math.floor(drawY), Math.floor(width), Math.floor(height))

        // Border
        this.ctx.strokeStyle = COLORS.BG_DARK
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(Math.floor(drawX), Math.floor(drawY), Math.floor(width), Math.floor(height))

        // Bonus indicator
        if (!hit) {
          this.ctx.fillStyle = COLORS.BG_DARK
          this.ctx.font = 'bold 16px monospace'
          this.ctx.textAlign = 'center'
          this.ctx.fillText('x3', Math.floor(centerX), Math.floor(centerY + 4))
        }
      }
    } else {
      // Normal note (terracotta)
      this.ctx.fillStyle = hit ? COLORS.BG_DARK : COLORS.PRIMARY
      this.ctx.fillRect(Math.floor(drawX), Math.floor(drawY), Math.floor(width), Math.floor(height))

      // Border
      this.ctx.strokeStyle = COLORS.BG_DARK
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(Math.floor(drawX), Math.floor(drawY), Math.floor(width), Math.floor(height))

      // Note key label
      if (!hit) {
        this.ctx.fillStyle = COLORS.WHITE
        this.ctx.font = '12px monospace'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(NOTE_TO_KEY[type], Math.floor(centerX), Math.floor(centerY + 4))
      }
    }

    this.ctx.globalAlpha = 1
  }

  /**
   * Draw piano keys at bottom
   */
  drawPiano(activeNotes: NoteType[] = []): void {
    const pianoY = CANVAS.HEIGHT - 48
    const keyHeight = 40

    for (let i = 0; i < NOTES.length; i++) {
      const x = i * this.laneWidth
      const note = NOTES[i]
      const isActive = activeNotes.includes(note)

      // Piano key
      this.ctx.fillStyle = isActive ? COLORS.PRIMARY : COLORS.SECONDARY
      this.ctx.fillRect(Math.floor(x + 4), pianoY, Math.floor(this.laneWidth - 8), keyHeight)

      // Border
      this.ctx.strokeStyle = COLORS.BG_DARK
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(Math.floor(x + 4), pianoY, Math.floor(this.laneWidth - 8), keyHeight)

      // Key label
      this.ctx.fillStyle = isActive ? COLORS.BG : COLORS.BG_DARK
      this.ctx.font = '12px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(NOTE_TO_KEY[note], Math.floor(x + this.laneWidth / 2), pianoY + 26)
    }
  }

  /**
   * Draw UI (score, level, lives)
   */
  drawUI(uiData: UIData): void {
    const { score, highScore, levelName, lives, maxLives } = uiData

    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '16px monospace'

    // Score (top left)
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`SCORE: ${score}`, 8, 24)

    // High score (top right)
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`MAX: ${highScore}`, CANVAS.WIDTH - 8, 24)

    // Level (center)
    if (levelName) {
      this.ctx.textAlign = 'center'
      this.ctx.fillText(levelName.toUpperCase(), CANVAS.WIDTH / 2, 24)
    }

    // Lives (hearts below score)
    if (lives !== undefined) {
      this.ctx.textAlign = 'left'
      this.ctx.font = '12px monospace'
      let livesDisplay = ''
      for (let i = 0; i < maxLives; i++) {
        livesDisplay += i < lives ? '♥' : '♡'
      }
      this.ctx.fillStyle = COLORS.ACCENT
      this.ctx.fillText(livesDisplay, 8, 44)
    }
  }

  /**
   * Draw "GAME OVER" text overlay
   */
  drawGameOverText(): void {
    // Semi-transparent background
    this.ctx.fillStyle = COLORS.BG
    this.ctx.globalAlpha = 0.7
    this.ctx.fillRect(CANVAS.WIDTH / 2 - 140, CANVAS.HEIGHT / 2 - 40, 280, 80)
    this.ctx.globalAlpha = 1

    // Border
    this.ctx.strokeStyle = COLORS.ACCENT
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(CANVAS.WIDTH / 2 - 140, CANVAS.HEIGHT / 2 - 40, 280, 80)

    // Text
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.font = '20px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('GAME OVER', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 8)
  }

  /**
   * Draw "LEVEL UP!" notification
   */
  drawLevelUp(): void {
    // Semi-transparent background
    this.ctx.fillStyle = COLORS.BG
    this.ctx.globalAlpha = 0.6
    this.ctx.fillRect(CANVAS.WIDTH / 2 - 120, CANVAS.HEIGHT / 2 - 40, 240, 80)
    this.ctx.globalAlpha = 1

    // Border
    this.ctx.strokeStyle = COLORS.SECONDARY
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(CANVAS.WIDTH / 2 - 120, CANVAS.HEIGHT / 2 - 40, 240, 80)

    // Text
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = '20px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('LEVEL UP!', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 8)
  }

  /**
   * Draw menu screen
   */
  drawMenu(highScore: number): void {
    this.clear()

    // Title
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('HERO DU', CANVAS.WIDTH / 2, 120)
    this.ctx.fillText('PIANO', CANVAS.WIDTH / 2, 160)

    // Instructions
    this.ctx.font = '12px monospace'
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.fillText('APPUIE SUR LES TOUCHES', CANVAS.WIDTH / 2, 240)
    this.ctx.fillText('A S D F G H J', CANVAS.WIDTH / 2, 270)

    // High score
    if (highScore > 0) {
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.fillText(`RECORD: ${highScore}`, CANVAS.WIDTH / 2, 320)
    }

    // Start instruction
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '16px monospace'
    this.ctx.fillText('CLIQUER POUR', CANVAS.WIDTH / 2, 400)
    this.ctx.fillText('COMMENCER', CANVAS.WIDTH / 2, 430)
  }

  /**
   * Draw pause overlay
   */
  drawPauseOverlay(): void {
    // Semi-transparent background
    this.ctx.fillStyle = COLORS.BG
    this.ctx.globalAlpha = 0.8
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
    this.ctx.globalAlpha = 1

    // Text
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('PAUSE', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2)

    this.ctx.font = '12px monospace'
    this.ctx.fillText('ESPACE POUR REPRENDRE', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 40)
  }

  /**
   * Draw game over screen
   */
  drawGameOver(score: number, highScore: number, isNewHighScore: boolean): void {
    // Semi-transparent background
    this.ctx.fillStyle = COLORS.BG
    this.ctx.globalAlpha = 0.9
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
    this.ctx.globalAlpha = 1

    // Title
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.font = '20px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('FIN DE PARTIE', CANVAS.WIDTH / 2, 160)

    // Score
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '16px monospace'
    this.ctx.fillText(`SCORE: ${score}`, CANVAS.WIDTH / 2, 240)

    // New record
    if (isNewHighScore) {
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.fillText('NOUVEAU RECORD!', CANVAS.WIDTH / 2, 290)
    }

    // High score
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.fillText(`RECORD: ${highScore}`, CANVAS.WIDTH / 2, 340)

    // Replay instruction
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '12px monospace'
    this.ctx.fillText('CLIQUER POUR REJOUER', CANVAS.WIDTH / 2, 420)
  }

  /**
   * Draw hit effect
   */
  drawHitEffect(lane: number): void {
    const x = lane * this.laneWidth

    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.globalAlpha = 0.5
    this.ctx.fillRect(x, HIT_ZONE.Y - 20, this.laneWidth, HIT_ZONE.HEIGHT + 40)
    this.ctx.globalAlpha = 1
  }

  /**
   * Draw miss effect
   */
  drawMissEffect(lane: number): void {
    const x = lane * this.laneWidth

    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.globalAlpha = 0.5
    this.ctx.fillRect(x, HIT_ZONE.Y - 20, this.laneWidth, HIT_ZONE.HEIGHT + 40)
    this.ctx.globalAlpha = 1
  }
}
