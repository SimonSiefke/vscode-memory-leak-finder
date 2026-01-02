import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as Root from '../Root/Root.ts'

const getCacheFilePath = (vscodeVersion: string): string => {
  return join(Root.root, '.vscode-runtime-paths', `${vscodeVersion}.json`)
}

export const getVscodeRuntimePath = async (vscodeVersion: string): Promise<string> => {
  const cacheFilePath = getCacheFilePath(vscodeVersion)
  if (!existsSync(cacheFilePath)) {
    return ''
  }
  try {
    const cache = await JsonFile.readJson(cacheFilePath)
    // Support both new format (pathUri) and old format (path) for backward compatibility
    const pathUri = cache.pathUri || cache.path
    if (typeof pathUri !== 'string') {
      return ''
    }
    // If it's already a URI, convert it to path; otherwise use it as-is (old format)
    let path: string
    if (pathUri.startsWith('file://')) {
      path = fileURLToPath(pathUri)
    } else {
      path = pathUri
    }
    if (!existsSync(path)) {
      return ''
    }
    return path
  } catch {
    return ''
  }
}

export const setVscodeRuntimePath = async (vscodeVersion: string, path: string): Promise<void> => {
  const cacheFilePath = getCacheFilePath(vscodeVersion)
  // Convert path to URI before saving
  const pathUri = pathToFileURL(path).toString()
  await JsonFile.writeJson(cacheFilePath, { pathUri })
}
