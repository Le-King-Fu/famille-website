// =============================================================================
// Tête de Soccer - Ball Entity
// =============================================================================

import { BALL, CANVAS, PADDLE } from '../config'

export interface BallRenderData {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  isExplosive: boolean
  trail: Array<{ x: number; y: number }>
}

export class Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  active = true
  launched = false
  isExplosive = false
  explosiveTimer = 0
  trail: Array<{ x: number; y: number }> = []
  private trailTimer = 0

  constructor(x: number, y: number, speed: number, angle?: number) {
    this.x = x
    this.y = y
    this.radius = BALL.RADIUS

    if (angle !== undefined) {
      this.vx = Math.cos(angle) * speed
      this.vy = Math.sin(angle) * speed
      this.launched = true
    } else {
      this.vx = 0
      this.vy = 0
    }
  }

  // Launch from paddle
  launch(speed: number): void {
    if (this.launched) return
    // Launch at slight random angle upward
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 4
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.launched = true
  }

  // Stick to paddle before launch
  stickToPaddle(paddleX: number): void {
    if (this.launched) return
    this.x = paddleX
    this.y = PADDLE.Y - PADDLE.HEIGHT / 2 - this.radius - 1
  }

  update(dt: number): void {
    if (!this.launched || !this.active) return

    // Update explosive timer
    if (this.isExplosive && this.explosiveTimer > 0) {
      this.explosiveTimer -= dt * 16.67
      if (this.explosiveTimer <= 0) {
        this.isExplosive = false
      }
    }

    // Move
    this.x += this.vx * dt
    this.y += this.vy * dt

    // Trail
    this.trailTimer += dt
    if (this.trailTimer > 0.5) {
      this.trailTimer = 0
      this.trail.push({ x: this.x, y: this.y })
      if (this.trail.length > BALL.TRAIL_LENGTH) {
        this.trail.shift()
      }
    }

    // Wall bounces
    if (this.x - this.radius <= 0) {
      this.x = this.radius
      this.vx = Math.abs(this.vx)
    }
    if (this.x + this.radius >= CANVAS.NATIVE_WIDTH) {
      this.x = CANVAS.NATIVE_WIDTH - this.radius
      this.vx = -Math.abs(this.vx)
    }
    if (this.y - this.radius <= 0) {
      this.y = this.radius
      this.vy = Math.abs(this.vy)
    }

    // Fallen below screen
    if (this.y > CANVAS.NATIVE_HEIGHT + this.radius * 2) {
      this.active = false
    }

    // Enforce minimum angle to prevent near-horizontal bouncing
    this.enforceMinAngle()
  }

  private enforceMinAngle(): void {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed === 0) return

    const angle = Math.atan2(this.vy, this.vx)
    const absAngle = Math.abs(angle)

    // If angle is too close to horizontal (0 or PI)
    if (absAngle < BALL.MIN_ANGLE || absAngle > Math.PI - BALL.MIN_ANGLE) {
      const sign = this.vy >= 0 ? 1 : -1
      const newAngle = this.vx >= 0 ? BALL.MIN_ANGLE * sign : (Math.PI - BALL.MIN_ANGLE) * sign
      this.vx = Math.cos(newAngle) * speed
      this.vy = Math.sin(newAngle) * speed
    }
  }

  // Bounce off paddle - angle depends on hit position
  bounceOffPaddle(paddleX: number, paddleWidth: number): void {
    const relativeX = (this.x - (paddleX - paddleWidth / 2)) / paddleWidth // 0 to 1
    // Map to angle: left edge = 150°, center = 90° (straight up), right edge = 30°
    const angle = Math.PI - relativeX * (2 * Math.PI / 3) - Math.PI / 6

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    this.vx = Math.cos(angle) * speed
    this.vy = -Math.abs(Math.sin(angle) * speed) // Always go up

    // Make sure ball is above paddle
    this.y = PADDLE.Y - PADDLE.HEIGHT / 2 - this.radius - 1
  }

  // Bounce off brick - determine side of collision
  bounceOffBrick(brickLeft: number, brickRight: number, brickTop: number, brickBottom: number): void {
    // Determine which side was hit
    const overlapLeft = (this.x + this.radius) - brickLeft
    const overlapRight = brickRight - (this.x - this.radius)
    const overlapTop = (this.y + this.radius) - brickTop
    const overlapBottom = brickBottom - (this.y - this.radius)

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
      this.vx = -this.vx
      // Push out
      if (minOverlap === overlapLeft) {
        this.x = brickLeft - this.radius
      } else {
        this.x = brickRight + this.radius
      }
    } else {
      this.vy = -this.vy
      // Push out
      if (minOverlap === overlapTop) {
        this.y = brickTop - this.radius
      } else {
        this.y = brickBottom + this.radius
      }
    }
  }

  getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
  }

  getRenderData(): BallRenderData {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
      vx: this.vx,
      vy: this.vy,
      isExplosive: this.isExplosive,
      trail: [...this.trail],
    }
  }
}

// Factory for spawning extra balls
export function spawnExtraBall(x: number, y: number, speed: number): Ball {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3
  return new Ball(x, y, speed, angle)
}
