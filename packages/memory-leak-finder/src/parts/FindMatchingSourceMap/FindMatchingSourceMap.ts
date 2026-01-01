import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const findMatchingSourceMap = (url: string): string | null => {
  if (!url) {
    return null
  }
  try {
    // Convert file:// URL to file path
    let filePath: string
    if (url.startsWith('file://')) {
      filePath = fileURLToPath(url)
    } else {
      filePath = url
    }
    // Check if it's a .js file
    if (!filePath.endsWith('.js')) {
      return null
    }
    // Construct the source map path
    const sourceMapPath = filePath + '.map'
    // Check if the source map file exists
    if (existsSync(sourceMapPath)) {
      // Convert back to file:// URL
      return pathToFileURL(sourceMapPath).toString()
    }
    return null
  } catch {
    return null
  }
}

