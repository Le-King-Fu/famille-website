// =============================================================================
// Tête de Soccer - Canvas 2D Renderer (Cyberpunk Orange Style)
// =============================================================================

import { CANVAS, COLORS, PADDLE, GAME, BrickType } from '../config'
import type { PaddleRenderData } from '../entities/Paddle'
import type { BallRenderData } from '../entities/Ball'
import type { BrickRenderData } from '../entities/Brick'

export interface UIData {
  score: number
  lives: number
  level: number
  levelName: string
  activePowerUps: string[]
}

export interface TearRenderData {
  x: number
  y: number
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupCanvas()
  }

  private setupCanvas(): void {
    this.canvas.width = CANVAS.WIDTH
    this.canvas.height = CANVAS.HEIGHT
    this.ctx.imageSmoothingEnabled = false
  }

  // =========================================================================
  // BACKGROUND
  // =========================================================================

  private drawBackground(): void {
    // Dark gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT)
    grad.addColorStop(0, COLORS.BG_PRIMARY)
    grad.addColorStop(1, COLORS.BG_SECONDARY)
    this.ctx.fillStyle = grad
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Subtle grid lines (cyberpunk feel)
    this.ctx.strokeStyle = COLORS.GRID_LINE
    this.ctx.lineWidth = 1
    const gridSize = 40
    for (let x = 0; x < CANVAS.WIDTH; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, CANVAS.HEIGHT)
      this.ctx.stroke()
    }
    for (let y = 0; y < CANVAS.HEIGHT; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(CANVAS.WIDTH, y)
      this.ctx.stroke()
    }
  }

  // =========================================================================
  // PADDLE RENDERING
  // =========================================================================

  drawPaddle(data: PaddleRenderData): void {
    const s = CANVAS.SCALE
    const x = data.x * s
    const y = data.y * s
    const w = data.width * s
    const h = data.height * s

    // Orange glow under paddle
    this.ctx.shadowColor = COLORS.ORANGE
    this.ctx.shadowBlur = 15

    if (data.headImage) {
      // Draw the head image as paddle
      const imgSize = PADDLE.HEAD_SIZE * s
      this.ctx.drawImage(data.headImage, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize)
    } else {
      // Fallback: draw a rectangular paddle
      this.ctx.fillStyle = COLORS.ORANGE
      this.ctx.fillRect(x - w / 2, y - h / 2, w, h)
      // Pixel border
      this.ctx.strokeStyle = COLORS.ORANGE_BRIGHT
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x - w / 2, y - h / 2, w, h)
    }

    this.ctx.shadowBlur = 0

    // Bonus head (tete2)
    if (data.hasBonusHead) {
      const bonusX = x - w / 2 - GAME.BONUS_HEAD_OFFSET * s
      const imgSize = PADDLE.HEAD_SIZE * s * 0.8
      this.ctx.shadowColor = COLORS.NEON_GREEN
      this.ctx.shadowBlur = 10
      if (data.bonusHeadImage) {
        this.ctx.drawImage(data.bonusHeadImage, bonusX - imgSize / 2, y - imgSize / 2, imgSize, imgSize)
      } else {
        this.ctx.fillStyle = COLORS.BRICK_GREEN
        this.ctx.fillRect(bonusX - imgSize / 2, y - imgSize / 2, imgSize, imgSize)
      }
      this.ctx.shadowBlur = 0
    }
  }

  // =========================================================================
  // BALL RENDERING
  // =========================================================================

  drawBall(data: BallRenderData): void {
    const s = CANVAS.SCALE
    const x = data.x * s
    const y = data.y * s
    const r = data.radius * s

    // Trail
    this.ctx.globalAlpha = 0.3
    data.trail.forEach((pos, i) => {
      const alpha = (i + 1) / data.trail.length * 0.3
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = data.isExplosive ? COLORS.BRICK_RED : COLORS.TEXT
      this.ctx.beginPath()
      this.ctx.arc(pos.x * s, pos.y * s, r * 0.6, 0, Math.PI * 2)
      this.ctx.fill()
    })
    this.ctx.globalAlpha = 1

    // Ball glow
    this.ctx.shadowColor = data.isExplosive ? COLORS.BRICK_RED : COLORS.ORANGE_BRIGHT
    this.ctx.shadowBlur = data.isExplosive ? 20 : 10

    // Ball body (white soccer ball)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, Math.PI * 2)
    this.ctx.fill()

    // Pentagon pattern (pixel art style)
    this.ctx.fillStyle = '#333333'
    const pentSize = r * 0.4
    // Center pentagon
    this.drawPentagon(x, y, pentSize)
    // Small marks around
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const px = x + Math.cos(angle) * r * 0.55
      const py = y + Math.sin(angle) * r * 0.55
      this.ctx.fillRect(px - 1, py - 1, 2, 2)
    }

    this.ctx.shadowBlur = 0

    // Explosive indicator
    if (data.isExplosive) {
      this.ctx.strokeStyle = COLORS.BRICK_RED
      this.ctx.lineWidth = 2
      this.ctx.setLineDash([3, 3])
      this.ctx.beginPath()
      this.ctx.arc(x, y, r + 4, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.setLineDash([])
    }
  }

  private drawPentagon(x: number, y: number, size: number): void {
    this.ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
      const px = x + Math.cos(angle) * size
      const py = y + Math.sin(angle) * size
      if (i === 0) this.ctx.moveTo(px, py)
      else this.ctx.lineTo(px, py)
    }
    this.ctx.closePath()
    this.ctx.fill()
  }

  // =========================================================================
  // BRICK RENDERING
  // =========================================================================

  drawBrick(data: BrickRenderData): void {
    const s = CANVAS.SCALE
    const x = data.x * s
    const y = data.y * s
    const w = data.width * s
    const h = data.height * s

    if (data.destroying) {
      // Destruction animation: shrink + flash
      const progress = 1 - (data.destroyTimer / 300)
      const scale = 1 - progress * 0.5
      const alpha = 1 - progress

      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.translate(x, y)
      this.ctx.scale(scale, scale)

      // Flash white
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fillRect(-w / 2, -h / 2, w, h)

      // Particles
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + progress * Math.PI
        const dist = progress * 15 * s
        const px = Math.cos(angle) * dist
        const py = Math.sin(angle) * dist
        this.ctx.fillStyle = data.config.color
        this.ctx.fillRect(px - 2, py - 2, 4, 4)
      }

      this.ctx.restore()
      return
    }

    // Main brick body
    this.ctx.fillStyle = data.config.color
    this.ctx.fillRect(x - w / 2, y - h / 2, w, h)

    // Top highlight (cyberpunk shine)
    this.ctx.fillStyle = data.config.colorLight
    this.ctx.fillRect(x - w / 2, y - h / 2, w, h * 0.3)

    // Border
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x - w / 2, y - h / 2, w, h)

    // Special brick indicators
    if (data.type === BrickType.BLACK) {
      // X pattern for indestructible
      this.ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      this.ctx.moveTo(x - w / 2 + 2, y - h / 2 + 2)
      this.ctx.lineTo(x + w / 2 - 2, y + h / 2 - 2)
      this.ctx.moveTo(x + w / 2 - 2, y - h / 2 + 2)
      this.ctx.lineTo(x - w / 2 + 2, y + h / 2 - 2)
      this.ctx.stroke()
    } else if (data.type === BrickType.ORANGE) {
      // Multi-ball: small circle
      this.ctx.fillStyle = '#ffffff'
      this.ctx.beginPath()
      this.ctx.arc(x, y, 3, 0, Math.PI * 2)
      this.ctx.fill()
    } else if (data.type === BrickType.RED) {
      // Explosive: star
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = `bold ${h * 0.6}px monospace`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('*', x, y)
    } else if (data.type === BrickType.GREEN) {
      // Bonus head: smiley
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = `${h * 0.6}px monospace`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(':)', x, y)
    } else if (data.type === BrickType.BLUE) {
      // Tears: drop
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = `${h * 0.6}px monospace`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('~', x, y)
    }
  }

  // =========================================================================
  // TEARS RENDERING
  // =========================================================================

  drawTear(data: TearRenderData): void {
    const s = CANVAS.SCALE
    const x = data.x * s
    const y = data.y * s

    this.ctx.fillStyle = COLORS.BRICK_BLUE
    this.ctx.shadowColor = COLORS.BRICK_BLUE
    this.ctx.shadowBlur = 6
    // Teardrop shape
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - 6)
    this.ctx.quadraticCurveTo(x + 4, y, x, y + 4)
    this.ctx.quadraticCurveTo(x - 4, y, x, y - 6)
    this.ctx.fill()
    this.ctx.shadowBlur = 0
  }

  // =========================================================================
  // UI RENDERING
  // =========================================================================

  drawUI(data: UIData): void {
    // Score (top left)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(8, 8, 130, 30)
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 14px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(`SCORE: ${data.score}`, 14, 15)

    // Level (center top)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    const levelText = `${data.levelName}`
    this.ctx.textAlign = 'center'
    this.ctx.fillRect(CANVAS.WIDTH / 2 - 60, 8, 120, 30)
    this.ctx.fillStyle = COLORS.ORANGE
    this.ctx.font = 'bold 14px monospace'
    this.ctx.fillText(levelText, CANVAS.WIDTH / 2, 15)

    // Lives (top right) — small soccer balls
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(CANVAS.WIDTH - 118, 8, 110, 30)
    this.ctx.textAlign = 'right'
    this.ctx.font = '14px monospace'
    let livesStr = ''
    for (let i = 0; i < data.lives; i++) livesStr += '⚽'
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.fillText(livesStr, CANVAS.WIDTH - 14, 15)

    // Active power-ups (bottom)
    if (data.activePowerUps.length > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.fillRect(8, CANVAS.HEIGHT - 30, 200, 22)
      this.ctx.fillStyle = COLORS.NEON_GREEN
      this.ctx.font = '11px monospace'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(data.activePowerUps.join(' | '), 14, CANVAS.HEIGHT - 22)
    }
  }

  // =========================================================================
  // SCREEN RENDERING
  // =========================================================================

  drawMenu(): void {
    this.drawBackground()

    // Title with neon glow
    this.ctx.shadowColor = COLORS.ORANGE
    this.ctx.shadowBlur = 25
    this.ctx.fillStyle = COLORS.ORANGE
    this.ctx.font = 'bold 32px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('TÊTE DE SOCCER', CANVAS.WIDTH / 2, 100)
    this.ctx.shadowBlur = 0

    // Subtitle
    this.ctx.fillStyle = COLORS.CYAN
    this.ctx.font = '16px monospace'
    this.ctx.fillText('Casse-Briques Cyberpunk', CANVAS.WIDTH / 2, 140)

    // Instructions
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = '14px monospace'
    this.ctx.fillText('Détruis toutes les briques !', CANVAS.WIDTH / 2, 220)

    // Brick types legend
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    const legendX = CANVAS.WIDTH / 2 - 100
    let legendY = 265

    const legends = [
      { color: COLORS.BRICK_GREY, text: 'Grise - 100 pts' },
      { color: COLORS.BRICK_ORANGE, text: 'Orange - Multi-ballon' },
      { color: COLORS.BRICK_RED, text: 'Rouge - Explosif' },
      { color: COLORS.BRICK_GREEN, text: 'Verte - Tête bonus' },
      { color: COLORS.BRICK_BLUE, text: 'Bleue - Larmes' },
      { color: COLORS.BRICK_BLACK, text: 'Noire - Incassable' },
    ]

    legends.forEach(({ color, text }) => {
      this.ctx.fillStyle = color
      this.ctx.fillRect(legendX, legendY - 6, 14, 10)
      this.ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(legendX, legendY - 6, 14, 10)
      this.ctx.fillStyle = COLORS.TEXT_DIM
      this.ctx.fillText(text, legendX + 20, legendY)
      legendY += 18
    })

    // Controls
    this.ctx.textAlign = 'center'
    this.ctx.fillStyle = COLORS.ORANGE_BRIGHT
    this.ctx.font = 'bold 14px monospace'
    this.ctx.fillText('CLIQUER OU ESPACE POUR JOUER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 50)

    this.ctx.fillStyle = COLORS.TEXT_DIM
    this.ctx.font = '10px monospace'
    this.ctx.fillText('Souris / ← → : Déplacer | Espace : Lancer | Échap : Pause', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 25)
  }

  drawPauseOverlay(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    this.ctx.shadowColor = COLORS.CYAN
    this.ctx.shadowBlur = 15
    this.ctx.fillStyle = COLORS.CYAN
    this.ctx.font = 'bold 36px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('PAUSE', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2)
    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = '14px monospace'
    this.ctx.fillText('ESPACE POUR REPRENDRE', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 50)
  }

  drawGameOver(score: number, highScore: number, isNewRecord: boolean): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    this.ctx.shadowColor = COLORS.BRICK_RED
    this.ctx.shadowBlur = 20
    this.ctx.fillStyle = COLORS.BRICK_RED
    this.ctx.font = 'bold 32px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('FIN DE PARTIE', CANVAS.WIDTH / 2, 140)
    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 20px monospace'
    this.ctx.fillText(`SCORE: ${score}`, CANVAS.WIDTH / 2, 220)

    if (isNewRecord) {
      this.ctx.shadowColor = COLORS.GOLD
      this.ctx.shadowBlur = 15
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.font = 'bold 18px monospace'
      this.ctx.fillText('NOUVEAU RECORD!', CANVAS.WIDTH / 2, 270)
      this.ctx.shadowBlur = 0
    }

    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = '14px monospace'
    this.ctx.fillText(`MEILLEUR: ${highScore}`, CANVAS.WIDTH / 2, 320)

    this.ctx.fillStyle = COLORS.ORANGE_BRIGHT
    this.ctx.font = '12px monospace'
    this.ctx.fillText('ESPACE POUR REJOUER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 60)
    this.ctx.fillText('ÉCHAP POUR LE MENU', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 40)
  }

  drawVictory(score: number, highScore: number, isNewRecord: boolean): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    this.ctx.shadowColor = COLORS.GOLD
    this.ctx.shadowBlur = 25
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.font = 'bold 32px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('VICTOIRE !', CANVAS.WIDTH / 2, 100)
    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = COLORS.ORANGE_BRIGHT
    this.ctx.font = '16px monospace'
    this.ctx.fillText('Tous les niveaux terminés !', CANVAS.WIDTH / 2, 150)

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 20px monospace'
    this.ctx.fillText(`SCORE: ${score}`, CANVAS.WIDTH / 2, 220)

    if (isNewRecord) {
      this.ctx.shadowColor = COLORS.GOLD
      this.ctx.shadowBlur = 15
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.font = 'bold 18px monospace'
      this.ctx.fillText('NOUVEAU RECORD!', CANVAS.WIDTH / 2, 270)
      this.ctx.shadowBlur = 0
    }

    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = '14px monospace'
    this.ctx.fillText(`MEILLEUR: ${highScore}`, CANVAS.WIDTH / 2, 320)

    this.ctx.fillStyle = COLORS.NEON_GREEN
    this.ctx.font = 'bold 14px monospace'
    this.ctx.fillText('ESPACE: NIVEAUX BONUS', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 80)
    this.ctx.fillStyle = COLORS.ORANGE_BRIGHT
    this.ctx.font = '12px monospace'
    this.ctx.fillText('ÉCHAP POUR LE MENU', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 55)
  }

  drawLevelTransition(levelName: string): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(CANVAS.WIDTH / 2 - 150, CANVAS.HEIGHT / 2 - 50, 300, 100)

    this.ctx.strokeStyle = COLORS.ORANGE
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(CANVAS.WIDTH / 2 - 150, CANVAS.HEIGHT / 2 - 50, 300, 100)

    this.ctx.shadowColor = COLORS.ORANGE
    this.ctx.shadowBlur = 15
    this.ctx.fillStyle = COLORS.ORANGE
    this.ctx.font = 'bold 24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('NIVEAU SUIVANT', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 - 10)

    this.ctx.font = '16px monospace'
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.fillText(levelName, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 25)
    this.ctx.shadowBlur = 0
  }

  // =========================================================================
  // MAIN RENDER
  // =========================================================================

  clear(): void {
    this.ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
  }

  render(
    paddle: PaddleRenderData,
    balls: BallRenderData[],
    bricks: BrickRenderData[],
    tears: TearRenderData[],
    uiData: UIData,
  ): void {
    this.animTime += 0.016

    this.drawBackground()

    // Draw bricks
    bricks.forEach((b) => this.drawBrick(b))

    // Draw tears
    tears.forEach((t) => this.drawTear(t))

    // Draw paddle
    this.drawPaddle(paddle)

    // Draw balls
    balls.forEach((b) => this.drawBall(b))

    // Draw UI
    this.drawUI(uiData)
  }
}
