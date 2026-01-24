import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { root } from '../Root/Root.ts'

const CACHE_DIR_NAME = '.vscode-resolve-source-map-cache'

const getCachePath = (hash: string): string => {
  return join(root, CACHE_DIR_NAME, `${hash}.json`)
}

export const getCachedData = async (hash: string): Promise<any | null> => {
  try {
    const cachePath = getCachePath(hash)
    const data = await readFile(cachePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const setCachedData = async (hash: string, data: any): Promise<void> => {
  try {
    const cacheDir = join(root, CACHE_DIR_NAME)
    await mkdir(cacheDir, { recursive: true })
    const cachePath = getCachePath(hash)
    await writeFile(cachePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  } catch {
    // Silently fail if cache cannot be written
  }
}
