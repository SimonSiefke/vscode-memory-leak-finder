import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VError } from '../VError/VError.ts'

export const writeJson = async (path: string, json: unknown): Promise<void> => {
  try {
    const content = JSON.stringify(json, null, 2) + '\n'
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  } catch (error) {
    throw new VError(error, `Failed to write json`)
  }
}
