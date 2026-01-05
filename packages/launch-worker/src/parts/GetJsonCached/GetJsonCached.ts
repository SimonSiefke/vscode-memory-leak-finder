import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as Root from '../Root/Root.ts'
import * as VError from '../VError/VError.ts'
import { getJson } from '../GetJson/GetJson.ts'

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
    const data = (await getJson(url)) as T
    await JsonFile.writeJson(cacheFilePath, data)
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Request timeout for URL: ${url}`)
    }
    throw new VError.VError(error, `Failed to fetch JSON from URL: ${url}`)
  }
}
