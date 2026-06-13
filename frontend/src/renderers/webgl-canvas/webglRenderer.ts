import type { GameDsl, RendererAdapter, RenderHostTarget, RuntimeSnapshot } from '../types'

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split('').map(char => `${char}${char}`).join('')
    : normalized, 16)

  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255
  }
}

export function createWebGLRenderer(): RendererAdapter {
  let gl: any = null
  let dsl: GameDsl | null = null

  return {
    backend: 'webgl',

    async init(target: RenderHostTarget) {
      const canvas = target.node
      if (!canvas || typeof canvas.getContext !== 'function') {
        throw new Error('WebGL canvas node is unavailable')
      }

      canvas.width = target.width * target.dpr
      canvas.height = target.height * target.dpr
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) {
        throw new Error('WebGL context is unavailable')
      }

      gl.viewport(0, 0, canvas.width, canvas.height)
    },

    async load(nextDsl) {
      dsl = nextDsl
      const color = hexToRgb(nextDsl.scene.palette.background)
      if (gl) {
        gl.clearColor(color.r, color.g, color.b, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }
    },

    async play() {
      if (!gl || !dsl) return
      const color = hexToRgb(dsl.scene.palette.background)
      gl.clearColor(color.r, color.g, color.b, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },

    async pause() {
      return
    },

    async captureSnapshot(): Promise<RuntimeSnapshot> {
      return {
        id: dsl?.meta.id || 'unknown',
        createdAt: Date.now()
      }
    },

    async dispose() {
      gl = null
      dsl = null
    }
  }
}
