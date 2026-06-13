import Taro from '@tarojs/taro'
import { Canvas, View } from '@tarojs/components'
import { useEffect, useMemo, useRef, useState } from 'react'

import { GameCoverScene } from '../../components/GameCoverScene'
import type { GameDsl, RenderBackend, RenderHostStatusPayload, RenderPreviewMode, RenderQuality, RenderStatus } from '../types'
import { createRendererAdapter } from '../webgl-canvas/createRendererAdapter'
import { GameRuntime } from '../webgl-canvas/gameRuntime'
import { createPerfSample, getEstimatedFps, recordFrame } from '../webgl-canvas/perfMonitor'
import { shouldRunRuntime } from '../webgl-canvas/scheduler'

import './index.scss'

interface RenderHostProps {
  gameId: string
  dsl: GameDsl
  active: boolean
  previewMode: RenderPreviewMode
  quality: RenderQuality
  backend?: RenderBackend
  variant?: number
  onStatusChange?: (payload: RenderHostStatusPayload) => void
}

function toCanvasId(gameId: string) {
  let hash = 0
  for (let index = 0; index < gameId.length; index += 1) {
    hash = (hash * 31 + gameId.charCodeAt(index)) >>> 0
  }
  return `render_${hash.toString(16)}`
}

export function RenderHost({
  gameId,
  dsl,
  active,
  previewMode,
  quality,
  backend = 'canvas2d',
  variant = 0,
  onStatusChange
}: RenderHostProps) {
  const canvasId = useMemo(() => toCanvasId(gameId), [gameId])
  const runtimeRef = useRef<GameRuntime | null>(null)
  const [status, setStatus] = useState<RenderStatus>('idle')
  const [fps, setFps] = useState(0)
  const statusChangeRef = useRef(onStatusChange)

  useEffect(() => {
    statusChangeRef.current = onStatusChange
  }, [onStatusChange])

  const commitStatus = (nextStatus: RenderStatus, nextFps = 0) => {
    setStatus(nextStatus)
    setFps(nextFps)
    statusChangeRef.current?.({
      gameId,
      backend,
      status: nextStatus,
      quality,
      fps: nextFps
    })
  }

  useEffect(() => {
    let disposed = false
    const runRuntime = shouldRunRuntime(previewMode, active)
    const runtime = new GameRuntime(createRendererAdapter(backend))
    const perfSample = createPerfSample(gameId)
    runtimeRef.current = runtime

    if (!runRuntime) {
      commitStatus(previewMode === 'snapshot' ? 'snapshot' : 'paused')
      return () => {
        disposed = true
        runtime.dispose()
      }
    }

    commitStatus('initializing')

    Taro.createSelectorQuery()
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec(async result => {
        if (disposed) return
        const canvasInfo = result?.[0] || {}
        const systemInfo = Taro.getSystemInfoSync()
        const width = Number(canvasInfo.width || systemInfo.windowWidth || 390)
        const height = Number(canvasInfo.height || systemInfo.windowHeight || 844)

        try {
          await runtime.init({
            canvasId,
            node: canvasInfo.node,
            width,
            height,
            dpr: systemInfo.pixelRatio || 1
          })
          await runtime.load(dsl)
          await runtime.play()
          recordFrame(perfSample)
          if (!disposed) commitStatus('playing', getEstimatedFps(perfSample) || 30)
        } catch (error) {
          if (!disposed) commitStatus('error')
        }
      })

    return () => {
      disposed = true
      commitStatus('paused')
      runtime.dispose()
    }
  }, [active, backend, canvasId, dsl, gameId, previewMode, quality])

  const canvasType = backend === 'webgl' ? 'webgl' : '2d'

  return (
    <View
      className={`render-host render-host--${previewMode} render-host--status-${status}`}
      data-backend={backend}
      data-fps={fps}
      data-quality={quality}
      data-status={status}
    >
      <Canvas id={canvasId} canvasId={canvasId} type={canvasType} className='render-host__canvas' />
      <GameCoverScene variant={variant} />
    </View>
  )
}
