export type FeedGestureLock = 'feed' | 'game'

export function resolveGestureLock(deltaX: number, deltaY: number): FeedGestureLock {
  return Math.abs(deltaY) >= Math.abs(deltaX) ? 'feed' : 'game'
}
