import { NOTE, NOTES, HIT_ZONE, CANVAS, BONUS, type NoteType } from '../config'

export interface NoteRenderData {
  x: number
  y: number
  width: number
  height: number
  type: NoteType
  lane: number
  isBonus: boolean
  bonusImageIndex: number
  hit: boolean
  missed: boolean
  alpha: number
  scale: number
}

export class Note {
  type: NoteType
  lane: number
  isBonus: boolean
  bonusImageIndex: number
  hit: boolean
  missed: boolean
  y: number
  x: number
  width: number
  height: number
  animationFrame: number
  hitAnimationTimer: number

  constructor(noteType: NoteType, isBonus = false, bonusImageIndex = 0) {
    this.type = noteType
    this.lane = NOTES.indexOf(noteType)
    this.isBonus = isBonus
    this.bonusImageIndex = bonusImageIndex
    this.hit = false
    this.missed = false

    // Initial position (above canvas)
    this.y = -NOTE.HEIGHT

    // Calculate X position based on lane
    const laneWidth = CANVAS.WIDTH / NOTES.length
    this.x = this.lane * laneWidth + NOTE.PADDING
    this.width = laneWidth - NOTE.PADDING * 2
    this.height = NOTE.HEIGHT

    // Animation
    this.animationFrame = 0
    this.hitAnimationTimer = 0
  }

  /**
   * Update note position
   * @returns true if note is still visible
   */
  update(speed: number, deltaTime: number): boolean {
    // Normalize delta for smooth movement (based on 60fps)
    const normalizedDelta = deltaTime / 16.67
    this.y += speed * normalizedDelta

    // Pulse animation for bonus notes
    if (this.isBonus && !this.hit) {
      this.animationFrame += deltaTime * 0.01
    }

    // Hit animation
    if (this.hit) {
      this.hitAnimationTimer += deltaTime
    }

    // Check if note has passed the bottom
    if (this.y > CANVAS.HEIGHT) {
      if (!this.hit) {
        this.missed = true
      }
      return false
    }

    return true
  }

  /**
   * Check if note is in the hit zone
   */
  canBeHit(): boolean {
    if (this.hit || this.missed) {
      return false
    }

    const noteBottom = this.y + this.height
    const zoneTop = HIT_ZONE.Y - HIT_ZONE.TOLERANCE
    const zoneBottom = HIT_ZONE.Y + HIT_ZONE.TOLERANCE + this.height

    return noteBottom >= zoneTop && this.y <= zoneBottom
  }

  /**
   * Mark note as hit
   */
  markAsHit(): void {
    this.hit = true
    this.hitAnimationTimer = 0
  }

  /**
   * Check if hit animation is complete
   */
  isHitAnimationComplete(): boolean {
    return this.hit && this.hitAnimationTimer > 200
  }

  /**
   * Get render data for drawing
   */
  getRenderData(): NoteRenderData {
    // Pulse effect for bonus
    let scale = 1
    if (this.isBonus && !this.hit) {
      scale = 1 + Math.sin(this.animationFrame) * 0.1
    }

    // Fade out effect for hit notes
    let alpha = 1
    if (this.hit) {
      alpha = Math.max(0, 1 - this.hitAnimationTimer / 200)
    }

    return {
      x: this.x,
      y: this.y,
      width: this.width * scale,
      height: this.height * scale,
      type: this.type,
      lane: this.lane,
      isBonus: this.isBonus,
      bonusImageIndex: this.bonusImageIndex,
      hit: this.hit,
      missed: this.missed,
      alpha,
      scale,
    }
  }

  /**
   * Create a random note
   */
  static createRandom(bonusChance = BONUS.CHANCE, numBonusImages = 6): Note {
    const randomIndex = Math.floor(Math.random() * NOTES.length)
    const noteType = NOTES[randomIndex]
    const isBonus = Math.random() < bonusChance
    const bonusImageIndex = isBonus ? Math.floor(Math.random() * numBonusImages) : 0
    return new Note(noteType, isBonus, bonusImageIndex)
  }
}
