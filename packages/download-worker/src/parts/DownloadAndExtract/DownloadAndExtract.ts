import { rm } from 'fs/promises'
import { join } from 'path'
import * as Download from '../Download/Download.ts'
import * as Root from '../Root/Root.ts'
import * as Unzip from '../Unzip/Unzip.ts'

export const downloadAndExtract = async (name: string, urls: string[], outDir: string): Promise<void> => {
  await rm(outDir, { recursive: true, force: true })
  const tmpDir = join(Root.root, '.vscode-tool-downloads')
  const tmpFile = join(tmpDir, 'file.zip')
  await Download.download(name, urls, tmpFile)
  await Unzip.unzip(tmpFile, outDir)
}
