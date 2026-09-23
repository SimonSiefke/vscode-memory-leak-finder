import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getPoolmonData = async (basePath: string) => {
  const resultsPath = join(basePath, 'poolmon')
  if (!existsSync(resultsPath)) {
    return []
  }

  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const result = await readJson(join(resultsPath, entry.name))
    if (!Number.isFinite(result.pool?.beforeBytes) || !Number.isFinite(result.pool?.afterBytes)) {
      throw new Error(`Missing finite before/after PoolMon bytes in ${entry.name}`)
    }
    results.push({
      data: [
        { name: 'Before iterations', value: result.pool.beforeBytes },
        { name: 'After iterations', value: result.pool.afterBytes },
      ],
      filename: entry.name.slice(0, -'.json'.length),
    })
  }
  return results
}
