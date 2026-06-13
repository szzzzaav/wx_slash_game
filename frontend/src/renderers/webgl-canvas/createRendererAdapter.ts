import type { RenderBackend, RendererAdapter } from '../types'
import { createCanvas2DRenderer } from './canvas2dRenderer'
import { createWebGLRenderer } from './webglRenderer'

export function createRendererAdapter(backend: RenderBackend): RendererAdapter {
  if (backend === 'webgl') {
    return createWebGLRenderer()
  }

  return createCanvas2DRenderer()
}
