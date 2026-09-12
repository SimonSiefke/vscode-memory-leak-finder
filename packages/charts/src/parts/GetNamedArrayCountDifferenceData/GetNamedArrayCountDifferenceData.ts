import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface ArrayCountRow {
  readonly count: number
  readonly delta: number
  readonly name: string
}

export const getNamedArrayCountDifferenceData = async (basePath: string) => {
  const resultsPath = join(basePath, 'namedArrayCountDifference')
  if (!existsSync(resultsPath)) {
    return []
  }
  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const rawData = await readJson(join(resultsPath, entry.name))
    const rows: readonly ArrayCountRow[] = rawData.namedArrayCountDifference || []
    results.push({
      data: rows.map(({ count, delta, name }) => ({ count, delta, name })).sort((a, b) => b.count - a.count),
      filename: entry.name.slice(0, -'.json'.length),
    })
  }
  return results
}
