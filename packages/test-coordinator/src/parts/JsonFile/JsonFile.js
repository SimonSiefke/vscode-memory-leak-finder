import { dirname } from 'node:path'
import { VError } from '../VError/VError.js'
import { mkdir, writeFile } from 'node:fs/promises'

export const writeJson = async (path, json) => {
  try {
    const content = JSON.stringify(json, null, 2) + '\n'
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  } catch (error) {
    throw new VError(error, `Failed to write json`)
  }
}
