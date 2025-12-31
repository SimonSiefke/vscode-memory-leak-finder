import { VError } from '@lvce-editor/verror'
import { dirname } from 'node:path'
import * as Exec from '../Exec/Exec.ts'

export const extractAppImage = async (appImagePath: string): Promise<void> => {
  try {
    const folder = dirname(appImagePath)
    await Exec.exec(appImagePath, ['--appimage-extract'], {
      cwd: folder,
    })
  } catch (error) {
    throw new VError(error, `Failed to extract appImage`)
  }
}
