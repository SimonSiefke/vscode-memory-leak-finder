import * as os from 'node:os'
import { join } from 'node:path'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as CollectSourceMapUrls from '../CollectSourceMapUrls/CollectSourceMapUrls.ts'
import * as DownloadAndExtract from '../DownloadAndExtract/DownloadAndExtract.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as LoadSourceMaps from '../LoadSourceMaps/LoadSourceMaps.ts'
import * as RemoveUnusedFiles from '../RemoveUnusedFiles/RemoveUnusedFiles.ts'
import * as Root from '../Root/Root.ts'
import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import { resolve } from 'node:path'

const automaticallyDownloadSourceMaps = false

const getProductJsonPath = (path: string): string => {
  if (process.platform === 'darwin') {
    return resolve(path, '..', '..', 'Resources', 'app', 'product.json')
  }
  return resolve(path, '..', 'resources', 'app', 'product.json')
}

const getBinaryPathFromExtractDir = (extractDir: string): string => {
  if (process.platform === 'darwin') {
    return join(extractDir, 'Visual Studio Code - Insiders.app', 'Contents', 'MacOS', 'Electron')
  }
  if (process.platform === 'win32') {
    return join(extractDir, 'Code - Insiders', 'Code - Insiders.exe')
  }
  const arch = os.arch()
  const archSuffix = arch === 'arm64' || arch === 'aarch64' ? 'arm64' : 'x64'
  return join(extractDir, `VSCode-linux-${archSuffix}`, 'code')
}

export const downloadAndUnzipInsiders = async (commit: string): Promise<string> => {
  const metadata = await FetchVscodeInsidersMetadata.fetchVscodeInsidersMetadata(commit)
  const insidersVersionsDir = join(Root.root, '.vscode-insiders-versions')
  const extractDir = join(insidersVersionsDir, commit)
  const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(commit)
  if (cachedPath) {
    return cachedPath
  }
  await DownloadAndExtract.downloadAndExtract('vscode-insiders', [metadata.url], extractDir)
  const path = getBinaryPathFromExtractDir(extractDir)
  const productPath = getProductJsonPath(path)
  const productJson = await JsonFile.readJson(productPath)
  const newProductJson = AdjustVscodeProductJson.adjustVscodeProductJson(productJson)
  await JsonFile.writeJson(productPath, newProductJson)
  await RemoveUnusedFiles.removeUnusedFiles(path)
  if (automaticallyDownloadSourceMaps) {
    const sourceMapUrls = await CollectSourceMapUrls.collectSourceMapUrls(path)
    await LoadSourceMaps.loadSourceMaps(sourceMapUrls)
  }
  await GetVscodeRuntimePath.setVscodeRuntimePath(commit, path)
  return path
}

