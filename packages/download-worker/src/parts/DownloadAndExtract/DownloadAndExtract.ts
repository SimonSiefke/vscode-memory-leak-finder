import { copyFile, mkdir, rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import * as Download from '../Download/Download.ts'
import * as ExtractTarGz from '../ExtractTarGz/ExtractTarGz.ts'
import * as Root from '../Root/Root.ts'
import * as Unzip from '../Unzip/Unzip.ts'

export const downloadAndExtract = async (name: string, urls: string[], outDir: string): Promise<void> => {
  await rm(outDir, { force: true, recursive: true })
  const tmpDir = join(Root.root, '.vscode-tool-downloads')
  const downloadUrl = urls[0]
  const urlBasename = basename(new URL(downloadUrl).pathname)
  const tmpFile = join(tmpDir, urlBasename)
  await Download.download(name, urls, tmpFile)
  if (process.platform === 'win32' && tmpFile.endsWith('.exe')) {
    await mkdir(outDir, { recursive: true })
    const outFile = join(outDir, urlBasename)
    await copyFile(tmpFile, outFile)
  } else if (tmpFile.endsWith('.tar.gz')) {
    await ExtractTarGz.extractTarGz(tmpFile, outDir)
  } else {
    await Unzip.unzip(tmpFile, outDir)
  }
}
