import { VError } from '@lvce-editor/verror'
import extract from 'extract-zip'
import { mkdir } from 'node:fs/promises'

export const unzip = async (inFile: string, outDir: string): Promise<void> => {
  try {
    await mkdir(outDir, { recursive: true })
    await extract(inFile, { dir: outDir })
  } catch (error) {
    throw new VError(error, `Failed to unzip ${inFile}`)
  }
}
