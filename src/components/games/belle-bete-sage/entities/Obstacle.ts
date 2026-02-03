import {
  OBSTACLES,
  OBSTACLE_SPAWN,
  LANES,
  CANVAS,
  GAME,
  type ObstacleType,
  type ObstacleConfig,
} from '../config'
import type { Player } from './Player'

export interface ObstacleState {
  id: string
  lane: number
  x: number
  y: number
  config: ObstacleConfig
  active: boolean
  speed: number
}

let obstacleIdCounter = 0

export class Obstacle {
  state: ObstacleState

  constructor(lane: number, speedMultiplier: number, forceSmall?: boolean) {
    // Determine if large or small obstacle
    const isLarge = forceSmall ? false : Math.random() < OBSTACLE_SPAWN.LARGE_CHANCE
    const obstacleList = isLarge ? OBSTACLES.large : OBSTACLES.small

    // Pick random obstacle from the list
    const config = obstacleList[Math.floor(Math.random() * obstacleList.length)]

    this.state = {
      id: `obstacle-${obstacleIdCounter++}`,
      lane,
      x: LANES.POSITIONS[lane],
      y: -config.height, // Start above screen
      config,
      active: true,
      speed: OBSTACLE_SPAWN.BASE_SPEED * speedMultiplier,
    }
  }

  update(deltaTime: number): void {
    if (!this.state.active) return

    // Move down
    this.state.y += this.state.speed * deltaTime

    // Deactivate if past bottom of screen
    if (this.state.y > CANVAS.NATIVE_HEIGHT + this.state.config.height) {
      this.state.active = false
    }
  }

  checkCollision(player: Player): boolean {
    if (!this.state.active) return false

    const playerBounds = player.getBounds()
    const obstacleBounds = this.getBounds()

    // Check lane alignment first (more efficient)
    if (player.state.lane !== this.state.lane) return false

    // Check if player can jump over this obstacle
    if (this.state.config.canJumpOver && player.canAvoidByJumping()) {
      return false
    }

    // Bounding box collision with tolerance
    const tolerance = GAME.HIT_ZONE_TOLERANCE

    const collisionX =
      playerBounds.x + tolerance < obstacleBounds.x + obstacleBounds.width &&
      playerBounds.x + playerBounds.width - tolerance > obstacleBounds.x

    const collisionY =
      playerBounds.y + tolerance < obstacleBounds.y + obstacleBounds.height &&
      playerBounds.y + playerBounds.height - tolerance > obstacleBounds.y

    return collisionX && collisionY
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.state.x - this.state.config.width / 2,
      y: this.state.y - this.state.config.height,
      width: this.state.config.width,
      height: this.state.config.height,
    }
  }

  getRenderData(): {
    id: string
    x: number
    y: number
    width: number
    height: number
    type: ObstacleType
    color: string
    isLarge: boolean
  } {
    return {
      id: this.state.id,
      x: this.state.x,
      y: this.state.y,
      width: this.state.config.width,
      height: this.state.config.height,
      type: this.state.config.type,
      color: this.state.config.color,
      isLarge: this.state.config.isLarge,
    }
  }
}

// Factory function for spawning obstacles
export function spawnObstacle(
  speedMultiplier: number,
  occupiedLanes: number[] = []
): Obstacle | null {
  // Get available lanes
  const availableLanes = [0, 1, 2].filter((lane) => !occupiedLanes.includes(lane))

  if (availableLanes.length === 0) return null

  // Pick random available lane
  const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)]

  return new Obstacle(lane, speedMultiplier)
}
