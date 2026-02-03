import {
  PLAYER,
  LANES,
  CHARACTERS,
  GAME,
  type CharacterId,
  type CharacterStats,
} from '../config'

export interface PlayerState {
  lane: number // 0, 1, or 2
  x: number // Current X position (native)
  targetX: number // Target X position for smooth movement
  y: number // Current Y position (native)
  baseY: number // Base Y position (for jump calculation)
  isJumping: boolean
  jumpStartTime: number
  jumpProgress: number // 0-1
  lives: number
  isInvincible: boolean
  invincibleUntil: number
  character: CharacterStats
  animationTime: number // For leg/tail animation
}

export class Player {
  state: PlayerState

  constructor(characterId: CharacterId = 'flora') {
    const character = CHARACTERS[characterId]
    this.state = {
      lane: 1, // Start in middle lane
      x: LANES.POSITIONS[1],
      targetX: LANES.POSITIONS[1],
      y: PLAYER.Y_POSITION,
      baseY: PLAYER.Y_POSITION,
      isJumping: false,
      jumpStartTime: 0,
      jumpProgress: 0,
      lives: GAME.BASE_LIVES + Math.floor(character.force / 2), // Force adds lives
      isInvincible: false,
      invincibleUntil: 0,
      character,
      animationTime: 0,
    }
  }

  setCharacter(characterId: CharacterId): void {
    const character = CHARACTERS[characterId]
    this.state.character = character
    this.state.lives = GAME.BASE_LIVES + Math.floor(character.force / 2)
  }

  reset(): void {
    this.state.lane = 1
    this.state.x = LANES.POSITIONS[1]
    this.state.targetX = LANES.POSITIONS[1]
    this.state.y = PLAYER.Y_POSITION
    this.state.isJumping = false
    this.state.jumpStartTime = 0
    this.state.jumpProgress = 0
    this.state.lives = GAME.BASE_LIVES + Math.floor(this.state.character.force / 2)
    this.state.isInvincible = false
    this.state.invincibleUntil = 0
    this.state.animationTime = 0
  }

  moveLeft(): boolean {
    if (this.state.lane > 0) {
      this.state.lane--
      this.state.targetX = LANES.POSITIONS[this.state.lane]
      return true
    }
    return false
  }

  moveRight(): boolean {
    if (this.state.lane < LANES.COUNT - 1) {
      this.state.lane++
      this.state.targetX = LANES.POSITIONS[this.state.lane]
      return true
    }
    return false
  }

  jump(): boolean {
    if (!this.state.isJumping) {
      this.state.isJumping = true
      this.state.jumpStartTime = Date.now()
      this.state.jumpProgress = 0
      return true
    }
    return false
  }

  hit(): boolean {
    const now = Date.now()
    if (this.state.isInvincible && now < this.state.invincibleUntil) {
      return false // Still invincible, no damage
    }

    this.state.lives--
    this.state.isInvincible = true
    this.state.invincibleUntil = now + GAME.INVINCIBILITY_DURATION

    return this.state.lives <= 0 // Return true if dead
  }

  update(deltaTime: number): void {
    const now = Date.now()

    // Update animation time
    this.state.animationTime += deltaTime

    // Smooth lane movement
    const dx = this.state.targetX - this.state.x
    if (Math.abs(dx) > 1) {
      const moveSpeed = PLAYER.LANE_CHANGE_SPEED * this.state.character.vitesse * 0.25
      this.state.x += Math.sign(dx) * Math.min(Math.abs(dx), moveSpeed * deltaTime)
    } else {
      this.state.x = this.state.targetX
    }

    // Jump physics
    if (this.state.isJumping) {
      const elapsed = now - this.state.jumpStartTime
      this.state.jumpProgress = Math.min(elapsed / PLAYER.JUMP_DURATION, 1)

      // Parabolic jump (sin curve)
      const jumpOffset = Math.sin(this.state.jumpProgress * Math.PI) * PLAYER.JUMP_HEIGHT
      this.state.y = this.state.baseY - jumpOffset

      if (this.state.jumpProgress >= 1) {
        this.state.isJumping = false
        this.state.y = this.state.baseY
        this.state.jumpProgress = 0
      }
    }

    // Check invincibility expiry
    if (this.state.isInvincible && now >= this.state.invincibleUntil) {
      this.state.isInvincible = false
    }
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.state.x - PLAYER.WIDTH / 2,
      y: this.state.y - PLAYER.HEIGHT,
      width: PLAYER.WIDTH,
      height: PLAYER.HEIGHT,
    }
  }

  canAvoidByJumping(): boolean {
    // Can avoid small obstacles when in the middle of a jump (20-80% progress)
    return this.state.isJumping && this.state.jumpProgress > 0.2 && this.state.jumpProgress < 0.8
  }

  getRenderData(): {
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
  } {
    return {
      x: this.state.x,
      y: this.state.y,
      width: PLAYER.WIDTH,
      height: PLAYER.HEIGHT,
      character: this.state.character,
      isJumping: this.state.isJumping,
      jumpProgress: this.state.jumpProgress,
      isInvincible: this.state.isInvincible,
      animationTime: this.state.animationTime,
      lives: this.state.lives,
    }
  }
}
