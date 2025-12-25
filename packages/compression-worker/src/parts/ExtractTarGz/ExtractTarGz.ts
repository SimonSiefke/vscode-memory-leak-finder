import { VError } from '@lvce-editor/verror'
import { execa } from 'execa'
import { mkdir } from 'node:fs/promises'

export const extractTarGz = async (inFile: string, outDir: string): Promise<void> => {
  try {
    await mkdir(outDir, { recursive: true })
    await execa('tar', ['-xzf', inFile, '-C', outDir])
  } catch (error) {
    throw new VError(error, `Failed to extract tar.gz ${inFile}`)
  }
}
