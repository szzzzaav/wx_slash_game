const loadedAssets = new Map<string, unknown>()

export function rememberAsset(key: string, asset: unknown) {
  loadedAssets.set(key, asset)
}

export function getAsset(key: string) {
  return loadedAssets.get(key)
}

export function releaseAsset(key: string) {
  loadedAssets.delete(key)
}

export function releaseAllAssets() {
  loadedAssets.clear()
}
