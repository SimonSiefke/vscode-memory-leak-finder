import { createHash } from 'node:crypto'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'

const hashUrl = (url: string): string => {
  const hash = createHash('sha1')
  hash.update(url)
  return hash.digest('hex')
}

const isHttpsUrl = (url: string): boolean => {
  return url.startsWith('https://')
}

export const loadSourceMaps = async (sourceMapUrls: readonly string[]): Promise<void> => {
  const httpsUrls = sourceMapUrls.filter(isHttpsUrl)
  for (const url of httpsUrls) {
    try {
      const hash = hashUrl(url)
      await LoadSourceMap.loadSourceMap(url, hash)
    } catch (error) {
      // Don't crash on errors like 404, 500, etc.
      // Just log and continue
      console.warn(`Failed to download source map from ${url}:`, error)
    }
  }
}
