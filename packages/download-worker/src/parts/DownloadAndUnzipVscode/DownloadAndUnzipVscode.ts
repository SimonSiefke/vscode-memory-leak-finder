import { VError } from '@lvce-editor/verror'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as Assert from '../Assert/Assert.ts'
import * as CollectSourceMapUrls from '../CollectSourceMapUrls/CollectSourceMapUrls.ts'
import * as DownloadAndUnzipInsiders from '../DownloadAndUnzipInsiders/DownloadAndUnzipInsiders.ts'
import * as Env from '../Env/Env.ts'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'
import * as GetProductJsonPath from '../GetProductJsonPath/GetProductJsonPath.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as LoadSourceMaps from '../LoadSourceMaps/LoadSourceMaps.ts'
import * as RemoveUnusedFiles from '../RemoveUnusedFiles/RemoveUnusedFiles.ts'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.ts'

const automaticallyDownloadSourceMaps = false
const maxDownloadRetries = 3
const transientDownloadErrorCodes = new Set([ErrorCodes.ECONNRESET, 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'EPIPE'])

interface DownloadVSCodeOptions {
  readonly arch: string
  readonly cachePath: string
  readonly platform: string
  readonly version: string
}

export interface DownloadAndUnzipVscodeOptions {
  readonly arch: string
  readonly insidersCommit: string
  readonly platform: string
  readonly updateUrl: string
  readonly vscodeVersion: string
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const getNestedErrors = (error: unknown, seen = new Set<unknown>()): unknown[] => {
  if (!isObject(error) || seen.has(error)) {
    return []
  }
  seen.add(error)
  const nested: unknown[] = []
  if (Array.isArray(error.errors)) {
    nested.push(...error.errors)
  }
  if (error.cause !== undefined) {
    nested.push(error.cause)
  }
  return [error, ...nested.flatMap((item) => getNestedErrors(item, seen))]
}

const isTransientDownloadError = (error: unknown): boolean => {
  return getNestedErrors(error).some((item) => {
    if (!isObject(item)) {
      return false
    }
    if (typeof item.code === 'string' && transientDownloadErrorCodes.has(item.code)) {
      return true
    }
    const message = item.message
    return typeof message === 'string' && [...transientDownloadErrorCodes].some((code) => message.includes(code))
  })
}

const getErrorDetails = (error: unknown): string => {
  const details = getNestedErrors(error).map((item) => {
    if (item instanceof Error) {
      const code = isObject(item) && typeof item.code === 'string' ? ` (${item.code})` : ''
      return `${item.name}: ${item.message}${code}`
    }
    return String(item)
  })
  return [...new Set(details)].join('; ') || String(error)
}

const downloadAndUnzipVSCodeWithRetries = async (options: DownloadVSCodeOptions): Promise<string> => {
  const { downloadAndUnzipVSCode } = await import('@vscode/test-electron')
  for (let attempt = 0; ; attempt++) {
    try {
      return await downloadAndUnzipVSCode(options)
    } catch (error) {
      const attempts = attempt + 1
      if (!isTransientDownloadError(error) || attempt >= maxDownloadRetries) {
        throw new Error(
          `VS Code ${options.version} download for ${options.platform}/${options.arch} failed after ${attempts} attempt(s): ${getErrorDetails(error)}`,
          { cause: error },
        )
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt))
    }
  }
}

export const downloadAndUnzipVscode = async (options: DownloadAndUnzipVscodeOptions): Promise<string> => {
  try {
    Assert.object(options)
    Assert.string(options.vscodeVersion)
    Assert.string(options.insidersCommit)
    Assert.string(options.platform)
    Assert.string(options.arch)
    if (Env.env.VSCODE_PATH) {
      console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
      return Env.env.VSCODE_PATH
    }

    const { arch, insidersCommit, platform, updateUrl, vscodeVersion } = options

    if (insidersCommit) {
      return await DownloadAndUnzipInsiders.downloadAndUnzipInsiders(platform, arch, insidersCommit, updateUrl)
    }

    if (!vscodeVersion) {
      throw new Error('Either vscodeVersion or insidersCommit must be provided')
    }

    const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(vscodeVersion, platform, arch)
    if (cachedPath) {
      return cachedPath
    }
    const path = await downloadAndUnzipVSCodeWithRetries({
      arch,
      cachePath: VscodeTestCachePath.vscodeTestCachePath,
      platform,
      version: vscodeVersion,
    })
    try {
      const productPath = GetProductJsonPath.getProductJsonPath(platform, path)
      const productJson = await JsonFile.readJson(productPath)
      const newProductJson = AdjustVscodeProductJson.adjustVscodeProductJson(productJson)
      await JsonFile.writeJson(productPath, newProductJson)
    } catch {
      // ignore
    }
    await RemoveUnusedFiles.removeUnusedFiles(platform, path)
    if (automaticallyDownloadSourceMaps) {
      const sourceMapUrls = await CollectSourceMapUrls.collectSourceMapUrls(path)
      await LoadSourceMaps.loadSourceMaps(sourceMapUrls)
    }
    await GetVscodeRuntimePath.setVscodeRuntimePath(vscodeVersion, path, platform, arch)
    return path
  } catch (error) {
    throw new VError(error, `Failed to download VSCode`)
  }
}
