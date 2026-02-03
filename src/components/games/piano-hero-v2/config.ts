/**
 * Configuration for Piano Hero v2
 * Friendly Cyberpunk color scheme
 */

// Canvas dimensions
export const CANVAS = {
  WIDTH: 640,
  HEIGHT: 480,
  SCALE: 1,
}

// Friendly Cyberpunk color palette
export const COLORS = {
  BG: '#2C3E50',            // Warm dark blue-gray
  BG_SECONDARY: '#34495E',  // Slightly lighter
  BG_DARK: '#1A252F',       // Darker shade
  PRIMARY: '#C17767',       // Terracotta - notes, UI
  PRIMARY_DARK: '#A85B4A',  // Darker terracotta
  SECONDARY: '#4A90A4',     // Bleu - success, hits
  ACCENT: '#E57373',        // Soft red - miss, errors
  GOLD: '#F7931A',          // Bitcoin orange - bonus
  WHITE: '#FFF8F0',         // Crème - text
}

// Notes configuration
export const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type NoteType = (typeof NOTES)[number]

// French note names
export const NOTE_NAMES_FR: Record<NoteType, string> = {
  C: 'Do',
  D: 'Ré',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

// Note -> Key mapping for display
export const NOTE_TO_KEY: Record<NoteType, string> = {
  C: 'A',
  D: 'S',
  E: 'D',
  F: 'F',
  G: 'G',
  A: 'H',
  B: 'J',
}

// Note dimensions
export const NOTE = {
  WIDTH: Math.floor(CANVAS.WIDTH / NOTES.length) - 8,
  HEIGHT: 40,
  PADDING: 4,
}

// Hit zone configuration
export const HIT_ZONE = {
  Y: CANVAS.HEIGHT - 80,
  HEIGHT: 48,
  TOLERANCE: 30,
}

// Level configurations
export const LEVELS = [
  { speed: 0.8, spawnInterval: 1600, name: 'Débutant' },
  { speed: 1.0, spawnInterval: 1300, name: 'Facile' },
  { speed: 1.3, spawnInterval: 1000, name: 'Moyen' },
  { speed: 1.6, spawnInterval: 800, name: 'Difficile' },
  { speed: 2.0, spawnInterval: 600, name: 'Expert' },
  { speed: 2.4, spawnInterval: 500, name: 'Maître' },
  { speed: 2.8, spawnInterval: 400, name: 'Légende' },
  { speed: 3.2, spawnInterval: 350, name: 'Impossible' },
] as const

// Keyboard mapping (AZERTY + QWERTY support)
export const KEY_MAP: Record<string, NoteType> = {
  a: 'C',
  s: 'D',
  d: 'E',
  f: 'F',
  g: 'G',
  h: 'A',
  j: 'B',
  // QWERTY support
  q: 'C',
  w: 'D',
  e: 'E',
  r: 'F',
  t: 'G',
  y: 'A',
  u: 'B',
}

// Note frequencies (Hz) for audio
export const NOTE_FREQ: Record<NoteType, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
}

// Background melody - "Souvenirs d'Hiver"
export const MELODY: NoteType[] = [
  // Phrase 1
  'E', 'G', 'A', 'G',
  'E', 'D', 'C', 'D',
  // Phrase 2
  'E', 'G', 'A', 'B',
  'A', 'G', 'E', 'D',
  // Phrase 3
  'C', 'E', 'G', 'E',
  'F', 'A', 'G', 'F',
  // Phrase 4
  'E', 'D', 'C', 'E',
  'D', 'C', 'D', 'C',
]

// Bonus configuration
export const BONUS = {
  CHANCE: 0.15,
  MULTIPLIER: 3,
  IMAGES: [
    '/games/piano-hero-v2/bonus/extracted_face_1.png',
    '/games/piano-hero-v2/bonus/extracted_face_2.png',
    '/games/piano-hero-v2/bonus/extracted_face_k1.png',
    '/games/piano-hero-v2/bonus/extracted_face_k2.png',
    '/games/piano-hero-v2/bonus/extracted_face_k3.png',
    '/games/piano-hero-v2/bonus/bonus_piano.png',
  ],
}

// Scoring
export const SCORE = {
  HIT: 100,
  BONUS_HIT: 300,
  MISS_PENALTY: 0,
}

// Lives
export const LIVES = {
  INITIAL: 5,
  MAX: 5,
}

// Level up
export const LEVEL_UP = {
  SCORE_THRESHOLD: 1500,
  DISPLAY_DURATION: 1000,
}

// Game states
export const GAME_STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
} as const

export type GameState = (typeof GAME_STATE)[keyof typeof GAME_STATE]
