// =============================================================================
// Tête de Soccer - Configuration & Constants
// =============================================================================

// Canvas settings (same pattern as other games)
export const CANVAS = {
  WIDTH: 640,
  HEIGHT: 480,
  NATIVE_WIDTH: 320,
  NATIVE_HEIGHT: 240,
  SCALE: 2,
} as const

// Cyberpunk orange color palette
export const COLORS = {
  BG_PRIMARY: '#0f0f23',
  BG_SECONDARY: '#1a1a2e',
  BG_GRID: 'rgba(255, 107, 53, 0.06)',
  GRID_LINE: 'rgba(255, 107, 53, 0.12)',

  // Accent colors
  ORANGE: '#FF6B35',
  ORANGE_BRIGHT: '#F7931A',
  ORANGE_DARK: '#CC5500',
  CYAN: '#00D4FF',
  NEON_PINK: '#FF1493',
  NEON_GREEN: '#00FF88',

  // Brick colors
  BRICK_GREY: '#8a8a9a',
  BRICK_GREY_LIGHT: '#aaaabc',
  BRICK_ORANGE: '#FF6B35',
  BRICK_ORANGE_LIGHT: '#FF8C5A',
  BRICK_RED: '#FF3333',
  BRICK_RED_LIGHT: '#FF6666',
  BRICK_GREEN: '#33CC66',
  BRICK_GREEN_LIGHT: '#66DD88',
  BRICK_BLUE: '#3399FF',
  BRICK_BLUE_LIGHT: '#66BBFF',
  BRICK_BLACK: '#2a2a3e',
  BRICK_BLACK_LIGHT: '#3a3a4e',

  // UI
  TEXT: '#ffffff',
  TEXT_DIM: '#888899',
  GOLD: '#FFD700',
  PRIMARY: '#FF6B35',
  SECONDARY: '#F7931A',
} as const

// Brick types
export enum BrickType {
  GREY = 'G',    // 100pts, regular
  ORANGE = 'O',  // 150pts, spawns extra ball
  RED = 'R',     // 150pts, explosive mode
  GREEN = 'V',   // 150pts, bonus head
  BLUE = 'B',    // 150pts, tears power-up
  BLACK = 'N',   // Indestructible
  EMPTY = '.',   // No brick
}

export interface BrickConfig {
  type: BrickType
  points: number
  color: string
  colorLight: string
  hp: number // -1 = indestructible
  label: string
}

export const BRICK_CONFIGS: Record<BrickType, BrickConfig> = {
  [BrickType.GREY]: {
    type: BrickType.GREY,
    points: 100,
    color: COLORS.BRICK_GREY,
    colorLight: COLORS.BRICK_GREY_LIGHT,
    hp: 1,
    label: 'Brique',
  },
  [BrickType.ORANGE]: {
    type: BrickType.ORANGE,
    points: 150,
    color: COLORS.BRICK_ORANGE,
    colorLight: COLORS.BRICK_ORANGE_LIGHT,
    hp: 1,
    label: 'Multi-ballon',
  },
  [BrickType.RED]: {
    type: BrickType.RED,
    points: 150,
    color: COLORS.BRICK_RED,
    colorLight: COLORS.BRICK_RED_LIGHT,
    hp: 1,
    label: 'Explosif',
  },
  [BrickType.GREEN]: {
    type: BrickType.GREEN,
    points: 150,
    color: COLORS.BRICK_GREEN,
    colorLight: COLORS.BRICK_GREEN_LIGHT,
    hp: 1,
    label: 'Tête bonus',
  },
  [BrickType.BLUE]: {
    type: BrickType.BLUE,
    points: 150,
    color: COLORS.BRICK_BLUE,
    colorLight: COLORS.BRICK_BLUE_LIGHT,
    hp: 1,
    label: 'Larmes',
  },
  [BrickType.BLACK]: {
    type: BrickType.BLACK,
    points: 0,
    color: COLORS.BRICK_BLACK,
    colorLight: COLORS.BRICK_BLACK_LIGHT,
    hp: -1,
    label: 'Incassable',
  },
  [BrickType.EMPTY]: {
    type: BrickType.EMPTY,
    points: 0,
    color: 'transparent',
    colorLight: 'transparent',
    hp: 0,
    label: '',
  },
}

// Brick grid settings (in native coordinates)
export const BRICK_GRID = {
  COLS: 10,
  ROWS: 8,
  BRICK_WIDTH: 28,    // native pixels
  BRICK_HEIGHT: 12,   // native pixels
  SPACING: 2,         // gap between bricks
  OFFSET_X: 10,       // left margin
  OFFSET_Y: 20,       // top margin
} as const

// Paddle settings (in native coordinates)
export const PADDLE = {
  WIDTH: 40,
  HEIGHT: 20,
  Y: 225,         // near bottom of native canvas
  SPEED: 4,       // pixels per normalized frame
  HEAD_SIZE: 24,  // the head image size (square)
} as const

// Ball settings (in native coordinates)
export const BALL = {
  RADIUS: 4,
  BASE_SPEED: 2.5,
  MAX_SPEED: 5,
  SPEED_INCREMENT: 0.15, // per level
  MIN_ANGLE: Math.PI / 6, // 30 degrees from horizontal (prevent too-flat angles)
  TRAIL_LENGTH: 5,
} as const

// Game settings
export const GAME = {
  INITIAL_LIVES: 5,
  TOTAL_LEVELS: 5,
  EXPLOSIVE_DURATION: 8000, // ms
  TEARS_INTERVAL: 400,      // ms between tear shots
  TEARS_SPEED: 3,
  TEARS_DURATION: 10000,    // ms
  BONUS_HEAD_OFFSET: 30,    // native pixels offset from main paddle
  LEVEL_TRANSITION_TIME: 2000, // ms
  GAME_OVER_DELAY: 1500,
} as const

// Power-up types
export type PowerUpType = 'multiball' | 'explosive' | 'bonushead' | 'tears'

export interface ActivePowerUp {
  type: PowerUpType
  timer: number  // remaining ms, -1 for permanent until level end
}

// Keyboard mappings (AZERTY + QWERTY)
export const KEYS = {
  LEFT: ['ArrowLeft', 'KeyA', 'KeyQ'],
  RIGHT: ['ArrowRight', 'KeyD'],
  LAUNCH: ['Space', 'ArrowUp', 'KeyW', 'KeyZ'],
  PAUSE: ['Escape'],
}
