import { readFile } from 'node:fs/promises'
import { VError } from '@lvce-editor/verror'

export const readJson = async (path: string): Promise<any> => {
  try {
    const content = await readFile(path, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    throw new VError(error, `Failed to read json`)
  }
}

