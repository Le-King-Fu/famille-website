// Belle Bête Sage - Renderer System
// Procedural Canvas 2D rendering for cyberpunk endless runner

import {
  CANVAS,
  COLORS,
  LANES,
  PLAYER,
  OBSTACLES,
  type CharacterStats,
  type ObstacleType,
  type CharacterId,
  CHARACTERS,
} from '../config'
import type { CollectibleType } from '../entities/Collectible'

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerRenderData {
  x: number
  y: number
  width: number
  height: number
  character: CharacterStats
  isJumping: boolean
  jumpProgress: number
  isInvincible: boolean
  animationTime: number
  lives: number
}

export interface ObstacleRenderData {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: ObstacleType
  color: string
  isLarge: boolean
}

export interface CollectibleRenderData {
  id: string
  type: CollectibleType
  x: number
  y: number
  size: number
  color: string
  animationTime: number
}

export interface UIData {
  score: number
  highScore: number
  level: number
  levelName: string
  lives: number
  maxLives: number
  character: CharacterStats
  coinsCollected: number
  bonusesCollected: number
}

interface Building {
  x: number
  width: number
  height: number
  windows: { x: number; y: number; lit: boolean }[]
  neonColor: string
}

// =============================================================================
// RENDERER CLASS
// =============================================================================

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private buildings: Building[] = []
  private buildingScrollOffset = 0
  private starField: { x: number; y: number; brightness: number }[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context')
    this.ctx = ctx

    this.setupCanvas()
    this.generateBuildings()
    this.generateStarField()
  }

  // ===========================================================================
  // SETUP
  // ===========================================================================

  private setupCanvas(): void {
    this.canvas.width = CANVAS.WIDTH
    this.canvas.height = CANVAS.HEIGHT

    this.ctx.imageSmoothingEnabled = false
    this.canvas.style.imageRendering = 'pixelated'
  }

  private generateBuildings(): void {
    this.buildings = []
    let x = 0
    const neonColors = [COLORS.NEON_PINK, COLORS.NEON_CYAN, COLORS.NEON_GREEN, COLORS.PRIMARY]

    while (x < CANVAS.WIDTH + 200) {
      const width = 40 + Math.random() * 60
      const height = 100 + Math.random() * 200
      const windows: Building['windows'] = []

      // Generate windows
      const windowRows = Math.floor(height / 20)
      const windowCols = Math.floor(width / 15)
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          windows.push({
            x: 5 + col * 15,
            y: 10 + row * 20,
            lit: Math.random() > 0.6,
          })
        }
      }

      this.buildings.push({
        x,
        width,
        height,
        windows,
        neonColor: neonColors[Math.floor(Math.random() * neonColors.length)],
      })

      x += width + 5
    }
  }

  private generateStarField(): void {
    this.starField = []
    for (let i = 0; i < 50; i++) {
      this.starField.push({
        x: Math.random() * CANVAS.WIDTH,
        y: Math.random() * 100,
        brightness: 0.3 + Math.random() * 0.7,
      })
    }
  }

  // ===========================================================================
  // BACKGROUND RENDERING
  // ===========================================================================

  private drawSky(): void {
    // Gradient sky
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT)
    gradient.addColorStop(0, '#0a0a15')
    gradient.addColorStop(0.3, COLORS.BG_DARK)
    gradient.addColorStop(1, COLORS.BG_PRIMARY)
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Stars
    this.starField.forEach((star) => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.5})`
      this.ctx.fillRect(star.x, star.y, 2, 2)
    })
  }

  private drawBuildings(scrollSpeed: number): void {
    // Update scroll
    this.buildingScrollOffset += scrollSpeed * 0.5

    this.buildings.forEach((building) => {
      const drawX = building.x - (this.buildingScrollOffset % (CANVAS.WIDTH + 200))
      let adjustedX = drawX
      if (drawX < -building.width) {
        adjustedX = drawX + CANVAS.WIDTH + 200
      }

      const drawY = CANVAS.HEIGHT - building.height

      // Building body
      this.ctx.fillStyle = COLORS.BUILDING_DARK
      this.ctx.fillRect(adjustedX, drawY, building.width, building.height)

      // Building edge highlight
      this.ctx.fillStyle = COLORS.BUILDING_MEDIUM
      this.ctx.fillRect(adjustedX, drawY, 3, building.height)

      // Windows
      building.windows.forEach((window) => {
        this.ctx.fillStyle = window.lit ? COLORS.WINDOW_LIT : COLORS.WINDOW_OFF
        this.ctx.fillRect(adjustedX + window.x, drawY + window.y, 8, 12)
      })

      // Neon sign on top (random buildings)
      if (building.height > 200) {
        this.ctx.shadowColor = building.neonColor
        this.ctx.shadowBlur = 10
        this.ctx.fillStyle = building.neonColor
        this.ctx.fillRect(adjustedX + 10, drawY - 5, building.width - 20, 3)
        this.ctx.shadowBlur = 0
      }
    })
  }

  // ===========================================================================
  // LANE RENDERING
  // ===========================================================================

  private drawLanes(): void {
    // Road surface
    const roadLeft = LANES.POSITIONS[0] * CANVAS.SCALE - (LANES.WIDTH * CANVAS.SCALE) / 2 - 20
    const roadWidth = LANES.WIDTH * 3 * CANVAS.SCALE + 40

    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(roadLeft, 0, roadWidth, CANVAS.HEIGHT)

    // Lane dividers (dashed lines)
    this.ctx.strokeStyle = COLORS.TEXT_DIM
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([20, 15])

    for (let i = 1; i < LANES.COUNT; i++) {
      const x = (LANES.POSITIONS[i - 1] + LANES.POSITIONS[i]) / 2 * CANVAS.SCALE
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, CANVAS.HEIGHT)
      this.ctx.stroke()
    }

    this.ctx.setLineDash([])

    // Road edges with neon glow
    this.ctx.shadowColor = COLORS.NEON_CYAN
    this.ctx.shadowBlur = 8
    this.ctx.strokeStyle = COLORS.NEON_CYAN
    this.ctx.lineWidth = 3

    // Left edge
    this.ctx.beginPath()
    this.ctx.moveTo(roadLeft, 0)
    this.ctx.lineTo(roadLeft, CANVAS.HEIGHT)
    this.ctx.stroke()

    // Right edge
    this.ctx.beginPath()
    this.ctx.moveTo(roadLeft + roadWidth, 0)
    this.ctx.lineTo(roadLeft + roadWidth, CANVAS.HEIGHT)
    this.ctx.stroke()

    this.ctx.shadowBlur = 0
  }

  // ===========================================================================
  // PLAYER RENDERING
  // ===========================================================================

  drawPlayer(data: PlayerRenderData): void {
    const scale = CANVAS.SCALE
    const x = data.x * scale
    const y = data.y * scale
    const width = data.width * scale
    const height = data.height * scale

    // Invincibility blink effect
    if (data.isInvincible && Math.floor(data.animationTime * 10) % 2 === 0) {
      this.ctx.globalAlpha = 0.5
    }

    // Jump shadow
    if (data.isJumping) {
      const shadowScale = 1 - data.jumpProgress * 0.5
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      this.ctx.beginPath()
      this.ctx.ellipse(
        x,
        (PLAYER.Y_POSITION + 5) * scale,
        width * 0.6 * shadowScale,
        8 * shadowScale,
        0,
        0,
        Math.PI * 2
      )
      this.ctx.fill()
    }

    // Dog body
    this.drawDog(x, y, width, height, data.character, data.animationTime, data.isJumping)

    this.ctx.globalAlpha = 1
  }

  private drawDog(
    x: number,
    y: number,
    width: number,
    height: number,
    character: CharacterStats,
    animationTime: number,
    isJumping: boolean
  ): void {
    const legAnimation = isJumping ? 0 : Math.sin(animationTime * 15) * 5
    const tailWag = Math.sin(animationTime * 12) * 8

    // Body
    this.ctx.fillStyle = character.color
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.4, width * 0.5, height * 0.35, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Head
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.75, width * 0.35, width * 0.3, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Ears
    this.ctx.fillStyle = character.accentColor
    // Left ear
    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.25, y - height * 0.85)
    this.ctx.lineTo(x - width * 0.4, y - height * 1.1)
    this.ctx.lineTo(x - width * 0.1, y - height * 0.9)
    this.ctx.fill()
    // Right ear
    this.ctx.beginPath()
    this.ctx.moveTo(x + width * 0.25, y - height * 0.85)
    this.ctx.lineTo(x + width * 0.4, y - height * 1.1)
    this.ctx.lineTo(x + width * 0.1, y - height * 0.9)
    this.ctx.fill()

    // Snout
    this.ctx.fillStyle = character.accentColor
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.65, width * 0.15, width * 0.12, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Nose
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.62, width * 0.08, width * 0.06, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Eyes
    this.ctx.fillStyle = '#fff'
    this.ctx.beginPath()
    this.ctx.arc(x - width * 0.12, y - height * 0.8, width * 0.08, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.12, y - height * 0.8, width * 0.08, 0, Math.PI * 2)
    this.ctx.fill()

    // Pupils
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    this.ctx.arc(x - width * 0.1, y - height * 0.8, width * 0.04, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.14, y - height * 0.8, width * 0.04, 0, Math.PI * 2)
    this.ctx.fill()

    // Legs
    this.ctx.fillStyle = character.color
    const legWidth = width * 0.12
    const legHeight = height * 0.3

    // Front legs
    this.ctx.fillRect(x - width * 0.25 - legWidth / 2, y - legHeight + legAnimation, legWidth, legHeight)
    this.ctx.fillRect(x + width * 0.25 - legWidth / 2, y - legHeight - legAnimation, legWidth, legHeight)

    // Back legs (slightly behind)
    this.ctx.fillRect(x - width * 0.35 - legWidth / 2, y - height * 0.2 - legAnimation, legWidth, height * 0.25)
    this.ctx.fillRect(x + width * 0.35 - legWidth / 2, y - height * 0.2 + legAnimation, legWidth, height * 0.25)

    // Tail
    this.ctx.strokeStyle = character.color
    this.ctx.lineWidth = 6
    this.ctx.lineCap = 'round'
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - height * 0.3)
    this.ctx.quadraticCurveTo(
      x - width * 0.3 + tailWag,
      y - height * 0.5,
      x - width * 0.2 + tailWag * 1.5,
      y - height * 0.7
    )
    this.ctx.stroke()

    // Laska: white patches (chest + paw tips) for black-and-white look
    if (character.id === 'laska') {
      this.ctx.fillStyle = '#FFFFFF'
      // Chest patch
      this.ctx.beginPath()
      this.ctx.ellipse(x, y - height * 0.25, width * 0.2, height * 0.15, 0, 0, Math.PI * 2)
      this.ctx.fill()
      // Paw tips (front)
      this.ctx.fillRect(x - width * 0.25 - legWidth / 2, y - 4, legWidth, 4)
      this.ctx.fillRect(x + width * 0.25 - legWidth / 2, y - 4, legWidth, 4)
      // Paw tips (back)
      this.ctx.fillRect(x - width * 0.35 - legWidth / 2, y - height * 0.2 + height * 0.25 - 4, legWidth, 4)
      this.ctx.fillRect(x + width * 0.35 - legWidth / 2, y - height * 0.2 + height * 0.25 - 4, legWidth, 4)
    }
  }

  // ===========================================================================
  // OBSTACLE RENDERING
  // ===========================================================================

  drawObstacle(data: ObstacleRenderData): void {
    const scale = CANVAS.SCALE
    const x = data.x * scale
    const y = data.y * scale
    const width = data.width * scale
    const height = data.height * scale

    switch (data.type) {
      case 'cat':
        this.drawCat(x, y, width, height, data.color)
        break
      case 'rat':
        this.drawRat(x, y, width, height, data.color)
        break
      case 'car':
        this.drawCar(x, y, width, height, data.color)
        break
      case 'motorcycle':
        this.drawMotorcycle(x, y, width, height, data.color)
        break
      case 'cow':
        this.drawCow(x, y, width, height, data.color)
        break
      case 'cone':
        this.drawCone(x, y, width, height, data.color)
        break
    }
  }

  private drawCat(x: number, y: number, width: number, height: number, color: string): void {
    // Body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.4, width * 0.45, height * 0.35, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Head
    this.ctx.beginPath()
    this.ctx.arc(x, y - height * 0.8, width * 0.3, 0, Math.PI * 2)
    this.ctx.fill()

    // Ears (triangular)
    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.25, y - height * 0.9)
    this.ctx.lineTo(x - width * 0.35, y - height * 1.2)
    this.ctx.lineTo(x - width * 0.1, y - height * 0.95)
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.moveTo(x + width * 0.25, y - height * 0.9)
    this.ctx.lineTo(x + width * 0.35, y - height * 1.2)
    this.ctx.lineTo(x + width * 0.1, y - height * 0.95)
    this.ctx.fill()

    // Eyes (angry)
    this.ctx.fillStyle = '#ffff00'
    this.ctx.beginPath()
    this.ctx.ellipse(x - width * 0.12, y - height * 0.85, width * 0.08, width * 0.1, 0, 0, Math.PI * 2)
    this.ctx.ellipse(x + width * 0.12, y - height * 0.85, width * 0.08, width * 0.1, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Pupils (slits)
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(x - width * 0.13, y - height * 0.92, width * 0.03, height * 0.15)
    this.ctx.fillRect(x + width * 0.11, y - height * 0.92, width * 0.03, height * 0.15)

    // Tail
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 4
    this.ctx.beginPath()
    this.ctx.moveTo(x + width * 0.3, y - height * 0.3)
    this.ctx.quadraticCurveTo(x + width * 0.6, y - height * 0.5, x + width * 0.5, y - height * 0.8)
    this.ctx.stroke()
  }

  private drawRat(x: number, y: number, width: number, height: number, color: string): void {
    // Body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.4, width * 0.45, height * 0.35, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Head (pointed)
    this.ctx.beginPath()
    this.ctx.ellipse(x + width * 0.2, y - height * 0.5, width * 0.35, height * 0.25, -0.3, 0, Math.PI * 2)
    this.ctx.fill()

    // Ears (round)
    this.ctx.fillStyle = '#ffc0cb'
    this.ctx.beginPath()
    this.ctx.arc(x, y - height * 0.7, width * 0.15, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.25, y - height * 0.75, width * 0.12, 0, Math.PI * 2)
    this.ctx.fill()

    // Eyes
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    this.ctx.arc(x + width * 0.3, y - height * 0.55, width * 0.06, 0, Math.PI * 2)
    this.ctx.fill()

    // Nose
    this.ctx.fillStyle = '#ff69b4'
    this.ctx.beginPath()
    this.ctx.arc(x + width * 0.5, y - height * 0.45, width * 0.05, 0, Math.PI * 2)
    this.ctx.fill()

    // Tail
    this.ctx.strokeStyle = '#ffc0cb'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.4, y - height * 0.3)
    this.ctx.bezierCurveTo(
      x - width * 0.8, y - height * 0.2,
      x - width * 0.9, y - height * 0.6,
      x - width * 0.7, y - height * 0.8
    )
    this.ctx.stroke()
  }

  private drawCar(x: number, y: number, width: number, height: number, color: string): void {
    // Car body
    this.ctx.fillStyle = color
    this.ctx.fillRect(x - width / 2, y - height * 0.6, width, height * 0.5)

    // Car top
    this.ctx.fillRect(x - width * 0.35, y - height, width * 0.7, height * 0.4)

    // Windows
    this.ctx.fillStyle = '#87CEEB'
    this.ctx.fillRect(x - width * 0.3, y - height * 0.95, width * 0.25, height * 0.3)
    this.ctx.fillRect(x + width * 0.05, y - height * 0.95, width * 0.25, height * 0.3)

    // Headlights
    this.ctx.fillStyle = '#ffff00'
    this.ctx.shadowColor = '#ffff00'
    this.ctx.shadowBlur = 8
    this.ctx.fillRect(x - width * 0.45, y - height * 0.5, width * 0.1, height * 0.15)
    this.ctx.fillRect(x + width * 0.35, y - height * 0.5, width * 0.1, height * 0.15)
    this.ctx.shadowBlur = 0

    // Wheels
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.beginPath()
    this.ctx.arc(x - width * 0.3, y - height * 0.1, width * 0.12, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.3, y - height * 0.1, width * 0.12, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawMotorcycle(x: number, y: number, width: number, height: number, color: string): void {
    // Wheels
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.beginPath()
    this.ctx.arc(x - width * 0.3, y - height * 0.2, width * 0.15, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.3, y - height * 0.2, width * 0.15, 0, Math.PI * 2)
    this.ctx.fill()

    // Body/frame
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.2, y - height * 0.3)
    this.ctx.lineTo(x + width * 0.3, y - height * 0.3)
    this.ctx.lineTo(x + width * 0.4, y - height * 0.5)
    this.ctx.lineTo(x, y - height * 0.8)
    this.ctx.lineTo(x - width * 0.3, y - height * 0.5)
    this.ctx.closePath()
    this.ctx.fill()

    // Seat
    this.ctx.fillStyle = '#2a2a2a'
    this.ctx.fillRect(x - width * 0.15, y - height * 0.7, width * 0.35, height * 0.15)

    // Handlebars
    this.ctx.strokeStyle = '#888'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(x + width * 0.2, y - height * 0.75)
    this.ctx.lineTo(x + width * 0.35, y - height * 0.9)
    this.ctx.stroke()

    // Headlight
    this.ctx.fillStyle = '#ffff00'
    this.ctx.shadowColor = '#ffff00'
    this.ctx.shadowBlur = 6
    this.ctx.beginPath()
    this.ctx.arc(x + width * 0.38, y - height * 0.5, width * 0.08, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.shadowBlur = 0
  }

  private drawCow(x: number, y: number, width: number, height: number, color: string): void {
    // Body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.4, width * 0.45, height * 0.35, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Spots
    this.ctx.fillStyle = '#4a4a4a'
    this.ctx.beginPath()
    this.ctx.ellipse(x - width * 0.15, y - height * 0.45, width * 0.12, height * 0.1, 0.3, 0, Math.PI * 2)
    this.ctx.ellipse(x + width * 0.2, y - height * 0.35, width * 0.1, height * 0.12, -0.2, 0, Math.PI * 2)
    this.ctx.fill()

    // Head
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.8, width * 0.25, height * 0.2, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Snout
    this.ctx.fillStyle = '#ffc0cb'
    this.ctx.beginPath()
    this.ctx.ellipse(x, y - height * 0.7, width * 0.15, height * 0.1, 0, 0, Math.PI * 2)
    this.ctx.fill()

    // Nostrils
    this.ctx.fillStyle = '#333'
    this.ctx.beginPath()
    this.ctx.arc(x - width * 0.05, y - height * 0.68, width * 0.03, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.05, y - height * 0.68, width * 0.03, 0, Math.PI * 2)
    this.ctx.fill()

    // Eyes
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    this.ctx.arc(x - width * 0.1, y - height * 0.85, width * 0.04, 0, Math.PI * 2)
    this.ctx.arc(x + width * 0.1, y - height * 0.85, width * 0.04, 0, Math.PI * 2)
    this.ctx.fill()

    // Horns
    this.ctx.fillStyle = '#d4a574'
    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.2, y - height * 0.9)
    this.ctx.quadraticCurveTo(x - width * 0.35, y - height * 1.1, x - width * 0.25, y - height * 1.15)
    this.ctx.quadraticCurveTo(x - width * 0.15, y - height * 1.05, x - width * 0.15, y - height * 0.95)
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.moveTo(x + width * 0.2, y - height * 0.9)
    this.ctx.quadraticCurveTo(x + width * 0.35, y - height * 1.1, x + width * 0.25, y - height * 1.15)
    this.ctx.quadraticCurveTo(x + width * 0.15, y - height * 1.05, x + width * 0.15, y - height * 0.95)
    this.ctx.fill()

    // Legs
    this.ctx.fillStyle = color
    const legWidth = width * 0.08
    this.ctx.fillRect(x - width * 0.3, y - height * 0.15, legWidth, height * 0.2)
    this.ctx.fillRect(x - width * 0.15, y - height * 0.15, legWidth, height * 0.2)
    this.ctx.fillRect(x + width * 0.1, y - height * 0.15, legWidth, height * 0.2)
    this.ctx.fillRect(x + width * 0.25, y - height * 0.15, legWidth, height * 0.2)
  }

  private drawCone(x: number, y: number, width: number, height: number, color: string): void {
    // Cone body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(x, y - height)
    this.ctx.lineTo(x - width / 2, y)
    this.ctx.lineTo(x + width / 2, y)
    this.ctx.closePath()
    this.ctx.fill()

    // White stripes
    this.ctx.fillStyle = '#fff'
    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.15, y - height * 0.3)
    this.ctx.lineTo(x + width * 0.15, y - height * 0.3)
    this.ctx.lineTo(x + width * 0.25, y - height * 0.15)
    this.ctx.lineTo(x - width * 0.25, y - height * 0.15)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.moveTo(x - width * 0.08, y - height * 0.6)
    this.ctx.lineTo(x + width * 0.08, y - height * 0.6)
    this.ctx.lineTo(x + width * 0.12, y - height * 0.45)
    this.ctx.lineTo(x - width * 0.12, y - height * 0.45)
    this.ctx.closePath()
    this.ctx.fill()

    // Base
    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(x - width * 0.6, y - height * 0.08, width * 1.2, height * 0.1)
  }

  // ===========================================================================
  // COLLECTIBLE RENDERING
  // ===========================================================================

  drawCollectible(data: CollectibleRenderData): void {
    const scale = CANVAS.SCALE
    const x = data.x * scale
    const y = data.y * scale
    const size = data.size * scale

    // Pulsing animation
    const pulse = 1 + Math.sin(data.animationTime) * 0.15

    if (data.type === 'coin') {
      this.drawCoin(x, y, size * pulse, data.color)
    } else {
      this.drawBonus(x, y, size * pulse, data.color, data.animationTime)
    }
  }

  private drawCoin(x: number, y: number, size: number, color: string): void {
    // Glow effect
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 12

    // Coin body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    this.ctx.fill()

    // Inner circle
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(x, y, size / 3, 0, Math.PI * 2)
    this.ctx.stroke()

    // $ symbol
    this.ctx.fillStyle = '#fff'
    this.ctx.font = `bold ${size * 0.6}px monospace`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('$', x, y)

    this.ctx.shadowBlur = 0
  }

  private drawBonus(x: number, y: number, size: number, color: string, animationTime: number): void {
    // Rotation
    const rotation = animationTime * 2

    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(rotation)

    // Glow effect
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 15

    // Star shape
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const radius = i === 0 ? size / 2 : size / 2
      const innerRadius = size / 4
      const outerAngle = angle
      const innerAngle = angle + Math.PI / 5

      if (i === 0) {
        this.ctx.moveTo(Math.cos(outerAngle) * radius, Math.sin(outerAngle) * radius)
      } else {
        this.ctx.lineTo(Math.cos(outerAngle) * radius, Math.sin(outerAngle) * radius)
      }
      this.ctx.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius)
    }
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.shadowBlur = 0
    this.ctx.restore()
  }

  // ===========================================================================
  // UI RENDERING
  // ===========================================================================

  drawUI(data: UIData): void {
    // Score panel (top left)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(8, 8, 150, 70)

    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 16px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`SCORE: ${data.score}`, 16, 30)

    this.ctx.font = '12px monospace'
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.fillText(`MAX: ${data.highScore}`, 16, 48)

    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.fillText(`${data.levelName}`, 16, 66)

    // Lives (top right)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(CANVAS.WIDTH - 108, 8, 100, 35)

    this.ctx.textAlign = 'right'
    this.ctx.font = '16px monospace'
    let livesDisplay = ''
    for (let i = 0; i < data.maxLives; i++) {
      livesDisplay += i < data.lives ? '♥' : '♡'
    }
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.fillText(livesDisplay, CANVAS.WIDTH - 16, 32)

    // Character info (bottom left)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(8, CANVAS.HEIGHT - 62, 145, 54)

    this.ctx.textAlign = 'left'
    this.ctx.font = 'bold 12px monospace'
    this.ctx.fillStyle = data.character.accentColor
    this.ctx.fillText(data.character.name, 16, CANVAS.HEIGHT - 46)

    this.ctx.font = '9px monospace'
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.fillText(`♥ Vie: ${data.character.force}`, 16, CANVAS.HEIGHT - 32)
    this.ctx.fillStyle = COLORS.NEON_CYAN
    this.ctx.fillText(`⚡ Dist: ${data.character.vitesse}`, 16, CANVAS.HEIGHT - 20)
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.fillText(`⭐ Bonus: ${data.character.beaute}`, 80, CANVAS.HEIGHT - 20)

    // Collectibles count (bottom right)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(CANVAS.WIDTH - 108, CANVAS.HEIGHT - 50, 100, 42)

    this.ctx.textAlign = 'right'
    this.ctx.font = '12px monospace'
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.fillText(`🪙 ${data.coinsCollected}`, CANVAS.WIDTH - 16, CANVAS.HEIGHT - 32)
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.fillText(`⭐ ${data.bonusesCollected}`, CANVAS.WIDTH - 16, CANVAS.HEIGHT - 16)
  }

  // ===========================================================================
  // SCREEN RENDERING
  // ===========================================================================

  drawMenu(highScore: number, characters: CharacterId[], selectedIndex: number): void {
    this.clear()
    this.drawSky()
    this.drawBuildings(0)

    // Title with neon effect
    this.ctx.shadowColor = COLORS.NEON_PINK
    this.ctx.shadowBlur = 20
    this.ctx.fillStyle = COLORS.NEON_PINK
    this.ctx.font = 'bold 24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('LA BELLE, LA BÊTE', CANVAS.WIDTH / 2, 70)
    this.ctx.fillStyle = COLORS.NEON_CYAN
    this.ctx.shadowColor = COLORS.NEON_CYAN
    this.ctx.fillText('ET LA SAGE', CANVAS.WIDTH / 2, 105)
    this.ctx.shadowBlur = 0

    // Character selection
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = '14px monospace'
    this.ctx.fillText('CHOISIS TON CHIEN', CANVAS.WIDTH / 2, 170)

    characters.forEach((charId, index) => {
      const char = CHARACTERS[charId]
      const cardX = CANVAS.WIDTH / 2 + (index - 1) * 150
      const cardY = 260
      const isSelected = index === selectedIndex

      // Card background
      this.ctx.fillStyle = isSelected ? 'rgba(193, 119, 103, 0.3)' : 'rgba(0, 0, 0, 0.5)'
      this.ctx.strokeStyle = isSelected ? COLORS.PRIMARY : COLORS.TEXT_DIM
      this.ctx.lineWidth = isSelected ? 3 : 1
      this.ctx.fillRect(cardX - 60, cardY - 50, 120, 145)
      this.ctx.strokeRect(cardX - 60, cardY - 50, 120, 145)

      // Draw mini dog
      this.drawDog(cardX, cardY + 10, 40, 50, char, 0, false)

      // Name
      this.ctx.fillStyle = isSelected ? char.accentColor : COLORS.TEXT
      this.ctx.font = 'bold 12px monospace'
      this.ctx.fillText(char.name, cardX, cardY + 50)

      // Stats with descriptive labels
      this.ctx.textAlign = 'left'
      this.ctx.font = '9px monospace'
      this.ctx.fillStyle = COLORS.ACCENT
      this.ctx.fillText(`♥ Vie: ${char.force}`, cardX - 50, cardY + 65)
      this.ctx.fillStyle = COLORS.NEON_CYAN
      this.ctx.fillText(`⚡ Dist: ${char.vitesse}`, cardX - 50, cardY + 76)
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.fillText(`⭐ Bonus: ${char.beaute}`, cardX + 5, cardY + 76)
      this.ctx.textAlign = 'center'
    })

    // Instructions
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '12px monospace'
    this.ctx.fillText('← → POUR CHOISIR', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 90)
    this.ctx.fillText('ESPACE POUR JOUER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 70)
    this.ctx.fillStyle = COLORS.TEXT_DIM
    this.ctx.font = '10px monospace'
    this.ctx.fillText('T = TUTORIEL', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 52)

    // High score
    if (highScore > 0) {
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.fillText(`RECORD: ${highScore}`, CANVAS.WIDTH / 2, CANVAS.HEIGHT - 30)
    }
  }

  drawPauseOverlay(): void {
    // Darken background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Pause text with neon
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

  drawGameOver(score: number, highScore: number, isNewHighScore: boolean, character: CharacterStats): void {
    // Darken background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Game Over text
    this.ctx.shadowColor = COLORS.ACCENT
    this.ctx.shadowBlur = 20
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.font = 'bold 32px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('FIN DE PARTIE', CANVAS.WIDTH / 2, 120)
    this.ctx.shadowBlur = 0

    // Draw character
    this.drawDog(CANVAS.WIDTH / 2, 200, 60, 80, character, 0, false)

    // Score
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 20px monospace'
    this.ctx.fillText(`SCORE: ${score}`, CANVAS.WIDTH / 2, 280)

    // New record
    if (isNewHighScore) {
      this.ctx.shadowColor = COLORS.GOLD
      this.ctx.shadowBlur = 15
      this.ctx.fillStyle = COLORS.GOLD
      this.ctx.font = 'bold 18px monospace'
      this.ctx.fillText('NOUVEAU RECORD!', CANVAS.WIDTH / 2, 320)
      this.ctx.shadowBlur = 0
    }

    // High score
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = '14px monospace'
    this.ctx.fillText(`MEILLEUR: ${highScore}`, CANVAS.WIDTH / 2, 360)

    // Replay instruction
    this.ctx.fillStyle = COLORS.PRIMARY
    this.ctx.font = '12px monospace'
    this.ctx.fillText('ESPACE POUR REJOUER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 60)
    this.ctx.fillText('ÉCHAP POUR LE MENU', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 40)
  }

  drawLevelUp(levelName: string): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(CANVAS.WIDTH / 2 - 150, CANVAS.HEIGHT / 2 - 50, 300, 100)

    // Border
    this.ctx.strokeStyle = COLORS.SECONDARY
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(CANVAS.WIDTH / 2 - 150, CANVAS.HEIGHT / 2 - 50, 300, 100)

    // Text with glow
    this.ctx.shadowColor = COLORS.SECONDARY
    this.ctx.shadowBlur = 15
    this.ctx.fillStyle = COLORS.SECONDARY
    this.ctx.font = 'bold 24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('LEVEL UP!', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2)

    this.ctx.font = '16px monospace'
    this.ctx.fillText(levelName, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 30)
    this.ctx.shadowBlur = 0
  }

  drawHitEffect(): void {
    // Red flash on screen edges
    this.ctx.fillStyle = 'rgba(229, 115, 115, 0.3)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
  }

  drawJumpBonus(x: number, y: number, timer: number): void {
    const scale = CANVAS.SCALE
    const alpha = Math.min(1, timer / 300)
    const floatOffset = (1 - timer / 1000) * 40

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.shadowColor = COLORS.NEON_GREEN
    this.ctx.shadowBlur = 10
    this.ctx.fillStyle = COLORS.NEON_GREEN
    this.ctx.font = 'bold 16px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('+50', x * scale, (y - 20) * scale - floatOffset)
    this.ctx.shadowBlur = 0
    this.ctx.restore()
  }

  drawTutorial(): void {
    // Full-screen dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)

    // Title
    this.ctx.shadowColor = COLORS.NEON_CYAN
    this.ctx.shadowBlur = 15
    this.ctx.fillStyle = COLORS.NEON_CYAN
    this.ctx.font = 'bold 22px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('COMMENT JOUER', CANVAS.WIDTH / 2, 45)
    this.ctx.shadowBlur = 0

    // --- Small obstacles section ---
    this.ctx.fillStyle = COLORS.NEON_GREEN
    this.ctx.font = 'bold 13px monospace'
    this.ctx.fillText('Saute par-dessus ! (+50 pts)', CANVAS.WIDTH / 2, 80)

    // Draw small obstacle examples
    const smallY = 120
    const smallObs = OBSTACLES.small
    const smallSpacing = CANVAS.WIDTH / (smallObs.length + 1)
    smallObs.forEach((obs, i) => {
      const sx = smallSpacing * (i + 1)
      const scale = CANVAS.SCALE
      const w = obs.width * scale * 0.8
      const h = obs.height * scale * 0.8
      switch (obs.type) {
        case 'cat':
          this.drawCat(sx, smallY, w, h, obs.color)
          break
        case 'rat':
          this.drawRat(sx, smallY, w, h, obs.color)
          break
        case 'cone':
          this.drawCone(sx, smallY, w, h, obs.color)
          break
      }
      this.ctx.fillStyle = COLORS.TEXT_DIM
      this.ctx.font = '10px monospace'
      this.ctx.fillText(obs.name, sx, smallY + 18)
    })

    // --- Large obstacles section ---
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.font = 'bold 13px monospace'
    this.ctx.fillText('Change de couloir !', CANVAS.WIDTH / 2, 165)

    const largeY = 210
    const largeObs = OBSTACLES.large
    const largeSpacing = CANVAS.WIDTH / (largeObs.length + 1)
    largeObs.forEach((obs, i) => {
      const sx = largeSpacing * (i + 1)
      const scale = CANVAS.SCALE
      const w = obs.width * scale * 0.6
      const h = obs.height * scale * 0.6
      switch (obs.type) {
        case 'car':
          this.drawCar(sx, largeY, w, h, obs.color)
          break
        case 'motorcycle':
          this.drawMotorcycle(sx, largeY, w, h, obs.color)
          break
        case 'cow':
          this.drawCow(sx, largeY, w, h, obs.color)
          break
      }
      this.ctx.fillStyle = COLORS.TEXT_DIM
      this.ctx.font = '10px monospace'
      this.ctx.fillText(obs.name, sx, largeY + 22)
    })

    // --- Character traits ---
    this.ctx.fillStyle = COLORS.TEXT
    this.ctx.font = 'bold 12px monospace'
    this.ctx.fillText('TRAITS DES CHIENS', CANVAS.WIDTH / 2, 270)

    this.ctx.font = '11px monospace'
    this.ctx.fillStyle = COLORS.ACCENT
    this.ctx.fillText('♥ Force = Plus de vies', CANVAS.WIDTH / 2, 295)
    this.ctx.fillStyle = COLORS.NEON_CYAN
    this.ctx.fillText('⚡ Vitesse = Plus de points distance', CANVAS.WIDTH / 2, 315)
    this.ctx.fillStyle = COLORS.GOLD
    this.ctx.fillText('⭐ Beauté = Plus de bonus étoile', CANVAS.WIDTH / 2, 335)

    // --- Controls ---
    this.ctx.fillStyle = COLORS.TEXT_DIM
    this.ctx.font = '10px monospace'
    this.ctx.fillText('← → : Changer de couloir', CANVAS.WIDTH / 2, 370)
    this.ctx.fillText('↑ ou ESPACE : Sauter', CANVAS.WIDTH / 2, 385)
    this.ctx.fillText('Échap : Pause', CANVAS.WIDTH / 2, 400)

    // --- Start prompt ---
    this.ctx.shadowColor = COLORS.NEON_PINK
    this.ctx.shadowBlur = 10
    this.ctx.fillStyle = COLORS.NEON_PINK
    this.ctx.font = 'bold 14px monospace'
    this.ctx.fillText('ESPACE POUR COMMENCER', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 30)
    this.ctx.shadowBlur = 0
  }

  // ===========================================================================
  // MAIN RENDER METHODS
  // ===========================================================================

  clear(): void {
    this.ctx.fillStyle = COLORS.BG_PRIMARY
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT)
  }

  renderBackground(scrollSpeed: number): void {
    this.drawSky()
    this.drawBuildings(scrollSpeed)
    this.drawLanes()
  }

  render(
    player: PlayerRenderData,
    obstacles: ObstacleRenderData[],
    collectibles: CollectibleRenderData[],
    uiData: UIData,
    scrollSpeed: number
  ): void {
    // Background
    this.renderBackground(scrollSpeed)

    // Collectibles (behind player)
    collectibles.forEach((c) => this.drawCollectible(c))

    // Obstacles
    obstacles.forEach((o) => this.drawObstacle(o))

    // Player
    this.drawPlayer(player)

    // UI
    this.drawUI(uiData)
  }
}
