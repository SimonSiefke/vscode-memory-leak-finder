import { dirname, join } from 'path'
import * as Download from '../Download/Download.js'
import * as Unzip from '../Unzip/Unzip.js'

export const downloadAndExtract = async (name, urls, outFile) => {
  const outDir = dirname(outFile)
  await Download.download(name, urls, outFile)
  const dataDir = join(outDir, 'data')
  await Unzip.unzip(outFile, dataDir)
}
