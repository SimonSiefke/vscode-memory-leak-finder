import { VError } from '@lvce-editor/verror'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as Assert from '../Assert/Assert.ts'
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
  readonly arch: string
  readonly insidersCommit: string
  readonly platform: string
  readonly updateUrl: string
  readonly vscodeVersion: string
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

    const { vscodeVersion } = options
    const { insidersCommit } = options
    const platform = options.platform || process.platform
    const { arch } = options
    const { updateUrl } = options

    if (insidersCommit) {
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
