export interface PerfSample {
  gameId: string
  startedAt: number
  lastFrameAt: number
  frameCount: number
}

export function createPerfSample(gameId: string): PerfSample {
  const now = Date.now()
  return {
    gameId,
    startedAt: now,
    lastFrameAt: now,
    frameCount: 0
  }
}

export function recordFrame(sample: PerfSample, at = Date.now()) {
  sample.lastFrameAt = at
  sample.frameCount += 1
  return sample
}

export function getEstimatedFps(sample: PerfSample) {
  const elapsed = Math.max(1, sample.lastFrameAt - sample.startedAt)
  return Math.round((sample.frameCount / elapsed) * 1000)
}
