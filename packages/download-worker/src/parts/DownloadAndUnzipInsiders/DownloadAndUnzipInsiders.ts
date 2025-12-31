import { basename, join } from 'node:path'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as CollectSourceMapUrls from '../CollectSourceMapUrls/CollectSourceMapUrls.ts'
import * as Download from '../Download/Download.ts'
import * as DownloadAndExtract from '../DownloadAndExtract/DownloadAndExtract.ts'
import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import * as GetProductJsonPath from '../GetProductJsonPath/GetProductJsonPath.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as LoadSourceMaps from '../LoadSourceMaps/LoadSourceMaps.ts'
import * as RemoveUnusedFiles from '../RemoveUnusedFiles/RemoveUnusedFiles.ts'
import * as Root from '../Root/Root.ts'

const automaticallyDownloadSourceMaps = false

const getBinaryPathFromExtractDir = (platform: string, arch: string, extractDir: string): string => {
  if (platform === 'darwin') {
    return join(extractDir, 'Visual Studio Code - Insiders.app', 'Contents', 'MacOS', 'Electron')
  }
  if (platform === 'win32') {
    return join(extractDir, 'Code - Insiders', 'Code - Insiders.exe')
  }
  const archSuffix = arch === 'arm64' ? 'arm64' : 'x64'
  return join(extractDir, `VSCode-linux-${archSuffix}`, 'code-insiders')
}

export const downloadAndUnzipInsiders = async (platform: string, arch: string, commit: string, updateUrl: string): Promise<string> => {
  const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(commit)
  if (cachedPath) {
    return cachedPath
  }
  const metadata = await FetchVscodeInsidersMetadata.fetchVscodeInsidersMetadata(platform, arch, commit, updateUrl)
  const insidersVersionsDir = join(Root.root, '.vscode-insiders-versions')
  const extractDir = join(insidersVersionsDir, commit)
  console.log(`[download-worker] Downloading ${metadata.url}`)

  const urlBasename = basename(new URL(metadata.url).pathname)
  const isExe = platform === 'win32' && urlBasename.endsWith('.exe')

  if (isExe) {
    const tmpDir = join(Root.root, '.vscode-tool-downloads')
    const tmpFile = join(tmpDir, urlBasename)
    await Download.download('vscode-insiders', [metadata.url], tmpFile)
    console.log(`[download-worker] Download complete.`)
    const path = tmpFile
    await GetVscodeRuntimePath.setVscodeRuntimePath(commit, path)
    return path
  }

  await DownloadAndExtract.downloadAndExtract(platform, 'vscode-insiders', [metadata.url], extractDir)
  console.log(`[download-worker] Download complete.`)
  const path = getBinaryPathFromExtractDir(platform, arch, extractDir)
  const productPath = GetProductJsonPath.getProductJsonPath(platform, path)
  const productJson = await JsonFile.readJson(productPath)
  const newProductJson = AdjustVscodeProductJson.adjustVscodeProductJson(productJson)
  await JsonFile.writeJson(productPath, newProductJson)
    await RemoveUnusedFiles.removeUnusedFiles(platform, path)
  if (automaticallyDownloadSourceMaps) {
    const sourceMapUrls = await CollectSourceMapUrls.collectSourceMapUrls(path)
    await LoadSourceMaps.loadSourceMaps(sourceMapUrls)
  }
  await GetVscodeRuntimePath.setVscodeRuntimePath(commit, path)
  return path
}
