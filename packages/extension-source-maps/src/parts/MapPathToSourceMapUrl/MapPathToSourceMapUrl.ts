import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import * as MapPathToSourceMapPath from '../MapPathToSourceMapPath/MapPathToSourceMapPath.ts'

export const mapPathToSourceMapUrl = (path: string, root: string): string | null => {
  if (!path) {
    return null
  }
  try {
    const sourceMapPath = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
    if (!sourceMapPath) {
      return null
    }
    if (existsSync(sourceMapPath)) {
      const sourceMapUrl = pathToFileURL(sourceMapPath).toString()
      return sourceMapUrl
    }
    // Fallback: try with 'v' prefix for backward compatibility with legacy directories
    // This handles cases where directories were created with 'v' prefix before the fix
    const sourceMapPathWithV = sourceMapPath.replace(
      '/copilot-chat-',
      '/copilot-chat-v',
    )
    if (existsSync(sourceMapPathWithV)) {
      const sourceMapUrl = pathToFileURL(sourceMapPathWithV).toString()
      return sourceMapUrl
    }
    console.log(`[addOriginalSourcesToData] Source map not found: ${sourceMapPath}`)
    return null
  } catch {
    return null
  }
}
