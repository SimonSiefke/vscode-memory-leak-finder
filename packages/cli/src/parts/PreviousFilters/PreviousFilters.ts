import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Root from '../Root/Root.ts'
import { VError } from '../VError/VError.ts'

const getPreviousFilterPath = (): string => {
  return join(Root.root, '.vscode-previous-filters', 'filters.json')
}

export const get = (): string[] => {
  try {
    const previousFilterPath = getPreviousFilterPath()
    const content = readFileSync(previousFilterPath, 'utf8')
    const json = JSON.parse(content)
    return json
  } catch {
    return []
  }
}

export const add = async (value: string): Promise<void> => {
  try {
    const previousFilterPath = getPreviousFilterPath()
    const current = get()
    const newValues = [value, ...current]
    const newContent = JSON.stringify(newValues, null, 2)
    await mkdir(dirname(previousFilterPath), { recursive: true })
    const content = await writeFile(previousFilterPath, newContent)
    return content
  } catch (error) {
    throw new VError(error, `Failed to add filter`)
  }
}

export const addAll = async (values: readonly string[]): Promise<void> => {
  for (const value of values) {
    await add(value)
  }
}
