import { VError } from '@lvce-editor/verror'
import * as os from 'node:os'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as CollectSourceMapUrls from '../CollectSourceMapUrls/CollectSourceMapUrls.ts'
import * as DownloadAndUnzipInsiders from '../DownloadAndUnzipInsiders/DownloadAndUnzipInsiders.ts'
import * as Env from '../Env/Env.ts'
import * as GetProductJsonPath from '../GetProductJsonPath/GetProductJsonPath.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as LoadSourceMaps from '../LoadSourceMaps/LoadSourceMaps.ts'
import * as RemoveUnusedFiles from '../RemoveUnusedFiles/RemoveUnusedFiles.ts'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.ts'

const automaticallyDownloadSourceMaps = false

export interface DownloadAndUnzipVscodeOptions {
  readonly arch?: string
  readonly insidersCommit?: string
  readonly platform?: string
  readonly updateUrl?: string
  readonly vscodeVersion?: string
}

/**
 * @param {DownloadAndUnzipVscodeOptions} options
 */
export const downloadAndUnzipVscode = async (options: DownloadAndUnzipVscodeOptions | string): Promise<string> => {
  try {
    if (Env.env.VSCODE_PATH) {
      console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
      return Env.env.VSCODE_PATH
    }

    let vscodeVersion: string | undefined
    let insidersCommit: string | undefined
    let platform: string | undefined
    let arch: string | undefined

    if (typeof options === 'string') {
      vscodeVersion = options
      platform = process.platform
      arch = os.arch()
    } else {
      vscodeVersion = options.vscodeVersion
      insidersCommit = options.insidersCommit
      platform = options.platform || process.platform
      arch = options.arch || os.arch()
    }

    if (insidersCommit) {
      const updateUrl = typeof options === 'object' && options.updateUrl ? options.updateUrl : 'https://update.code.visualstudio.com'
      return await DownloadAndUnzipInsiders.downloadAndUnzipInsiders(platform, arch, insidersCommit, updateUrl)
    }

    if (!vscodeVersion) {
      throw new Error('Either vscodeVersion or insidersCommit must be provided')
    }

    const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(vscodeVersion)
    if (cachedPath) {
      return cachedPath
    }
    const { downloadAndUnzipVSCode } = await import('@vscode/test-electron')
    const path = await downloadAndUnzipVSCode({
      cachePath: VscodeTestCachePath.vscodeTestCachePath,
      version: vscodeVersion,
    })
    const productPath = GetProductJsonPath.getProductJsonPath(platform, path)
    const productJson = await JsonFile.readJson(productPath)
    const newProductJson = AdjustVscodeProductJson.adjustVscodeProductJson(productJson)
    await JsonFile.writeJson(productPath, newProductJson)
    await RemoveUnusedFiles.removeUnusedFiles(path)
    if (automaticallyDownloadSourceMaps) {
      const sourceMapUrls = await CollectSourceMapUrls.collectSourceMapUrls(path)
      await LoadSourceMaps.loadSourceMaps(sourceMapUrls)
    }
    await GetVscodeRuntimePath.setVscodeRuntimePath(vscodeVersion, path)
    return path
  } catch (error) {
    throw new VError(error, `Failed to download vscode`)
  }
}
