// Witch Case - Configuration
// Snake game collecting letters to spell "LANDRY"

// =============================================================================
// CANVAS
// =============================================================================

export const CANVAS = {
  WIDTH: 640,
  HEIGHT: 480,
}

// =============================================================================
// GRID
// =============================================================================

export const GRID = {
  SIZE: 20, // Grid is 20x20
  CELL_SIZE: 24, // Each cell is 24px (fills 480px height)
  OFFSET_X: 80, // Center the 480x480 grid in 640px width
  OFFSET_Y: 0,
}

// =============================================================================
// PATTERN
// =============================================================================

export const PATTERN = 'landry'

// =============================================================================
// COLORS
// =============================================================================

export const COLORS = {
  // Backgrounds
  BG_PRIMARY: '#1a1a2e',
  BG_SECONDARY: '#16213e',
  GRID_LINE: 'rgba(74, 144, 164, 0.15)',

  // Snake
  SNAKE_HEAD: '#4A90A4', // Bleu famille
  SNAKE_BODY: '#3d7a8c',
  SNAKE_LETTER: '#FFF8F0',

  // Letters
  LETTER_TARGET: '#00FF88', // Green - target letter (easy mode)
  LETTER_NORMAL: '#FFD700', // Gold - all letters
  LETTER_PASCAL_DECOY: '#FF6B9D', // Pink - PASCAL decoy letters (hard mode)

  // UI
  TEXT: '#FFF8F0',
  TEXT_DIM: '#888888',
  PRIMARY: '#C17767', // Terracotta
  SECONDARY: '#4A90A4', // Bleu famille
  GOLD: '#F7931A',
  ACCENT: '#E57373',

  // Effects
  NEON_GREEN: '#00FF88',
  NEON_PINK: '#FF6B9D',
  NEON_CYAN: '#00D4FF',
}

// =============================================================================
// DIFFICULTY LEVELS
// =============================================================================

export type DifficultyId = 'easy' | 'medium' | 'hard'

export interface DifficultyLevel {
  id: DifficultyId
  name: string
  speed: number // ms between moves
  showTarget: boolean // Show target letter in green
  pascalDecoys: boolean // Add PASCAL letters as decoys
}

export const DIFFICULTY_LEVELS: Record<DifficultyId, DifficultyLevel> = {
  easy: {
    id: 'easy',
    name: 'Facile',
    speed: 300,
    showTarget: true,
    pascalDecoys: false,
  },
  medium: {
    id: 'medium',
    name: 'Moyen',
    speed: 150,
    showTarget: false,
    pascalDecoys: false,
  },
  hard: {
    id: 'hard',
    name: 'Difficile',
    speed: 150,
    showTarget: false,
    pascalDecoys: true,
  },
}

// =============================================================================
// BONUS
// =============================================================================

export const BONUS = {
  IMAGE: '/games/witch-case/bonus.png',
  TEXT_FIRST: 'la meilleure famille!!!',
  TEXT_SUBSEQUENT: 'Snaaaaaaaake!',
  DURATION: 2000, // ms to show bonus overlay
}

// =============================================================================
// SCORING
// =============================================================================

export const SCORING = {
  CORRECT_LETTER: 100,
  WRONG_LETTER_PENALTY: 0, // Just resets to L, no score loss
  COMPLETE_LANDRY: 500, // Bonus for completing LANDRY
}

// =============================================================================
// KEYBOARD MAPPINGS
// =============================================================================

export const KEYS = {
  UP: ['ArrowUp', 'KeyW', 'KeyZ'], // AZERTY + QWERTY
  DOWN: ['ArrowDown', 'KeyS'],
  LEFT: ['ArrowLeft', 'KeyA', 'KeyQ'],
  RIGHT: ['ArrowRight', 'KeyD'],
  PAUSE: ['Escape', 'KeyP'],
  CONFIRM: ['Space', 'Enter'],
}

// =============================================================================
// INITIAL SNAKE
// =============================================================================

export const INITIAL_SNAKE = {
  // Start in the middle of the grid
  HEAD_X: 10,
  HEAD_Y: 10,
  DIRECTION: 'right' as Direction,
  // Snake starts with just the head containing "L"
  INITIAL_LETTER: 'L',
}

export type Direction = 'up' | 'down' | 'left' | 'right'
