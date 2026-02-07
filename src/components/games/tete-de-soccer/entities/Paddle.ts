// =============================================================================
// Tête de Soccer - Paddle Entity
// =============================================================================

import { PADDLE, CANVAS, GAME } from '../config'

export interface PaddleRenderData {
  x: number
  y: number
  width: number
  height: number
  headImage: HTMLImageElement | null
  bonusHeadImage: HTMLImageElement | null
  hasBonusHead: boolean
}

export class Paddle {
  x: number
  y: number
  width: number
  height: number
  headImage: HTMLImageElement | null = null
  bonusHeadImage: HTMLImageElement | null = null
  headLoaded = false
  bonusHeadLoaded = false
  hasBonusHead = false

  constructor() {
    this.x = CANVAS.NATIVE_WIDTH / 2
    this.y = PADDLE.Y
    this.width = PADDLE.WIDTH
    this.height = PADDLE.HEIGHT

    // Load head images
    this.headImage = new Image()
    this.headImage.onload = () => { this.headLoaded = true }
    this.headImage.src = '/games/tete-de-soccer/tete1.png'

    this.bonusHeadImage = new Image()
    this.bonusHeadImage.onload = () => { this.bonusHeadLoaded = true }
    this.bonusHeadImage.src = '/games/tete-de-soccer/tete2.png'
  }

  // Set position from mouse (native coords)
  setPosition(nativeX: number): void {
    const halfWidth = this.width / 2
    this.x = Math.max(halfWidth, Math.min(CANVAS.NATIVE_WIDTH - halfWidth, nativeX))
  }

  // Move with keyboard
  moveLeft(dt: number): void {
    this.x -= PADDLE.SPEED * dt
    const halfWidth = this.width / 2
    if (this.x < halfWidth) this.x = halfWidth
  }

  moveRight(dt: number): void {
    this.x += PADDLE.SPEED * dt
    const halfWidth = this.width / 2
    if (this.x > CANVAS.NATIVE_WIDTH - halfWidth) this.x = CANVAS.NATIVE_WIDTH - halfWidth
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    }
  }

  // Bonus head bounds (to the side of the main paddle)
  getBonusHeadBounds() {
    if (!this.hasBonusHead) return null
    return {
      left: this.x - this.width / 2 - GAME.BONUS_HEAD_OFFSET - PADDLE.HEAD_SIZE / 2,
      right: this.x - this.width / 2 - GAME.BONUS_HEAD_OFFSET + PADDLE.HEAD_SIZE / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2,
    }
  }

  getRenderData(): PaddleRenderData {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      headImage: this.headLoaded ? this.headImage : null,
      bonusHeadImage: this.bonusHeadLoaded ? this.bonusHeadImage : null,
      hasBonusHead: this.hasBonusHead,
    }
  }
}
