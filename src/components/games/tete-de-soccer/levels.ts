// =============================================================================
// Tête de Soccer - Level Layouts
// =============================================================================
// G = Grey, O = Orange, R = Red, V = Green, B = Blue, N = Black, . = Empty

export interface Level {
  name: string
  grid: string[][]
  ballSpeed: number // multiplier
}

export const LEVELS: Level[] = [
  // Level 1: Simple pattern, all grey with a few bonuses
  {
    name: 'Échauffement',
    ballSpeed: 1.0,
    grid: [
      ['.', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', '.'],
      ['G', 'G', 'G', 'O', 'G', 'G', 'O', 'G', 'G', 'G'],
      ['.', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', '.'],
      ['G', 'G', 'G', 'G', 'V', 'B', 'G', 'G', 'G', 'G'],
      ['.', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ],
  },
  // Level 2: Black bricks as obstacles
  {
    name: 'Les Murs',
    ballSpeed: 1.15,
    grid: [
      ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
      ['G', 'O', 'G', 'G', 'N', 'N', 'G', 'G', 'O', 'G'],
      ['G', 'G', 'G', 'G', '.', '.', 'G', 'G', 'G', 'G'],
      ['.', '.', 'N', '.', 'G', 'G', '.', 'N', '.', '.'],
      ['G', 'G', 'G', 'G', 'R', 'R', 'G', 'G', 'G', 'G'],
      ['G', 'V', 'G', 'G', '.', '.', 'G', 'G', 'B', 'G'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.'],
    ],
  },
  // Level 3: Diamond pattern with bonus bricks
  {
    name: 'Le Diamant',
    ballSpeed: 1.3,
    grid: [
      ['.', '.', '.', '.', 'G', 'G', '.', '.', '.', '.'],
      ['.', '.', '.', 'G', 'O', 'O', 'G', '.', '.', '.'],
      ['.', '.', 'G', 'G', 'N', 'N', 'G', 'G', '.', '.'],
      ['.', 'G', 'R', 'G', 'G', 'G', 'G', 'R', 'G', '.'],
      ['G', 'G', 'G', 'V', 'G', 'G', 'V', 'G', 'G', 'G'],
      ['.', 'G', 'G', 'G', 'B', 'B', 'G', 'G', 'G', '.'],
      ['.', '.', 'G', 'G', 'G', 'G', 'G', 'G', '.', '.'],
      ['.', '.', '.', 'G', 'G', 'G', 'G', '.', '.', '.'],
    ],
  },
  // Level 4: Maze with black brick walls
  {
    name: 'Le Labyrinthe',
    ballSpeed: 1.45,
    grid: [
      ['G', 'G', 'G', 'N', 'G', 'G', 'N', 'G', 'G', 'G'],
      ['G', 'O', 'G', 'N', '.', '.', 'N', 'G', 'O', 'G'],
      ['G', 'G', 'G', 'N', 'G', 'G', 'N', 'G', 'G', 'G'],
      ['N', 'N', '.', '.', 'G', 'G', '.', '.', 'N', 'N'],
      ['G', 'G', 'G', 'N', 'R', 'R', 'N', 'G', 'G', 'G'],
      ['G', 'V', 'G', 'N', '.', '.', 'N', 'G', 'B', 'G'],
      ['G', 'G', 'G', 'N', 'G', 'G', 'N', 'G', 'G', 'G'],
      ['.', '.', '.', '.', 'G', 'G', '.', '.', '.', '.'],
    ],
  },
  // Level 5: Hard - dense with few bonuses
  {
    name: 'Le Boss',
    ballSpeed: 1.6,
    grid: [
      ['N', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'N'],
      ['G', 'G', 'G', 'N', 'G', 'G', 'N', 'G', 'G', 'G'],
      ['G', 'G', 'R', 'G', 'G', 'G', 'G', 'R', 'G', 'G'],
      ['G', 'N', 'G', 'G', 'N', 'N', 'G', 'G', 'N', 'G'],
      ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
      ['N', 'G', 'G', 'O', 'G', 'G', 'O', 'G', 'G', 'N'],
      ['G', 'G', 'G', 'G', 'V', 'B', 'G', 'G', 'G', 'G'],
      ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
    ],
  },
]

// Generate random bonus level
export function generateBonusLevel(levelNumber: number): Level {
  const grid: string[][] = []
  const types = ['G', 'G', 'G', 'G', 'O', 'R', 'V', 'B', 'N', '.']
  // Increase difficulty: more blacks, fewer empties
  const difficultyFactor = Math.min(levelNumber - LEVELS.length, 10)

  for (let row = 0; row < 8; row++) {
    const rowData: string[] = []
    for (let col = 0; col < 10; col++) {
      const rand = Math.random()
      if (rand < 0.05 + difficultyFactor * 0.02) {
        rowData.push('N') // More black bricks at higher levels
      } else if (rand < 0.15) {
        rowData.push('.') // Empty
      } else if (rand < 0.20) {
        rowData.push(types[Math.floor(Math.random() * 5) + 4]) // Bonus types
      } else {
        rowData.push('G') // Grey
      }
    }
    grid.push(rowData)
  }

  return {
    name: `Bonus ${levelNumber - LEVELS.length + 1}`,
    ballSpeed: 1.6 + (levelNumber - LEVELS.length) * 0.1,
    grid,
  }
}
