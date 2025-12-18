import { VError } from '@lvce-editor/verror'
import { chmod } from 'node:fs/promises'

export const makeExecutable = async (file: string): Promise<void> => {
  try {
    await chmod(file, 0o755)
  } catch (error) {
    throw new VError(error, `Failed to make file executable`)
  }
}
