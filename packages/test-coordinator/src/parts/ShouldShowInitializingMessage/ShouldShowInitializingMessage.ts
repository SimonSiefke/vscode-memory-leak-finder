import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Ide from '../Ide/Ide.ts'
import * as Root from '../Root/Root.ts'

export interface ShouldShowInitializingMessageOptions {
  readonly arch: string
  readonly commit: string
  readonly ide: string
  readonly insidersCommit: string
  readonly platform: string
  readonly vscodePath: string
  readonly vscodeVersion: string
}

const getCacheFilePath = (cacheKey: string, platform: string, arch: string): string => {
  return join(Root.root, '.vscode-runtime-paths', `${cacheKey}-${platform}-${arch}.json`)
}

const isRuntimeCached = async (cacheKey: string, platform: string, arch: string): Promise<boolean> => {
  if (!cacheKey) {
    return false
  }
  const cacheFilePath = getCacheFilePath(cacheKey, platform, arch)
  if (!existsSync(cacheFilePath)) {
    return false
  }
  try {
    const cacheContent = await readFile(cacheFilePath, 'utf8')
    const cache = JSON.parse(cacheContent)
    const pathUri = cache.uri || cache.path
    if (typeof pathUri !== 'string' || pathUri === '') {
      return false
    }
    const binaryPath = pathUri.startsWith('file://') ? fileURLToPath(pathUri) : pathUri
    return existsSync(binaryPath)
  } catch {
    return false
  }
}

export const shouldShowInitializingMessage = async (options: ShouldShowInitializingMessageOptions): Promise<boolean> => {
  const { arch, commit, ide, insidersCommit, platform, vscodePath, vscodeVersion } = options
  if (ide !== Ide.VsCode) {
    return false
  }
  if (vscodePath || process.env.VSCODE_PATH) {
    return false
  }
  if (commit) {
    return false
  }
  const cacheKey = insidersCommit || vscodeVersion
  const isDownloaded = await isRuntimeCached(cacheKey, platform, arch)
  return !isDownloaded
}
