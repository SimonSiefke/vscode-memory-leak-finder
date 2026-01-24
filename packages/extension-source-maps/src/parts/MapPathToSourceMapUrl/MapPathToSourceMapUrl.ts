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
    // Always return a file URL, regardless of whether the file exists
    const sourceMapUrl = pathToFileURL(sourceMapPath).toString()
    return sourceMapUrl
  } catch {
    return null
  }
}
