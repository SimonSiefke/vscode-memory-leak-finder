import { rm } from 'fs/promises'
import { join } from 'path'
import * as Download from '../Download/Download.js'
import * as Root from '../Root/Root.js'
import * as Unzip from '../Unzip/Unzip.js'

export const downloadAndExtract = async (name, urls, outDir) => {
  await rm(outDir, { recursive: true, force: true })
  const tmpDir = join(Root.root, '.vscode-tool-downloads')
  const tmpFile = join(tmpDir, 'file.zip')
  await Download.download(name, urls, tmpFile)
  await Unzip.unzip(tmpFile, outDir)
}
