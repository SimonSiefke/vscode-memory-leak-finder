import { VError } from '@lvce-editor/verror'
import { execa } from 'execa'
import { dirname } from 'path'

export const extractAppImage = async (appImagePath) => {
  try {
    const folder = dirname(appImagePath)
    await execa(appImagePath, ['--appimage-extract'], {
      cwd: folder,
    })
  } catch (error) {
    throw new VError(error, `Failed to extract appImage`)
  }
}
