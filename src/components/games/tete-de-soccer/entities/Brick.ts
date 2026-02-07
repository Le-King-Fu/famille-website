// =============================================================================
// Tête de Soccer - Brick Entity
// =============================================================================

import { BRICK_GRID, BrickType, BRICK_CONFIGS, type BrickConfig } from '../config'

export interface BrickRenderData {
  x: number
  y: number
  width: number
  height: number
  type: BrickType
  config: BrickConfig
  destroying: boolean
  destroyTimer: number
}

export class Brick {
  col: number
  row: number
  type: BrickType
  config: BrickConfig
  hp: number
  active: boolean
  destroying = false
  destroyTimer = 0

  // Pixel coordinates (native)
  x: number
  y: number
  width: number
  height: number

  constructor(col: number, row: number, type: BrickType) {
    this.col = col
    this.row = row
    this.type = type
    this.config = BRICK_CONFIGS[type]
    this.hp = this.config.hp
    this.active = type !== BrickType.EMPTY

    this.width = BRICK_GRID.BRICK_WIDTH
    this.height = BRICK_GRID.BRICK_HEIGHT
    this.x = BRICK_GRID.OFFSET_X + col * (BRICK_GRID.BRICK_WIDTH + BRICK_GRID.SPACING) + this.width / 2
    this.y = BRICK_GRID.OFFSET_Y + row * (BRICK_GRID.BRICK_HEIGHT + BRICK_GRID.SPACING) + this.height / 2
  }

  // Hit the brick, returns true if destroyed
  hit(): boolean {
    if (!this.active || this.hp === -1) return false // Indestructible

    this.hp--
    if (this.hp <= 0) {
      this.destroying = true
      this.destroyTimer = 300 // ms for animation
      return true
    }
    return false
  }

  update(dt: number): void {
    if (this.destroying) {
      this.destroyTimer -= dt * 16.67
      if (this.destroyTimer <= 0) {
        this.active = false
      }
    }
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    }
  }

  // Check if ball collides with this brick
  checkCollision(ballX: number, ballY: number, ballRadius: number): boolean {
    if (!this.active || this.destroying) return false

    const bounds = this.getBounds()
    // Find closest point on brick to ball center
    const closestX = Math.max(bounds.left, Math.min(ballX, bounds.right))
    const closestY = Math.max(bounds.top, Math.min(ballY, bounds.bottom))

    const dx = ballX - closestX
    const dy = ballY - closestY

    return (dx * dx + dy * dy) < (ballRadius * ballRadius)
  }

  // Check if ball is within explosive radius
  checkExplosiveRadius(ballX: number, ballY: number, explosiveRadius: number): boolean {
    if (!this.active || this.destroying || this.hp === -1) return false

    const dx = ballX - this.x
    const dy = ballY - this.y

    return (dx * dx + dy * dy) < (explosiveRadius * explosiveRadius)
  }

  isDestructible(): boolean {
    return this.type !== BrickType.BLACK && this.type !== BrickType.EMPTY
  }

  getRenderData(): BrickRenderData {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      type: this.type,
      config: this.config,
      destroying: this.destroying,
      destroyTimer: this.destroyTimer,
    }
  }
}

// Create bricks from level grid
export function createBricksFromGrid(grid: string[][]): Brick[] {
  const bricks: Brick[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const type = grid[row][col] as BrickType
      if (type !== BrickType.EMPTY) {
        bricks.push(new Brick(col, row, type))
      }
    }
  }
  return bricks
}
