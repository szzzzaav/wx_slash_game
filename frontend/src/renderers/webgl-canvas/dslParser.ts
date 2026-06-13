import type { GameDsl, GameDslMeta } from '../types'

const palettes = [
  {
    background: '#121212',
    primary: '#d8dbe6',
    secondary: '#d8c4ff',
    accent: '#539df5'
  },
  {
    background: '#15101f',
    primary: '#f0d7ff',
    secondary: '#a8d7ff',
    accent: '#f05dff'
  },
  {
    background: '#101722',
    primary: '#d9e7ff',
    secondary: '#c8d1ff',
    accent: '#7a3cff'
  }
]

interface CreateGameDslInput {
  id: string
  title: string
  type?: GameDslMeta['type']
  difficulty?: GameDslMeta['difficulty']
  estimatedDuration?: number
  variant?: number
}

export function createMockGameDsl({
  id,
  title,
  type = 'puzzle',
  difficulty = 3,
  estimatedDuration = 240,
  variant = 0
}: CreateGameDslInput): GameDsl {
  const palette = palettes[variant % palettes.length]

  return {
    meta: {
      id,
      title,
      type,
      difficulty,
      estimatedDuration
    },
    scene: {
      palette,
      variant,
      camera: 'isometric',
      objects: [
        { id: 'tile-a', type: 'tile', x: 0, y: 1, z: 0 },
        { id: 'tile-b', type: 'tile', x: 1, y: 0, z: 0 },
        { id: 'tile-c', type: 'tile', x: 2, y: 1, z: 0 },
        { id: 'bridge', type: 'bridge', x: 1, y: 1, z: 0 },
        { id: 'tower', type: 'tower', x: 1, y: 0, z: 1 },
        { id: 'portal', type: 'portal', x: 2, y: 0, z: 1 },
        { id: 'character', type: 'character', x: 0, y: 0, z: 1 }
      ]
    }
  }
}
