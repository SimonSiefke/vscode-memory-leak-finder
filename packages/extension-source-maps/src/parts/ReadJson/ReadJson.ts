import { VError } from '@lvce-editor/verror'
import { readFile } from 'node:fs/promises'

export const readJson = async (path: string): Promise<any> => {
  try {
    const content = await readFile(path, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    throw new VError(error, `Failed to read json`)
  }
}
