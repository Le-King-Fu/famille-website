import { COLLECTIBLES, LANES, CANVAS, OBSTACLE_SPAWN } from '../config'
import type { Player } from './Player'

export type CollectibleType = 'coin' | 'bonus'

export interface CollectibleState {
  id: string
  type: CollectibleType
  lane: number
  x: number
  y: number
  size: number
  value: number
  color: string
  active: boolean
  speed: number
  animationTime: number
}

let collectibleIdCounter = 0

export class Collectible {
  state: CollectibleState

  constructor(type: CollectibleType, lane: number, speedMultiplier: number) {
    const isCoin = type === 'coin'
    const size = isCoin ? COLLECTIBLES.COIN.size : COLLECTIBLES.BONUS.size
    const value = isCoin ? COLLECTIBLES.COIN.value : COLLECTIBLES.BONUS.baseValue
    const color = isCoin ? COLLECTIBLES.COIN.color : COLLECTIBLES.BONUS.color

    this.state = {
      id: `collectible-${collectibleIdCounter++}`,
      type,
      lane,
      x: LANES.POSITIONS[lane],
      y: -size, // Start above screen
      size,
      value,
      color,
      active: true,
      speed: OBSTACLE_SPAWN.BASE_SPEED * speedMultiplier * 0.9, // Slightly slower than obstacles
      animationTime: Math.random() * Math.PI * 2, // Random start for animation variety
    }
  }

  update(deltaTime: number): void {
    if (!this.state.active) return

    // Move down
    this.state.y += this.state.speed * deltaTime

    // Update animation time
    this.state.animationTime += deltaTime * 0.1

    // Deactivate if past bottom of screen
    if (this.state.y > CANVAS.NATIVE_HEIGHT + this.state.size) {
      this.state.active = false
    }
  }

  checkCollection(player: Player): number {
    if (!this.state.active) return 0

    // Check lane alignment
    if (player.state.lane !== this.state.lane) return 0

    const playerBounds = player.getBounds()
    const collectibleBounds = this.getBounds()

    // More forgiving collision for collectibles
    const collisionX =
      playerBounds.x < collectibleBounds.x + collectibleBounds.width &&
      playerBounds.x + playerBounds.width > collectibleBounds.x

    const collisionY =
      playerBounds.y < collectibleBounds.y + collectibleBounds.height &&
      playerBounds.y + playerBounds.height > collectibleBounds.y

    if (collisionX && collisionY) {
      this.state.active = false

      // Bonus value is multiplied by character's beauty stat
      if (this.state.type === 'bonus') {
        return Math.floor(this.state.value * (player.state.character.beaute / 3))
      }
      return this.state.value
    }

    return 0
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.state.x - this.state.size / 2,
      y: this.state.y - this.state.size / 2,
      width: this.state.size,
      height: this.state.size,
    }
  }

  getRenderData(): {
    id: string
    type: CollectibleType
    x: number
    y: number
    size: number
    color: string
    animationTime: number
  } {
    return {
      id: this.state.id,
      type: this.state.type,
      x: this.state.x,
      y: this.state.y,
      size: this.state.size,
      color: this.state.color,
      animationTime: this.state.animationTime,
    }
  }
}

// Factory function for spawning collectibles
export function spawnCollectible(
  speedMultiplier: number,
  occupiedLanes: number[] = []
): Collectible | null {
  // Get available lanes
  const availableLanes = [0, 1, 2].filter((lane) => !occupiedLanes.includes(lane))

  if (availableLanes.length === 0) return null

  // Determine type based on spawn chances
  const rand = Math.random()
  let type: CollectibleType

  if (rand < COLLECTIBLES.BONUS.spawnChance) {
    type = 'bonus'
  } else if (rand < COLLECTIBLES.BONUS.spawnChance + COLLECTIBLES.COIN.spawnChance) {
    type = 'coin'
  } else {
    return null // No collectible spawned
  }

  // Pick random available lane
  const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)]

  return new Collectible(type, lane, speedMultiplier)
}
