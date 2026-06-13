export const FEED_RENDER_RESUME_DELAY_MS = 220

export function shouldRunRuntime(previewMode: 'active' | 'neighbor' | 'snapshot', active: boolean, suspended = false) {
  return active && !suspended && previewMode === 'active'
}
