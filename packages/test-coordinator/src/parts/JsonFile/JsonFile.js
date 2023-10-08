import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VError } from '../VError/VError.js'

export const writeJson = async (path, json) => {
  try {
    const content = JSON.stringify(json, null, 2) + '\n'
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  } catch (error) {
    throw new VError(error, `Failed to write json`)
  }
}

export const readJson = async (path) => {
  try {
    const content = await readFile(path, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    throw new VError(error, `Failed to read json`)
  }
}
