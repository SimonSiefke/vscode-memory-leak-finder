import { existsSync } from 'node:fs'
import { join } from 'node:path'
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
    const { path } = cache
    if (typeof path !== 'string') {
      return ''
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
  await JsonFile.writeJson(cacheFilePath, { path })
}
