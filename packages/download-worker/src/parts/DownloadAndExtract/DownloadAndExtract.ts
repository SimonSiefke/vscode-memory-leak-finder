import { rm } from 'fs/promises'
import { basename, join } from 'path'
import * as Download from '../Download/Download.ts'
import * as ExtractTarGz from '../ExtractTarGz/ExtractTarGz.ts'
import * as Root from '../Root/Root.ts'
import * as Unzip from '../Unzip/Unzip.ts'

export const downloadAndExtract = async (name: string, urls: string[], outDir: string): Promise<void> => {
  await rm(outDir, { recursive: true, force: true })
  const tmpDir = join(Root.root, '.vscode-tool-downloads')
  const downloadUrl = urls[0]
  const urlBasename = basename(new URL(downloadUrl).pathname)
  const tmpFile = join(tmpDir, urlBasename)
  await Download.download(name, urls, tmpFile)
  if (tmpFile.endsWith('.tar.gz')) {
    await ExtractTarGz.extractTarGz(tmpFile, outDir)
  } else {
    await Unzip.unzip(tmpFile, outDir)
  }
}
