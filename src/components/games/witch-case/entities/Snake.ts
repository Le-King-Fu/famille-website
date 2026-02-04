// Witch Case - Snake Entity
// Snake with letter segments

import { GRID, PATTERN, INITIAL_SNAKE, type Direction } from '../config'

// =============================================================================
// TYPES
// =============================================================================

export interface SnakeSegment {
  x: number
  y: number
  letter: string
}

export interface SnakeState {
  segments: SnakeSegment[]
  direction: Direction
  nextDirection: Direction
  patternIndex: number // Current position in LANDRY pattern (0-5)
}

// =============================================================================
// SNAKE CLASS
// =============================================================================

export class Snake {
  state: SnakeState

  constructor() {
    this.state = this.createInitialState()
  }

  private createInitialState(): SnakeState {
    return {
      segments: [
        {
          x: INITIAL_SNAKE.HEAD_X,
          y: INITIAL_SNAKE.HEAD_Y,
          letter: INITIAL_SNAKE.INITIAL_LETTER,
        },
      ],
      direction: INITIAL_SNAKE.DIRECTION,
      nextDirection: INITIAL_SNAKE.DIRECTION,
      patternIndex: 1, // We start with L, so next letter is at index 1 (A)
    }
  }

  /**
   * Reset snake to initial state
   */
  reset(): void {
    this.state = this.createInitialState()
  }

  /**
   * Set the next direction (will be applied on next move)
   */
  setDirection(newDirection: Direction): void {
    const { direction } = this.state

    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    }

    if (opposites[newDirection] !== direction) {
      this.state.nextDirection = newDirection
    }
  }

  /**
   * Get the next letter the snake needs to collect
   */
  getTargetLetter(): string {
    return PATTERN[this.state.patternIndex].toUpperCase()
  }

  /**
   * Check if a letter is the correct next letter
   */
  isCorrectLetter(letter: string): boolean {
    return letter.toUpperCase() === this.getTargetLetter()
  }

  /**
   * Move the snake forward
   * Returns the new head position and whether a wall was hit
   */
  move(): { x: number; y: number; hitWall: boolean } {
    // Apply the queued direction
    this.state.direction = this.state.nextDirection

    // Calculate new head position
    const head = this.state.segments[0]
    let newX = head.x
    let newY = head.y

    switch (this.state.direction) {
      case 'up':
        newY = newY - 1
        break
      case 'down':
        newY = newY + 1
        break
      case 'left':
        newX = newX - 1
        break
      case 'right':
        newX = newX + 1
        break
    }

    // Check wall collision
    const hitWall = newX < 0 || newX >= GRID.SIZE || newY < 0 || newY >= GRID.SIZE

    if (hitWall) {
      // Don't actually move if hit wall
      return { x: head.x, y: head.y, hitWall: true }
    }

    // Move body: each segment takes the position of the one ahead
    for (let i = this.state.segments.length - 1; i > 0; i--) {
      this.state.segments[i].x = this.state.segments[i - 1].x
      this.state.segments[i].y = this.state.segments[i - 1].y
      // Letters stay with their segments!
    }

    // Move head
    this.state.segments[0].x = newX
    this.state.segments[0].y = newY

    return { x: newX, y: newY, hitWall: false }
  }

  /**
   * Add a new segment to the snake (when collecting any letter)
   */
  addSegment(x: number, y: number, letter: string): void {
    this.state.segments.push({
      x,
      y,
      letter: letter.toUpperCase(),
    })
  }

  /**
   * Advance to the next letter in the pattern
   */
  advancePattern(): void {
    this.state.patternIndex = (this.state.patternIndex + 1) % PATTERN.length
  }

  /**
   * Reset pattern to start (next target is L)
   * Snake length is preserved!
   */
  resetPattern(): void {
    this.state.patternIndex = 0
  }

  /**
   * Check if the snake collides with itself
   * Excludes the tail segment since it moves away
   */
  checkSelfCollision(): boolean {
    const head = this.state.segments[0]

    // Check if head collides with any body segment (excluding tail)
    for (let i = 1; i < this.state.segments.length - 1; i++) {
      if (
        this.state.segments[i].x === head.x &&
        this.state.segments[i].y === head.y
      ) {
        return true
      }
    }

    return false
  }

  /**
   * Get positions occupied by the snake (for letter spawning)
   */
  getOccupiedPositions(): Set<string> {
    const positions = new Set<string>()
    for (const segment of this.state.segments) {
      positions.add(`${segment.x},${segment.y}`)
    }
    return positions
  }

  /**
   * Get head position
   */
  getHeadPosition(): { x: number; y: number } {
    return {
      x: this.state.segments[0].x,
      y: this.state.segments[0].y,
    }
  }

  /**
   * Get the length of the snake
   */
  getLength(): number {
    return this.state.segments.length
  }

  /**
   * Get the snake body as a string of letters
   */
  getBodyString(): string {
    return this.state.segments.map(s => s.letter).join('')
  }
}
