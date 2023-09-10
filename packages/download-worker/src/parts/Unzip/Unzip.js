import { VError } from '@lvce-editor/verror'
import extract from 'extract-zip'
import { mkdir } from 'node:fs/promises'

export const unzip = async (inFile, outDir) => {
  try {
    await mkdir(outDir, { recursive: true })
    await extract(inFile, { dir: outDir })
  } catch (error) {
    throw new VError(error, `Failed to unzip ${inFile}`)
  }
}
