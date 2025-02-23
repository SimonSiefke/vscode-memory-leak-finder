import { VError } from '@lvce-editor/verror'
import { execa } from 'execa'

export const extractAppImage = async (appImagePath) => {
  try {
    await execa(appImagePath, '--appimage-extract')
  } catch (error) {
    throw new VError(error, `Failed to extract appImage`)
  }
}
