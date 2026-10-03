import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getMapSizeData = async (basePath: string) => {
  const currentPath = join(basePath, 'mapSize')
  const resultsPath = existsSync(currentPath) ? currentPath : join(basePath, 'map-size')
  if (!existsSync(resultsPath)) {
    return []
  }
  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const { mapSize } = await readJson(join(resultsPath, entry.name))
    if (!Number.isFinite(mapSize?.before) || !Number.isFinite(mapSize?.after)) {
      throw new Error(`Missing finite before/after map sizes in ${entry.name}`)
    }
    results.push({
      data: [
        { name: 'Before iterations', value: mapSize.before },
        { name: 'After iterations', value: mapSize.after },
      ],
      filename: entry.name.slice(0, -'.json'.length),
    })
  }
  return results
}
