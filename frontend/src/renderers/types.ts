export type RenderBackend = 'canvas2d' | 'webgl' | 'cocos'

export type RenderQuality = 'snapshot' | 'low' | 'medium' | 'high'

export type RenderPreviewMode = 'active' | 'neighbor' | 'snapshot'

export type RenderStatus = 'idle' | 'initializing' | 'ready' | 'playing' | 'paused' | 'snapshot' | 'fallback' | 'error'

export interface GameDslMeta {
  id: string
  title: string
  type: 'puzzle' | 'platformer' | 'runner' | 'collector' | 'sokoban' | 'maze' | 'custom'
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedDuration: number
}

export interface GameDslColorPalette {
  background: string
  primary: string
  secondary: string
  accent: string
}

export interface GameDslScene {
  palette: GameDslColorPalette
  variant: number
  camera: 'isometric'
  objects: Array<{
    id: string
    type: 'tile' | 'bridge' | 'tower' | 'portal' | 'character'
    x: number
    y: number
    z: number
  }>
}

export interface GameDsl {
  meta: GameDslMeta
  scene: GameDslScene
}

export interface RenderHostTarget {
  canvasId: string
  node?: any
  width: number
  height: number
  dpr: number
}

export interface RuntimeSnapshot {
  id: string
  createdAt: number
  dataUrl?: string
}

export interface RenderHostStatusPayload {
  gameId: string
  backend: RenderBackend
  status: RenderStatus
  quality: RenderQuality
  fps: number
}

export interface RendererAdapter {
  backend: RenderBackend
  init(target: RenderHostTarget): Promise<void>
  load(dsl: GameDsl): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  captureSnapshot(): Promise<RuntimeSnapshot>
  dispose(): Promise<void>
}
