import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as Root from '../Root/Root.ts'

const getCacheFilePath = (vscodeVersion: string): string => {
  return join(Root.root, '.vscode-runtime-paths', `${vscodeVersion}.json`)
}

export const getVscodeRuntimePath = async (vscodeVersion: string): Promise<string> => {
  const cacheFilePath = getCacheFilePath(vscodeVersion)
  console.log(`[download-worker] [cache] Checking cache for version: ${vscodeVersion}`)
  console.log(`[download-worker] [cache] Cache file path: ${cacheFilePath}`)
  if (!existsSync(cacheFilePath)) {
    console.log(`[download-worker] [cache] Cache file does not exist`)
    return ''
  }
  try {
    const cache = await JsonFile.readJson(cacheFilePath)
    const path = cache.path
    if (typeof path !== 'string') {
      console.log(`[download-worker] [cache] Cache file exists but path is not a string`)
      return ''
    }
    console.log(`[download-worker] [cache] Cached path: ${path}`)
    if (!existsSync(path)) {
      console.log(`[download-worker] [cache] Cached path does not exist on filesystem`)
      return ''
    }
    console.log(`[download-worker] [cache] Using cached path: ${path}`)
    return path
  } catch (error) {
    console.log(`[download-worker] [cache] Error reading cache file: ${error}`)
    return ''
  }
}

export const setVscodeRuntimePath = async (vscodeVersion: string, path: string): Promise<void> => {
  const cacheFilePath = getCacheFilePath(vscodeVersion)
  await JsonFile.writeJson(cacheFilePath, { path })
}
