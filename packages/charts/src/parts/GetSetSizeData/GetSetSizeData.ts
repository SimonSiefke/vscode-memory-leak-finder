import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getSetSizeData = async (basePath: string) => {
  const currentPath = join(basePath, 'setSize')
  const resultsPath = existsSync(currentPath) ? currentPath : join(basePath, 'set-size')
  if (!existsSync(resultsPath)) {
    return []
  }
  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const { setSize } = await readJson(join(resultsPath, entry.name))
    if (!Number.isFinite(setSize?.before) || !Number.isFinite(setSize?.after)) {
      throw new Error(`Missing finite before/after set sizes in ${entry.name}`)
    }
    results.push({
      data: [
        { name: 'Before iterations', value: setSize.before },
        { name: 'After iterations', value: setSize.after },
      ],
      filename: entry.name.slice(0, -'.json'.length),
    })
  }
  return results
}
