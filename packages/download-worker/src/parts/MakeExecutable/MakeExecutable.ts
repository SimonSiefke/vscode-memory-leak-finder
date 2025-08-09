import { chmod } from 'node:fs/promises'
import { VError } from '@lvce-editor/verror'

export const makeExecutable = async (file: string): Promise<void> => {
  try {
    await chmod(file, 0o755)
  } catch (error) {
    throw new VError(error, `Failed to make file executable`)
  }
}
