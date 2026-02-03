// Belle Bête Sage - Configuration
// Endless runner cyberpunk avec les chiens de la famille

// =============================================================================
// CANVAS
// =============================================================================

export const CANVAS = {
  WIDTH: 640,
  HEIGHT: 480,
  NATIVE_WIDTH: 320,
  NATIVE_HEIGHT: 240,
  get SCALE() {
    return this.WIDTH / this.NATIVE_WIDTH
  },
}

// =============================================================================
// COLORS - Friendly Cyberpunk (adapted from famille-website palette)
// =============================================================================

export const COLORS = {
  // Backgrounds
  BG_PRIMARY: '#2C3E50',
  BG_SECONDARY: '#34495E',
  BG_DARK: '#1A252F',

  // Game elements
  PRIMARY: '#C17767', // Terracotta - player, UI
  PRIMARY_DARK: '#A85B4A',
  SECONDARY: '#4A90A4', // Bleu famille - success, collectibles
  ACCENT: '#E57373', // Soft red - danger, obstacles
  GOLD: '#F7931A', // Bitcoin orange - coins, bonus

  // Neon effects
  NEON_PINK: '#FF6B9D',
  NEON_CYAN: '#00D4FF',
  NEON_GREEN: '#00FF88',

  // UI
  TEXT: '#FFF8F0',
  TEXT_DIM: '#888888',

  // Buildings
  BUILDING_DARK: '#1a1a2e',
  BUILDING_MEDIUM: '#16213e',
  WINDOW_LIT: '#ffcc00',
  WINDOW_OFF: '#0a0a15',
}

// =============================================================================
// LANES
// =============================================================================

export const LANES = {
  COUNT: 3,
  WIDTH: 80, // Native pixels
  POSITIONS: [80, 160, 240], // Center X of each lane (native)
  get DISPLAY_POSITIONS() {
    return this.POSITIONS.map((p) => p * CANVAS.SCALE)
  },
}

// =============================================================================
// PLAYER
// =============================================================================

export const PLAYER = {
  WIDTH: 24,
  HEIGHT: 32,
  Y_POSITION: 180, // Native Y position
  JUMP_HEIGHT: 50,
  JUMP_DURATION: 500, // ms
  LANE_CHANGE_SPEED: 8, // pixels per frame
}

// =============================================================================
// CHARACTERS
// =============================================================================

export type CharacterId = 'flora' | 'nouki' | 'laska'

export interface CharacterStats {
  id: CharacterId
  name: string
  breed: string
  force: number // Lives (1-5)
  vitesse: number // Speed multiplier (1-5)
  beaute: number // Bonus multiplier (1-5)
  color: string
  accentColor: string
}

export const CHARACTERS: Record<CharacterId, CharacterStats> = {
  flora: {
    id: 'flora',
    name: 'Flora',
    breed: 'Berger Allemand',
    force: 3,
    vitesse: 4,
    beaute: 5,
    color: '#8B4513', // Saddle brown
    accentColor: '#D2691E', // Chocolate
  },
  nouki: {
    id: 'nouki',
    name: 'Nouki',
    breed: 'Labrador',
    force: 5,
    vitesse: 3,
    beaute: 4,
    color: '#DAA520', // Goldenrod
    accentColor: '#FFD700', // Gold
  },
  laska: {
    id: 'laska',
    name: 'Laska',
    breed: 'Berger Australien',
    force: 3,
    vitesse: 5,
    beaute: 4,
    color: '#2F4F4F', // Dark slate gray (blue merle)
    accentColor: '#87CEEB', // Sky blue
  },
}

// =============================================================================
// DIFFICULTY LEVELS
// =============================================================================

export interface DifficultyLevel {
  name: string
  speedMultiplier: number
  spawnInterval: number // ms
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { name: 'Débutant', speedMultiplier: 0.8, spawnInterval: 1600 },
  { name: 'Facile', speedMultiplier: 1.0, spawnInterval: 1300 },
  { name: 'Normal', speedMultiplier: 1.3, spawnInterval: 1000 },
  { name: 'Difficile', speedMultiplier: 1.6, spawnInterval: 800 },
  { name: 'Expert', speedMultiplier: 2.0, spawnInterval: 600 },
]

export const LEVEL_UP_SCORE = 2000

// =============================================================================
// OBSTACLES
// =============================================================================

export type ObstacleType = 'cat' | 'rat' | 'car' | 'motorcycle' | 'cow' | 'cone'

export interface ObstacleConfig {
  type: ObstacleType
  name: string
  width: number
  height: number
  color: string
  isLarge: boolean
  canJumpOver: boolean
}

export const OBSTACLES: {
  small: ObstacleConfig[]
  large: ObstacleConfig[]
} = {
  small: [
    {
      type: 'cat',
      name: 'Chat',
      width: 20,
      height: 18,
      color: '#FF6B6B',
      isLarge: false,
      canJumpOver: true,
    },
    {
      type: 'rat',
      name: 'Rat',
      width: 16,
      height: 12,
      color: '#808080',
      isLarge: false,
      canJumpOver: true,
    },
    {
      type: 'cone',
      name: 'Cône',
      width: 14,
      height: 20,
      color: '#FF8C00',
      isLarge: false,
      canJumpOver: true,
    },
  ],
  large: [
    {
      type: 'car',
      name: 'Voiture',
      width: 40,
      height: 24,
      color: '#4169E1',
      isLarge: true,
      canJumpOver: false,
    },
    {
      type: 'motorcycle',
      name: 'Moto',
      width: 30,
      height: 20,
      color: '#DC143C',
      isLarge: true,
      canJumpOver: false,
    },
    {
      type: 'cow',
      name: 'Vache',
      width: 36,
      height: 28,
      color: '#F5F5DC',
      isLarge: true,
      canJumpOver: false,
    },
  ],
}

export const OBSTACLE_SPAWN = {
  OBSTACLE_CHANCE: 0.6, // 60% obstacles
  LARGE_CHANCE: 0.3, // 30% of obstacles are large
  BASE_SPEED: 2, // Native pixels per frame
}

// =============================================================================
// COLLECTIBLES
// =============================================================================

export const COLLECTIBLES = {
  COIN: {
    value: 100,
    size: 12,
    color: COLORS.GOLD,
    spawnChance: 0.3, // 30%
  },
  BONUS: {
    baseValue: 500,
    size: 16,
    color: COLORS.SECONDARY,
    spawnChance: 0.1, // 10%
  },
}

// =============================================================================
// GAME SETTINGS
// =============================================================================

export const GAME = {
  BASE_LIVES: 3,
  INVINCIBILITY_DURATION: 1500, // ms after hit
  HIT_ZONE_TOLERANCE: 20, // collision detection tolerance
}

// =============================================================================
// KEYBOARD MAPPINGS
// =============================================================================

export const KEYS = {
  LEFT: ['ArrowLeft', 'KeyA', 'KeyQ'], // AZERTY + QWERTY
  RIGHT: ['ArrowRight', 'KeyD'],
  JUMP: ['ArrowUp', 'KeyW', 'KeyZ', 'Space'], // AZERTY + QWERTY
  PAUSE: ['Escape', 'KeyP'],
}

// =============================================================================
// TOUCH CONTROLS
// =============================================================================

export const TOUCH = {
  SWIPE_THRESHOLD: 30, // pixels
  TAP_THRESHOLD: 10, // pixels (movement less than this = tap)
}
