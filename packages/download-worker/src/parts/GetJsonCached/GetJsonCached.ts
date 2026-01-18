import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as Root from '../Root/Root.ts'

export const getJsonCached = async <T>(url: string, cacheKey: string, cacheDirName: string): Promise<T> => {
  const cacheFilePath = join(Root.root, cacheDirName, `${cacheKey}.json`)
  if (existsSync(cacheFilePath)) {
    try {
      const cachedData = (await JsonFile.readJson(cacheFilePath)) as T
      return cachedData
    } catch {
      // If cache read fails, continue to fetch from network
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vscode-memory-leak-finder/1.0.0',
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = (await response.json()) as T
    await JsonFile.writeJson(cacheFilePath, data)
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Request timeout for URL: ${url}`)
    }
    throw new VError(error, `Failed to fetch JSON from URL: ${url}`)
  }
}
