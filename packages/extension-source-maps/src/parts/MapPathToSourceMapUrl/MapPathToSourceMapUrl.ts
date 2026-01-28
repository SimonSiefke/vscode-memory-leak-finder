import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import * as MapPathToSourceMapPath from '../MapPathToSourceMapPath/MapPathToSourceMapPath.ts'

export const mapPathToSourceMapUrl = (path: string, root: string, jsDebugVersion?: string): string | null => {
  if (!path) {
    return null
  }
  try {
    const sourceMapPath = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root, jsDebugVersion)
    if (!sourceMapPath) {
      return null
    }
    if (existsSync(sourceMapPath)) {
      const sourceMapUrl = pathToFileURL(sourceMapPath).toString()
      return sourceMapUrl
    }
    console.log(`[addOriginalSourcesToData] Source map not found: ${sourceMapPath}`)
    return null
  } catch {
    return null
  }
}
