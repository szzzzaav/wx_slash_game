import type { GameDsl, RendererAdapter, RenderHostTarget, RuntimeSnapshot } from '../types'

export class GameRuntime {
  private adapter: RendererAdapter
  private loadedDsl: GameDsl | null = null

  constructor(adapter: RendererAdapter) {
    this.adapter = adapter
  }

  async init(target: RenderHostTarget) {
    await this.adapter.init(target)
  }

  async load(dsl: GameDsl) {
    this.loadedDsl = dsl
    await this.adapter.load(dsl)
  }

  async play() {
    if (!this.loadedDsl) return
    await this.adapter.play()
  }

  async pause() {
    await this.adapter.pause()
  }

  async captureSnapshot(): Promise<RuntimeSnapshot> {
    return this.adapter.captureSnapshot()
  }

  async dispose() {
    await this.adapter.dispose()
    this.loadedDsl = null
  }
}
