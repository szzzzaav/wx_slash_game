import type { RuntimeSnapshot } from '../types'

export function createStaticSnapshot(id: string): RuntimeSnapshot {
  return {
    id,
    createdAt: Date.now()
  }
}
