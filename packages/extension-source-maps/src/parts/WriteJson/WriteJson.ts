import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VError } from '@lvce-editor/verror'

export const writeJson = async (path: string, json: any): Promise<void> => {
  try {
    const content = JSON.stringify(json, null, 2) + '\n'
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  } catch (error) {
    throw new VError(error, `Failed to write json`)
  }
}
