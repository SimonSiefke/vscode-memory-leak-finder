import { VError } from '@lvce-editor/verror'
import { mkdir } from 'node:fs/promises'
import * as Exec from '../Exec/Exec.ts'

export const extractTarGz = async (inFile: string, outDir: string): Promise<void> => {
  try {
    await mkdir(outDir, { recursive: true })
    await Exec.exec('tar', ['-xzf', inFile, '-C', outDir])
  } catch (error) {
    throw new VError(error, `Failed to extract tar.gz ${inFile}`)
  }
}
