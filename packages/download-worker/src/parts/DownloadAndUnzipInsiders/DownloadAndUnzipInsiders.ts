import * as os from 'node:os'
import { join } from 'node:path'
import { resolve } from 'node:path'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as CollectSourceMapUrls from '../CollectSourceMapUrls/CollectSourceMapUrls.ts'
import * as DownloadAndExtract from '../DownloadAndExtract/DownloadAndExtract.ts'
import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import * as GetVscodeRuntimePath from '../GetVscodeRuntimePath/GetVscodeRuntimePath.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as LoadSourceMaps from '../LoadSourceMaps/LoadSourceMaps.ts'
import * as RemoveUnusedFiles from '../RemoveUnusedFiles/RemoveUnusedFiles.ts'
import * as Root from '../Root/Root.ts'

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
  const archSuffix = arch === 'arm64' ? 'arm64' : 'x64'
  return join(extractDir, `VSCode-linux-${archSuffix}`, 'code-insiders')
}

const getFileSizeInMB = async (url: string): Promise<number | undefined> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(30_000),
    })
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      const sizeInBytes = Number.parseInt(contentLength, 10)
      const sizeInMB = sizeInBytes / (1024 * 1024)
      return sizeInMB
    }
    return undefined
  } catch {
    return undefined
  }
}

export const downloadAndUnzipInsiders = async (commit: string): Promise<string> => {
  const cachedPath = await GetVscodeRuntimePath.getVscodeRuntimePath(commit)
  if (cachedPath) {
    return cachedPath
  }
  const metadata = await FetchVscodeInsidersMetadata.fetchVscodeInsidersMetadata(commit)
  const insidersVersionsDir = join(Root.root, '.vscode-insiders-versions')
  const extractDir = join(insidersVersionsDir, commit)
  const fileSizeMB = await getFileSizeInMB(metadata.url)
  if (fileSizeMB !== undefined) {
    console.log(`[download-worker] Downloading ${metadata.url} (${fileSizeMB.toFixed(2)} MB)`)
  } else {
    console.log(`[download-worker] Downloading ${metadata.url}`)
  }
  await DownloadAndExtract.downloadAndExtract('vscode-insiders', [metadata.url], extractDir)
  console.log(`[download-worker] Download complete.`)
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
