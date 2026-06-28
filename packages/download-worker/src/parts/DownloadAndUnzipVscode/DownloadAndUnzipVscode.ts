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

interface DownloadVSCodeOptions {
  readonly cachePath: string
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

const isEconnresetError = (error: unknown): boolean => {
  if (!isObject(error)) {
    return false
  }
  return error.code === ErrorCodes.ECONNRESET || (typeof error.message === 'string' && error.message.includes(ErrorCodes.ECONNRESET))
}

const downloadAndUnzipVSCodeWithRetries = async (options: DownloadVSCodeOptions): Promise<string> => {
  const { downloadAndUnzipVSCode } = await import('@vscode/test-electron')
  for (let attempt = 0; ; attempt++) {
    try {
      return await downloadAndUnzipVSCode(options)
    } catch (error) {
      if (!isEconnresetError(error) || attempt >= maxDownloadRetries) {
        throw error
      }
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
      cachePath: VscodeTestCachePath.vscodeTestCachePath,
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
