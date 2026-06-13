import type { GameDsl, RendererAdapter, RenderHostTarget, RuntimeSnapshot } from '../types'

function fillRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawDiamond(ctx: any, x: number, y: number, width: number, height: number, fill: string) {
  ctx.beginPath()
  ctx.moveTo(x, y - height / 2)
  ctx.lineTo(x + width / 2, y)
  ctx.lineTo(x, y + height / 2)
  ctx.lineTo(x - width / 2, y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.58)'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawChromaticCrystal(ctx: any, width: number, height: number, accent: string) {
  ctx.save()
  ctx.globalAlpha = 0.52
  ctx.translate(width + 16, height * 0.38)
  ctx.rotate(-0.26)

  const crystal = ctx.createLinearGradient(-104, -132, 42, 132)
  crystal.addColorStop(0, 'rgba(255,255,255,0.16)')
  crystal.addColorStop(0.36, 'rgba(83,157,245,0.14)')
  crystal.addColorStop(0.68, 'rgba(166,77,255,0.2)')
  crystal.addColorStop(1, 'rgba(255,255,255,0.06)')

  ctx.beginPath()
  ctx.moveTo(-88, -142)
  ctx.lineTo(34, -96)
  ctx.lineTo(12, 124)
  ctx.lineTo(-116, 96)
  ctx.lineTo(-148, -24)
  ctx.closePath()
  ctx.fillStyle = crystal
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.stroke()

  ctx.globalAlpha = 0.42
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-126, -8)
  ctx.lineTo(8, -68)
  ctx.lineTo(-18, 88)
  ctx.stroke()
  ctx.restore()
}

function drawPsSymbolHints(ctx: any, width: number) {
  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.strokeStyle = '#539df5'
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.arc(width + 4, 154, 38, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(width - 44, 96)
  ctx.lineTo(width - 12, 146)
  ctx.lineTo(width - 76, 146)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawIslandObject(ctx: any, objectType: string, x: number, y: number, palette: GameDsl['scene']['palette']) {
  if (objectType === 'tower') {
    const gradient = ctx.createLinearGradient(x - 24, y - 72, x + 24, y + 12)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.5, palette.primary)
    gradient.addColorStop(1, '#7f86a8')
    ctx.fillStyle = gradient
    fillRoundedRect(ctx, x - 22, y - 74, 44, 82, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.58)'
    ctx.stroke()
    return
  }

  if (objectType === 'portal') {
    ctx.save()
    ctx.shadowColor = palette.accent
    ctx.shadowBlur = 18
    ctx.fillStyle = palette.accent
    fillRoundedRect(ctx, x - 18, y - 54, 36, 54, 18)
    ctx.fill()
    ctx.restore()
    return
  }

  if (objectType === 'character') {
    ctx.save()
    ctx.shadowColor = '#a64dff'
    ctx.shadowBlur = 16
    ctx.fillStyle = '#a64dff'
    fillRoundedRect(ctx, x - 8, y - 34, 16, 28, 8)
    ctx.fill()
    ctx.restore()
  }
}

function drawStaticPreview(ctx: any, target: RenderHostTarget, dsl: GameDsl) {
  const width = target.width || 390
  const height = target.height || 844
  const palette = dsl.scene.palette

  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#1b263e')
  bg.addColorStop(0.48, palette.background)
  bg.addColorStop(1, '#050613')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.24
  ctx.fillStyle = palette.accent
  ctx.beginPath()
  ctx.arc(width * 0.76, height * 0.2, 148, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  drawPsSymbolHints(ctx, width)
  drawChromaticCrystal(ctx, width, height, palette.accent)

  ctx.save()
  ctx.globalAlpha = 0.78
  const line = ctx.createLinearGradient(0, 0, width, 0)
  line.addColorStop(0, 'rgba(83,157,245,0)')
  line.addColorStop(0.42, 'rgba(83,157,245,0.82)')
  line.addColorStop(1, 'rgba(83,157,245,0)')
  ctx.fillStyle = line
  ctx.translate(-24, height - 142)
  ctx.rotate(-0.05)
  ctx.fillRect(0, 0, width * 0.88, 2)
  ctx.restore()

  const originX = width / 2 - 4
  const originY = height * 0.37
  const tileW = 86
  const tileH = 46

  dsl.scene.objects.forEach((object, index) => {
    const x = originX + (object.x - object.y) * (tileW / 2)
    const y = originY + (object.x + object.y) * (tileH / 2) - object.z * 34

    ctx.save()

    if (object.type === 'tile' || object.type === 'bridge') {
      const tileFill = index % 2 === 0 ? palette.primary : palette.secondary
      ctx.shadowColor = 'rgba(0,0,0,0.42)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetY = 16
      drawDiamond(ctx, x, y, object.type === 'bridge' ? 132 : tileW, object.type === 'bridge' ? 30 : tileH, tileFill)
    } else {
      drawIslandObject(ctx, object.type, x, y, palette)
    }

    ctx.restore()
  })
}

export function createCanvas2DRenderer(): RendererAdapter {
  let target: RenderHostTarget | null = null
  let dsl: GameDsl | null = null
  let ctx: any = null

  return {
    backend: 'canvas2d',

    async init(nextTarget) {
      target = nextTarget
      const canvas = nextTarget.node
      if (!canvas || typeof canvas.getContext !== 'function') {
        throw new Error('Canvas2D node is unavailable')
      }

      canvas.width = nextTarget.width * nextTarget.dpr
      canvas.height = nextTarget.height * nextTarget.dpr
      ctx = canvas.getContext('2d')
      if (ctx && typeof ctx.scale === 'function') {
        ctx.scale(nextTarget.dpr, nextTarget.dpr)
      }
    },

    async load(nextDsl) {
      dsl = nextDsl
      if (ctx && target) {
        drawStaticPreview(ctx, target, nextDsl)
      }
    },

    async play() {
      if (ctx && target && dsl) {
        drawStaticPreview(ctx, target, dsl)
      }
    },

    async pause() {
      return
    },

    async captureSnapshot() {
      return {
        id: dsl?.meta.id || 'unknown',
        createdAt: Date.now()
      }
    },

    async dispose() {
      if (ctx && target) {
        ctx.clearRect(0, 0, target.width, target.height)
      }
      ctx = null
      target = null
      dsl = null
    }
  }
}
